var lark = require("./interpreter.js");
function js_lit(lit_type){
  return rule_from_func(function(x){
    //this is purely temporary
    try{
      var attempt=JSON.parse(a);
      if(typeof attempt=="string"){
        return attempt;
      }
      return undefined;
    }
    catch(e){
      return undefined;
    }
  });
}
var js_string=js_lit("string")

var def_parser ={
                  parse:lark.concat_parsers(left,lark.lit("="),right),
                  postprocessor:function(captured_vars){

                    return captured_vars;}
                };



match-> or_parsers(named_parser("c",charL),named_parser("w",wildL))
(charL | wildL):* {% function(d){return "lark.concat_parsers(["+d[0].join(",")+",])";} %}
wildL -> "$" [a-zA-Z]:+ {% function(d){return "lark.exec_lark('"+d[1]+"')";} %}
charL -> [^$=\\\n'] {% function(d){return "lark.lit('"+d[0]+"')";} %}
| "\\$" {% function(d){return "lark.lit('"+"$"+"')";} %}
| "\\=" {% function(d){return "lark.lit('"+"="+"')";} %}
| "\\n" {% function(d){return "lark.lit('"+"\\n"+"')";} %}
| "'" {% function(d){return 'lark.lit("\'")';} %}
right -> (charR | wildR):* {% function(d){return "function(captured_vars){return "+d[0].join("+")+";}";} %}
wildR -> "$" [a-zA-Z]:+ {% function(d){return "captured_vars."+d[1];} %}
charR -> [^$=\\\n'] {% function(d){return "'"+d[0]+"'";} %}
| "\\$" {% function(d){return "'$'";} %}
| "\\=" {% function(d){return "'='";} %}
| "\\n" {% function(d){return "'\\n'";} %}
| "'" {% function(d){return '"\'"';} %}
