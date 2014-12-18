(function() {
  var core_parser = require("./core_parser.js");
  var nearley = require('nearley');
  var grammar = require('./util_grammar.js');

  function scope(rules){
    if (rules === undefined) {
      this.rules = [];
    } else {
      this.rules = rules;
    }

    function new_rule_parser(start) {
      // Does this 3rd argument of start work?
      return new nearley.Parser(grammar.ParserRules, grammar.ParserStart, start);
    }

    /* This takes the string form of a parser, such as $n!=($n-1)! and turns it
    into a parser object. */
    this.str_to_rule = function(str_to_convert) {
      /* Is their anyway I can make it so I don't have to make a new js_parser
      each time? */
      var rule_parser = new_rule_parser('rule');
      // This will error is the input is not a valid parser.
      return (rule_parser.feed(str_to_convert).results[0])(this);
    }

    this.to_parser = function(name) {
      return core_parser.expr_parser(name,this.rules);
    }

    this.to_rule = function() {
      return this.to_parser("output");
    }

    this.with = function(rule) {
      return new scope(this.rules.concat([rule]));
    }

    this.with_str = function(str_rule) {
      var rule = this.str_to_rule(str_rule);
      return this.with(rule);
    }

    this.with_func = function(func_rule) {
      var rule = core_parser.func_to_rule(func_rule);
      return this.with(rule);
    }

    this.add_func_rule = function(func_rule) {
      var rule = core_parser.func_to_rule(func_rule);
      return this.add_rule(rule);
    }

    this.add_str_rule = function(str_rule) {
      var rule = this.str_to_rule(str_rule);
      return this.add_rule(rule);
    }

    this.add_rule = function(rule) {
      return this.rules.push(rule);
    }
  }

  //!== not needed
  if (typeof module != 'undefined' && typeof module.exports != 'undefined') {
    module.exports = {
      scope:scope
    }
  }
  /*
  else {
  window.grammar = grammar;
  }
  */
})();
