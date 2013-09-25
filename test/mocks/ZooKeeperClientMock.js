/**
 * @file ZooKeeperClientMock.js
 * @author kgao
 */

var mockConstructor = require('./mockConstructor'),
    rewire = require('rewire'),
    zookeeper = rewire('node-zookeeper-client');

module.exports = function() {
  var Client = zookeeper.__get__('Client');

  return mockConstructor(Client.prototype);
};
