# utiltest

utiltest provides functionality for testing, saving time for developing automatic tests.

## Install

```bash
$ npm install utiltest<@<version>>
```
## Modules

### Main
This module provides basic features for test. There the following functions.
#### testLoader
This function load all the test defined in a specific folder. Any `js` that doesn't begining by a dot or be a index, will be consider a test file.
```js
'use strict';
var utiltest = require('utiltest'),
  path = require('path');
var fs = require('fs');
describe('dao', function(){
  utiltest.testLoader(path.resolve(__dirname));
});
```
```bash
|-myfolder
||-subfolder
|||-index.js
||-subfolder2
|||-file.js
||-.jshintrc.js
||-anyfile.ext
||-index.js
||-file1.js
||-file2.js
```
The method will load:
* `file1.js`
* `file2.js`
* `subfolder/index.js`

### yadda
This provide basic functionality for using [yadda](https://acuminous.gitbooks.io/yadda-user-guide/en/).
This module exports a default `library` and also the necessary methods for create your own `library` and `dictionary`.

By default utiltest.yadda provide the basic dictionary with the default steps.
#### initDictionary
This method return the initial dictionary for creating a new onMessage.
```js
var dictionary = utiltest.yadda.initDictionary;
```
#### initLibrary
This method initialize a library. If a dictionary is provided, then the dictionary is automatically add to the library.

```js
var library = utiltest.yadda.initLibrary(dictionary);
```
Creates a library using a given dictionary.
```js
var library = utiltest.yadda.initLibrary();
```
Creates a library without a dictionary
#### addCommonSteps
Add common steps to a given library
```js
var library = utiltest.yadda.addCommonSteps(library);;
```
Add the common steps to a given library.

#### Default dictionary.
The default dictionary contains the following terms:
 * json -->> Convert a string to a JSON object
 * strArray -->> convert a string `,` separate in an array of strings
 * userLogin -->> convert a `usser, password` in to an object like
     ```json
     {"user": "string", "password":"string"}
     ```

 * statusCode --> convert string in to a number between 100 and 999

#### Default steps
`Launch $json` or `launch $json`: Execute a python script with the given options defined in `$json`, and wait until the script finish before go to next step.

`Given the following context\n$form`: Store the given context (`$json`) in the test context.

`Then the response is[\b\n]$json` Validates that the response, which is stored in the test context, be equal to `$json`

`Then responses with $type` Validates that the response, which is stored in the test context, is of the given type.

`Then the response should be like[\s\n]$form` Validates that the response, which is stored in the test context, is of the kind defined in `$form`. See validation.
### ScriptLoader
This module provide functionality for loading a script. Initially, only supports python scripts. See jsDoc for more info

### validation
This module provide functionality for validation in the tests.

[Change Log](./CHANGELOG.md)
