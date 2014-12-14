(function(){
//The module underscore is imported in order to help with functional stuff like memoization.
_=require('underscore')

//The lit function takes a string or matchable object and returns a function that checks for a complete matche of the whole string of its input with the string or matchable object.
function lit(match_against){
  //No memoization here because I think this is fast enough without it. A possible change in the future may be adding memoization here or making it occur when the matchable is sufficiently large.
  if(typeof match_against=="string"){
    return function(x){
      if(x===match_against){
        return {captured_vars:{},matches:true};
      }else{
        return {matches:false};
      }
    };
  }else{
    //This assumes it is a regex or other matchable object.
    return function(x){

      var attempt_match=x.match(match_against);
      if(attempt_match===null){
        return {matches:false};
      }
      //This is to make sure all of x is matched.
      else if(attempt_match[0]===x){
        return {captured_vars:{},matches:true};
      }else{
        return {matches:false};
      }
    };
  }

}
//The join_rules function takes two rule functions and returns a function that attempts to parse an input string with one rule followed by the other. It does this by splliting the string in half at every index and checking whether each rule can parse its half of the string.
function join_rules(left_rule,right_rule){
  //This is memoized so we don't do useless stuff later.
  return _.memoize(function(str_to_check){
    //The attempt variables store our attempts at parsing each half of our string which we will split at differing points.
    var left_attempt;
    var right_attempt;
    //Yes, we could have weird recursing but we won't since I'll never pass a function to its own left_rule or right_rule or something similar with more levels.
    for(var i in str_to_check){
      //Here we check the left half of the string before i.
      left_attempt=left_rule(str_to_check.slice(0,i));
      if(left_attempt.matches){
        //Here we check the right half of the string starting at i.
        right_attempt=right_rule(str_to_check.slice(i));
        if(right_attempt.matches){
          //Now we know that both sides match so we just return that we match and the symbols. Note for "than" we are combining the captured_vars from both sections as they are not being absorbed here. They are in fact absorbed in the postprocessor.
          return {captured_vars:_.extend({},left_attempt.captured_vars,right_attempt.captured_vars),matches:true}
        }
      }
    }
    //In case there are no matchings.
    return {matches:false};
  });
}

//The concat_rules function takes an array of several rules as input and makes a concatanation of them using the join_rules function.
function concat_rules(rules){
  //This accounts for trying to concat one item which may occur due to concat_rules's recursion.
  if(rules.length==1){
    return rules[0];
  }
  //Now we split them in half and recurse on each half, combining those two halfs with join_rules.
  return join_rules(concat_rules(rules.slice(0,rules.length/2)),concat_rules(rules.slice(rules.length/2)));
}

//This parse_expr function takes a set of parsers and a name and returns a function that takes a string and returns {matches:false} if none of the parsers match the input string and otherwise returns an object where matching is true and a captured_vars where var_name maps to the output of the captured parsing.
function parse_expr(var_name,parsers){

  //This is memoized so we don't do useless stuff later.
  return _.memoize(function(str_to_parse){

    //The rule variable stores the current rule we are looking at in the for loop below.
    var current_parser;
    //The attempt variable store our attempts at parsing the string with the function at the variable rule.
    var attempt;
    for(var i in parsers){
      //This is getting the current parser and trying to match str_to_parse with that rule.
      current_parser=parsers[i]
      attempt=current_parser.match(str_to_parse);
      //If the attempt does match we run the captured_vars of that attempt through the rules postprocessor.
      if(attempt.matches){
        var my_captured_vars={}
        my_captured_vars[var_name]=current_parser.postprocessor(attempt.captured_vars);
        return {captured_vars:my_captured_vars,matches:true};
      }

    }
    //If the program gets here it means no parsings have been found so it just returns {matches:false}.
    return {matches:false};
  });
}
//The global_parsers variable is used to keep track of the base set of parsers since they are needed with several functions
//It may change at times if inside certain functions the rules are changed. This should eventually be changed as it can cause problems.
var global_parsers;
function exec_lark(var_name,parsers){
  return function(str_to_exec){

    var older_parsers;
    if(parsers){
      //The older_parsers variable holdes the previous global parsers until this is done executing.
      older_parsers=global_parsers;
      global_parsers=parsers;

    }
    var attempt=parse_expr(var_name,global_parsers)(str_to_exec)
    //If the string never parses than we return {matches:false}. Otherwise we return the last possible matching parse.
    var old={matches:false};
    while(attempt.matches){
      old=attempt;
      attempt=parse_expr(var_name,global_parsers)(attempt[var_name]);
    }
    if(older_parsers){
      //The global_parsers variable now gets back its old value
      global_parsers=older_parsers;
    }
    return old;
  }
}

function named_rule(name,rule,postprocessor){
  return function(str_to_check){
    var attempt=rule(str_to_check);
    if(attempt.matches){
      var ret={matches:true,captured_vars:{}};
      if(postprocessor){
        ret.captured_vars[name]=postprocessor(str_to_check);
      }else{
        ret.captured_vars[name]=str_to_check;
      }
      return ret;
    }
    return {matches:false};
  }
}
//This is for when you have a function that you want to use for both matching and postprocessing
function parser_from_func(func_to_use){
  //this is going to return an object.... the object needs to have storing things...aka class
  return {match:function(str_to_check){
      var attempt=func_to_use(str_to_check);
      if(attempt!=undefined){//undefined is for when it fails
        return {matches:true,captured_vars:{out:attempt}};
      }
      return {matches:false};
    },postprocessor:function(captured_vars){return captured_vars.out;}
  };
}
//This takes a rule that captures a rule variable and a expr variable and returns a rule that will parse the expr with the rule (and all other rules).
var nearley = require("nearley");
var grammar = require("./util_grammar.js");
function parse_with_rule(rule){
  return parser_from_func(
    function(str_to_parse){
      // var basic_attempt=lark.concat_rules([lark.lit("(with "),lark.named_rule("rule",lark.lit(/\"([^"\/]|\\\\|\\[^\\])*\"/)),lark.lit(" "),lark.named_rule("expr",lark.lit(/\"([^"\/]|\\\\|\\[^\\])*\"/)),lark.lit(")")])(str_to_parse);
      var given_rule_attempt=rule(str_to_parse)
      if(!given_rule_attempt.matches){
        return undefined;
      }
      var str_form_of_rule=given_rule_attempt.captured_vars.rule;//yeah.... this is dangerous.... I'm 'unescaping' the string into rule form.
      //Now I turn it into a rule
      js_parser = new nearley.Parser(grammar.ParserRules, grammar.ParserStart);
      rule_parsings=js_parser.feed(str_form_of_rule).results;
      if(rule_parsings.length==0)return undefined;
      var str_form_of_expr=given_rule_attempt.captured_vars.expr;
      //module
      var attempt=exec_lark("out",global_parsers.concat([rule_parsings[0](lark_functions)]))(str_form_of_expr);
      if(attempt.matches){
        return attempt.captured_vars.out;
      }else{
        return undefined;
        //ummm... post proccessing fail?
      }
    });
}
function parser_from_str(str_to_convert){
  js_parser = new nearley.Parser(grammar.ParserRules, grammar.ParserStart);
  //needs to be valid...
  //console.log((js_parser.feed(str_to_convert).results[0])(module.exports));
  return(js_parser.feed(str_to_convert).results[0])(lark_functions);
}
//ADD THIS NAMED FUNCTION SO I CAN NAME RULES

//in actuall fact the parsers should compile their work into rules, wilds should come with rules builtin, no matter what...
//MUST BE A MODULE
var lark_functions = {lit:lit,
  join_rules:join_rules,
  concat_rules:concat_rules,
  parse_expr:parse_expr,
  exec_lark:exec_lark,
  named_rule:named_rule,
  parser_from_func: parser_from_func,
  parse_with_rule: parse_with_rule,
  parser_from_str: parser_from_str
};
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
  module.exports = lark_functions;
}
// else {
//   window.grammar = grammar;
// }
})();
