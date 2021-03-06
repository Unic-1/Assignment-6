/*
 * This is a simple Hello World api
 */

var http = require('http');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var cluster = require('cluster');
var os = require('os');

var httpServer = http.createServer(function (req, res) {
    unifiedServer(req, res);
});

var unifiedServer = function (req, res) {
    // Parse the url
    var parseUrl = url.parse(req.url, true);

    // Get url path name
    var path = parseUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the payload, if any
    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data', function (data) {
        buffer += decoder.write(data);
    });
    req.on('end', function () {
        buffer += decoder.end();

        var chooseHandler = typeof (routes[trimmedPath]) != 'undefined' ? routes[trimmedPath] : handler.notDefined;

        var data = {};

        chooseHandler(data, function (statusCode, payload) {
            // Verify the statusCode
            statusCode = typeof (statusCode) == 'number' ? statusCode : 200;

            // Verify the payload
            payload = typeof (payload) == 'object' ? payload : {};

            // Convert payload to string
            payload = JSON.stringify(payload);

            // This is the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payload);

            // Log the response
            console.log("Returning this response: ", statusCode, payload);
        });
    });
};

if (cluster.isMaster) {
    for (var i = 0; i < os.cpus().length; i++) {
        cluster.fork();
    }
} else {
    httpServer.listen(3000, function () {
        console.log("The server is listening on port 3000")
    })
}


// Handler for routes
var handler = {}

// Hello world handler
handler.hello = function (data, callback) {
    callback(200, {
        "message": "Hello World"
    });
}

// Not defined handler
handler.notDefined = function (data, callback) {
    callback(404);
}

// Setting up routes for request
var routes = {
    'hello': handler.hello
}