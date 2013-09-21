/**
 * @file A wrapper for creating a Helix participant
 * @author kgao
 * @module node-helix-participant
 */

'use strict';

var HelixAdmin = require('./helix/admin'),
    HelixManager = require('./helix/manager');

/**
 * Enumeration of instance types.
 * @readonly
 * @enum {string}
 */
var INSTANCE_TYPE = {
  /** @constant */
  PARTICIPANT: 'PARTICIPANT'
};

/**
 *
 * @param {string} clusterName - The name of the Helix cluster
 * @param {string} instanceName - The name of the cluster instance to be managed
 * @param {string} zkConnectString - A ZooKeeper connection string. Formatting is as follows:
 * "<server>:<port>,<server>:<port>,...,<server>:<port>/RootZNode"
 * @param {object} stateModel - State model to be used for participant
 * @returns {object} Helix participant
 */
function createParticipant(clusterName, instanceName, zkConnectString, stateModel) {
  var manager = HelixManager(clusterName, instanceName, INSTANCE_TYPE.PARTICIPANT, zkConnectString);

  /**
   * Returns the manager for this participant.
   * @returns {HelixManager} Helix manager instance
   */
  function getManager() {
    return manager;
  }

  return {
    getManager: manager
  };
}

exports.createParticipant = createParticipant;