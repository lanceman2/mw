// This does the same thing that avatarTheHardWay.js does without extra
// data and if() statements by nesting the callback function dependences,
// building in the load dependencies naturally. For example moving the
// avatar depends on loading the avatar so we do not setup the move Avatar
// callbacks in the add Avatar callback.  Nesting callbacks in callbacks
// in callbacks ... etc, tends to be a natural way to code in "dependency
// trees" in javaScript.

(function() {

    var opts = mw_getScriptOptions();
    var mw = opts.mw;

    // Our very simple test world:
    mw_addActor(opts.prefix+'../examples/plane.x3d');
    mw_addActor(opts.prefix+'../examples/teapot.x3d');

    mw_addActor(); // flush the above mw_addActor() calls.

    // The callback to add another users Avatar The function get called
    // with the arguments that are sent in sendPayload(avatarId,
    // avatarUrl) on another client below.
    mw.recvPayload('addAvator',

        // function - What to do with the payload:
        // Add an avatar.  avatarId is the server service subscription ID.
        function(avatarId, avatarUrl) {

            mw_addActor(avatarUrl, function(transformNode) {

                // Set the cleanup function after we get the actor model
                // loaded, now:
                var cleanup = function(sourceId) {

                    if(transformNode !== undefined) {
                        transformNode.parentNode.removeChild(transformNode);
                        delete transformNode;
                    }
                };

                //mw.setUnsubscribeCleanup(avatarMoveId, cleanup);
                mw.setUnsubscribeCleanup(avatarId, cleanup);

                // Called to receive data from sendPayload(avatarMoveId,
                //   avatarMoveId, avatarId, e.position, e.orientation);
                // from another client calling far below here in this
                // file.  'moveAvator' is a subscription descriptor for a
                // class of subscriptions.  You may not use numbers as a
                // descriptor (not like '21').  Numbers can only be used
                // for particular subscriptions (IDs) after the server
                // sets them up.
                mw.recvPayload('moveViewpointAvator_' + avatarId, 

                    // function - What to do with the payload: Move the
                    // avatar.  avatarMoveId is the server service
                    // subscription ID.
                    function(avatarMoveId, _avatarId, pos, rot) {

                        if(transformNode !== undefined) {

                            transformNode.setAttribute('translation',
                                pos.x + ' ' + pos.y + ' ' + pos.z);
                            transformNode.setAttribute('rotation',
                                rot[0].x + ' ' + rot[0].y + ' ' +
                                rot[0].z + ' ' + rot[1]);
                        }
                });
 
            }, {
                containerNodeType: 'Transform'
            });
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
            mw.sendPayload(/*where to send =*/avatarId,
                        /*what to send =*/avatarId,
                        opts.prefix + '../examples/gnome.x3d');

            // We move "our" avatar on the other clients by sending our
            // viewpoint The positioning of the Avatar depends on the
            // Avatar being loaded, therefore this is nested under the
            // Avatar setup callback.
 
            mw.createSource('Move Viewpoint Avator',/*shortName*/
                'avator viewpoint position as 3 pos and 4 rot'/*description*/,
                'moveViewpointAvator_' +
                avatarId/*recvPayload() function name (or url of javaScript)*/,
                function(avatarMoveId, shortName) {

                    // Wrapper utility function with sends the payload
                    // called twice below.
                    function sendPayload(pos, rot) {
                        mw.sendPayload(/*where to send =*/avatarMoveId,
                            /*what to send =*/avatarMoveId, // and
                            avatarId, 
                            pos, rot);
                    }

                    // This is the "move avatar" source function.
                    // We have approval from the server now we setup a
                    // handler.

                    // Send initial state the subscribers.
                    sendPayload(mw_getCurrentViewpoint().position,
                            mw_getCurrentViewpoint().orientation);

                    // Send this each time we change the viewpoint.
                    // TODO: throttle this.  It may be writing too much.
                    mw_getCurrentViewpoint().addEventListener(
                            'viewpointChanged',
                        function(e) {

                            sendPayload(e.position, e.orientation);
                        }
                    );
                }
            );
        }
    );

})();
