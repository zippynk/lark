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

    this.add = function(other_lark_func) {
      var rules = [other_lark_func.to_rule(), this.to_rule()];
      this.func = core_parser.or_rules("output", rules);
    };
    this.str_to_func = function(str_to_convert){
      /* This takes the string form of a parser, such as $n!=($n-1)! and turns
      it into a parser object. */
      var parser = new nearley.Parser(grammar.ParserRules,
        grammar.ParserStart,
        "func");
      return new lark_func((parser.feed(str_to_convert).results[0])(this));
    }
    this.add_str =   function (str_to_convert){
      return this.add(this.str_to_func(str_to_convert));
    }

    if (init_val === null) {
      //This is in case we just want a base rule that matches nothing;
      this.func = core_parser.none;
    } else if (typeof init_val == "function") {

      this.func = init_val;
    } else {
      throw Error("The type " + typeof init_val +
                  " is not a correct type for lark_func.");
    }
  }
  /* this is bad and should not be used */
  function str_to_lark_func(str_to_convert){
    /* This takes the string form of a parser, such as $n!=($n-1)! and turns
    it into a parser object. */
    var parser = new nearley.Parser(grammar.ParserRules,
      grammar.ParserStart,
      "func");
    //this needs to be in a function part...
    var none_rule = new lark_func(null);
    return new lark_func((parser.feed(str_to_convert).results[0])(none_rule));
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
      lark_func: lark_func,
      str_to_lark_func: str_to_lark_func,
      lark_int: lark_int
    };
  }
  //So... right now.... I need to write the thing... so one rule matches rules
  /*
  else {
  window.grammar = grammar;
  }
  */
})();
