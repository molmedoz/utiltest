'use strict';
var Yadda = require('yadda');
var English = Yadda.localisation.English;
var Dictionary = Yadda.Dictionary;

function parseJSON(json, cb) {
    try {
        var formP = JSON.parse(json);
        cb(null, formP);
    } catch (err) {
        cb(err);
    }
}
function str2Array(agentsSTR, cb) {
    var array = agentsSTR.split(',').map(function(str) {
        return str.trim();
    });
    return cb(null, array);
}
function agentAuthData(user, password, cb){
    cb(null, {'user': user, 'password': password});
}
var initDictionary = function initDictionary(){
  var dictionary = new Dictionary().define('json', /([^\u0000]*)/, parseJSON);
  dictionary.define('strArray', /(.+)/, str2Array);
  dictionary.define('userLogin', /(.+), (.+)/, agentAuthData);
  dictionary.define('statusCode', /([1-9]\d{2})/, Yadda.converters.integer);
  return dictionary;
};

module.exports = initDictionary();
module.exports.initDictionary = initDictionary;
