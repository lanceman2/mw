// Note: this script does not pollute the name space.
// Load this with mw_addActor('mw_default.js', mw)
// where mw is the mirror worlds client from mw_client().



// Run this after this script is loaded which is after the mirror worlds
// client is setup.
(function() {

    var pre = mw_getCurrentScriptPrefix();

    mw_addActor(pre+'actor/examples/plane.x3d');
    mw_addActor(pre+'actor/examples/gnome.x3d');

    mw_addActor(pre+'subscription/clientNavigationFollow.js',
            function() {

                console.log(pre+'mw_default.js load handler finished');
            },
            { avatorUrl: pre+'actor/avatar/teapot.x3d' }
    );
})();
