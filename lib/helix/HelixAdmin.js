/**
 * @file A subset of the features found in ZKHelixAdmin from the original Apache Helix project.
 * @author Kevin Gao
 * @module helix/admin
 */

'use strict';

/**
 * @TODO: This is a temporary function to be removed once actual functions are implemented.
 */
function noop() {
  var args = arguments;
  console.info(args.callee.name + " called");
}

/**
 * Returns a new Helix admin object.
 * @param {Client} zkClient - node-zookeeper-client
 * @constructor
 */
function HelixAdmin(zkClient) {
  return {
    addInstance: noop,
    dropInstance: noop,
    resetInstance: noop,
    enablePartition: noop,
    disablePartition: noop,
    addStateModelDef: noop
  };
}

module.exports = HelixAdmin;