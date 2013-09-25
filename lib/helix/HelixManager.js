/**
 * @file A subset of the features found in ZKHelixManager from the original Apache Helix project.
 * @author Kevin Gao
 * @module helix/manager
 */

'use strict';

var async = require('async'),
    format = require('util').format,
    os = require('os'),
    zookeeper = require('node-zookeeper-client'),
    ERR = require('async-stacktrace'),
    HelixAdmin = require('./HelixAdmin'),
    InstanceType = require('./InstanceType'),
    CreateMode = zookeeper.CreateMode,
    State = zookeeper.State;

var HELIX_VERSION = '0.6.1-nodeparticipant';

// PRIVATE METHODS

/**
 * @TODO: This is a temporary function to be removed once actual functions are implemented.
 */
function noop() {
  var args = arguments;
  console.info(args.callee.name + " called");
}

/**
 * Emulates Java call to ManagementFactory.getRuntimeMXBean().getName().
 * @returns {string} runtime MX Bean name
 */
function getRuntimeName() {
  return format('%d@%s', process.pid, os.hostname());
}

/**
 * Gets the session id as a string from a zookeeper client.
 * @param {Client} zkClient - ZooKeeper client
 * @returns {string} The session id
 */
function getSessionIdFromZkClient(zkClient) {
  return zkClient.getSessionId().toString('hex');
}

/**
 * Based on the cluster and instance name, return the ZK path to the LIVEINSTANCE node.
 * @param {string} clusterName - The name of the cluster
 * @param {string} instanceName - The name of the instance
 * @returns {string} The LIVEINSTANCE node path
 */
function buildLiveInstancePath(clusterName, instanceName) {
  return format('/%s/LIVEINSTANCES/%s', clusterName, instanceName);
}

/**
 * Based on the cluster and instance name, return the ZK path to the INSTANCE node.
 * @param {string} clusterName - The name of the cluster
 * @param {string} instanceName - The name of the instance
 * @returns {string} The INSTANCE node path
 */
function buildBaseInstancePath(clusterName, instanceName) {
  return format('/%s/INSTANCES/%s', clusterName, instanceName);
}

/**
 * Based on the cluster and instance name, return the ZK path to the MESSAGES node.
 * @param {string} clusterName - The name of the cluster
 * @param {string} instanceName - The name of the instance
 * @returns {string} The MESSAGES node path
 */
function buildMessagesPath(clusterName, instanceName) {
  return format('%s/MESSAGES', buildBaseInstancePath(clusterName, instanceName));
}

/**
 * Based on the cluster and instance name, return the ZK path to the CURRENTSTATES node.
 * @param {string} clusterName - The name of the cluster
 * @param {string} instanceName - The name of the instance
 * @returns {string} The CURRENTSTATES node path
 */
function buildCurrentStatesPath(clusterName, instanceName) {
  return format('%s/CURRENTSTATES', buildBaseInstancePath(clusterName, instanceName));
}

/**
 * Checks to see if there already exists an ephemeral node at:
 *   /<clusterName>/LIVEINSTANCES/<instanceName>
 * If there is, then it fails; otherwise, it will succeed and go to the
 * next callback.
 * @param {Client} zkClient - ZooKeeper client
 * @param {string} clusterName - The name of the cluster
 * @param {string} instanceName - The name of the instance
 * @param {function} callback - callback passed in by async.series
 * @returns {void}
 */
function ensureNoLiveInstanceExists(zkClient, clusterName, instanceName, callback) {
  var liveInstancePath = buildLiveInstancePath(clusterName, instanceName);
  zkClient.exists(liveInstancePath, null, function(err, stat) {
    if (err) {
      ERR(format('Failed to check existence of %s due to: ', liveInstancePath, err), callback);
      return;
    }
    if (stat) {
      callback(format('Found another instance with the same instanceName: %s in cluster %s',
        instanceName,
        clusterName));
    } else {
      // Success, no live instance exists
      callback(null);
    }
  });
}

/**
 * Invokes all the pre-connect callbacks that were registered.
 * @param {function[]} preConnectCallbacks - Array of callbacks to invoke
 * @param {function} callback - callback passed in by async.series
 * @returns {void}
 */
function invokePreConnectCallbacks(preConnectCallbacks, callback) {
  preConnectCallbacks.forEach(function(preConnectCallback) {
    preConnectCallback();
  });
  callback(null);
}

/**
 * Adds the ephemeral node at:
 *   /<clusterName>/LIVEINSTANCES/<instanceName>
 * @param {Client} zkClient - ZooKeeper client
 * @param {string} clusterName - The name of the cluster
 * @param {string} instanceName - The name of the instance
 * @param {function} callback - callback passed in by async.series
 * @returns {void}
 */
