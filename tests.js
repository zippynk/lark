//run "nearleyc larkConverter.ne>larkConverter.js" first
var grammar = require("./util_grammar.js");
var lark = require("./lark.js");
var nearley = require("nearley");
var fs = require("fs");


var js_parser;
var details=new Object();
details.encoding="ascii";
var lines=fs.readFileSync("test_case.lark",details).split("\n");
rules=[];
for(i in lines){
  if(lines[i]){
    js_parser = new nearley.Parser(grammar.ParserRules, grammar.ParserStart);
    rules.push(eval(js_parser.feed(lines[i]).results[0])(lark));
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
    return {matches:true,captured_vars:{rule:eval(rule_parsings[0])(lark)}};
  }
}
rules.push(lark.parser_from_func(
          function(str_to_parse){
            var basic_attempt=lark.concat_rules([lark.lit("(with "),lark.named_rule("rule",lark.lit(/\"([^"\/]|\\\\|\\[^\\])*\"/)),lark.lit(" "),lark.named_rule("expr",lark.lit(/\"([^"\/]|\\\\|\\[^\\])*\"/)),lark.lit(")")])(str_to_parse);
            if(!basic_attempt.matches){
              return undefined;
            }
            var str_form_of_rule=eval(basic_attempt.captured_vars.rule);//yeah.... this is dangerous.... I'm 'unescaping' the string into rule form.
            //Now I turn it into a rule
            js_parser = new nearley.Parser(grammar.ParserRules, grammar.ParserStart);
            rule_parsings=js_parser.feed(str_form_of_rule).results;
            if(rule_parsings.length==0)return undefined;
            var str_form_of_expr=eval(basic_attempt.captured_vars.expr);
            var attempt=lark.exec_lark("out",rules.concat([eval(rule_parsings[0])(lark)]))(str_form_of_expr);
            if(attempt.matches){
              return attempt.captured_vars.out;
            }else{
              return undefined;
                //ummm... post proccessing fail?
            }
          }));


//ADD WITH FUNCTION
// rules.push({match:concat_rules(lit('(with '),
//                               named_rule("rule",lit(/([^=]|"\\=")*"="([^=]|"\\=")*"\n"/),)//pretty basic
//                             )
//                           });
var lark_parser=lark.exec_lark("output",rules);
console.log(lark_parser('(with "0=1" "0")'));
