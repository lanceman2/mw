(function() {

    var pre = mw_getCurrentScriptPrefix();
    var src = mw_getCurrentScriptSrc();

    // document.currentScript is not defined in callbacks so we get the
    // script options here now, like so:
    var opts = mw_getScriptOpts();
    var mw = opts.mw;
    var serverSourceId = opts.sourceId;

    // Required option:
    mw_assert(mw, 'mw client object not passed to' + src);
    mw_assert(typeof serverSourceId !== 'undefined', 'no source ID given to ' + src);

    var viewpoint = mw_getCurrentViewpoint();

    // register a handler for the incoming data.
    mw.recvPayload(serverSourceId,
        // receive function
        function(pos, rot) {

            viewpoint.setAttribute('position', pos.x + ' ' + pos.y + ' ' + pos.z);
            viewpoint.setAttribute('orientation', rot[0].x + ' ' + rot[0].y + ' ' +
                rot[0].z + ' ' + rot[1]);
        },
        // removeSubscription function
        function() { console.log('Removed subscription for ' + src); }
    );
})();
