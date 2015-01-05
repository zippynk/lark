(function(){
  var types = require("./types.js");
  var nearley = require('nearley');
  var _ = require('underscore');
  var grammar = require('./util_grammar.js');
  var core_parser = require("./core_parser.js");

  //basicly.... first execs it with current rules...
  //if that does not match, it should keep working with util_grammar

  /* For the interpreter, if it finds a rule, it should exec itself on the text
  it found along with that rule added. run on whatever its internals are (not
  caring about executing amount). I can probaly just make it so with works with
  this. (with some sort of exec_with commands). So, how are wilds gonna work? Well
  how does scoping and referncing work in js. Oh yeah, objects are all
  pointer-esque. */
  function int_rule(){
    return (
      core_parser.named_parser(
        "output",
        core_parser.regex_parser(/(\-?)[0-9]+/),
        function(i){return i;}
      )
    );
  }
  function other_int_rule(){
    return (
      core_parser.named_parser(
        "output",
        core_parser.regex_parser(/int\((\-?)[0-9]+\)/),
        function(i){return i;}
      )
    );
  }
  function add_int_rule(rules){
    var parser = new nearley.Parser(grammar.ParserRules,
      "left");
      var funcer = eval(parser.feed("$a+$b").results[0])
    return core_parser.parts_to_rule(
      funcer,
      function(captured_vars){
        var a = parseInt(captured_vars.a());
        if(a==NaN)throw "ERROR: Cannot add because "+a+" is not an int.";
        var b = parseInt(captured_vars.b());
        if(b==NaN)throw "ERROR: Cannot add because "+b+" is not an int.";
        return (parseInt(a)+parseInt(b)).toString();
      }
    );
  }
  function subtract_int_rule(rules){
    var parser = new nearley.Parser(grammar.ParserRules,
      "left");
      var funcer = eval(parser.feed("$a-$b").results[0])
      return core_parser.parts_to_rule(
        funcer,
        function(captured_vars){
          var a = parseInt(captured_vars.a());
          if(a==NaN)throw "ERROR: Cannot subtract because "+a+" is not an int.";
          var b = parseInt(captured_vars.b());
          if(b==NaN)throw "ERROR: Cannot subtract because "+b+" is not an int.";
          return (parseInt(a)-parseInt(b)).toString();
        }
      );
  }
  function if_rule(rules){
    var parser = new nearley.Parser(grammar.ParserRules,
      "left");
      var funcer = eval(parser.feed("if $condition then $a else $b").results[0])
      return core_parser.parts_to_rule(
        funcer,
        function(captured_vars){
          var condition = captured_vars.condition();
          if (condition == "true") {
            return captured_vars.a();
          } else if (condition == "false") {
            return captured_vars.b();
          } else{
            throw "ERROR: Cannot execute if because "+condition+" is not a bool.";
          }
        }
      );
    }
  function equal_rule(rules){
    var parser = new nearley.Parser(grammar.ParserRules,
      "left");
      var funcer = eval(parser.feed("$a\\=\\=$b").results[0])
      return core_parser.parts_to_rule(
        funcer,
        function(captured_vars){
          var a = captured_vars.a();
          var b = captured_vars.b();
          if(a==b) return "true";
          return "false";
        }
      );
    }
    function less_than_rule(rules){
      var parser = new nearley.Parser(grammar.ParserRules,
        "left");
        var funcer = eval(parser.feed("$a<$b").results[0])
        return core_parser.parts_to_rule(
          funcer,
          function(captured_vars){
            var a = parseInt(captured_vars.a());
            if(a==NaN)throw "ERROR: Cannot do less than because "+a+" is not an int.";
            var b = parseInt(captured_vars.b());
            if(b==NaN)throw "ERROR: Cannot do less than because "+b+" is not an int.";
            if(a<b) return "true";
            return "false";
          }
        );
      }
      function more_than_rule(rules){
        var parser = new nearley.Parser(grammar.ParserRules,
          "left");
          var funcer = eval(parser.feed("$a>$b").results[0])
          return core_parser.parts_to_rule(
            funcer,
            function(captured_vars){
              var a = parseInt(captured_vars.a());
              if(a==NaN)throw "ERROR: Cannot do more than because "+a+" is not an int.";
              var b = parseInt(captured_vars.b());
              if(b==NaN)throw "ERROR: Cannot do more than because "+b+" is not an int.";
              if(a>b) return "true";
              return "false";
            }
          );
        }

  // The memoizing of this that may occur could cause problems.
  function print_rule(rules){
    var parser = new nearley.Parser(grammar.ParserRules,
      "left");
      return(
        core_parser.parts_to_rule(
          eval(parser.feed("print($a)").results[0]),
          function(x){
            // I don't like this way of doing things.
            //no easy way to fix this for now
            console.log(x.a());
            return "";
          }
        )
      );
    }
    var parse_block = _.memoize(function(str){
      var parser = new nearley.Parser(grammar.ParserRules,
        "block");
      try {
        return parser.feed(str).results;
      } catch(e) {
        return undefined;
      }
    });

    /* This shouldn't use recursion really. It should just be updating an
    instance of an interperter I guess. */
    function block_rule(rules){
        return(
          (function(str){

            if(str[0]!="{" || str.slice(-1)!="}"){
              return {matches:false};
            }
            results=parse_block(str);
            if(results===undefined) return {matches:false};
            if(results.length >= 1) { // ambigous for now
              var result = results[0];
              var new_rules = rules.clone();
              new_rules.add(result.rule(new_rules));

              //var ret = new_rules.exec("{"+result.code+"}");
              //return ret;
              return {matches:true,captured_vars:{
                output:function(){
                  var ret1 = new_rules.exec("{"+result.code+"}");
                  var ret= ret1.captured_vars.output()

                  return ret;
                  }
                  }
                };
            } else {
              return {matches:false};
            }
          })
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
    code = "{" + code + "}"
    var rules = new types.lark_func(null);
    rules.add(block_rule(rules));
    rules.add(string_to_rule("{$a}=$a",rules)); //this aint good
    rules.add(string_to_rule("($a)=$a",rules)); //this aint good
    //$(a)*$(b)=if $b==0 than 0 else ($a*($b-1)+$a);
    rules.add(if_rule(rules));
    rules.add(int_rule(rules));
    rules.add(add_int_rule(rules));
    rules.add(subtract_int_rule(rules));
    rules.add(print_rule(rules)); // Needs work
    rules.add(equal_rule(rules));
    rules.add(less_than_rule(rules));
    rules.add(more_than_rule(rules));

    var attempt = rules.exec(code);
    if (attempt.matches) {
      return attempt.captured_vars.output();
    } else {
      return "ERROR";
    }
  }
  if (typeof module != 'undefined' && typeof module.exports != 'undefined') {
    module.exports = {
      interpreter: interpreter
    };
  }

})();
