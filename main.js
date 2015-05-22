
var fs = require('fs');
var parseJSDoc = require('./JSDOCParser');
var DefinitionGenerator = require('./DefinitionGenerator');

if (process.argv.length < 3) {
  console.log("please pass a jsdoc json output filename");
  process.exit(0);
}

var input = process.argv[2];

fs.readFile(input, function (err, data) {

  if (err) {
    console.log(err.message);
    throw err;
  }

  var results = JSON.parse(data);
  var generator = new DefinitionGenerator();

  var info = parseJSDoc(results);
  var defs = generator.generate(info);

  fs.readFile('cesium.d.ts.template', function (err, data) {

    if (err) {
      console.log(err.message);
      throw err;
    }

    console.log(
        data.toString().replace('{{HERE}}', defs));
  });

});
