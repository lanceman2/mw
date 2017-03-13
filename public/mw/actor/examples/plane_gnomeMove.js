// We keep the namespace clean by calling this anonymous function.

(function() {

    var prefix = mw_getCurrentScriptPrefix();

    mw_addActor(prefix + 'plane.x3d');

    // First load the move() function and then load the x3d object and
    // then start moving the object.

    mw_addActor(prefix + 'move.js', function(script) {

        // This is where we really need prefix since the context of a
        // handler call has no associated script node.
        mw_addActor(prefix + 'gnome.x3d', function(inlineNode) {

            // To stop infinite recursion, because move() re-parents the
            // node, causing a reload.
            inlineNode.onload = null;

            // This is called when we have the move function and the x3d
            // inline node both loaded.
            move(inlineNode);
        });
    });
})();
