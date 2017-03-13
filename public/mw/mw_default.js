// Note: this script does not pollute the name space.
// Load this with mw_addActor('mw_default.js', mw)
// where mw is the mirror worlds client from mw_client().


mw_addActor('actor/examples/plane.x3d');
mw_addActor('actor/examples/gnome.x3d');


// Run this after this script is loaded which is after the mirror worlds
// client is setup.
document.currentScript.onload = function() {

    // We indirectly get arguments from the script object.
    var mw = this.Arg; // mw is the mirror worlds client

    mw_addActor('subscription/clientNavigationFollow.js', mw);

    console.log('mw_default.js load handler finished');
}
