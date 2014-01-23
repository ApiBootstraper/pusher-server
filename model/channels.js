var Channel = function(id, name) {
    this.name = name;
    this.id = id;
    this.users = new Users(this.name);
    this.created = new Date().getTime();

    // Wrapper for Users.addUser
    this.addUser = function(user) {
        this.users.addUser(user);
    };

    // Wrapper for Users.getUser
    this.getUser = function(name) {
        return this.users.getUser(name);
    };

    // Wrapper for Users.allUsers
    this.allUsers = function() {
        return this.users.allUsers();  
    };

    // Wrapper for Users.sendToAll
    this.sendToAll = function(data) {
        this.users.sendToAll(data);
    };

    // Wrapper for Users.sendToOne
    this.sendToOne = function(user, data) {
        this.users.sendToOne(user, data);
    };

    // Wrapper for Users.checkAway
    this.checkActivity = function() {
        result = this.users.checkAway();
        if (!result)
            result = this.created;
        return result;
    };

    // Wrapper for Users.removeUser
    this.removeUser = function(user) {
        return this.users.removeUser(user);
    };
}

// All of the chat channels associated with this server
var Channels = {
    channels: {},

    // adding a new channel to the channel list
    createChannel: function(id, name) {
        var channel = Channels.channels[id];
        if (channel && channel.id)
            return null; // already taken
        Channels.channels[id] = new Channel(id, name);
        return Channels.channels[id];
    },

    // retrieving a channel object from the channel list
    getChannel: function(id) {
        var channel = Channels.channels[id];
        if (!channel || !channel.id)
            return null;
        return channel;
    },

    // set users to 'away' / 'active', and delete channels
    // if necessary
    checkActivity: function () {
        for (channelName in Channels.channels) {
            var channel = Channels.channels[channelName];
            if (!channel || !channel.id)
                continue
            var lastActivity = channel.checkActivity();
            var expires = lastActivity + config.channelTimeout;
            var userCount = channel.allUsers().length;
            if (expires < new Date().getTime() && userCount == 0) {
                // deleting channel
                Channels.channels[channelName] = null;
            }
        }
    },

    // delete a channel, alerting any remaining users
    closeChannel: function(name, data) {
        if (!data.message) {
            data.message = "Closing channel.";
        }
        Commands.close(Channels.channels[name].users, data); 
    }
    
};