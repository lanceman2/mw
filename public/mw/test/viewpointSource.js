(function() {

    var pre = mw_getCurrentScriptPrefix();
    var opts = mw_getScriptOpts();
    var src = mw_getCurrentScriptSrc();

    mw_assert(opts.mw, 'mw client object not passed to ' + src);

    // Our dumb world:
    mw_addActor(pre+'../actor/example/plane.x3d');
    mw_addActor(pre+'../actor/avatar/teapot.x3d');

    // Add the viewpoint source thingy, so other clients
    // may follow us:
    mw_addActor(pre+'../subscription/source/body_3pos_4rot.js',

        function() {

            console.log(src + ' finished running');
        },
        {
            // options for body_3pos_4rot.js
            //
            body: mw_getCurrentViewpoint(),
            listener: 'viewpointChanged',
            mw: opts.mw
        }
    );
})();
