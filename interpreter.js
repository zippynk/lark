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
        function(i){return i;}
      )
    );
  }
  function other_int_rule(){
    return (
      core_parser.named_parser(
        "output",
        core_parser.lit(/int\((\-?)[0-9]+\)/),
        function(i){return i;}
      )
    );
  }

  function add_int_rule(rules){
    var parser = new nearley.Parser(grammar.ParserRules,
      "left");
      var funcer = eval(parser.feed("$a+$b").results[0])
    return core_parser.func_to_rule(function(str){
      var attempt = funcer(str);
      if (attempt.matches) {
        var a = attempt.captured_vars.a;
        var b = attempt.captured_vars.b;
        if(parseInt(a)!=NaN & parseInt(b)!=NaN) return (parseInt(a)+parseInt(b))+"";
      }
    });
  }
  function subtract_int_rule(rules){
    var parser = new nearley.Parser(grammar.ParserRules,
      "left");
      var funcer = eval(parser.feed("$a-$b").results[0])
      return core_parser.func_to_rule(function(str){
        var attempt = funcer(str);
        if (attempt.matches) {
          var a = attempt.captured_vars.a;
          var b = attempt.captured_vars.b;
          if(parseInt(a)!=NaN & parseInt(b)!=NaN) return (parseInt(a)-parseInt(b))+"";
        }
      });
    }
    function equal_rule(rules){
      var parser = new nearley.Parser(grammar.ParserRules,
        "left");
        var funcer = eval(parser.feed("$a\\=\\=$b").results[0]);
        //assumes identical look
        //for now lets just use ==
        return core_parser.func_to_rule(function(str){
          var attempt = funcer(str);
          if (attempt.matches) {//b=$a*($b-1)+$a
            var a = attempt.captured_vars.a;
            var b = attempt.captured_vars.b;
            if(a==b)return "true";
            return "false";
          }
        });
      }
  // The memoizing of this that may occur could cause problems.
  function print_rule(rules){
    var parser = new nearley.Parser(grammar.ParserRules,
      "left");
      return(
        core_parser.parts_to_rule(
          eval(parser.feed("print($a)").results[0]),
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

  function fix_whitespace(code){
    return code=code.replace(/(\w)\s+(\w)/g,"$1 $2")
    .replace(/(\W)\s+(.)/g,"$1$2")
    .replace(/(.)\s+(\W)/g,"$1$2")
    .replace(/^\s+/,"")
    .replace(/\s+$/,"");
  }

  function interpreter(code){
    code = fix_whitespace(code);

    var rules = new types.lark_func(null);

    rules.add(int_rule(rules));

    rules.add(add_int_rule(rules));
    rules.add(subtract_int_rule(rules));
    rules.add(print_rule(rules));
    rules.add(equal_rule(rules));


    // Print has no type so it won't need something to execute it.



    var results;
    while (true){
      var parser = new nearley.Parser(grammar.ParserRules,
        "code");
        // I hope the first is the shortest.
        try {
          results=parser.feed(code).results;
        } catch (e){
          results=[];
        }
        if(results.length >= 1) { // ambigous for now
          var result = results[0];
          code=result.code;
          rules.add(result.rule(rules));
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
