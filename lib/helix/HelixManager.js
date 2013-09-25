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
    HelixAdmin = require('./HelixAdmin'),
    InstanceType = require('./InstanceType'),
    CreateMode = zookeeper.CreateMode,
    State = zookeeper.State;

var HELIX_VERSION = '0.6.1-nodeparticipant';

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
      lastNotificationTime = null,
      messageListeners = [],
      sessionId,
  // @TODO: build these paths using something like the HelixDataAccessor
      liveInstancePath = format('/%s/LIVEINSTANCES/%s', clusterName, instanceName),
      baseInstancePath = format('/%s/INSTANCES/%s', clusterName, instanceName),
      messagesPath = format('%s/MESSAGES', baseInstancePath),
      currentStatesPath = format('%s/CURRENTSTATES', baseInstancePath);

  // Do initialization once the zookeeper client is connected.
  zkClient.once('connected', init);

  /**
   * Initialization once the ZooKeeper client is connected.
   * @returns {void}
   */
  function init() {
    sessionId = zkClient.getSessionId();
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
   * Getter for ZooKeeper client's session id.
   * @returns {string} ZK Client session id
   */
  function getSessionId() {
    return sessionId.toString('hex');
  }

  /**
   * Returns the Helix version.
   * @returns {string} Helix version
   */
  function getVersion() {
    return HELIX_VERSION;
  }

  // PRIVATE METHODS

  /**
   * Emulates Java call to ManagementFactory.getRuntimeMXBean().getName().
   * @returns {string} runtime MX Bean name
   */
  function getRuntimeName() {
    return format('%d@%s', process.pid, os.hostname());
  }

  /**
   * Checks to see if there already exists an ephemeral node at:
   *   /<clusterName>/LIVEINSTANCES/<instanceName>
   * If there is, then it fails; otherwise, it will succeed and go to the
   * next callback.
   * @param {function} callback - callback passed in by async.series
   * @returns {void}
   */
  function ensureNoLiveInstanceExists(callback) {
    zkClient.exists(liveInstancePath, null, function(err, stat) {
      if (err) {
        callback(format('Failed to check existence of %s due to: ', liveInstancePath, err));
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
   * @param {function} callback - callback passed in by async.series
   * @returns {void}
   */
  function invokePreConnectCallbacks(callback) {
    preConnectCallbacks.forEach(function(preConnectCallback) {
      preConnectCallback();
    });
    callback(null);
  }

  /**
   * Adds the ephemeral node at:
   *   /<clusterName>/LIVEINSTANCES/<instanceName>
   * @param {function} callback - callback passed in by async.series
   * @returns {void}
   */
  function addLiveInstance(callback) {
    // @TODO: have a function construct this.
    var liveInstanceNode = {
          id: instanceName,
          simpleFields: {
            HELIX_VERSION: HELIX_VERSION,
            LIVE_INSTANCE: getRuntimeName(),
            SESSION_ID: getSessionId()
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
          callback(format('Failed to create node %s due to: %s', path, err));
          return;
        }
        callback(null);
      });
  }

  /**
   * Carry over current states from previous sessions. Set to initial state for
   * current session only when the state doesn't exist in the current session.
   * @param callback
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
   * @param callback
   */
  function setupMessageListener(callback) {
    var watcher = function(event) {
      // @TODO: register state machine engine as a message listener
    };
    zkClient.getChildren(messagesPath, watcher, function(err, children, stats) {
      if (err) {
        callback(err.stack);
        return;
      }
      // @TODO: process existing messages
      callback(null);
    });
  }

  /**
   * On a new ZK client connection, this function will be called to establish
   * the session as a participant.
   */
  function handleNewSessionAsParticipant() {
    async.series([
      // 1. Check if there is another instance that holds the ephemeral node
      ensureNoLiveInstanceExists,
      // 2. If not, invoke pre-connect callbacks
      invokePreConnectCallbacks,
      // 3. Create the LIVEINSTANCE ephemeral node
      addLiveInstance,
      // 4. Carry over previous current state
      carryOverPreviousCurrentState,
      // 5. Set up message listener
      setupMessageListener
      // 6. @TODO: Health reports
    ], function(err) {
      if (err) {
        console.error('Failed to start new session as participant: %s', err);
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
    getSessionId: getSessionId,
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
