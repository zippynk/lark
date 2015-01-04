//THIS FILE IS VERY ALPHA AND IS MOSTLY USED FOR DEV PURPOSES
var fs = require("fs");
var lark = require("../interpreter.js");
// lark.interpreter("($a)=$a;$a*($b)=$a*$b;$a*0=0;$a*$b=$a*($b-1)+$a;print(2+2*2)");
fs.readFile('test/basic_test.lk', function (err, data) {
  if (err) throw err;
  // Remove new lines for convenience.
  var text = data.toString().replace(/\n/g,"");
  lark.interpreter(text);
});
// lark.interpreter("$a*0=0;$a*$b=$a*$b;$a*$b=$a*($b-2);print(3*1)");

//print(int(int(2)*(int(int(3)-int(1))-1)+int(2)+int(2)))
