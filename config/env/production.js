exports.update = function(config) {
    config.authenticationTimeout = 30;
    this.host = process.env.HOST || 'push.trackline-project.net';
};