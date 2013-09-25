/**
 * @file HelixManagerTest
 * @author Kevin Gao
 */

var assert = require('assert'),
    format = require('util').format,
    mockery = require('mockery'),
    rewire = require('rewire'),
    sinon = require('sinon'),
    vows = require('vows'),
    zookeeper = require('node-zookeeper-client'),
    InstanceType = require('../../lib/helix/InstanceType'),
    ZooKeeperClientMock = require('../mocks/ZooKeeperClientMock');

// @NOTE: We module-scope the mock because it's a pain to reregister every time. Since
// zkClient is scoped to the HelixManager closure, we can't access it once it's been
// registered.
/** @type Client */
var zkClientMock = ZooKeeperClientMock(),
    clusterName = 'foo',
    instanceName = 'bar',
    liveInstancePath = format('/%s/LIVEINSTANCES/%s', clusterName, instanceName),
    messagesPath = format('/%s/INSTANCES/%s/MESSAGES', clusterName, instanceName),
    sessionId = 'abcdef1234567890';

function suppressConsoleOutput(rewiredModule) {
  var noop = function() { };
  rewiredModule.__set__('console', {
    log: noop,
    info: noop,
    warn: noop,
    error: noop
  });
}

function getHelixManagerConstructor() {
  // @NOTE: rewire has to be called after mockery.registerMock for the mock to take effect.
  var HelixManager = rewire('../../lib/helix/HelixManager');
  suppressConsoleOutput(HelixManager);
  return HelixManager;
}

function setup() {
  mockery.enable({useCleanCache: true, warnOnReplace: false, warnOnUnregistered: false});
  mockery.registerMock('node-zookeeper-client', {
    createClient: function() { return zkClientMock; },
    State: zookeeper.State,
    CreateMode: zookeeper.CreateMode
  });
}

function teardown() {
  zkClientMock.__reset__();
  mockery.deregisterAll();
  mockery.disable();
}

var helixManagerSpec = vows.describe('HelixManager Spec');

// Testing connection behavior
helixManagerSpec.addBatch({
  'testing correct calls to zkClient are made': {
    topic: function() {
      setup();
      return getHelixManagerConstructor()(clusterName, instanceName, InstanceType.PARTICIPANT, 'localhost:2181');
    },

    'calling connect should call connect on the zkClient': function(manager) {
      manager.connect();
      assert(zkClientMock.connect.calledOnce);
      zkClientMock.connect.reset();
    },

    'calling connect when already connected should not call connect again': function(manager) {
      zkClientMock.getState.returns(zookeeper.State.SYNC_CONNECTED);
      manager.connect();
      assert.equal(zkClientMock.connect.callCount, 0);
    },

    'calling disconnect should close the zkClient': function(manager) {
      manager.disconnect();
      assert(zkClientMock.close.calledOnce);
      zkClientMock.connect.reset();
    },

    'calling disonnect when already disconnected should not call close again': function(manager) {
      zkClientMock.getState.returns(zookeeper.State.DISCONNECTED);
      manager.disconnect();
      assert.equal(zkClientMock.connect.callCount, 0);
    },

    teardown: teardown
  }
});

helixManagerSpec.addBatch({
  'testing specific participant behavior': {
    topic: function() {
      var HelixManager = getHelixManagerConstructor();
      setup();
      zkClientMock.getSessionId.returns(sessionId);
      this.callback(
        HelixManager, // This needs to be accessible so we can access the private functions
        HelixManager(clusterName, instanceName, InstanceType.PARTICIPANT, 'localhost:2181'));
    },

    'ensureNoLiveInstanceExists calls zkClient.exists on the LIVEINSTANCE path': function(HelixManager, manager) {
      var callback = sinon.stub();
      HelixManager.__get__('ensureNoLiveInstanceExists')(zkClientMock, clusterName, instanceName, callback);
      assert(zkClientMock.exists.calledWith(liveInstancePath));
      zkClientMock.exists.reset();
    },

    'addLiveInstance calls zkClient.create on LIVEINSTANCE path and ZNode has correct data': function(HelixManager, manager) {
      var callback = sinon.stub(),
          data;
      // Assert that create was called
      HelixManager.__get__('addLiveInstance')(zkClientMock, clusterName, instanceName, callback);
      assert(zkClientMock.create.calledWith(liveInstancePath));

      // Assert that data is correct
      data = JSON.parse(zkClientMock.create.args[0][1].toString());
      assert(data.id === instanceName);
      assert(typeof data.simpleFields === 'object');
      assert(typeof data.listFields === 'object');
      assert(typeof data.mapFields === 'object');
      assert(data.simpleFields.HELIX_VERSION.match(/\d+\.\d+(-.+)?/));
      assert.equal(data.simpleFields.SESSION_ID, sessionId);
      assert(data.simpleFields.LIVE_INSTANCE.match(/\d+@.+/));
      zkClientMock.create.reset();
    },

    'setupMessageListener calls zkClient.getChildren on the MESSAGES path and sets a watcher': function(HelixManager, manager) {
      var callback = sinon.stub();
      HelixManager.__get__('setupMessageListener')(zkClientMock, clusterName, instanceName, callback);
      assert(zkClientMock.getChildren.calledWithMatch(messagesPath, sinon.match.func));
    },

    teardown: teardown
  },

  'testing overall participant behavior': {
    topic: function() {
      setup();
      zkClientMock.getSessionId.returns(sessionId);
      zkClientMock.once.withArgs('connected').yields();
      return getHelixManagerConstructor();
    },

    'starting a new session as a participant calls all the necessary functions': function(HelixManager) {
      var ensureNoLiveInstanceExists = sinon.stub().yields(),
        invokePreConnectCallbacks = sinon.stub().yields(),
        addLivenstance = sinon.stub().yields(),
        carryOverPreviousCurrentState = sinon.stub().yields(),
        setupMessageListener = sinon.stub().yields();
      HelixManager.__set__('ensureNoLiveInstanceExists', ensureNoLiveInstanceExists);
      HelixManager.__set__('invokePreConnectCallbacks', invokePreConnectCallbacks);
      HelixManager.__set__('addLiveInstance', addLivenstance);
      HelixManager.__set__('carryOverPreviousCurrentState', carryOverPreviousCurrentState);
      HelixManager.__set__('setupMessageListener', setupMessageListener);

      HelixManager(clusterName, instanceName, InstanceType.PARTICIPANT, 'localhost:2181');

      assert(ensureNoLiveInstanceExists.calledOnce);
      assert(invokePreConnectCallbacks.calledAfter(ensureNoLiveInstanceExists));
      assert(addLivenstance.calledAfter(invokePreConnectCallbacks));
      assert(carryOverPreviousCurrentState.calledAfter(addLivenstance));
      assert(setupMessageListener.calledAfter(carryOverPreviousCurrentState));
    },

    teardown: teardown
  }
});

helixManagerSpec.addBatch({
});

helixManagerSpec.export(module);
