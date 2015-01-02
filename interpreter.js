(function(){
  var types = require("./types.js");
  var nearley = require('nearley');
  var grammar = require('./util_grammar.js');
  var core_parser = require("./core_parser.js");

  //basicly.... first execs it with current rules...
  //if that does not match, it should keep working with util_grammar

  /* For the interpreter, if it finds a rule, it should exec itself on the text
  it found along with that rule added. run on whatever its internals are (not
  caring about executing amount). I can probaly just make it so with works with
  this. (with some sort of exec_with commands). So, hwo are wilds gonna work? Well
  how does scoping and referncing work in js. Oh yeah, objects are all
  pointer-esque. */
  function int_rule(){
    return (
      core_parser.named_parser(
        "output",
        core_parser.lit(/(\-?)[0-9]+/),
        function(i){return "int("+i+")";}
      )
    );
  }

  function add_int_rule(rules){
    var parser = new nearley.Parser(grammar.ParserRules,
      "left");
    return (
      core_parser.parts_to_rule(
        eval(parser.feed("int($a)+int($b)").results[0]),
        function(x){
          // Slicing removes the "int(" and ")".
          return (parseInt(x.a.slice(4,-1))+parseInt(x.b.slice(4,-1)))+"";
        }
      )
    );
  }

  function subtract_int_rule(rules){
    var parser = new nearley.Parser(grammar.ParserRules,
      "left");
    return (
      core_parser.parts_to_rule(
        eval(parser.feed("int($a)-int($b)").results[0]),
        function(x){
          // Slicing removes the "int(" and ")".
          return (parseInt(x.a.slice(4,-1))-parseInt(x.b.slice(4,-1)))+"";
        }
      )
    );
  }

  function print_int_rule(rules){
    var parser = new nearley.Parser(grammar.ParserRules,
      "left");
      return(
        core_parser.parts_to_rule(
          eval(parser.feed("print(int($a))").results[0]),
          function(x){
            console.log(x.a);
            return "";
          }
        )
      );
    }

  function string_to_rule(string_to_convert,rules){
    var parser = new nearley.Parser(grammar.ParserRules,
      "rule");
    return (
      (parser.feed(string_to_convert).results[0])(rules)
    );
  }

  function interpreter(code){
    var rules = new types.lark_func(null);

    rules.add(int_rule(rules));

    rules.add(add_int_rule(rules));
    rules.add(subtract_int_rule(rules));
    rules.add(print_int_rule(rules));


    rules.add(string_to_rule("$a+$b=int($a+$b)",rules));
    rules.add(string_to_rule("$a-$b=int($a-$b)",rules));
    // Print has no type so it won't need something to execute it.
    rules.add(string_to_rule("print($a)=print($a)",rules));
    // rules.add(string_to_rule("(int($a))=$a",rules));



    while (true){
      var parser = new nearley.Parser(grammar.ParserRules,
        "code");
        // I hope the first is the shortest.
        results=parser.feed(code).results;
        if(results.length >= 1) { // ambigous for now
          var result = results[0];
          code=result.code;
          rules.add(new types.lark_func(result.rule(rules)));
        } else {
          attempt=rules.exec(code);
          if (attempt.matches) {
            code = attempt.captured_vars.output;
            // Technically I know I don't need to use exec again.
          } else {
            break;
          }
        }
    }

    return code;
  }
  if (typeof module != 'undefined' && typeof module.exports != 'undefined') {
    module.exports = {
      interpreter: interpreter
    };
  }

})();
