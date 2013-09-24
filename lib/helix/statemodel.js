/**
 * @file Defines the base StateModel for
 * @author kgao
 */

/** @const */
var DEFAULT_INITIAL_STATE = 'OFFLINE';

/**
 * Returns the function that handles the given state transition. Note that these functions
 * should be defined on the state model's prototype chain as __INITIALSTATEtoFINALSTATE__.
 * @param {string} initialState - The initial state name
 * @param {string} finalState - The final state name
 * @returns {transitionHandler|null} The transition handler if it exists
 */
function getTransitionHandler(initialState, finalState) {
  // @TODO: Add error handling if state transition doesn't exist.
  var transitionHandler = this['__' + initialState + 'to' + finalState + '__'];
  if (typeof transitionHandler === 'function') {
    return transitionHandler;
  }
  return null;
}

/**
 * Constructs a new state model.
 * @param {string} partitionName - The partition that is described by this state model
 * @param {string[]} states - Enumeration of possible states
 * @param {string} [initialState] - Optional initial state. Otherwise, defaults to OFFLINE
 * @constructor
 */
function StateModel(partitionName, states, initialState) {
  this.currentState = DEFAULT_INITIAL_STATE;
}

StateModel.prototype.getTransitionHandler = getTransitionHandler;

/**
 * Function definition for transition handlers.
 * @callback transitionHandler
 * @param {object} message
 * @param {object} notificationContext
 */

module.exports = StateModel;