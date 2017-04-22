'use strict';
var chai = require('chai');
var chaiAsPromise = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromise);
var Promise = require('bluebird');
var localClient = require('../localrestclient');
var util = require('util');
var PythonLoader = require('../scriptloader').PythonLoader;
var validator = require('../validation');
module.exports = function(library) {
  library.define(/[Ll]aunch $script $json/, function(script, json, done) {
    this.ctx.step++;
    var self = this;
    var logger = self.logger;
    var loader = new PythonLoader(script, json);
    var response = {
      'data': []
    };
    loader.onMessage(function(message) {
      response.data.push(message);
    });
    loader.then(function() {
      logger.info('the script was executed without errors');
    }).catch(function(err) {
      response.error = err;
      logger.info('the script failed');
    }).finally(function() {
      if (self.ctx.scriptResponse) {
        self.ctx.scriptResponses = self.ctx.scriptResponses || [];
        self.ctx.scriptResponses.push(response);
      }
      self.ctx.scriptResponse = response;
      logger.debug({
        'scriptResponse': response
      }, 'Script response');
      done();
    });
  }).given(/the following context\n$json/, function(context) {
    this.ctx.step++;
    var self = this;
    Object.keys(context).forEach(function(key) {
      self.ctx[key] = context[key];
    });
  }).then(/the response is[\n\s]$json/, function(expected) {
    this.ctx.step++;
    var response = this.ctx.response;
    if (response.constructor.name !== 'Promise') {
      response.should.be.eql(expected);
    } else {
      return response.should.eventually.eql(expected);
    }
  }).then(/responses with $type/, function(type) {
    this.ctx.step++;
    var response = this.ctx.response;
    if (response.constructor.name !== 'Promise') {
      response.should.be.a(type);
    } else {
      return response.should.eventually.a(type);
    }
  }).then(/the response should be like[\s\n]$json/, function(expected) {
    this.ctx.step++;
    validator.assertValue(expected, this.ctx.response);
  }).then(/the response should resolve like[\s\n]$json/, function(expected, done) {
    this.ctx.step++;
    this.ctx.response.then(function(value) {
      try {
        validator.assertValue(expected, value);
        done();
      } catch (e) {
        done(e);
      }
    });
  }).then(/the response should be rejected with[\s\n]$json/, function(expected, done) {
    this.ctx.step++;
    this.ctx.response.should.be.rejectedWith(expected).and.notify(done);
  }).then(/the response should be rejected/, function(expected, done) {
    this.ctx.step++;
    this.ctx.response.should.be.rejected.and.notify(done);
  }).when(/calling to "$endPoint" endPoint with[\b\n]$json/, function(endPoint, json, next) {
    this.ctx.step++;
    var self = this;
    var logger = self.logger;
    if (this.ctx.args) {
      this.ctx.callArgs = this.ctx.callArgs || [];
      this.ctx.callArgs.push(this.ctx.args);
    }
    localClient.restRequest(endPoint, json).then(function(data, response) {
      if (self.ctx.response) {
        self.ctx.responses = self.ctx.responses || [];
        self.ctx.responses.push(self.ctx.response);
      }
      var responseJS = {};
      try {
        if (data.constructor === Buffer) {
          responseJS = JSON.parse(data);
        } else {
          responseJS = data;
        }
      } catch (e) {
        responseJS.msg = data.toString();
      }
      responseJS.statusCode = response.statusCode;
      responseJS.statusMessage = response.statusMessage;
      self.ctx.response = responseJS;
      next();
    }).on('error', function(err, d) {
      logger.error({
        'err': err,
        'args': json
      }, 'Something bad in the request');
      next(err);
    });
  });
};
