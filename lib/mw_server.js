/* We have 3 run cases: 
 *
 *   1. running mw_server from some where else where it's installed:
 *
 *     - mw_server can be in your PATH, and can run many instances
 *
 *   2. running mw_server from the source directory:
 *
 *     - Easier for development
 *
 *   3. you can run 'node lib/mw_server.js'
 *
 *     - This works but does not have the builders configuration changes
 *       to the default parameters from running ./configure
 *
 * All these cases need to be tested to make a release.
 *
 * We also keep it so that if a user wishes to they may move the whole
 * installed directory tree to a different directory and still be able to
 * use it without any changes to any file.  They just need to keep the
 * installed files with all their relative paths the same.  To make this
 * so, we require that all these projects files must not depend on the
 * absolute path, at least at startup time, and the path to other
 * installed project files must be computed from __dirname in this file,
 * or be a relative path (not full path).
 *
 * Hence the structure of the source files is the same as the installed
 * files.
 *
 * In nodeJS __dirname resolves symlinks to the real full path.  That's
 * just what it does, so we work with it.
 */


/* config is defined above then this program spliced together via 'make'. */

if(config == null)
    var config = {};

/* Command line and environment optional configuration override some
 * config values via this local 'options' module. */
require("./options").parse(config);


var path = require('path'),
    fs = require('fs'),
    https = require('https').createServer({
            key: fs.readFileSync(path.join(config.etc_dir, 'key.pem')),
            cert: fs.readFileSync(path.join(config.etc_dir, 'cert.pem'))
        }, https_handler).listen(config.https_port);

if(config.http_local)
    var http = require('http').createServer(http_handler).
        listen(config.http_port, 'localhost');
else
    var http = require('http').createServer(http_handler).
        listen(config.http_port);

var
    io = require('socket.io').listen(http),
    ios = require('socket.io').listen(https),
    url = require('url'),
    querystring = require('querystring');


// Sends a file.
// TODO: there is no way this is efficient for large files.
function send(req, res, pathname, fullpath)
{
    fs.readFile(fullpath, function(err, data) {
        if (err) {
            res.writeHead(500);
            res.end('Error getting ' + pathname);
            console.error(err);
            return;
        }

        res.writeHead(200);
        res.end(data);
        console.log('sent ' + pathname + ' to ' +
                req.connection.remoteAddress + ':' +
                req.connection.remotePort);
    });
}


function http_handler(req, res) 
{
    var urL = url.parse(req.url);
    var pathname = urL.pathname;

    if(config.mw_dir_str !== pathname.substr(0, config.mw_dir_str_length) ) {
        // regular file not beginning with '/mw/'
        send(req, res, pathname, config.doc_root + pathname);
        return;
    }

    // It is an internal mirror worlds pathname beginning with '/mw/'

    send(req, res, pathname, path.join(config.mw_prefix, pathname));
}


function ws_OnConnection(socket) {
  
    var address =
        socket.request.connection.remoteAddress + ':' +
        socket.request.connection.remotePort;

    console.log('New socket.io connection from ' + address);

    socket.on('initiate', function(obj) {
        console.log('Socket.io initiate from ' +
                address + ':\n  ' + obj);
        // TODO: initialize a new client

        socket.emit('initiate', 'welcome to mirror Worlds');
    });

    socket.on('update', function(obj) {
        console.log('Socket.io update from ' +
                address + ':\n  ' + obj);
        // TODO:

        socket.emit('update', obj);
    });

    socket.on('subscription', function(obj) {
        console.log('Socket.io recieved subscription '
                + address + '\n  ' + obj);
        // TODO:

        socket.emit('subscription', obj);
    });

    socket.on('createSubscription', function(obj) {
        console.log('Socket.io recieved creteSubscription ' +
                address + ':\n  encode=' + obj.encode +
                '\n  decode=' + obj.decode);
        // TODO:

        socket.emit('createSubscription', obj);
    });

    socket.on('subscribe', function(obj) {
        console.log('Socket.io recieved subscribe: ' +
                address + ':\n  ' + obj);
        // TODO:
    });

    socket.on('disconnect', function() {
        console.log('Socket.io connection closed: ' + address);
    });
}


io.on('connection', ws_OnConnection);
ios.on('connection', ws_OnConnection);



function https_handler(req, res) {

    // This handler just adds some authentication and then calls
    // the http handler.

    function parseCookies(req) {
        var list = {},
        rc = req.headers.cookie;

        rc && rc.split(';').forEach(function( cookie ) {
            var parts = cookie.split('=');
            list[parts.shift().trim()] = decodeURI(parts.join('='));
        });

        return list;
    }

    if(config.passcode.length > 0) {
    ////////////////////////////////////////////////////////////////////
    // Restrict access to this server.
    // We do this by:
    //
    //      Checking that a valid session cookie (passcode) was sent
    //
    //                 or
    //
    //      A valid query with the passcode
    //
    //

    var obj = querystring.parse(url.parse(req.url).query);
    var cookie = parseCookies(req);
    var need_pass_cookie = (!cookie.passcode ||
           cookie.passcode != config.passcode);

    if(need_pass_cookie &&

            (!obj.passcode || obj.passcode.length < 1 ||
            obj.passcode != config.passcode)) {

        console.log('rejected connection from address:  ' +
                req.connection.remoteAddress.replace(/^.*:/, '') +
                ' invalid passcode');

        // TODO: IS there a way to close the socket after the end()

        res.writeHead(500, {"Content-Type": "text/plain"});
        res.write("\nBad passcode\n\n");
        res.end();
        return;
    } else if(need_pass_cookie)
        res.setHeader('Set-Cookie', 'passcode=' + config.passcode);
    }

    // Do the same thing as in a http request.
    http_handler(req, res);
}


// Startup spew to stderr when the server is running, nothing more.
http.on('listening', function() {

    var address =  http.address();

    // If there is no binding (or so called ANY) address than we will be
    // listening on all Internet interfaces, including localhost
    // (127.0.0.1) if it's setup and usable.  It should be called "all
    // addresses".
    //
    // nodejs http server has address='::' for the ANY address interface,
    // or so it appears.
    //
    // Since the native nodejs does not provide an interface to get all
    // known IP interfaces, we just punt and use 'localhost' and
    // 'hostname', where hostname may not even have a working DNS
    // lookup.

    if(address.address.toString() === '::')
        console.error('Server listening on All Addresses on port ' +
                address.port + "\n" +
                'So you may be able to connect via:\n\n' +
                '           http://localhost:' + address.port +
                '/mw/index.html\n' +
                '      or:  http://' + require('os').hostname() +
                ':' + address.port + '/mw/index.html\n');
    else
        console.error('Server listening at:\n\n           http://' +
                address.address + ':' + address.port + '/mw/index.html\n');
});


// Startup spew for the TSL version of the server.
https.on('listening', function() {

    var address = https.address();
    var passcode = '';
    if(config.passcode.length > 0)
        passcode = '?passcode=' + config.passcode;

    if(address.address.toString() === '::')
        console.error('Secure server listening on All Addresses on port ' +
                address.port + "\n" +
                'So you may be able to connect via:\n\n' +
                '           https://localhost:' + address.port +
                '/mw/index.html' + passcode +'\n' +
                '      or:  https://' + require('os').hostname() +
                ':' + address.port + '/mw/index.html' + passcode + '\n');
    else
        console.error('Secure server listening at:\n\n           http://' +
                address.address + ':' + address.port + '/mw/index.html' +
                passcode) + '\n';
});
