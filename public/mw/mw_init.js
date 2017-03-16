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


function mw_assert(val, msg) {

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

    mw_assert(group);

    var inline = document.createElement('inline');
    mw_assert(inline);
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
        mw_assert(scenes.length === 1, 'scenes=' + scenes);
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

        console.log('MW loaded ' + url);
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


function _mw_currentScriptAddress() {

    // document.currentScript is not defined in script handlers.
    mw_assert(document.currentScript,
            'you cannot get the current script in a handler');
    return document.currentScript.
                src.replace(/^.*:\/\//, '').replace(/\/.*$/, '');
}


// returns a string that is the URL without the filename
// and including the last '/'.
// This will not work in a callback function.
function mw_getCurrentScriptPrefix() {

    mw_assert(document.currentScript,
            'mw_getCurrentScriptPrefix(): you cannot get ' +
            'the current script in a handler');
    return document.currentScript.src.replace(/[^\/]*$/,'');
}


function mw_getScriptOpts() {

    mw_assert(document.currentScript,
            'you cannot get the current script in a handler');
    return document.currentScript._mw_opts;
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
   
    // We handle protocols: http: https: ws: wss:
    // The http(s) protocols are converted to ws: or wss:

    var defaultUrl = location.protocol.replace(/^http/, 'ws') +
        '//' + location.hostname + ':' + location.port + '/';

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

    var mw = new WebSocket(opts.url);

    mw.url = opts.url;

    mw.onCalls = {};

    mw.on = function(name, func) {

        mw.onCalls[name] = func;
    };

    mw.onopen = function(e) {

        console.log('MW connected to ' + mw.url);

        // TODO: add a timeout handler to happen before this
        // event if this event takes to long.

        userInit(mw);
    };

    mw.emit = function(name, data) {

        var name = arguments.shift();
        mw.send(JSON.stringify({ name: name, arguments }));
    };

    mw.onmessage = function(e) {

        //console.log('MW WebSocket message from '
        //        + mw.url + '\n   ' + e.data);

        var obj = JSON.parse(e.data);
        var name = obj.name;

        // We should have this form:
        // e.data = { name: eventName, args:  [ {}, {}, {}, ... ] }
        if(name === undefined || obj.args === undefined || !(obj.args instanceof Array)) {
            console.log('array=' + (obj.args.isArray && obj.args.isArray()));
            mw_fail('MW Bad WebSocket "on" message from ' + mw.url +
                    '\n  ' + e.data);
        }

        if(mw.onCalls[name] === undefined)
            mw_fail('MW WebSocket on callback "' + name +
                    '" not found for message from ' + mw.url + ':' +
                    '\n  ' + e.data);

        // Call the on callback function using array spread syntax.
        //https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Operators/Spread_operator
        (mw.onCalls[name])(...obj.args);
    };

    mw.onclose = function(e) {

        console.log('MW closed to ' + mw.url);
    };

    // pretty good client webSocket tutorial.
    // http://cjihrig.com/blog/how-to-use-websockets/

    mw.on('initiate', function(message) {

        console.log('MW from ' + mw.url +
                '/n   ' + message);
    });

    return mw;
}


function _mw_init() {

    var url = null;

    // Parse the URL query:
    if(location.search.match(/.*(\?|\&)file=.*/) != -1)
        url = location.search.replace(/.*(\?|\&)file=/,'').
            replace(/\&.*$/g, '');

    if(url === null || url.length < 1) {
        // The default mode
        // This is the only place that we declare this.
        url = 'mw_default.js';
    }

    mw_client(/*on initiate*/function(mw) {

        // When this is executed all the stuff is loaded.
        mw_addActor(url, null, { mw: mw } );
        mw_addActor(); // flush it.
    });
}


// Called from body onload event.
function mw_init() {

    // This stuff is required to be loaded before the page onload is called,
    // so we call it now.
    mw_addActor('x3dom/x3dom.css');
    mw_addActor('x3dom/x3dom.js');
    mw_addActor('mw_default.css', function(node) { _mw_init(); });
}
