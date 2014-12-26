func -> left "=" right {%function(){
  var core_parser=require("./core_parser");

  return function(d){
    return eval("(function(scope){return core_parser.parts_to_rule("+d[0]+","+d[2]+");})");
    }
  }() %}
left -> (charL | wildL):* {% function(d){return "core_parser.concat_parsers(["+d[0].join(",")+",])";} %}
wildL -> "$" [a-zA-Z]:+ {% function(d){return "scope.to_named_parser('"+d[1]+"')";} %}
charL -> [^$=\\\n'] {% function(d){return "core_parser.lit('"+d[0]+"')";} %}
      | "\\$" {% function(d){return "core_parser.lit('"+"$"+"')";} %}
      | "\\=" {% function(d){return "core_parser.lit('"+"="+"')";} %}
      | "\\n" {% function(d){return "core_parser.lit('"+"\\n"+"')";} %}
      | "'" {% function(d){return 'core_parser.lit("\'")';} %}
right -> (charR | wildR):* {% function(d){return "function(captured_vars){return "+d[0].join("+")+";}";} %}
wildR -> "$" [a-zA-Z]:+ {% function(d){return "captured_vars."+d[1];} %}
charR -> [^$=\\\n'] {% function(d){return "'"+d[0]+"'";} %}
      | "\\$" {% function(d){return "'$'";} %}
      | "\\=" {% function(d){return "'='";} %}
      | "\\n" {% function(d){return "'\\n'";} %}
      | "'" {% function(d){return '"\'"';} %}
