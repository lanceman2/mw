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


    // register a handler for the incoming data.
    mw.recvPayload(serverSourceId, function(position, rotation) {
        console.log('MW received ' + opts.shortName + '\n   ' +
                'position: ' + position + '\n   ' +
                'rotation: ' + rotation);
    });

    console.log(src + ' setup handler');
})();
