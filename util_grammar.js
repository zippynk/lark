// Generated automatically by nearley
// http://github.com/Hardmath123/nearley
(function () {
function id(x) {return x[0]; }
var grammar = {
    ParserRules: [
    {"name": "rule", "symbols": ["left", {"literal":"="}, "right"], "postprocess":  function(d){return (function(lark){return {match:d[0],postprocessor:d[2]};});} },
    {"name": "left", "symbols": [" ebnf$1"], "postprocess":  function(d){return function(){lark.concat_rules(d[0]);}} },
    {"name": "wildL", "symbols": [{"literal":"$"}, " ebnf$2"], "postprocess":  function(d){return function(){lark.exec_lark(d[1]);}} },
    {"name": "charL", "symbols": [/[^$=\\\n]/], "postprocess":  function(d){return function(){lark.lit(d[0]);};} },
    {"name": " string$3", "symbols": [{"literal":"\\"}, {"literal":"$"}], "postprocess": function joiner(d) {
        return d.join('');
    }},
    {"name": "charL", "symbols": [" string$3"], "postprocess":  function(d){return function(){lark.lit("$");} },
    {"name": " string$4", "symbols": [{"literal":"\\"}, {"literal":"="}], "postprocess": function joiner(d) {
        return d.join('');
    }},
    {"name": "charL", "symbols": [" string$4"], "postprocess":  function(d){return function(){lark.lit("=");}} },
    {"name": " string$5", "symbols": [{"literal":"\\"}, {"literal":"n"}], "postprocess": function joiner(d) {
        return d.join('');
    }},
    {"name": "charL", "symbols": [" string$5"], "postprocess":  function(d){return function(){lark.lit('\n')";};} },
    {"name": "right", "symbols": [" ebnf$6"], "postprocess":  function(d){return "function(captured_vars){return "+d[0].join("+")+";}";} },
    {"name": "wildR", "symbols": [{"literal":"$"}, " ebnf$7"], "postprocess":  function(d){return "captured_vars."+d[1];} },
    {"name": "charR", "symbols": [/[^$=\\\n]/], "postprocess":  function(d){return d[0];} },
    {"name": " string$8", "symbols": [{"literal":"\\"}, {"literal":"$"}], "postprocess": function joiner(d) {
        return d.join('');
    }},
    {"name": "charR", "symbols": [" string$8"], "postprocess":  function(d){return "$";} },
    {"name": " string$9", "symbols": [{"literal":"\\"}, {"literal":"="}], "postprocess": function joiner(d) {
        return d.join('');
    }},
    {"name": "charR", "symbols": [" string$9"], "postprocess":  function(d){return "=";} },
    {"name": " string$10", "symbols": [{"literal":"\\"}, {"literal":"n"}], "postprocess": function joiner(d) {
        return d.join('');
    }},
    {"name": "charR", "symbols": [" string$10"], "postprocess":  function(d){return "\n";} },
    {"name": " ebnf$1", "symbols": []},
    {"name": " ebnf$1", "symbols": [" subexpression$11", " ebnf$1"], "postprocess": function (d) {
                    return [d[0]].concat(d[1]);
                }},
    {"name": " ebnf$2", "symbols": [/[a-zA-Z]/]},
    {"name": " ebnf$2", "symbols": [/[a-zA-Z]/, " ebnf$2"], "postprocess": function (d) {
                    return [d[0]].concat(d[1]);
                }},
    {"name": " ebnf$6", "symbols": []},
    {"name": " ebnf$6", "symbols": [" subexpression$12", " ebnf$6"], "postprocess": function (d) {
                    return [d[0]].concat(d[1]);
                }},
    {"name": " ebnf$7", "symbols": [/[a-zA-Z]/]},
    {"name": " ebnf$7", "symbols": [/[a-zA-Z]/, " ebnf$7"], "postprocess": function (d) {
                    return [d[0]].concat(d[1]);
                }},
    {"name": " subexpression$11", "symbols": ["charL"]},
    {"name": " subexpression$11", "symbols": ["wildL"]},
    {"name": " subexpression$12", "symbols": ["charR"]},
    {"name": " subexpression$12", "symbols": ["wildR"]}
]
  , ParserStart: "rule"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
