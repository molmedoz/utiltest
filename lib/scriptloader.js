'use strict';

var PythonShell = require('python-shell'),
  Promise = require('bluebird'),
  _ = require('lodash'),
  EventEmmitter = require('events'),
  util = require('util'),
  verror = require('verror'),
  WError = verror.WError,
  MultiError = verror.MultiError,
  spawn = require('child_process').spawn;

/**
 * [PythonLoader description]
 * @class PythonLoader
 * @param  {string}       script                Script to be executed
 * @param  {object}       options               the execution options, consisting of:
 * @param  {string}       [options.mode=text] Configures how data is exchanged when data flows through stdin and stdout. The possible values are:
 *    text: each line of data (ending with "\n") is emitted as a message (default)
 *    json: each line of data (ending with "\n") is parsed as JSON and emitted as a message
 *    binary: data is streamed as-is through stdout and stdin
 * @param  {function}     formatter            each message to send is transformed using this method, then appended with "\n"
 * @param  {function}     parser               each line of data (ending with "\n") is parsed with this function and its result is emitted as a message
 * @param  {string}       [encoding=utf8]      the text encoding to apply on the child process streams (default: "utf8")
 * @param  {string}       [pythonPath=python]  The path where to locate the "python" executable. Default: "python"
 * @param  {string[]}     [pythonOptions]      Array of option switches to pass to "python"
 * @param  {string}       scriptPath           The default path where to look for scripts. Default is the current working directory.
 * @param  {array}        args                 Array of arguments to pass to the script
 */
var PythonLoader = function PythonLoader(script, options) {
  var opt = options || {};
  opt.parser = opt.parser || function(msg) {
    return msg;
  };
  var self = this;
  self.options = _.assign({}, opt);
  self.handlers = {'message': [], 'error': [], 'close': []};
  self.script = script;
  var _active = false;
  Object.defineProperty(self, 'active', {
    'enumerable': true,
    'get': function() {
      return _active;
    }
  });
  self.on('close', function deactivate() {
    _active = false;
  });
  var _shell;
  Object.defineProperty(self, 'shell', {
    'set': function(open) {
      if (_active) {
        var error = new WError({
          'name': 'ScriptRunningError',
          'cause': new Error('Couldn\'t set the shell while the sript is running')
        });
        throw error;
      }
      _active = true;
      if (open === true) {
        _shell = new PythonShell(self.script, self.options);
        _shell.on('message', function(msg) {
          self.emit.apply(self, _.flatten(['message', arguments]));
        });
        _shell.on('error', function(err) {
          if (err.exitCode !== 0) {
            self.emit.apply(self, _.flatten(['error', arguments]));
          } else {
            _shell.receive(err.message);
          }
        });
        _shell.on('close', function() {
          self.emit.apply(self, _.flatten(['close', arguments]));
        });
      }
    },
    'get': function() {
      return _shell;
    }

  });
};
util.inherits(PythonLoader, EventEmmitter);
PythonLoader.prototype.send = function() {
  if (!this.active) {
    var error = new WError({
      'name': 'ScriptRunningError',
      'cause': new Error('The script is not running')
    });
    throw error;
  }
  var shell = this.shell;
  return shell.send.apply(shell, arguments);
};
PythonLoader.prototype.receive = function end() {
  if (!this.active) {
    var error = new WError({
      'name': 'ScriptRunningError',
      'cause': new Error('The script is not running')
    });
    throw error;
  }
  var shell = this.shell;
  return shell.receive.apply(shell, arguments);
};
PythonLoader.prototype.onMessage = function onMessage(handler) {
  this.handlers.message.push(handler);
  if (this.active) {
    this.on('message', handler);
  }
};
PythonLoader.prototype.onError = function onError(handler) {
  this.handlers.error.push(handler);
  if (this.active) {
    this.on('error', handler);
  }
};
PythonLoader.prototype.onClose = function onClose(handler) {
  this.handlers.close.push(handler);
  if (this.active) {
    this.on('close', handler);
  }
};
PythonLoader.prototype.run = function run() {
  if (this.active) {
    var error = new WError({
      'name': 'ScriptRunningError',
      'cause': new Error('The script is already running')
    });
    return Promise.reject(error);
  }
  var self = this;
  return new Promise(function(resolve, reject) {
    self.shell = true;
    var errors = [];
    Object.keys(self.handlers).forEach(function addHandlers(eventName) {
      self.handlers[eventName].forEach(function(handler) {
        self.on(eventName, handler);
      });
    });
    self.on('error', function(err) {
      var e = new WError({'name': 'ScriptError', 'cause': err}, 'The script has generate an error');
      errors.push(e);
    });
    self.on('close', function(err) {
      if (err) {
        errors.push(err);
      }
      if (errors.length) {
        var cause = errors.length > 1 ? new MultiError(errors) : errors[0];
        var e = new WError({'name': 'ScriptError', 'cause': cause}, 'The script has ended with an error');
        reject(e);
      } else {
        resolve(true);
      }
    });
  });
};
PythonLoader.prototype.end = function end() {};


module.exports.PythonLoader = PythonLoader;
