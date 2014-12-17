(function() {
  /* You may be wondering what the difference between a rule and a parser is.
  A parser takes some input and returns an object indicating whether it matched
  the input and possibly including some variables it captured (specific parts
  that it matched that may of may not have been postprocessed). A rule has a
  parser property that is a parser and a postprocessor property that takes the
  captured variables of the parser and returns a string. The use for this is
  that we can check for correct parsings and only execute the postprocessor part
  later. */

  var _ = require('underscore');
  var nearley = require('nearley');
  var grammar = require('./util_grammar.js');
  /* The lit function takes a string or matchable object and returns a
  parser function that checks for a complete matche of the whole string of its
  input with the string or matchable object. */
  function lit(match_against) {
    /* No memoization here because I think this is fast enough without it. A
    possible change in the future may be adding memoization here or making it
    occur when the matchable is sufficiently large. */
    if (typeof match_against == 'string') {
      return function(x) {
        if (x === match_against) {
          return {
            captured_vars: {},
            matches: true
          };
        } else {
          return {
            matches: false
          };
        }
      };
    } else {
      // This assumes it is a regex or other matchable object.
      return function(x) {

        var attempt_match = x.match(match_against);
        if (attempt_match === null) {
          return {
            matches: false
          };
        }
        // This is to make sure all of x is matched.
        else if (attempt_match[0] === x) {
          return {
            captured_vars: {},
            matches: true
          };
        } else {
          return {
            matches: false
          };
        }
      };
    }

  }
  /*
  The join_parsers function takes two parser functions and returns a function
  that attempts to parse an input string with one parser followed by the other.
  It does this by splliting the string in half at every index and checking
  whether each parser can parse its half of the string.
  */
  function join_parsers(left_parser, right_parser) {
    // This is memoized so we don't do useless stuff later.
    return _.memoize(function(str_to_check) {
      /* The attempt variables store our attempts at parsing each half of our
      string which we will split at differing points. */
      var left_attempt;
      var right_attempt;
      /* Yes, we could have weird recursing but we won't since I'll never pass a
      function to its own left_parser or right_parser or something similar with
      more levels. */
      for (var i in str_to_check) {
        // Here we check the left half of the string before i.
        left_attempt = left_parser(str_to_check.slice(0, i));
        if (left_attempt.matches) {
          // Here we check the right half of the string starting at i.
          right_attempt = right_parser(str_to_check.slice(i));
          if (right_attempt.matches) {
            /* Now we know that both sides match so we just return that we match
            and the symbols. Note for "than" we are combining the captured_vars
            from both sections as they are not being absorbed here. They are in
            fact absorbed in the postprocessor. */
            var left_captured = left_attempt.captured_vars;
            var right_captured = right_attempt.captured_vars;
            return {
              captured_vars: _.extend({}, right_captured, left_captured),
              matches: true
            };
          }
        }
      }
      // In case there are no matchings.
      return {
        matches: false
      };
    });
  }

  /* The concat_parsers function takes an array of several parsers as input and
  makes a concatanation of them using the join_parsers function. */
  function concat_parsers(parsers) {
    /* This accounts for trying to concat one item which may occur due to
    concat_parsers's recursion. */
    if (parsers.length == 1) {
      return parsers[0];
    }
    /* Now we split them in half and recurse on each half, combining those two
    halves with join_parsers. */
    var left_half = concat_parsers(parsers.slice(0, parsers.length / 2));
    var right_half = concat_parsers(parsers.slice(parsers.length / 2));
    return join_parsers(left_half, right_half);
  }

  /* This is for when you have a parser and want to make it so it captures
  what it parses with a specific name and optionally a postprocessor. */

  function named_parser(name, rule, postprocessor) {
    return function(str_to_check) {
      var attempt = rule(str_to_check);
      if (attempt.matches) {
        var ret = {
          matches: true,
          captured_vars: {}
        };
        if (postprocessor != undefined) {
          ret.captured_vars[name] = postprocessor(str_to_check);
        } else {
          ret.captured_vars[name] = str_to_check;
        }
        return ret;
      }
      return {
        matches: false
      };
    }
  }

  /* This is for when you have a function and want to turn it into a parser. */

  function func_to_parser(name, func) {
    return function(str_to_check) {
      var attempt = func(str_to_check);
      if (attempt === undefined){
        return {
          matches:false
          };
      } else {
        var ret = {
          matches: true,
          captured_vars: {}
        };
        ret.captured_vars[name] = attempt;
        return ret
      }
    }
  }

  /* This or_rules function takes a set of rules and a name and returns a
  function that takes a string and returns {matches:false} if none of the rules
  match the input string and otherwise returns an object where matching is true
  and a captured_vars where var_name maps to the output of the captured parsing.
  */
  function or_rules(var_name, rules) {

    // This is memoized so we don't do useless stuff later.
    return _.memoize(function(str_to_parse) {

      /* The rule variable stores the current rule we are looking at in the for
      loop below. */
      var rule;
      /* The attempt variable store our attempts at parsing the string with the
      function at the variable rule. */
      var attempt;
      for (var i in rules) {
        /* This is getting the current rule and trying to match str_to_parse
        with that rule. */
        rule = rules[i];
        attempt = rule.parse(str_to_parse);
        /* If the attempt does match we run the captured_vars of that attempt
        through the rules postprocessor. */
        if (attempt.matches) {
          var captured_vars = {};
          // More than 80 characters here which is annoying
          captured_vars[var_name] = rule.postprocessor(attempt.captured_vars);
          return {
            captured_vars: captured_vars,
            matches: true
          };
        }

      }
      /* If the program gets here it means no parsings have been found so it
      just returns {matches:false}. */
      return {
        matches: false
      };
    });
  }

  /* The global_rules variable is used to keep track of the base set of rules
  since they are needed with several functions. It may change at times if inside
  certain functions the rules are changed. This should eventually be changed as
  it can cause problems. */
  var global_rules;

  /* This will return a parser that executes a string (an expression) with the
  given rules and captures that output with var_name. */

  function expr_parser(var_name, rules) {
    return function(str_to_exec) {

      var older_rules;
      if (rules) {
        /* The older_rules variable holds the previous global rules until this
        is done executing. */
        older_rules = global_rules;
        global_rules = rules;

      }
      var attempt = or_rules(var_name, global_rules)(str_to_exec);
      /* If the string never parses than we return {matches:false}. Otherwise we
      return the last possible matching parse. */
      var old = {
        matches: false
      };
      while (attempt.matches) {
        old = attempt;
        attempt = or_rules(var_name, global_rules)(attempt[var_name]);
      }
      if (older_rules) {
        // The global_rules variable now gets back its old value
        global_rules = older_rules;
      }
      return old;
    }
  }



  function make_rule(parser, postprocessor) {
    return {
      parser: parser,
      postprocessor: postprocessor
    };
  }

  function new_rule_parser(start) {
    console.log(lark_functions);
    nearley.Parser.prototype.lark=lark_functions;
    // Does this 3rd argument of start work?
    return new nearley.Parser(grammar.ParserRules, grammar.ParserStart, start);
  }

  /* This takes a parser that captures a parser variable and a expr variable and
  returns a parser that will parse the expr with the parser (and all other
  parsers). */

  function with_parser(parser) {
    return func_to_rule(
        function(str_to_parse) {
          var given_parser_attempt = parser(str_to_parse);
          if (!given_parser_attempt.matches) {
            return undefined;
          }
          var str_form_of_parser = given_parser_attempt.captured_vars.parser;
          // Now I turn it into a parser
          var rule_parser = new_rule_parser('rule');
          rule_parsings = rule_parser.feed(str_form_of_parser).results;
          if (rule_parsings.length == 0) return undefined;
          var str_form_of_expr = given_parser_attempt.captured_vars.expr;
          var new_rule = rule_parsings[0](lark_functions);
          var temp_rules = global_rules.concat([new_rule]);
          var attempt = expr_parser('out', temp_rules)(str_form_of_expr);
          if (attempt.matches) {
            return attempt.captured_vars.out;
          } else {
            return undefined;
            // This means there was a post proccessing failure.
          }
        });
  }

  /* This is for when you have a function that you want to use for both
    matching and postprocessing */
  function func_to_rule(func_to_use) {
    return {
      parse: function(str_to_check) {
        var attempt = func_to_use(str_to_check);
        if (attempt != undefined) { // undefined is for when it fails
          return {
            matches: true,
            captured_vars: {
              out: attempt
            }
          };
        }
        return {
          matches: false
        };
      },
      postprocessor: function(captured_vars) {
        return captured_vars.out;
      }
    };
  }

  /* This takes the string form of a parser, such as $n!=($n-1)! and turns it
    into a parser object. */
  function str_to_rule(str_to_convert) {
    /* Is their anyway I can make it so I don't have to make a new js_parser
      each time? */
      var rule_parser = new_rule_parser('rule');
    // This will error is the input is not a valid parser.
    return (rule_parser.feed(str_to_convert).results[0])(lark_functions);
  }

  // MUST BE A MODULE
  var lark_functions = {
    lit: lit,
    join_parsers: join_parsers,
    concat_parsers: concat_parsers,
    or_rules: or_rules,
    expr_parser: expr_parser,
    named_parser: named_parser,
    func_to_parser: func_to_parser,
    func_to_rule: func_to_rule,
    with_parser: with_parser,
    str_to_rule: str_to_rule
  };
  //!== not needed
  if (typeof module != 'undefined' && typeof module.exports != 'undefined') {
    module.exports = lark_functions;
  }
  /*
    else {
    window.grammar = grammar;
  }
  */
})();
