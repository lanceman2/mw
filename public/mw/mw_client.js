var _mw = {}; // one stinking global

function mw_fail() {

    var text = "Something has gone wrong";
    for(var i=0; i < arguments.length; ++i)
        text += "\n" + arguments[i];
    console.log(text);
    alert(text);
    window.stop();
    throw text;
}


function _mw_assert(val, msg)
{
    if(!val)
    {
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


function _mw_addScript(src, onloadFunc = null) {

    console.log('MW Adding Script src= ' + src);
    var script = document.createElement('script');
    document.head.appendChild(script);
    script.src = src;
    script.onload = onloadFunc;
}


function _mw_addCss(href, onloadFunc = null) {

    console.log('MW Adding CSS href= ' + href);
    var link = document.createElement('link');
    document.head.appendChild(link);
    link.setAttribute("rel", "stylesheet");
    link.setAttribute("type", "text/css");
    link.setAttribute("href", href)
    link.onload = onloadFunc;
}


// actorScriptUrls and actorCalls are arrays of strings.
function _mw_addScripts(actorScriptUrls, actorCalls = null) {

    if(actorCalls && actorCalls.length) {
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

        _mw_addScript(src, check);
    });
}


function _mw_addX3dActor(url) {

    var group = document.createElement('group');
    _mw_assert(group);
    var inline = document.createElement('inline');
    _mw_assert(inline);
    inline.setAttribute("namespacename", url);
    inline.setAttribute("url", url);

    inline.onload = function() {

        var dir = inline.url.replace(/[^\/]*$/, '');
        var actorScripts = _mw_findNodes(this, 'data-mw_script',
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
        _mw_addScripts(actorScripts, actorCalls);
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
}

function mw_addActor(url) {

    console.log('MW Adding Actor: ' + url);

    // TODO: consider adding a query part to the URL

    var suffix = url.replace(/^.*\./g, '').toLowerCase();

    switch (suffix) {
        case 'x3d':
            _mw_addX3dActor(url);
            return;
        case 'js':
            _mw_addScript(url);
            return;
        case 'css':
            _mw_addCss(url);
            return;
        default:
            console.log('MW Unknown Actor type: ' + url);
    }
}


// (TODO) This must verify the that this subscription creation is
// permitted from the server.  Command "Creates Subscriptions" to the
// server.  this is the socket.
function _mw_createSubscription(decoder) {

    _mw_assert(this !== window);

    this.emit('subscription', decoder /*TODO*/);
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


// userInit(mw) called in connect callback.
//
function mw_init(userInit = function(mw) {
            console.log('MW called default userInit()');
        }) {

    // Change 'http' to 'ws' and 'https' to 'wss'
    var socketUrl = location.href.replace(/^http/, 'ws');

    // the mw object inherits the socket.io object
    // the mw object is the socket.io object
    var mw = new io.connect('');
    // mw is a socket and we add more
    // client requests to the server
    mw.CreateSubscription = _mw_createSubscription;
    mw.Subscribe = _mw_subscribe;
    mw.EmitUpdates = _mw_emitUpdates;

    mw.on('connect', function(event) {
        console.log('MW Connected Socket.IO to ' + socketUrl);
        mw.createSubscription = _mw_createSubscription;
        mw.emitUpdate = _mw_emitUpdates;
        mw.subscribe = _mw_subscribe;
        // The users' callback function get to use the mw object
        // that is the socket.
        mw.emit('initiate', 'default');
    });
    mw.on('initiate', function(data0) {
        console.log('MW Recieved Socket.IO initiate message ' +
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
    //
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
        console.log('MW Socket.IO server at ' + location.host +
                ' disconnected');
        delete mw;
        mw = null;
    });
}



function _mw_bodyPreload() {

    // This stuff is required to be loaded before the page onload is called,
    // so we call it now.
    mw_addActor('x3dom/x3dom.css');
    mw_addActor('x3dom/x3dom.js');
    mw_addActor('/socket.io/socket.io.js');
    mw_addActor('mw_client_default.css');
}


// Called from body onload event.
function mw_main() {

    mw_init( /*init()*/function(mw) {
            mw.createSubscription('foo');
            mw_addActor('example.js');
        }
    );
}


// Call this now before the body onload function so that it's all
// loaded before the body onload function mw_main() gets called.
// We could use callbacks to do this, but this is way less coding.
_mw_bodyPreload();
