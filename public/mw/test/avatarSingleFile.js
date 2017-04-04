(function() {

    var opts = mw_getScriptOptions();
    var mw = opts.mw;

    // Our very simple test world:
    mw_addActor(opts.prefix+'../examples/plane.x3d');
    mw_addActor(opts.prefix+'../examples/teapot.x3d');

    mw_addActor(); // flush


    var avatars = { };

    // The callback to add another users Avatar The function get called
    // with the arguments that are sent in sendPayload(avatarId,
    // avatarUrl) on another client below.
    mw.recvPayload('addAvator', function(avatarId, avatarUrl) {

        mw_addActor(avatarUrl, function(transformNode) {

            avatars[avatarId] = transformNode;

            }, {
                containerNodeType: 'Transform'
            }
        );
    }

    // Called to receive function for sendPayload(avatarMoveId, avatarId,
    //   e.position, e.orientation);
    // from another client called below.
    mw.recvPayload('moveAvator', function(avatarMoveId, avatarId, pos, rot) {

        if(avatars[avatarId] !== undefined) {

            avatars[avatarId].setAttribute('translation',
                pos.x + ' ' + pos.y + ' ' + pos.z);
            avatars[avatarId].setAttribute('rotation',
                rot[0].x + ' ' + rot[0].y + ' ' + rot[0].z + ' ' + rot[1]);

        }, function(
    });


    // We tell the server that we want an Avatar file to represent us on
    // the other clients
    mw.createSource('avatar',/*shortName*/
            'user avatar'/*description*/,
            'addAvator'/*the mw recvPayload function name (or url of javaScript)*/,
        function(avatarId, shortName) {

            // TODO: add user avatar selection.
            // We could do it here based on avatarId.
            // The arguments to this function get called with
            // mw.addAvator() on the receiving client end.
            mw.sendPayload(avatarId,
                            opts.prefix + '../examples/gnome.x3d');

            // We move "our" avatar on the other clients by sending our
            // viewpoint The positioning of the Avatar depends on the
            // Avatar being loaded, therefore this is nested under the
            // Avatar setup callback.:w
            mw.createSource('move_avator',/*shortName*/
                'avator body position as 3 pos and 4 rot'/*description*/,
                'moveAvator'/*function name (or url of javaScript)*/,
                function(avatarMoveId, shortName) {
 
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
