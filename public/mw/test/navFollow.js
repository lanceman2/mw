(function() {

    var pre = mw_getCurrentScriptPrefix();
    var opts = mw_getScriptOpts();

    mw_assert(opts.mw, 'mw client object not passed to' +
            pre+'navFollow.js');

    // Our dumb world:
    mw_addActor(pre+'../actor/example/plane.x3d');
    mw_addActor(pre+'../actor/example/gnome.x3d');

    // Add the nav thingy:
    mw_addActor(pre+'../subscription/clientNavigationFollow.js',
            
        function() {

            console.log(pre+'navFollow.js load handler finished');
        },
        {
            avatorUrl: pre+'../actor/avatar/teapot.x3d',
            mw: opts.mw
        }
    );
})();
