exports.update = function(config) {
    config.authenticationTimeout = 30;
    this.host = process.env.HOST || 'push.staging.trackline-project.net';
};