'use strict';
var chai = require('chai'),
  chaiAsPromise = require('chai-as-promised'),
  expect = chai.expect,
  MultiError = require('verror').MultiError,
  Promise = require('bluebird'),
  ValidationError = require('./errors').ValidationError;
chai.use(chaiAsPromise);
chai.should();

/**
 * @typedef {Object}    Assertion object that represent and assertion to do
 * @property  {Array[]}   [arguments] List of list of arguments arguments for using in the assertion =.
 * @property  {String}  [errorMessage] Error message for the Error
 * @property  {String}  type  Indicate the assertion to execute. Could be fields, or a chai assertion chain. ([See]{@link http://chaijs.com/api/bdd/})
 * @property  {Assertion|*}       [value] Value to assert. If type is fields, value should be and assertion object, otherwise, should be a chai assertion chain. This will be ignored if arguments is provided
 */
/**
 * Validate if an object is like expecter
 * @method assertValue
 * @param  {*}                      expected Expected value
 * @param  {Assertion|Assertion[]}  [expected.assertion]  Assertion to execute.
 * @param  {*}                      actual   Actual value to assert
 * @param  {Function}               done     Function for sending the response of the promise validation
 * @return {Boolean}                True is the assertion is fullfiled
 * @throws {MultiError}             All asserrtion errors
 */
var assertValue = function assertValue(expected, actual) {
  var errors = [];
  if (actual.constructor.name === 'Promise') {
    return actual.then(function(value) {
      return Promise.try(function(){
        assertValue(expected, value);
      });
    });
  }
  if (expected.constructor === String || expected.constructor === Number || !expected.assertion) {
    return expect(actual).to.be.equal(expected);
  }
  var assertions = (expected.assertion.constructor === Array) ? expected.assertion : [expected.assertion];
  assertions.forEach(function(check) {
    try {
      if (check.type === 'fields') {
        Object.keys(check.value).forEach(function(att) {
          assertValue(check.value[att], actual[att]);
        });
      } else {
        var assertion = expect(actual, check.errorMessage),
          checks = check.type.split('.');
        checks.forEach(function(option, index) {
          if (assertion[option].constructor === Function) {
            var args = check.arguments.shift();
            assertion = assertion[option].apply(assertion, args);
          } else {
            assertion = assertion[option];
          }
        });
      }
    } catch (e) {
      errors.push(e);
    }
  });
  if (errors.length) {
    var err = new ValidationError(errors);
    throw err;
  }
  return true;
};

/**
 * Validate if an promise is like expecter
 * @method assertPromise
 * @param  {*}                      expected Expected value
 * @param  {Assertion|Assertion[]}  [expected.assertion]  Assertion to execute.
 * @param  {*}                      actual   Actual value to assert
 * @param  {Function}               done     Function for sending the response of the promise validation
 * @return {Boolean}                True is the assertion is fullfiled
 * @throws {MultiError}             All asserrtion errors
 */
var assertPromise = function assertPromise(expected, actual, done) {
  var errors = [];
  if (expected.constructor === String || expected.constructor === Number || !expected.assertion) {
    return expect(actual).eventually.be.equal(expected);
  }
  var assertionsPromise = [];
  var assertions = (expected.assertion.constructor === Array) ? expected.assertion : [expected.assertion];
  assertions.forEach(function(check) {
    try {
      if (check.type === 'fields') {
        Object.keys(check.value).forEach(function(att) {
          assertPromise(check.value[att], actual[att]);
        });
      } else {
        var assertion = actual.should,
          checks = check.type.split('.');
        checks.forEach(function(option, index) {
          if (assertion[option].constructor === Function) {
            var args = check.arguments.shift();
            assertion = assertion[option].apply(assertion, args);
          } else {
            assertion = assertion[option];
          }
        });
        var p = assertion.then(function() {}, function(err) {
          errors.push(err);
        });
        assertionsPromise.push(p);
      }
    } catch (e) {
      errors.push(e);
    }
  });
  return Promise.all(assertionsPromise).then(function() {
    if (errors.length) {
      var err = new ValidationError(errors);
      done(err);
    } else {
      done();
    }
  });
};

module.exports.assertValue = assertValue;
module.exports.assertPromise = assertPromise;
