//THIS FILE IS VERY ALPHA AND IS MOSTLY USED FOR DEV PURPOSES
//run "nearleyc larkConverter.ne>larkConverter.js" first
var grammar = require("./util_grammar.js");
var lark = require("./interperter.js");
var nearley = require("nearley");
var fs = require("fs");


var js_parser;
var details=new Object();
details.encoding="ascii";
var lines=fs.readFileSync("test_case.lark",details).split("\n");
rules=[];
for(i in lines){
  if(lines[i]){
    rules.push( lark.parser_from_str(lines[i]));
  }
}
function rule_parser(quoted_str){
  //optimally this would check to make sure the input is a properlly escaped string....
  //I think this checks for correct string
  //I should switch to nearley for this eventually.
  if(!(lark.lit(/\"([^"\/]|\\\\|\\[^\\])*\"/)(quoted_str).matches))return {matches:false};
  str_form_of_rule=eval(quoted_str);//yeah.... this is dangerous.... I'm 'unescaping' the string into rule form.
  //Now I turn it into a rule
  js_parser = new nearley.Parser(grammar.ParserRules, grammar.ParserStart);
  rule_parsings=js_parser.feed(str_form_of_rule).results;
  if(rule_parsings.length==0){
    return {matches:false};
  }else{
    return {matches:true,captured_vars:{rule:rule_parsings[0](lark)}};
  }
}

rules.push(lark.parse_with_rule(lark.concat_rules([lark.lit("(with "),lark.named_rule("rule",lark.lit(/\"([^"\/]|\\\\|\\[^\\])*\"/),function(i){return eval(i);}),lark.lit(" "),lark.named_rule("expr",lark.lit(/\"([^"\/]|\\\\|\\[^\\])*\"/),function(i){return eval(i);}),lark.lit(")")])
      //    )// (this is here because of annoying atom syntax highlighting)
    ));

//ADD WITH FUNCTION
// rules.push({match:concat_rules(lit('(with '),
//                               named_rule("rule",lit(/([^=]|"\\=")*"="([^=]|"\\=")*"\n"/),)//pretty basic
//                             )
//                           });
var lark_parser=lark.exec_lark("output",rules);
console.log(lark_parser('(with "0=1" "0")'));
