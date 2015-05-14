
var fs = require('fs');
var JSDOCParser = require('./JSDOCParser');
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
  var parser = new JSDOCParser();
  var generator = new DefinitionGenerator();

  var info = parser.parse(results);
  var defs = generator.generate(info);

  console.log(defs)
})
