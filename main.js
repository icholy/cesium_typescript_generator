
var fs = require('fs');
var parseJSDoc = require('./JSDOCParser');
var makeGenerator = require('./DefinitionGenerator');

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

  // jsdoc output
  var results = JSON.parse(data);

  // convert to more strutured data
  var info = parseJSDoc(results);

  // emit typescript
  var indent = "    ";
  var generate = makeGenerator(indent);
  var defs = generate(info);

  fs.readFile('cesium.d.ts.template', function (err, data) {

    if (err) {
      console.log(err.message);
      throw err;
    }

    // add generated code to template with boilerplate
    console.log(
        data.toString().replace('{{HERE}}', defs));
  });

});
