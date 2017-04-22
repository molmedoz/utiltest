'use strict';
var Promise = require('bluebird');
var Client = require('node-rest-client').Client;
var util = require('util');
var client = new Client();
var util = require('util');

/**
 * Add a new endPoint to the client
 * @method addEndPoint
 * @param  {String}    action Action define in the restclient. Alias for a given endPoint-Method pair.
 * @param  {Strint}    url    The url linked to the endpoint
 * @param  {Strint}    method The HTTP Verb for the request. [See]{@link http://www.restapitutorial.com/lessons/httpmethods.html} for more info
 */
var addEndPoint = function addEndPoint(action, url, method){
  if(client.methods[action]){
    throw new ReferenceError(util.format('"%s" is already defined in the client`'));
  }
  client.registerMethod(action, url, method);
};

/**
 * @typeDef {Object}  RESTResponse
 * @property {Number}         statusCode  status code of the response
 * @property {Object|String}  data The response of the request. Cnuld be a JSON object or and String
 */
/**
 * [restRequest description]
 * @method restRequest
 * @param  {String}  action          Action define in the restclient. Alias for a given endPoint-Method pair.
 * @param  {Object}  [args]          Object that define the call to the rest API. The more common options are listed below, for mor info [see the original documentation]{@link https://github.com/aacerox/node-rest-client}
 * @param  {Object}  [args.path]     Object that contains the the url params of the request. The keys are the uri param name.
 * @param  {Object}  [args.headers]  Object that represent the header for using in the request. The key are the header name.
 * @param  {Object}  [args.data]     Object that represent the form to send (JSON format)
 * @param  {Object}  [authData]      Auth Data for the call
 * @return {RESTResponse}       Rest Response
 */
function restRequest(action, d, authData) {
  return new Promise(function(resolve, reject) {
    var request = client.methods[action];
    if (!request) {
      var error = new Error('The action is not registered');
      error.code = 'ACTIONNOTREGISTERED';
      return reject(error);
    }
    var data = d || {};
    var args = JSON.parse(JSON.stringify(data));
    var headers = args.headers || {};
    headers['Content-Type'] = (args.headers) ? args.headers['Content-Type'] || 'application/json' : 'application/json';
    if (authData) {
      Object.keys(authData).forEach(function(key) {
        headers[key] = authData[key];
      });
    }
    args.headers = headers;
    request(args, function(dt, response) {
      try {
        var responseJS = (dt.constructor === Buffer) ? JSON.parse(dt) : dt;
        resolve({
          'statusCode': response.statusCode,
          'response': responseJS
        });
      } catch (err) {
        resolve({
          'statusCode': response.statusCode,
          'response': data
        });
      }
    }).on('error', reject);
  });
}

module.exports.addEndPoint = addEndPoint;
module.exports.restRequest = restRequest;
