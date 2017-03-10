// This is so that we may add Mirror Worlds WebSocket server connections
// from different Mirror Worlds WebSocket servers.  With this we can have
// more that one Mirror Worlds server connection.  So we can watch updates
// from other virtual worlds.

// On firefox, console.log() fails to work if this is called from a script
// from another server.
console.log(' ---------------######################- ScriptAddress=' + _mw_currentScriptAddress());
_mw.lastClient = mw_client();
_mw.haveLastClient = true;
