'use strict';
var Yadda = require('yadda');
var English = Yadda.localisation.English;
var dictionary = require('./dictionary');
var addCommonSteps = require('./common');
module.exports = (function(){
	var library = English.library(dictionary);
	addCommonSteps(library);
	return library;
})();
module.exports.initDictionary = dictionary.initDictionary;
module.exports.addCommonSteps = addCommonSteps;
module.exports.initLibrary = function(dictionary) {
	var dict = dictionary || new Yadda.Dictionary();
	return English.library(dict);
};
