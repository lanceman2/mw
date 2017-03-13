
mw_addActor('actor/examples/plane.x3d');
mw_addActor('actor/examples/gnome.x3d');

mw_client(
        function(mw) {
            
            console.log('another Mirror Worlds host' + wm.url);
        },
        { url: 'http://localhost:8881'}
);
