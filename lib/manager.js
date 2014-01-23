/*!
 * socket.io-node
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var util = require('../vendor/util')
  , Logger = require('../vendor/logger');


/**
 * Manager constructor.
 *
 * @param {HTTPServer} server
 * @param {Object} options, optional
 * @api public
 */

function Manager () {
  

  // this.log.info('socket.io started');
};


/**
 * Generates a session id.
 *
 * @api private
 */

Manager.prototype.generateId = function () {
  return Math.abs(Math.random() * Math.random() * Date.now() | 0).toString()
    + Math.abs(Math.random() * Math.random() * Date.now() | 0).toString();
};

