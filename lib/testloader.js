'use strict';
var fs = require('fs'),
  isExcluded = /./.test.bind(/(^[\.])|(^index\.js$)$/),
  isJS = /./.test.bind(/\.js$/),
  isTS = /./.test.bind(/\.[jt]s$/);
module.exports = function testLoader(path, acceptTs){
  fs.readdirSync(path).forEach(function(file){
    if ( !isExcluded(file) ) {
      var pFile = path.concat('/',file);
      var isAccepted = (acceptTs)?isTS:isJS;
      if(fs.statSync(pFile).isDirectory()){
        require(pFile);
      } else if (isAccepted(pFile)) {
        require(pFile);
      }
    }
  });
};
