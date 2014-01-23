/**************************************************************************
 * Required files
 **************************************************************************/
var http     = require('http'),
    util     = require('util'),
    express  = require('express'),
    httpAuth = require('http-auth'),
    io       = require("socket.io"),
    uuid     = require('node-uuid');

var config  = require('./config/config').configure();

var usersM      = require('./model/users.js'),
    channelsM   = require('./model/channels.js');

var Commands = require('./lib/commands.js'),
    Wordings = require('./lib/wordings.js');
    // Manager  = require('./lib/manager.js');

var A = require('./vendor/array.js');

var users = {};


/**************************************************************************
 * Initialize
 * Express + Socket.io
 **************************************************************************/
var app = express.createServer();
app.listen(config.port, config.host);
app.configure(function(){
    app.use(express.bodyParser());
});
var expressAuth = httpAuth({
    authType: "digest",
    authRealm: "realm",
    authFile: __dirname + '/users.htpasswd'
});

var socketServer = io.listen(app);



/**************************************************************************
 * Express
 **************************************************************************/
    app.get('/', function(req, res) {
        res.contentType('text');
        res.send(Wordings.welcomeMessage);
    });

    /**
     * Receive push from API, and send it into the channel asked
     */
    app.post('/api/send_push', function(req, res) {
        expressAuth.apply(req, res, function(username) {
            res.contentType('json');

            var channel = req.body.channel,
                event   = req.body.event,
                data    = req.body.data || {};
            // util.debug(JSON.stringify({'channel':channel, 'event':event, 'data':data}));

            if (channel != undefined && event != undefined) {
                socketServer.sockets.in(channel).send(JSON.stringify({'channel' : channel, 'event' : event, 'data' : data}));
                res.send(JSON.stringify({'msg':'Push sended'}), 200);
            }
            else {
                res.send(JSON.stringify({'msg':'Push not sended. Channel or event is missing.'}), 400);
            }
        });
    });

    /**
     * Verify authenticity of socket
     */
    app.post('/api/authenticate', function(req, res) {
        expressAuth.apply(req, res, function(username) {
            res.contentType('json');

            var socket_id    = req.body.socket_id || '',
                user_uuid    = req.body.user_uuid || '',
                authenticate = req.body.authenticate ? true : false,
                channels     = req.body.channels || [];
            // util.debug(JSON.stringify({'socket_id':socket_id, 'authenticate':authenticate, 'user_uuid':user_uuid, 'channels':channels}));
            var client = socketServer.sockets.sockets[socket_id];

            if (authenticate === true && client != undefined) {
                if (users[user_uuid] == undefined) users[user_uuid] = []
                users[user_uuid].push(socket_id);

                client.user.authentify = true;
                client.user.uuid = user_uuid;
                client.user.channels = channels;
                client.send(JSON.stringify({'msg':'You are now authenticate','data':{'auth':true, 'channels':channels}}));
                client.join("broadcast");

                for (var i = channels.length - 1; i >= 0; i--) {
                    // Subscribe the user in the channel
                    client.join(channels[i]);
                };

                res.send(JSON.stringify({'auth':true}), 200);
            }
            else
            {
                res.send(JSON.stringify({'auth':false, 'msg':'Undefined socket'}), 401);
            }
        });
    });

    /**
     * Subscribe socket session on new channels
     */
    app.post('/api/channels/subscribe', function(req, res) {
        expressAuth.apply(req, res, function(username) {
            res.contentType('json');

            var user_uuid    = req.body.user_uuid || '',
                new_channels = req.body.channels || [];
            util.debug("Subscribe" + JSON.stringify({'user_uuid':user_uuid, 'channels':new_channels}));
            var user_sockets = users[user_uuid];

            if (user_sockets != undefined)
            {
                for (var i = user_sockets.length - 1; i >= 0; i--)
                {
                    var client = socketServer.sockets.sockets[(user_sockets[i])];
                    if (client != undefined && client.user.authentify === true)
                    {
                        client.user.channels = client.user.channels.concat(new_channels);

                        for (var i = new_channels.length - 1; i >= 0; i--) {
                            // Subscribe the user in the channel
                            client.join(new_channels[i]);
                        };
                    }
                };
                // util.debug(JSON.stringify({'users':users, 'socket_id':user_sockets[i], 'client.user':client.user.channels}));

                res.send(JSON.stringify({'subscribe':true}), 200);
            }
            else
            {
                res.send(JSON.stringify({'subscribe':false, 'msg':'Undefined user_uuid'}), 401);
            }
        });
    });

    /**
     * Unsubscribe socket session on new channels
     */
    app.post('/api/channels/unsubscribe', function(req, res) {
        expressAuth.apply(req, res, function(username) {
            res.contentType('json');

            var user_uuid           = req.body.user_uuid || '',
                channels_to_remove  = req.body.channels || [];
            util.debug("Unsubscribe" + JSON.stringify({'user_uuid':user_uuid, 'channels':channels_to_remove}));
            var user_sockets = users[user_uuid];

            if (user_sockets != undefined)
            {
                for (var i = user_sockets.length - 1; i >= 0; i--)
                {
                    var client = socketServer.sockets.sockets[user_sockets[i]];
                    if (client != undefined && client.user.authentify === true)
                    {
                        var channels = client.user.channels;

                        for (var i = channels_to_remove.length - 1; i >= 0; i--) {
                            channels.remove(channels_to_remove[i]);
                            // Unsubscribe the user in the channel
                            client.leave(channels_to_remove[i]);
                        };
                    }
                };
                // util.debug(JSON.stringify({'users':users, 'socket_id':user_sockets[i], 'client.user':client.user.channels}));

                res.send(JSON.stringify({'unsubscribe':true}), 200);
            }
            else
            {
                res.send(JSON.stringify({'unsubscribe':false, 'msg':'Undefined user_uuid'}), 401);
            }
        });
    });




/**************************************************************************
 * Socket.io
 **************************************************************************/

// assuming io is the Socket.IO server object
// Resolve bug with Heroku
// socketServer.configure(function () { 
//   socketServer.set("transports", ["websocket"]); 
  // socketServer.set("polling duration", config.pollingDuration); 
// });

socketServer.sockets.on("connection", function(client) {
    verifAuthentication = function(client) {
        if (!client.user.authentify) {
            client.user.send(JSON.stringify({'msg': 'you have not authentified. Bye Bye !'}));
            client.disconnect();
        }
    }

    // Initialize client
    client.user = new User(client);

    // TODO verif identity with OAuth provider. Give just 30 seconds for the client, after, disconnect it.
    client.user.send(JSON.stringify({'msg': 'you have '+config.authenticationTimeout+' seconds for confirm your identity. Please authentify you on API', 'data':{'socket_id':client.sessionid}}));
    setTimeout(verifAuthentication, config.authenticationTimeout*1000, client);

    client.on("message", function(data) {
        client.send(JSON.stringify({'msg': 'you can\'t speak'}));
    });

    client.on("disconnect", function() {
        if (users[client.user.uuid] != undefined) users[client.user.uuid].remove(client.sessionid);
        // Commands.leave(client.user, {});
    });
});

/*
// HTTP Client example
var httpClient = http.createClien(80, 'api.dev.trackline-project.net'); // Place into config file

var request = client.request('POST', '/pusher/token_verification');
request.end();
request.on('response', function(response) {
    // Verif if identifiants is okey 
});
*/


util.puts('-- Server running on  '+config.host+':'+config.port);
