/**
 * @file A wrapper for creating a Helix participant
 * @author kgao
 * @module node-helix-participant
 */

'use strict';

var format = require('util').format,
    HelixManager = require('./helix/HelixManager'),
    InstanceType = require('./helix/InstanceType');

/**
 *
 * @param {string} clusterName - The name of the Helix cluster
 * @param {string} instanceName - The name of the cluster instance to be managed
 * @param {string} zkConnectString - A ZooKeeper connection string. Formatting is as follows:
 * "<server>:<port>,<server>:<port>,...,<server>:<port>/RootZNode"
 * @param {StateModelFactory} stateModelFactory - State model factory to be used for participant
 * @returns {object} Helix participant
 */
function createParticipant(clusterName, instanceName, zkConnectString, stateModelFactory) {
  console.log(format("Creating a Helix participant instance. clusterName: %s, instanceName: %s, zkSvr: %s",
    clusterName,
    instanceName,
    zkConnectString));

  var manager = new HelixManager(clusterName, instanceName, InstanceType.PARTICIPANT, zkConnectString);

  /**
   * Returns the manager for this participant.
   * @returns {HelixManager} Helix manager instance
   */
  function getManager() {
    return manager;
  }

  /**
   * Starts the Helix Manager for this instance.
   */
  function start() {
    manager.connect();
  }

  /**
   * Stops the Helix Manager for this instance.
   */
  function stop() {
    manager.disconnect();
  }

  return {
    getManager: manager,
    start: start,
    stop: stop
  };
}

exports.createParticipant = createParticipant;