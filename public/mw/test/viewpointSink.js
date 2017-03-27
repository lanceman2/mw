(function() {

    var pre = mw_getCurrentScriptPrefix();
    var opts = mw_getScriptOpts();
    var src = mw_getCurrentScriptSrc();

    console.log('Loading ' + src);

    mw_assert(opts.mw, 'mw client object not passed to ' + src);

    // Our dumb world:
    mw_addActor(pre+'../actor/example/plane.x3d');
    mw_addActor(pre+'../actor/avatar/teapot.x3d');
    mw_addActor();

    opts.mw.subscribeAll = true;

    console.log('Loaded ' + src);
})();
