/**
 * @file Simple example of how to create an instance of a Helix participant.
 * @author Kevin Gao
 */

'use strict';

var util = require('util'),
    participant = require('../lib/participant'),
    StateModel = require('../lib/helix/StateModel'),
    StateModelFactory = require('../lib/helix/StateModelFactory');

var clusterName = process.env.CLUSTER_NAME || 'clusterName',
    instanceName = process.env.INSTANCE_NAME || 'instanceName',
    zkConnectString = process.env.ZK_ADDRESS || 'localhost:2181';

function OfflineOnlineStateModel(partitionName, states, initialState) {
  OfflineOnlineStateModel.super_.call(this, partitionName, states, initialState);
}
util.inherits(OfflineOnlineStateModel, StateModel);

OfflineOnlineStateModel.prototype.__OFFLINEtoONLINE__ = function(message, notificationContext) {
  console.log('Went from OFFLINE to ONLINE');
};
OfflineOnlineStateModel.prototype.__ONLINEtoOFFLINE__ = function(message, notificationContext) {
  console.log('Went from ONLINE to OFFLINE');
};

var a = new OfflineOnlineStateModel('1', ['OFFLINE', 'ONLINE']);
debugger;

var fooParticipant = participant.createParticipant(
  clusterName,
  instanceName,
  zkConnectString,
  new StateModelFactory(OfflineOnlineStateModel, ['OFFLINE', 'ONLINE'], 'OFFLINE')
);

fooParticipant.start();

setTimeout(function() {
  fooParticipant.stop();
}, 10000);
