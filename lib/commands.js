var usersM  = require('../model/users.js');

exports = {
    
    // Alert all users that a room is closing
    close: function(room, data) {
        data = { command: "close",
                 message: data.message };
        room.sendToAll(data);
    },

    // Alert a room that a user is inactive (away)
    away: function(user, data) {
        data = { command: "away",
                 name: user.name };
        user.getRoom().sendToAll(data);
    },

    // Broadcast a chat message (may be a 'private' broadcast)
    broadcast: function(user, data) {
        user.activity = new Date().getTime();
        if (user.status == "away")
            user.status = "active";
        privateUser = data.private;
        data = { command: "broadcast",
                 message: data.message,
                 name: user.name };
        if (privateUser) {
            data.private = privateUser;
            toUser = user.getRoom().users[privateUser];
            if (!toUser)
                return Commands.error(user, "User doesn't exist or left.");
            user.getRoom().sendToOne(toUser, data);
            user.getRoom().sendToOne(user, data);
        } else {
            user.getRoom().sendToAll(data);
        }
    },

    // Send an error to a single user
    error: function(user, message) {
        var data = { name: user.name,
                     message: message,
                     command: "error" };
        user.getRoom().sendToOne(user, data);
    },

    // A user requested an invalid name
    invalidName: function(user, message) {
        data = { command: "invalidName",
                 name: user.name,
                 message: message };
        user.getRoom().sendToOne(user, data);
    },

    // A user has 'joined' a room (valid name)
    join: function(user, data) {
        user.getRoom().addUser(user);
        user.activity = new Date().getTime();
        data = { command: "join",
                 name: user.name }
        user.getRoom().sendToAll(data);
    },

    // A user has left a room (DCed, etc.)
    leave: function(user, data) {
        data = { command: "leave",
                 name: user.name }
        var room = user.getRoom();
        if (!room) {
            sys.log("No room for user?");
            return;
        }
        var result = room.removeUser(user);
        if (result)
            user.getRoom().sendToAll(data);
    },

    // A user has requested a list of users in the room
    users: function(user, data) {
        userData = [];
        users = user.getRoom().allUsers();
        for (var i=0; i<users.length; i++) {
            userData.push({ name: users[i].name,
                            status: users[i].status });
        }
        data = { command: "users",
                 users: userData }
        user.getRoom().sendToOne(user, data);
    },

    // The request commands (from a user)
    commands: {
        
        // A user is submitting a name for the room
        name: function(user, data) {
            var message = null;
            if (!data.name || data.name.length < 3)
                message = "Name must be 3 characters or longer.";
            if (!data.name || data.name.replace(/^\w+$/g, "") != "")
                message = "Only letters, numbers, and _ are allowed.";
            if (user.getRoom().getUser(data.name))
                message = "That name is taken.";
            if (message)
                return Commands.invalidName(user, message);

            if (user.name) {
                return Commands.error(user, "Can't change name!");
            }
            user.name = data.name;
            Commands.join(user, data);
        },

        // A user has submitted a message
        chat: function(user, data) {
            Commands.broadcast(user, data);
        },

        // A user has requested a list of users
        users: function(user, data) {
            Commands.users(user, data);
        },

        // A user quits the channel nicely
        quit: function(user, data) {
            Commands.leave(user, data);
        }

    },

    // Parse a requested command
    parse: function(user, data) {
        if (!user.room && !data.room)
            return Commands.error(user, "Unknown channel.");
        if (!user.room) {
            var room = Rooms.getRoom(data.room);
            if (!room)
                return Commands.error(user, "Unknown channel.");
            user.room = data.room;
        }
        if (Commands.commands.hasOwnProperty(data.command)) {
            Commands.commands[data.command](user, data);
        } else {
            Commands.error(user, "Unknown command: "+data.command);
        }
    }

};