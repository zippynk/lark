var types = require("./types.js");
var nearley = require('nearley');
var grammar = require('./util_grammar.js');

//basicly.... first execs it with current rules...
//if that does not match, it should keep working with util_grammar

/* For the interpreter, if it finds a rule, it should exec itself on the text
it found along with that rule added. run on whatever its internals are (not
caring about executing amount). I can probaly just make it so with works with
this. (with some sort of exec_with commands). So, hwo are wilds gonna work? Well
how does scoping and referncing work in js. Oh yeah, objects are all
pointer-esque. */

function interpreter(code){
  var rules = new types.lark_func(null);
  while (true){
    console.log(code);
    try {
    var parser = new nearley.Parser(grammar.ParserRules,
      grammar.ParserStart,
      "code");
      // I hope the first is the shortest.
      result=parser.feed(code).results[0];
      code=result.code;
      console.log(result)
      console.log(result.rule);
      rules.add(new types.lark_func(result.rule(this)));
    } catch (e) {
      throw e;
      return code;
    }
  }
}
console.log(interpreter("0=1;0"));
