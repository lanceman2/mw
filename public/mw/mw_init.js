// This file is sourced from world.html
// This is the first Mirror Worlds javaScript
// file that is loaded by the browser client.


// one stinking global
var _mw = {

    connectionCount: 0, // number of times we make a socket.io socket.
    client_userInitFunc: null,
    addActor_blocked: false,
    actorFiles: [],
    actorOpts: []
};


function mw_fail() {

    // TODO: add stack trace or is browser debugger enough?
    var text = "Something has gone wrong";
    for(var i=0; i < arguments.length; ++i)
        text += "\n" + arguments[i];
    console.log(text);
    alert(text);
    window.stop();
    throw text;
}


function _mw_assert(val, msg) {

    if(!val) {
        if(msg)
            mw_fail(msg);
        else
            mw_fail("JavaScript failed");
    }
}


function _mw_getElementById(id) {

    var element = document.getElementById(id);
    if(!element) mw_fail("document.getElementById(" + id + ") failed");
    return element;
}


// Searches node and all its' children and
// returns an array of returnFunc() things that testFunc() was true for.
// There are default testFunc and returnFunc functions.
function _mw_findNodes(node, param,
        returnFunc = function(node, param) {
            return node.getAttribute(param);
        },
        testFunc = function(node, param) { 
            return node.hasAttribute && node.hasAttribute(param);
        }) {

    if(node === undefined || !node) return [];

    var ret = [];

    if(testFunc(node, param))
        ret = [returnFunc(node, param)];

    for(node = node.firstChild; node !== undefined && node ;
            node = node.nextSibling) {
        var r = _mw_findNodes(node, param, returnFunc, testFunc);
        if(r.length > 0) ret = ret.concat(r);
    }

    return ret;
}


// Searches node and all its' children and
// returns an array of all nodes with attribute from node and all
// its' children.
function _mw_findAttributes(node, attribute) {

    return _mw_findNodes(node, attribute);
}


// actorCalls is an array of strings.
function _mw_runFunctions(actorCalls)
{
    actorCalls.forEach(
        function(call) {
            console.log('MW Calling: ' + call.call + '(' +
                    call.node + ')');
            window[call.call](call.node);
        }
    );
}


function _mw_addScript(src, onload, opts) {

    console.log('MW Adding Script src= ' + src);
    var script = document.createElement('script');
    document.head.appendChild(script);
    script.onload = onload;
    // script._mw_opts = opts Is how to pass arbitrary data to a script
    // we have not loaded yet.
    script._mw_opts = opts;
    script.src = src;
    script.onerror = function() {
        mw_fail(script.src + ' failed to load');
    };
}


function _mw_addCss(href, onload) {

    console.log('MW Adding CSS href= ' + href);
    var link = document.createElement('link');
    document.head.appendChild(link);
    link.setAttribute("rel", "stylesheet");
    link.setAttribute("type", "text/css");
    link.setAttribute("href", href)
    link.onload = onload;
    link.onerror = function() {
        mw_fail(href + ' failed to load');
    };
}


// actorScriptUrls and actorCalls are arrays of strings.
function _mw_addScripts(actorScriptUrls, actorCalls, opts) {

    if(actorCalls && actorCalls.length > 0) {
        
        var count = actorScriptUrls.length;
        var check = function() {
            --count;
            if(count === 0)
                // We call after all scripts are loaded:
                _mw_runFunctions(actorCalls);
        };

    } else
        var check = null;


    actorScriptUrls.forEach( function(src) {

        _mw_addScript(src, check, opts);
    });
}


function _mw_addX3d(url, onload = null,
        opts = null) {

    if(opts === null)
        opts = { containerNodeType: 'group' };
    if(opts.containerNodeType === undefined || opts.containerNodeType === null)
        opts.containerNodeType = 'group';

    if(opts.parentNode ===  undefined || opts.parentNode === null)
        var group = document.createElement(opts.containerNodeType);
    else
        var group = opts.parentNode;

    _mw_assert(group);

    var inline = document.createElement('inline');
    _mw_assert(inline);
    inline.setAttribute("namespacename", url);

    inline.onerror = function() {
        mw_fail(url + ' failed to load');
    };

    group.appendChild(inline);
 
    if(_mw.scene === undefined) {
        var scenes = _mw_findNodes(
                document.getElementsByTagName("BODY")[0], 'SCENE',
            function (node, nodeName) {
                return node; // what to return in an array
            },
            function (node, nodeName) {
                // The test function
                return node.nodeName === nodeName;
            }
        );
        _mw_assert(scenes.length === 1, 'scenes=' + scenes);
        _mw.scene = scenes[0];
    }

    _mw.scene.appendChild(group);

    inline.onload = function() {

        var dir = inline.url.replace(/[^\/]*$/, '');
        var actorScripts = _mw_findNodes(inline, 'data-mw_script',
                function(node, attribute) {
                    var src = node.getAttribute(attribute);
                    if(src.substr(0,1) !== '/') {
                        return  dir + src;
                    }
                    else
                        return src;
                }
        );
        var actorCalls = _mw_findNodes(this, 'data-mw_call',
                function(node, attribute) {
                    return {
                        node: node ,
                        call: node.getAttribute(attribute)
                    };
                }
        );

        // if the xd3 file had data-mw_script and/or data-mw_call
        // attributes we load the scripts and run the "mw_call" functions.
        _mw_addScripts(actorScripts, actorCalls, opts);

        inline.onload = null;
        //inline.url = null; // this brakes this code.  Why??

        if(typeof(onload) === 'function') {
            onload(group);
        }

    };

    inline.setAttribute('url', url);
}