function addLiveInstance(zkClient, clusterName, instanceName, callback) {
  var liveInstancePath = buildLiveInstancePath(clusterName, instanceName);
  // @TODO: have a function construct this.
  var liveInstanceNode = {
    id: instanceName,
    simpleFields: {
      HELIX_VERSION: HELIX_VERSION,
      LIVE_INSTANCE: getRuntimeName(),
      SESSION_ID: getSessionIdFromZkClient(zkClient)
    },
    listFields: {},
    mapFields: {}
  };

  zkClient.create(
    liveInstancePath,
    new Buffer(JSON.stringify(liveInstanceNode, null, '  ')),
    CreateMode.EPHEMERAL,
    function(err, path) {
      if (err) {
        ERR(format('Failed to create node %s due to: %s', path, err), callback);
        return;
      }
      callback(null);
    });
}

/**
 * Carry over current states from previous sessions. Set to initial state for
 * current session only when the state doesn't exist in the current session.
 * @param {function} callback - callback passed in by async.series
 * @returns {void}
 */
function carryOverPreviousCurrentState(callback) {
  // @TODO: Implement this method
  // 1. Get previous current states (don't include current session) in:
  //      /<clusterName>/INSTANCES/<instanceName>/CURRENTSTATES/<sessionId>
  // 2. For each previous session:
  // 2a. Get each resource (task) for that "current" state
  // 2b. For each resource, carry over and update the current state (current session)
  // 3. Remove all previous "current" states except for the current session
  callback(null);
}

/**
 * Sets up message listener to listen on the participant's message queue:
 *   /<clusterName>/INSTANCES/<instanceName>/MESSAGES
 * @param {Client} zkClient - ZooKeeper client
 * @param {string} clusterName - The name of the cluster
 * @param {string} instanceName - The name of the instance
 * @param {function} callback - callback passed in by async.series
 * @returns {void}
 */
function setupMessageListener(zkClient, clusterName, instanceName, callback) {
  var messagesPath = buildMessagesPath(clusterName, instanceName),
      watcher = function(event) {
        // @TODO: register state machine engine as a message listener
      };
  zkClient.getChildren(messagesPath, watcher, function(err, children, stats) {
    if (err) {
      ERR(format('Could not find messages path: %s: %s', messagesPath, err), callback);
      return;
    }
    // @TODO: process existing messages
    callback(null);
  });
}

// HELIX MANAGER DEFINITION

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
      lastNotificationTime = null,
      messageListeners = [];

  // Do initialization once the zookeeper client is connected.
  zkClient.once('connected', init);

  /**
   * Initialization once the ZooKeeper client is connected.
   * @returns {void}
   * @private
   */
  function init() {
    // @NOTE: Currently only participant instances are supported.
    if (instanceType === InstanceType.PARTICIPANT) {
      handleNewSessionAsParticipant();
    }
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
   * Returns the Helix version.
   * @returns {string} Helix version
   */
  function getVersion() {
    return HELIX_VERSION;
  }

  /**
   * On a new ZK client connection, this function will be called to establish
   * the session as a participant.
   * @returns {void}
   */
  function handleNewSessionAsParticipant() {
    // @NOTE: We partially apply each of the series tasks so that only the callback
    // parameter remains. The reason they are not included in the closure is for
    // testability.
    async.series([
      // 1. Check if there is another instance that holds the ephemeral node
      ensureNoLiveInstanceExists.bind(null, zkClient, clusterName, instanceName),
      // 2. If not, invoke pre-connect callbacks
      invokePreConnectCallbacks.bind(null, preConnectCallbacks),
      // 3. Create the LIVEINSTANCE ephemeral node
      addLiveInstance.bind(null, zkClient, clusterName, instanceName),
      // 4. Carry over previous current state
      carryOverPreviousCurrentState.bind(null),
      // 5. Set up message listener
      setupMessageListener.bind(null, zkClient, clusterName, instanceName)
      // 6. @TODO: Health reports
    ], function(err) {
      if (err) {
        console.error('Failed to start new session as participant:\n\t%s', err.stack || err);
        return;
      }
      console.log('Successfully started new session as participant');
    });
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

    // Getters
    getClusterName: getClusterName,
    getInstanceName: getInstanceName,
    getSessionId: getSessionIdFromZkClient.bind(null, zkClient),
    getStateMachineEngine: noop,
    getVersion: getVersion,
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
