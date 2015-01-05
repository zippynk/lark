var fs = require("fs");
var lark = require("../interpreter.js");

fs.readFile('test/basic_test.lk', function (err, data) {
  if (err) throw err;

  /* Remove new lines for convenience. Normally we would have to have these
  newlines removed in the file itself */
  var text = data.toString().replace(/\n/g, "");
  lark.interpreter(text);
});
