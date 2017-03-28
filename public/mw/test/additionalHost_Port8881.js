
(function() {

    var opts = mw_getScriptOptions();

    mw_addActor(opts.prefix+'../actor/example/plane.x3d');
    mw_addActor(opts.prefix+'../actor/example/gnome.x3d');

    mw_client(
        function(mw) {
            
            console.log('MW added Mirror Worlds connection ' + mw.url);
        },
        { url: 'http://localhost:8881'}
    );

})();
