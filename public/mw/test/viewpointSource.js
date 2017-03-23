// This is a test world in which our veiwpoint is a source of body
// position (pos) and orientation (rotation, rot).  It's just testing this
// as being a rigid body position source that is feed to the Mirror Worlds
// server.  Other clients may read the rigid body positions that we
// send.

(function() {

    var pre = mw_getCurrentScriptPrefix();
    var opts = mw_getScriptOpts();
    var src = mw_getCurrentScriptSrc();

    mw_assert(opts.mw, 'mw client object not passed to ' + src);

    // Our very simple test world:
    mw_addActor(pre+'../actor/example/plane.x3d');
    mw_addActor(pre+'../actor/avatar/teapot.x3d');

    // Add the viewpoint source thingy, so other clients
    // may follow us:
    mw_addActor(pre+'../subscription/source/body_3pos_4rot.js',

        function() {

            console.log(src + ' finished setting up');
        },
        {
            // options for body_3pos_4rot.js
            //
            body: mw_getCurrentViewpoint(), // get pos and rot from body
            listener: 'viewpointChanged',   // event to listen to
            mw: opts.mw                     // mw WebSocket object sending
        }
    );
})();
