'use strict';
var fs = require('fs'),
  isExcluded = /./.test.bind(/(^[\.])|(^index\.js$)$/),
  isJS = /./.test.bind(/\.js$/);
module.exports = function testLoader(path){
  fs.readdirSync(path).forEach(function(file){
    if ( !isExcluded(file) ) {
      var pFile = path.concat('/',file);
      if(fs.statSync(pFile).isDirectory()){
        require(pFile);
      } else if (isJS(pFile)) {
        require(pFile);
      }
    }
  });
};
