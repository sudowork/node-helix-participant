/**
 * @file mockConstructor is a utility function that will mock a constructor/object
 * @author kgao
 */

var sinon = require('sinon');

/**
 * Returns a mocked version of an object, or a mocked instance of a constructor.
 * @param {function|object} ctor - Constructor or object
 * @returns {object}
 */
function mockConstructor(ctor) {
  var objToMock = (typeof ctor === 'function') ? new ctor() : ctor,
      mock = {},
      fn;

  for (fn in objToMock) {
    // @NOTE: we intentionally iterate over all enumerable keys for the object because
    // we want the entire prototype chain.
    mock[fn] = (typeof objToMock[fn] === 'function') ? sinon.stub(objToMock, fn) : fn;
  }

  /**
   * Resets all stubbed methods.
   * @returns {void}
   */
  mock.__reset__ = function() {
    for (fn in objToMock) {
      if (objToMock[fn].reset) objToMock[fn].reset();
    }
  };

  return mock;
}

module.exports = mockConstructor;