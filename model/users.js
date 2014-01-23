var roomsModel = require('./channels.js');

User = function(client) {
    this.name = null;
    this.authentify = false;
    this.client = client;
    this.uuid = client.uuid;
    this.user_uuid = client.user_uuid;
    this.session = client.sessionId;
    this.activity = new Date().getTime();

    this.channels = [];
    this.room = null;
    this.send = function(data) {
        this.client.send(data);
    };
    this.getChannels = function() {
        var channels = [];
        this.channels.each(function(channel) {
            channels = Channels.getChannel(channel);
        });
        return channels;
    };
};

// A list of users, with appropriate methods
Users = function(channel) {
    this.room = room;

    // Add a new user to the room
    this.addUser = function(user) {
        this[user.name] = user;
    };

    // Checks to see if a user exists
    this.getUser = function(name) {
        var user = this[name];
        if (user && user.name) {
            return user;
        };
    };

    // Pull a user from the object
    this.removeUser = function(user) {
        user.status = "quit";
        testUser = this[user.name];
        if (testUser && testUser.session == user.session) {
            this[user.name] = null;
            return true;
        } else {
            sys.log("sessions don't match -- not deleting.");
            return false;
        }
    };

    // Return all valid users
    this.allUsers = function() {
        var users = [];
        for (attr in this) {
            if (!this.hasOwnProperty(attr))
                continue;
            var user = this.getUser(attr);
            if (user && user.name) {
                users.push(user);
            }
        }
        return users;
    };

    // Send a message to all users in this list
    this.sendToAll = function(data) {
        var msg = JSON.stringify(data);
        var users = this.allUsers();
        for (var i=0; i<users.length; i++) {
            user = users[i];
            user.send(msg);
        }
    };

    // Send a message to a single user
    this.sendToOne = function(user, data) {
        var msg = JSON.stringify(data);
        user.send(msg);
    };

    // Check which users are inactive ('away')
    this.checkAway = function() {
        var mostRecent = 0;
        var users = this.allUsers();
        var now = new Date().getTime();
        for (var i=0; i<users.length; i++) {
            var user = users[i];
            if (!user.activity)
                continue;
            if (user.activity > mostRecent)
                mostRecent = user.activity;
            var diff = now - user.activity;
            if (diff > config.awayTimout) {
                if (user.status != "away") {
                    
                    user.status = "away";
                    Commands.away(user, {});
                }
            } else {
                user.status = "active";
            }
        }
        return mostRecent;
    };

};