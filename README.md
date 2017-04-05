# Development Notes





## Terms

### source

javaScript that provides data to the server which relays it to the clients

### sink

javaScript that reads data from the server


## JavaScript Interfaces


mw_addActor( file, onloadCallback(node) {} );

onloadCallback() is called after all previous mw_addActor()
have finished loading.  You must add a onloadCallback to the
last mw_addActor() call to flush the requests.
Example:
<pre>
    mw_addActor('x3dom/x3dom.css');
    mw_addActor('x3dom/x3dom.js');
    mw_addActor('/socket.io/socket.io.js');
    mw_addActor('mw_client_default.css', function(node) { _mw_init(); });
</pre>
before the last call to  mw_addActor() with the onloadCallback all the
files to be loaded are just saved in a list to be loaded at the last
mw_addActor() with the onloadCallback, we call flushing the file load
requests.






mw_client( onConnect(mw) { }, optsObject );


### Something to think about

WebRTC

https://www.html5rocks.com/en/tutorials/webrtc/basics/

https://www.w3.org/TR/webrtc/

