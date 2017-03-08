var _mw_scene = false;

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

// returns an array of all nodes with attribute
function _mw_findAttributes(node, attribute, func = false) {

    var ret = [];

    if(node === undefined || !node) return false;

    //console.log('node = ' + node.innerHTML);

    if(node.hasAttribute && node.hasAttribute(attribute)) {
        if(func)
            ret = [func(node)];
        else
            ret = [node.getAttribute(attribute)];
    }

    for(node = node.firstChild; node !== undefined && node ;
            node = node.nextSibling) {
        var r = _mw_findAttributes(node, attribute, func);
        if(r.length > 0)
            ret = ret.concat(r);
    }

    return ret;
}


function _mw_runFunctions(actorCalls)
{
    actorCalls.forEach(
        function(call) {
            console.log('MW CALLING: ' + call.call + '(' +
                    call.node + ')');
            window[call.call](call.node);
        }
    );
}


function _mw_addScripts(actorScriptUrls, actorCalls) {

    var count = actorScriptUrls.length;
    actorScriptUrls.forEach(function(src) {
        
        var script = document.createElement('script');
        document.head.appendChild(script);
        script.src = src;
        script.onload = function() {
            --count;
            console.log('MW LOADED script: ' + src);
            actorScriptUrls.pop();
            if(count === 0) {
                // We call after all scripts are loaded:
                _mw_runFunctions(actorCalls);
            }
        };
    });
}


function mw_addActor(url) {

    var group = document.createElement('group');
    _mw_assert(group);
    var inline = document.createElement('inline');
    _mw_assert(inline);
    inline.setAttribute("namespacename", url);
    inline.setAttribute("url", url);
    
    inline.onload = function() {

        var actorScripts = _mw_findAttributes(this, 'data-mw_script');
        var actorScriptUrls = [];
        var actorCalls = _mw_findAttributes(this, 'data-mw_call',
                function(node) {
                    return { node: node , call: node.getAttribute('data-mw_call') };
                }
        );

        var dir = inline.url.replace(/[^\/]*$/, '');

        actorScripts.forEach(function(src) {
            // TODO: make this handle a general URL
            // not just a path.
            if(src.substr(0,1) !== '/')
                actorScriptUrls.push(dir + src);
            else
                actorScriptUrls.push(src);
        });

        _mw_addScripts(actorScriptUrls, actorCalls);
    }

    group.appendChild(inline);
    _mw_getElementById('mw_scene').appendChild(group);
}


// Called from body onload event.
function mw_main() {

    // Change 'http' to 'ws' and 'https' to 'wss'
    var socketUrl = location.href.replace(/^http/, 'ws');
    socket = new WebSocket(socketUrl);
    socket.onopen = function(event) {
        console.log('MW Connected webSocket to ' + socketUrl);
    }
    socket.onmessage = function(event) {
        console.log('MW Client received the message ' + event.data);
    }
    socket.onclose = function(event) {
        console.log('MW Client webSocket to ' + socketUrl + ' closed');
    }

    mw_addActor('actor/simpleExamples/move.x3d');
}
