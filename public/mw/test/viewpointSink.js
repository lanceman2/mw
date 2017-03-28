(function() {

    var opts = mw_getScriptOptions();

    // Our dumb world:
    mw_addActor(opts.prefix+'../actor/example/plane.x3d');
    mw_addActor(opts.prefix+'../actor/avatar/teapot.x3d');
    mw_addActor(); // flush

    opts.mw.subscribeAll = true;

    console.log('Loaded ' + opts.src);
})();
