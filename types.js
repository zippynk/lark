(function() {
  var core_parser = require('./core_parser.js');
  var nearley = require('nearley');
  var grammar = require('./util_grammar.js');

  function lark_func(init_val) {
    this.to_named = function(name) {
      return new lark_func(this.to_named_parser(name));
    };
    this.to_named_parser = function(name) {
      var named_parser = core_parser.expr_parser(name, [this.func]);
      return named_parser;
    };
    /* so.... $a should still cause the named parser.... but $( = ) should also
    be allowed... that would add several more special things... wait... I can
    ban that and just make it so I will have funcs that take things... yeah,
    thats fine. So... to match rule I do... string($x)... so, to match rule....
    I don't even need to match rule! just to make it so attempts at unboxing
    will fail! oh... wait... ummm... than string("4$a") should fail... hmmm..
    list($x,list($y))... when I try to get x do I get anything.... no... wait
    thats fine... I should not get anything there! okay. good. So, I need something
    that lets me check rule matching now ... also, not that $x will match
    .... and that rule($x) is shorthand for rule matching... */

    this.to_rule = function() {
      return this.to_named_parser('output');
    };

    this.exec = function(input_string) {
      return this.to_rule()(input_string);
    }

    this.cat = function(other_lark_func) {
      var new_rule = core_parser.join_rules(other_lark_func.to_rule(),
                                            this.to_rule());
      return new lark_func(new_rule);
    };

    this.or = function(other_lark_func) {
      var rules = [other_lark_func.to_rule(), this.to_rule()];
      var new_rule = core_parser.or_rules("output", rules);
      return new lark_func(new_rule);
    };
    if (typeof init_val == "string") {
      /* This takes the string form of a parser, such as $n!=($n-1)! and turns
      it into a parser object. */
      var parser = new nearley.Parser(grammar.ParserRules,
                                      grammar.ParserStart,
                                      "func");
                                      //this needs to be in a function part...
      this.func = (parser.feed(init_val).results[0])(this);
    } else if (typeof init_val == "function") {

      this.func = init_val;
    } else {
      throw Error("The type " + typeof init_val +
                  " is not a correct type for lark_func.");
    }
  }
  function lark_func_matches(str_to_check) {
    var parser = new nearley.Parser(grammar.ParserRules,
                                    grammar.ParserStart,
                                    "func");
    //this needs to be in a function part...
    var results = parser.feed(init_val).results;
    if (results.length == 0){
      return {matches: false};
    } else if (results.length ==1){
      return {matches: true, captured_vars:{output:str_to_check}}
    }
  }
  function lark_int(init_val) {
    this.val = parseInt(init_val);
    //I'm gonna do everything else myself...
    this.add = function(other_lark_int) {
      return this.val+other_lark_int.val;
    }
    this.sub = function(other_lark_int) {
      return this.val-other_lark_int.val;
    }

  }

  //!== not needed
  if (typeof module != 'undefined' && typeof module.exports != 'undefined') {
    module.exports = {
      lark_func:lark_func,
      lark_int:lark_int
    };
  }
  //So... right now.... I need to write the thing... so one rule matches rules
  /*
  else {
  window.grammar = grammar;
  }
  */
})();
