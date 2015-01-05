(function() {

  /* You may be wondering what the difference between a rule and a parser is.
  As of now the rules just always capture a "output" variable. */
  var _ = require('underscore');
  /* The lit function takes a string or matchable object and returns a
  parser function that checks for a complete matche of the whole string of its
  input with the string or matchable object. */
  function lit(match_against) {
    /* No memoization here because I think this is fast enough without it. A
    possible change in the future may be adding memoization here or making it
    occur when the matchable is sufficiently large. */
    var ret = function(x) {
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
    ret.is_lit = true;
    ret.str=match_against;
    return ret;

  }
  function regex_parser(match_against,max_match) {
    /* No memoization here because I think this is fast enough without it. A
    possible change in the future may be adding memoization here or making it
    occur when the matchable is sufficiently large. */

      // This assumes it is a regex or other matchable object.
    var ret = function(x) {
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
    if(max_match === true){
      ret.is_regex = true;
      ret.regex = match_against;
    }
    return ret;

  }


  function none(){
    return {
      matches: false
      };
  }
  function consume_start_str(str, lit_parser) {
    var lit = lit_parser.str;
    if (str.indexOf(lit,0) == 0) {
      return str.slice(lit.length);
    }
    return null;
  }
  function consume_end_str(str, lit_parser) {
    var lit = lit_parser.str;
    if (str.lastIndexOf(lit) == str.length-lit.length) {
      return str.slice(0,str.length-lit.length);
    }
    return null;
  }
  function consume_start_regex(str,reg_parser){
    var reg = reg_parser.regex;
    var attempt = str.match(reg)
    if (attempt && attempt.index == 0) {
      return str.slice(attempt[0].length);
    }
    return null;
  }
  function consume_end_regex(str,reg_parser){
    var reg = new RegExp(reg_parser.regex.source+"$");
    var attempt = str.match(reg)
    if (attempt) {
      return str.slice(0,-(attempt[0].length));
    }
    return null;
  }
  /*
  The join_parsers function takes two parser functions and returns a function
  that attempts to parse an input string with one parser followed by the other.
  It does this by splliting the string in half at every index and checking
  whether each parser can parse its half of the string.
  */
  function join_parsers(left_parser, right_parser) {
    // This is memoized so we don't do useless stuff later.
    if (left_parser.is_lit) {
      if (right_parser.is_lit) {
        return lit(left_parser.str+right_parser.str);
      }
      return function(str_to_check) {
        var test = consume_start_str(str_to_check,left_parser);
        if(test!==null) return right_parser(test);
        else {
          return {matches: false};}
      }
    }
    if (right_parser.is_lit) {
      return function(str_to_check) {
        var test = consume_end_str(str_to_check,right_parser);
        if(test!==null) return left_parser(test);
        else {return {matches: false};}
        }
    }
    if (left_parser.is_regex) {
      return function(str_to_check) {
        var test = consume_start_regex(str_to_check,left_parser);
        if(test!==null) return right_parser(test);
        else {return {matches: false};}
        }
      }
    if (right_parser.is_regex) {
      return function(str_to_check) {
        var test = consume_end_regex(str_to_check,right_parser);
        if(test!==null) return left_parser(test);
        else {return {matches: false};}
        }
      }
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
    for (var i = parsers.length-2; i >= 0 ; i--){
      var parser = parsers[i];

      if (parser.is_lit || parser.is_regex) {
        return join_parsers(concat_parsers(parsers.slice(0,i+1)),
                            concat_parsers(parsers.slice(i+1))
                            );
      }
    }
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
        captured_vars = {};
        captured_vars[name] = _.memoize(function(){
          if (postprocessor != undefined) {
            return postprocessor(str_to_check);
          } else {
            return str_to_check;
          }
        });
        return {
          matches: true,
          captured_vars: captured_vars
        };
      }
      return {
        matches: false
      };
    }
  }


  /* This or_rules function takes a set of rules and a name and returns a
  function that takes a string and returns {matches:false} if none of the rules
  match the input string and otherwise returns an object where matching is true
  and a captured_vars where var_name maps to the input string.
  */
  function check_rules(var_name, rules) {
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
        attempt = rule(str_to_parse);
        /* If the attempt does match we run the captured_vars of that attempt
        through the rules postprocessor. */

        if (attempt.matches) {
          var captured_vars = {};
          captured_vars[var_name]=function(){return str_to_parse;};
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
        attempt = rule(str_to_parse);
        /* If the attempt does match we run the captured_vars of that attempt
        through the rules postprocessor. */
        if (attempt.matches) {
          var captured_vars = {};
          captured_vars[var_name] = attempt.captured_vars.output;
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

  function expr_parser(var_name, global_rules) {
    return _.memoize(function(str_to_exec) {

      var attempt = or_rules(var_name, global_rules)(str_to_exec);
      /* If the string never parses than we return {matches:false}. Otherwise we
      return the last possible matching parse. */

      var old = {
        matches: false
      };
      if(attempt.matches){
        var captured_vars = {};
        captured_vars[var_name]=function(){
          while (attempt.matches) {
            // The if statement checks to see if we are just looping.
            // Should this be here?
            attempt_caught=attempt.captured_vars[var_name]();

            if (old.matches && attempt_caught == old_caught) break;
            old = attempt;
            old_caught=attempt_caught;
            attempt = or_rules(var_name, global_rules)(attempt_caught);
          }
          //post proccessing twice???
          return old_caught;
        };
        return {
          matches: true,
          captured_vars: captured_vars
        }
      } else {
        return {matches: false};
      }
    });
  }

  function parts_to_rule(matcher, postprocessor) {
    return _.memoize(function(str_to_check) {
      var attempt = matcher(str_to_check);
      if (attempt.matches) {
        return {matches: true,
          captured_vars:{output: function(){return postprocessor(attempt.captured_vars);}}
        };
      }
      return {
        matches: false
      };
    });
  }

  // MUST BE A MODULE
  var lark_functions = {
    lit: lit,
    regex_parser: regex_parser,
    none: none,
    join_parsers: join_parsers,
    concat_parsers: concat_parsers,
    or_rules: or_rules,
    expr_parser: expr_parser,
    named_parser: named_parser,
    check_rules: check_rules,
    parts_to_rule: parts_to_rule
  };

  //!== not needed
  if (typeof module != 'undefined' && typeof module.exports != 'undefined' ) {
    module.exports = lark_functions;
  }
  /*
    else {
    window.grammar = grammar;
  }
  */
})();
