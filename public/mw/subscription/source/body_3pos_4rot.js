// source of a rigid body position
//
// using position (3) and orientation (4) [quaternion]
// granted the orientation has an extra degree of freedom.
//
// The body being the source is just required to have:
//
//    body.getAttribute('position')
//    body.getAttribute('orientation')
//    body.addEventListener(listener, function(e) {})
//
// Looks like in x3dom the quaternion is not normalized.
//
// The x3dom Viewpoint happens to be a 3 4 position thingy,
// so we can use this to share the viewport between clients.

(function() {

    var pre = mw_getCurrentScriptPrefix();
    var src = mw_getCurrentScriptSrc();

    // document.currentScript is not defined in callbacks so we get the
    // script options here now, like so:
    var opts = mw_getScriptOpts();
    var mw = opts.mw;

    // Required option:
    mw_assert(mw, 'mw client object not passed to' + src);
    mw_assert(typeof opts.body !== 'undefined', 'no body given to ' + src);
    mw_assert(typeof opts.listener !== 'string', 'no listener given to ' + src);


    mw.createSource('shortName', 'description',
            pre+'../sink/body_3pos_4rot.js' /*jsSinkSrc*/,
        function(serverSourceId, shortName, description) {
 
            // We have approval from the server now we setup a handler.
            opts.body.addEventListener(opts.listener,
                function(e) {

                    // Send this to the subscribers.
                    mw.sendPayload(serverSourceId,
                        body.getAttribute('position'),
                        // TODO: in other parts of x3dom they call it
                        // rotation (not orientation).  We may need to
                        // wrap this, or add an interface that deals with
                        // the different names.
                        body.getAttribute('orientation'));
                }
            );
        }
    );

    console.log(src + ' setup handler');
})();
