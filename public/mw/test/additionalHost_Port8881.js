
(function() {

    var pre = mw_getCurrentScriptPrefix();

    mw_addActor(pre+'../actor/example/plane.x3d');
    mw_addActor(pre+'../actor/example/gnome.x3d');

    mw_client(
        function(mw) {
            
            console.log('MW added Mirror Worlds connection ' + mw.url);
        },
        { url: 'http://localhost:8881'}
    );

})();
