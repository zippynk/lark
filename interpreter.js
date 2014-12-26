var types = require("./types.js");
/* An interperter has a list of rules and executes strings according to them.
One of its rules should involve dealing with new rules. */
function func_string_parser(string_to_parse){
  try{
    return types.str_to_lark_func(string_to_parse);

  }
}

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
  var attempt = rules.exec(code);
  var once = false;
  if (attempt.matches) {
    code = attempt.output();
    once = true;
  } else {
    try {
      //GET PARSINGS HERE AND LEFT OVERS
      var new_rule_attempt = types.str_to_lark_func(string_to_parse);
      //so... none throws an error?
      rules = rules.or(new_rule_attempt);
      once = true;
    }
    catch (e) {
      console.log(e,"error");
      if (once) return {
        output:codes,matches:false
        }
    }

  }
}
types.lark_func()
