(function() {

    var opts = mw_getScriptOptions();
    var mw = opts.mw;

    // Our very simple test world:
    mw_addActor(opts.prefix+'../examples/plane.x3d');
    mw_addActor(opts.prefix+'../examples/teapot.x3d');

    mw_addActor(); // flush the above mw_addActor() calls.

    // list of avatars gets updated in mw.recvPayload('addAvator', ...)
    // for different avatars.
    var avatars = { };

    // The callback to add another users Avatar The function get called
    // with the arguments that are sent in sendPayload(avatarId,
    // avatarUrl) on another client below.
    mw.recvPayload('addAvator',

        // function - What to do with the payload:
        // Add an avatar.  avatarId is the server service subscription ID.
        function(avatarId, avatarUrl) {

            mw_addActor(avatarUrl, function(transformNode) {

                avatars[avatarId] = transformNode;

                }, {
                    containerNodeType: 'Transform'
                }
            );
        },

        // function - What to do for when the avatar related subscription
        // quits or we unsubscribe.  Cleanup.
        function(avatarId) {

            // TODO: add a javaScript preprocessor to remove asserts
            // in production builds.
            mw_assert(avatars[avatarId] !== undefined,
                    'Cannot cleanup avatar id=' + avatarId);

            avatars[avatarId].parentNode.removeChild(avatars[avatarId]);
            delete avatars[avatarId];
            // avatars[avatarId] should be undefined now.
        }
    );


    // Called to receive function for sendPayload(avatarMoveId, avatarId,
    //   e.position, e.orientation);
    // from another client calling far below here in this file.
    // 'moveAvator' is a subscription descriptor for a class or
    // subscriptions.  You may not use numbers as a descriptor
    // (not like '21').  Numbers can only be used for particular
    // subscriptions (IDs) after the server sets them up.
    mw.recvPayload('moveViewpointAvator', 

        // function - What to do with the payload: Move the avatar.
        // avatarMoveId is the server service subscription ID.
        function(avatarMoveId, avatarId, pos, rot) {

        if(avatars[avatarId] !== undefined) {

            avatars[avatarId].setAttribute('translation',
                pos.x + ' ' + pos.y + ' ' + pos.z);
            avatars[avatarId].setAttribute('rotation',
                rot[0].x + ' ' + rot[0].y + ' ' + rot[0].z + ' ' + rot[1]);

        }
        // function - What to do for when the avatar quits.
        // Cleanup.  Okay nothing to do, 'addAvator' should do it for us.
        // cleanup function defaults to null.
    });


    // We tell the server that we want an Avatar file to represent us on
    // the other clients
    mw.createSource('Add Avatar',/*shortName*/
        'user viewpoint avatar'/*description*/,
        // 'addAvator' is association to the sink call to
        // mw.recvPayload('addAvator', ...) above.
        // This is the magic that connects sendPayload() to its
        // corresponding recvPayload().
        'addAvator'/* the recvPayload function name or url to javaScript
                    * file receiver code (not url in this case) */,
        function(avatarId, shortName) {

            // This is the avatar source function.

            // avatarId is the unique server service subscription Id that
            // the server assigned to us.  shortName is assigned too, but
            // based on our shortName that is requested in
            // mw.createSource() just above.

            // TODO: add user avatar selection.
            // We could do it here based on avatarId.
            // The arguments to this function get called with
            // mw.addAvator() on the receiving client end.
            mw.sendPayload(avatarId,
                            opts.prefix + '../examples/gnome.x3d');

            // We move "our" avatar on the other clients by sending our
            // viewpoint The positioning of the Avatar depends on the
            // Avatar being loaded, therefore this is nested under the
            // Avatar setup callback.
            mw.createSource('Move Viewpoint Avator',/*shortName*/
                'avator viewpoint position as 3 pos and 4 rot'/*description*/,
                'moveViewpointAvator'/*function name (or url of javaScript)*/,
                function(avatarMoveId, shortName) {

                    // This is the "move avatar" source function.
 
                    // We have approval from the server now we setup a
                    // handler.
                    mw_getCurrentViewpoint().addEventListener(
                            'viewpointChanged',
                        function(e) {
                    
                            // Send this to the subscribers in this
                            // handler.
                            mw.sendPayload(avatarMoveId, avatarId,
                                    e.position, e.orientation);
                        }
                    );
                }
            );
        }
    );

})();
