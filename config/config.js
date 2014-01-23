/* The Base Configuration file and startup options

ONLY change these if you want them changed across ALL installations.
(i.e., this file should be in version control). You should put specific
deploayment options under "development.js" or "production.js", etc under
the root folder.

Those files should look like:

    exports.update = function(config) {
        config.port = 1337;
    };

*/

exports.configure = function() {

    this.port = process.env.PORT || 4242;
    this.host = process.env.HOST || '0.0.0.0';
    // this.checkInterval = 10000; // ten seconds
    this.transports = [ 'websocket', 'htmlfile', 'xhr-multipart', 'xhr-polling', 'jsonp-polling' ];
    // this.transports = ['xhr-polling'];
    // this.pollingDuration = 10;

    this.authenticationTimeout = 30;
    
    // Configure deployment settings
    if (!process.env.NODE_ENV)
        process.env.NODE_ENV = 'development';

    require("./env/"+process.env.NODE_ENV+".js").update(this);
   
    return this;
};

