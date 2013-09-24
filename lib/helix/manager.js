/**
 * @file A subset of the features found in ZKHelixManager from the original Apache Helix project.
 * @author Kevin Gao
 * @module helix/manager
 */

'use strict';

var format = require('util').format,
    zookeeper = require('node-zookeeper-client'),
    HelixAdmin = require('./admin'),
    State = zookeeper.State;

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
    clusterName,
    instanceName,
    instanceType,
    zkConnectString));

  // Private Variables
  /** @type Client */
  var zkClient = zookeeper.createClient(zkConnectString),
      preConnectCallbacks = [],
      sessionId;

  // Do initialization once the zookeeper client is connected.
  zkClient.once('connected', init);

  /**
   * Initialization once the ZooKeeper client is connected.
   * @returns {void}
   */
  function init() {
    sessionId = zkClient.getSessionId();
  }

  /**
   * Returns whether or not the client is currently connected.
   * @returns {boolean}
   */
  function isConnected() {
    return zkClient.getState() === State.SYNC_CONNECTED;
  }

  /**
   * Calls pre-connect callbacks and tries to connect the cluster manager to the
   * ZooKeeper cluster.
   * @returns void
   */
  function connect() {
    console.info('ClusterManager.connect()');
    if (!isConnected()) {
      preConnectCallbacks.forEach(function(callback) {
        callback();
      });
      zkClient.connect();
    } else {
      console.warn(format('Cluster manager %s %s already connected',
        clusterName,
        instanceName));
    }
  }

  /**
   * Tries to disconnect the cluster manager from ZooKeeper.
   */
  function disconnect() {
    console.info('ClusterManager.disconnect()');
    if (isConnected()) {
      zkClient.close();
    } else {
      console.warn(format('Cluster manager %s already disconnected',
        instanceName));
    }
  }

  /**
   * Adds a callback function to be called before connecting the ZooKeeper client.
   * @param {function} callback - The callback to be called
   * @returns {void}
   */
  function addPreConnectCallback(callback) {
    if (typeof callback === 'function') {
      preConnectCallbacks.push(callback);
    }
  }

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

  /**
   * Getter for ZooKeeper client's session id.
   * @returns {string} ZK Client session id
   */
  function getSessionId() {
    return sessionId;
  }

  /** @lends HelixManager */
  return {
    // Connection-related methods
    connect: connect,
    disconnect: disconnect,
    isConnected: isConnected,
    addPreConnectCallback: addPreConnectCallback,

    // Listener-related methods
    addListener: noop,
    removeListener: noop,

    // Participant-related methods
    handleNewSessionAsParticipant: noop,
    carryOverPreviousCurrentState: noop,

    // Getters
    getClusterName: getClusterName,
    getInstanceName: getInstanceName,
    getSessionId: getSessionId,
    getLastNotificationTime: noop,
    getStateMachineEngine: noop,
    getVersion: noop,
    getProperties: noop

  };
}

/**
 * @typedef HelixManager
 * @property {function} connect
 * @property {function} disconnect
 * @property {function} isConnected
 * @property {function} addPreConnectCallback
 */

module.exports = HelixManager;
