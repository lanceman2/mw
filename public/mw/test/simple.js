// Run this after this script is loaded which is after the mirror worlds
// client is setup.
(function() {

    var pre = mw_getScriptOptions().prefix;

    mw_addActor(pre+'../examples/plane.x3d');
    mw_addActor(pre+'../examples/gnome.x3d');

})();