function _mw_addActor(url, onload = null, opts = null) {

    var suffix = url.replace(/^.*\./g, '').toLowerCase(); 

    switch (suffix) {
        case 'x3d':
            _mw_addX3d(url, onload, opts);
            return;
        case 'js':
            _mw_addScript(url, onload, opts);
            return;
        case 'css':
            _mw_addCss(url, onload);
            return;
        default:
            console.log('MW Unknown Actor type: ' + url);
    }
}


// Add a node from a served file:
//
//    <inline> for .x3d added to <scene>
//    <script> for .js
//    <link>   for .css
//
//  url is:
//
//    1. full path
//    2. relative to document.currentScript if not in handler
//    3. scriptNode.Dir/url if in a handler in a mw_addActor()
//       loaded script file
//
function mw_addActor(url = null, onload = null, opts = null) {

    // TODO: consider adding a query part to the URL

    //console.log('mw_addActor(' + url + ', ' + onload, opts);

    if(url === null) {
        if(_mw.actorFiles.length > 0) {
            // This is a flush command
            console.log('MW Actor flushing:' + _mw.actorFiles);
            mw_addActor(_mw.actorFiles.pop(),function(node) {},
                    _mw.actorOpts.pop());
        }
        // Nothing to flush or we are flushing it already.
        return;
    }

    if(onload === null) {
        _mw.actorFiles.push(url);
        _mw.actorOpts.push(opts);
        return;
    }

    //console.log('----------- url=' + url + ' \n  ' +onload);

    if(_mw.actorFiles.length > 0) {

        // we have a onload.

        console.log('MW Actor loading series: ' +
                _mw.actorFiles + ',' + url);

        var actorFilesCount = _mw.actorFiles.length;
        var Url;
        var Opts;
        while((Url = _mw.actorFiles.shift())) {
            Opts = _mw.actorOpts.shift();
            _mw_addActor(Url, function(node) {
                    if(--actorFilesCount === 0) {
                        _mw_addActor(url, onload, opts);
                    }
            }, Opts);
        }

        // _mw.actorFiles.length === 0
        // _mw.actorOpts.length === 0

        return;
    }

    _mw_addActor(url, onload, opts);
}


function _mw_getSubscriptions() {

    _mw_assert(this !== window);

    this.emit('subscription', decoder /*TODO*/);
}


// (TODO) This must verify the that this subscription creation is
// permitted from the server.  Command "Creates Subscriptions" to the
// server.  this is the socket.
function _mw_createSubscription(encoder, decoder) {

    _mw_assert(this !== window);

    this.emit('subscription', encoder, decoder);
}

function _mw_subscribe(obj) {

    _mw_assert(this !== window);

    // TODO:
    
    console.log('subscribe(' + obj + ')');
}


// update from this client to the server writing subscription channels
// from this client to the server.
// this is the socket.  Subscribed clients will have the decoder already
// so we do not waist bandwidth resending it again and again.
// obj should be minimum data needed for client to use.
function _mw_emitUpdates(obj/*array of objects or single object*/) {

    _mw_assert(this !== window);

    this.emit('update', obj/*TODO*/);
}


