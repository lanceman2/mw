(function() {

    var opts = mw_getScriptOptions();

    // Required option(s):
    mw_assert(typeof opts.sourceId !== 'undefined',
            'no source ID given to ' + opts.src);

    var viewpoint = mw_getCurrentViewpoint();

    // register a handler for the incoming data.
    opts.mw.recvPayload(opts.sourceId,
        // receive function
        function(pos, rot) {

            viewpoint.setAttribute('position', pos.x + ' ' +
                    pos.y + ' ' + pos.z);
            viewpoint.setAttribute('orientation', rot[0].x + ' ' +
                    rot[0].y + ' ' + rot[0].z + ' ' + rot[1]);
        },
        // removeSubscription function
        function() { console.log('Removed subscription for ' + opts.src); }
    );
})();
