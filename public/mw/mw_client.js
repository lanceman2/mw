// This is so that we may add Mirror Worlds WebSocket server connections
// from different Mirror Worlds WebSocket servers.  With this we can have
// more that one Mirror Worlds server connection.  So we can watch updates
// from other virtual worlds.

_mw_assert(typeof(_mw.client_userInitFunc) === 'function');

// Get the first part of the URL to this server.
var url = document.currentScript.src.match(/^http(s|)//[^\/]*\//, '');

_mw_assert(url && url.length);

url = url[0];

mw_client(_mw.client_userInitFunc, {address: url});

_mw.client_userInitFunc = null;