function _mw_currentScriptAddress() {

    // document.currentScript is not defined in script handlers.
    _mw_assert(document.currentScript,
            'you cannot get the current script in a handler');
    return document.currentScript.
                src.replace(/^.*:\/\//, '').replace(/\/.*$/, '');
}


function mw_getScriptOpts() {

    _mw_assert(document.currentScript,
            'you cannot get the current script in a handler');
    return document.currentScript._mw_opts;
}


// returns a string that is the URL without the filename
// and including the last '/'.
// This will not work in a callback function.
function mw_getCurrentScriptPrefix() {

    _mw_assert(document.currentScript,
            'mw_getCurrentScriptPrefix(): you cannot get ' +
            'the current script in a handler');
    return document.currentScript.src.replace(/[^\/]*$/,'');
}


// This is the Mirror Worlds client factory function
//
// userInit(mw) called in connect callback.
// TODO: This makes an object that is not exposed outside this
// function scope.  Do we need to make this a client constructor function?
//
// opts { url: 'url' }
function mw_client(userInit = function(mw) {
            console.log('MW called default userInit('+mw+')');
        },
        opts = {}) {

    var defaultUrl = location.protocol + '//' +
            location.hostname + ':' + location.port;

    if(opts.url === undefined)
        opts.url = defaultUrl;

    if(opts.url !== defaultUrl && _mw.remoteURL !== opts.url) {

        // This will connect to a remote server.

        // keep trying until _mw.client_userInitFunc is not set
        if(typeof(_mw.client_userInitFunc) === 'function') {

                        console.log('MW waiting to connect to: ' + opts.url);
            // Try again later.
            setTimeout(function() {
                // Interesting, this is recursion without adding to the
                // function call stack.  Or is it still called recursion?
                mw_client(userInit, {url: opts.url});
            }, 400/* x 1 seconds/1000*/);
            return null; // See this is returning (popping this call)
            // before we call mw_client() again.
        }

        // This _mw.client_userInitFunc is changed back to null in
        // /mw/mw_client.js

        _mw.client_userInitFunc = userInit;
        // It's not known when this script gets loaded
        mw_addActor(opts.url + '/mw/mw_client.js', userInit);
        return null; // We cannot return an object in this case.
    }


    console.log('MW Socket.IO trying to connect to:' + opts.url);

    // the mw object inherits the socket.io object
    // the mw object is the socket.io object
    //
    var mw = new io.connect(opts.url, {'sync disconnect on unload': true });

    // mw is a socket and we add more
    // client requests to the server
    mw.ConnectionCount = ++_mw.connectionCount;
    mw.CreateSubscription = _mw_createSubscription;
    mw.Subscribe = _mw_subscribe;
    mw.EmitUpdates = _mw_emitUpdates;
    mw.url = opts.url;

    mw.on('connect', function(event) {
        console.log('MW Connected Socket.IO to: ' + opts.url);
        // The users' callback function get to use the mw object
        // that is the socket.
        mw.emit('initiate', 'default');
    });
    mw.on('initiate', function(data0) {
        console.log('MW Recieved Socket.IO initiate message from ' +
                mw.url + ':\n  ' +
                data0);

        userInit(mw);

        // TODO: find the currently available subscriptions here.

    });

    // Incoming socket.on  Commands 
    //
    //   update:  Get subscribed data in an array of subscriptions
    //            [] array of channels
    //
    //   subscription:  Pops up when available subscriptions change
    //                  [] array of channels that we may subscribe to
    //_mw_assert(
    //
    // Outgoing socket.emit Commands
    //
    //   update:  Put subscription data from this client as a source
    //            [] array of channels or single
    //
    //   subscription:  Creates subscriptions
    //                  [] array of channels that we would like to create
    //                  or single
    //
    //   subscribe:  subscribe to [] array of channels that we would like
    //               to create or single
    //
    //

    mw.on('update', function(data) {
        // TODO: Code to receive subscribed data:
        console.log('MW Recieved Socket.IO update message ' +
                data);
    });

    mw.on('subscription', function(data) {
        // TODO: Code to receive possible subscriptions:
        console.log('MW Recieved Socket.IO subscriptions ' +
                data);
    });

    mw.on('disconnect', function() {				
        mw.disconnect();
        mw.removeAllListeners(); // Now it should not reconnect.
        console.log('MW Socket.IO server at ' + opts.url +
                ' disconnected');
        delete mw;
        mw = null;
    });

    return mw;
}


function _mw_init() {

    // Parse the URL query:
    if(location.search.match(/.*(\?|\&)file=.*/) != -1)
        var url = location.search.replace(/.*(\?|\&)file=/,'').
            replace(/\&.*$/g, '');

    if(typeof url == undefined || url.length < 1) {
        // The default mode
        // This is the only place that we declare this.
        var url = 'mw_default.js';
    }

    mw_client(/*on initiate*/function(mw) {

        // When this is executed all the stuff is loaded.
        mw_addActor(url);
        mw_addActor(); // flush it.
    });
}


// Called from body onload event.
function mw_init() {

    // This stuff is required to be loaded before the page onload is called,
    // so we call it now.
    mw_addActor('x3dom/x3dom.css');
    mw_addActor('x3dom/x3dom.js');
    mw_addActor('/socket.io/socket.io.js');
    mw_addActor('mw_client_default.css', function(node) { _mw_init(); });
}
