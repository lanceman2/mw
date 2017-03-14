
mw_addActor('actor/examples/plane.x3d');
mw_addActor('actor/examples/gnome.x3d');

mw_client(
        function(mw) {
            
            console.log('MW added Mirror Worlds connection ' + mw.url);
        },
        { url: 'http://localhost:8881'}
);
