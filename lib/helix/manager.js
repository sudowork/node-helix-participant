/**
 * @file A subset of the features found in ZKHelixManager from the original Apache Helix project.
 * @author Kevin Gao
 * @module helix/manager
 */

'use strict';

var format = require('util').format,
    zookeeper = require('node-zookeeper-client');

/**
 * @TODO: This is a temporary function to be removed once actual functions are implemented.
 */
function noop() {
  var args = arguments;
  console.info(args.callee.name + " called");
}

/**
 * Creates a new HelixManager.
 * @param {string} clusterName - The name of the Helix cluster
 * @param {string} instanceName - The name of the cluster instance to be managed
 * @param {string} instanceType - For now, only "PARTICIPANT" is accepted
 * @param {string} zkConnectString - A ZooKeeper connection string. Formatting is as follows:
 * "<server>:<port>,<server>:<port>,...,<server>:<port>/RootZNode"
 * @constructor
 */
function HelixManager(clusterName, instanceName, instanceType, zkConnectString) {
  console.log(format("Create a zk-based cluster manager. clusterName: %s, instanceName: %s, type: %s, zkSvr: %s",
    clusterName, instanceName, instanceType));

  var zkClient = zookeeper.createClient(zkConnectString);

  zkClient.connect();

  /**
   * Getter for cluster name.
   * @returns {string} Cluster name
   */
  function getClusterName() {
    return clusterName;
  }

  /**
   * Getter for instance name.
   * @returns {string} Instance name
   */
  function getInstanceName() {
    return instanceName;
  }

  /** @lends HelixManager */
  return {
    // Connection-related methods
    connect: noop,
    disconnect: noop,
    isConnected: noop,
    addPreConnectCallback: noop,

    // Listener-related methods
    addListener: noop,
    removeListener: noop,

    // Participant-related methods
    handleNewSessionAsParticipant: noop,
    carryOverPreviousCurrentState: noop,

    // Getters
    getClusterName: getClusterName,
    getInstanceName: getInstanceName,
    getSessionId: noop,
    getLastNotificationTime: noop,
    getStateMachineEngine: noop,
    getVersion: noop,
    getProperties: noop

  };
}

module.exports = HelixManager;
