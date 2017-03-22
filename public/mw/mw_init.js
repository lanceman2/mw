// This file is sourced from world.html
// This is the first Mirror Worlds javaScript
// file that is loaded by the browser client.


// one stinking global
var _mw = {

    connectionCount: 0, // number of times we make a webSocket connection
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


function mw_getCurrentViewpoint()
{
    if(_mw.viewpoint !== undefined) return _mw.viewpoint;

    var x3d = document.getElementsByTagName("X3D");
    mw_assert(x3d && x3d.length > 0, 'first x3d tag not found');
    x3d = x3d[0];
    mw_assert(x3d, 'first x3d tag not found');
    // This call suggests that there is just one active viewpoint at any time
    // for a given x3d tag.  So there must be more x3d tags if you need
    // more views.
    var viewpoint = x3d.runtime.getActiveBindable("Viewpoint");

    //Attach default viewpoint if none exists
    if(viewpoint == undefined) {

	viewpoint = document.createElement("viewpoint");
	var scene = x3d.getElementsByTagName("Scene");

	mw_getScene.appendChild(viewpoint);
        viewpoint.setAttribute("position", "2 1.5 5");
	viewpoint.setAttribute("orientation", "0 0 0 0");
    }
    _mw.viewpoint = viewpoint;
    return viewpoint;
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

    // x3dom BUG: x3dom BUG: x3dom BUG: x3dom BUG: x3dom BUG: x3dom BUG:
    //
    // This code a little convoluted to work around a x3dom bug.
    //
    // We are not able to load a inline without putting it in a group of
    // some kind.  If we do not, some of the attributes of the children of
    // the inline seem to just disappear.  It must be a x3dom BUG.  If you
    // wish to fix this by using the inline as the container group node,
    // please run tests to be sure all the possible cases work.  BUG:
    // TODO: fix x3dom inline so it does not lose children and
    // sub-children attributes when being loaded with javaScript.  Please
    // heed this warning, or pain will ensue.
    //
    // TODO: check x3dom web BUG tickets for this bug.
    //
    /// x3dom BUG: x3dom BUG: x3dom BUG: x3dom BUG: x3dom BUG: x3dom BUG:

    if(opts === null)
        var opts = { containerNodeType: 'group' };
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

    mw_getScene().appendChild(group);

    inline.onload = function() {

        var dir = inline.url.replace(/[^\/]*$/, '');
        // This is where x3dom discards attributes if not for the
        // extra group node above the <inline>.
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


function mw_getScene() {

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
    return _mw.scene;
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


function mw_getCurrentScriptSrc() {

    mw_assert(document.currentScript,
            'mw_getCurrentScriptPrefix(): you cannot get ' +
            'the current script in a handler');
     return document.currentScript.src;
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


    console.log('MW WebSocket trying to connect to:' + opts.url);

    // the mw object inherits the WebSocket object
    // the mw object is the WebSocket object

    var mw = new WebSocket(opts.url);

    mw.url = opts.url;

    mw.onCalls = {};
    mw.recvCalls = {};

    mw.on = function(name, func) {

        mw.onCalls[name] = func;
    };

    mw._emit = function(name, data) {

        var args = [].slice.call(arguments);
        var name = args.shift();
        mw.send(JSON.stringify({ name: name, args: args }));
    };

    // Sends through the server to clients 
    mw.sendPayload(serverSourceId, data) {

        var args = [].slice.call(arguments);
        var id = args.shift();
        // 'P' is a magic constant
        mw.send('P' + id + ':' + JSON.stringify(
                    { args: args }));
    };

    mw.recvPayload(serverSourceId, func) {

        mw.recvCalls[serverSourceId] = func;
    };


    mw.onmessage = function(e) {

        //console.log('MW WebSocket message from '
        //        + mw.url + '\n   ' + e.data);

        // Is this a Payload to just send to clients that subscribe?
        // Look for 'P' the magic constant.
        if(message.substr(0, 1) === 'P') {

            var message = e.data;
            // The message should be of the form: 'P343:' + jsonString
            // where 343 is an example source ID.
            // An example of a mininum message would be like 'P2:{}'
            var idLen = 1;
            var stop = messagee.data.length - 3;
            // find a ':' so the ID is before it.
            while(idLen < stop && message.substr(idLen+1, 1) !== ':')
                ++idLen;
            
            if(idLen === stop) {
                console.log('MW Bad WebSocket "on" message from ' +
                    mw.url + '\n  ' + e.data);
                return;
            }

            // We strip off the source ID and send the Payload.
            var sourceId = message.substr(1, idLen);
            var obj = JSON.parse(message.substr(2+idLen));

            if(mw.recvCalls[sourceId] === undefined)
                mw_fail('MW WebSocket on payload sink callback "' + name +
                    '" not found for message from ' + mw.url + ':' +
                    '\n  ' + e.data);


            (mw.recvCalls[sourceId])(...obj.args);


            return;
        }


        var obj = JSON.parse(e.data);
        var name = obj.name;

        // We should have this form:
        // e.data = { name: eventName, args:  [ {}, {}, {}, ... ] }
        if(name === undefined || obj.args === undefined ||
                !(obj.args instanceof Array)) {
            mw_fail('MW Bad WebSocket "on" message from ' +
                    mw.url + '\n  ' + e.data);
        }

        if(mw.onCalls[name] === undefined)
            mw_fail('MW WebSocket on callback "' + name +
                    '" not found for message from ' + mw.url + ':' +
                    '\n  ' + e.data);

        console.log('MW WebSocket handled message from '
                + mw.url + '\n   ' + e.data);

        // Call the on callback function using array spread syntax.
        //https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Operators/Spread_operator
        (mw.onCalls[name])(...obj.args);
    };

    mw.onclose = function(e) {

        console.log('MW closed to ' + mw.url);
    };

    mw.onopen = function(e) {

        console.log('MW connected to ' + mw.url);

        mw._emit('initiate', 'hello', 'mirror worlds');
    };

    // pretty good client webSocket tutorial.
    // http://cjihrig.com/blog/how-to-use-websockets/

    mw.on('initiate', function(id) {

        mw.Id = id;

        console.log('MW initiate from ' + mw.url +
                '\n   client ID=' + id);

        // set a default user name
        mw.Name = 'User' + id;

        // TODO: add a timeout handler to happen before this
        // event if this event takes to long.

        userInit(mw);
    });

    mw.SourceId = 0;
    mw.CreateSourceFunc = {};

    mw.createSource(shortName, description, jsSinkSrc, func) {

        var sourceId = (++mw.SourceId).toString(); // client source ID
        mw.CreateSourceFunc[sourceId] = func;

        mw._emit('createSource', sourceId, shortName, description, jsSinkSrc);
    };

    mw.on('createSource',
        function(clientSourceId, serverSourceId, shortName,
            description, jsSinkSrc) {

            var func = mw.CreateSourceFunc[sourceId];
            // The shortName and description may be modified by the server
            // and are returned in this callback to the javaScript that
            // called mw.createSource().
            func(serverSourceId, shortName, description);
            // We are done with this function.
            delete mw.CreateSourceFunc[sourceId];
        }
    );

    mw.subscribe = function(sourceId, shortName, description, jsSinkSrc) {

        mw_addActor(jsSinkSrc,
                function() {},
                {
                    // options passed
                    mw: mw,
                    sourceId: sourceId, // server source ID
                    shortName: shortName,
                    description: description
                }
            );
    };

    mw.on('newSubscription', function(sourceId, shortName,
        description, jsSinkSrc) {

            // TODO: add a subscription user selection system that
            // configures what to do with this service.  For now
            // just subscribe to all newSubscription(s) received.
            mw.subscribe(sourceId, shortName, description, jsSinkSrc);
        }
    );


    return mw;
}


// WebRTC
// https://www.html5rocks.com/en/tutorials/webrtc/basics/
// https://www.w3.org/TR/webrtc/
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

    mw_addActor('x3dom/x3dom.css');
    mw_addActor('x3dom/x3dom.js');
    mw_addActor('mw_default.css', function(node) { _mw_init(); });
}
