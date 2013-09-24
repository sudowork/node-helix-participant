/**
 * @file Defines a StateModelFactory, a helper for creating new state models.
 * @author Kevin Gao
 */

'use strict';

/**
 * Returns an array containing the found transition handlers.
 * @param {function} StateModelCtor - The constructor for the state model
 * @returns {Array} Array of transition handler function names
 */
function getTransitionHandlerNames(StateModelCtor) {
  var transitionHandlerNames = [],
      key;
  for (key in StateModelCtor.prototype) {
    if (StateModelCtor.prototype.hasOwnProperty(key)) {
      if (typeof StateModelCtor.prototype[key] === 'function' && key.match(/__.*to.*__/)) {
        transitionHandlerNames.push(key);
      }
    }
  }
  return transitionHandlerNames;
}

/**
 * Creates a new factory for a given state model.
 * @param StateModelCtor - The state model constructor
 * @param {string[]} states - Enumeration of possible states
 * @param {string} [initialState] - Optional initial state. Otherwise, defaults to OFFLINE
 * @constructor
 */
function StateModelFactory(StateModelCtor, states, initialState) {
  console.log('Creating new StateModelFactory for state model: ' + StateModelCtor.name);
  console.log('\tTransition Handlers:' + getTransitionHandlerNames(StateModelCtor));

  /**
   * Creates a new statemodel for a given partition.
   * @param {string} partitionName - The partition name
   */
  function createNewStateModel(partitionName) {
    return new StateModelCtor(partitionName, states, initialState)
  }

  return {
    createNewStateModel: createNewStateModel
  }
}

module.exports = StateModelFactory;
