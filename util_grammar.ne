parser -> left "=" right {% function(d){return eval("(function(lark){return {parse:"+d[0]+",postprocessor:"+d[2]+"};})");} %}
left -> (charL | wildL):* {% function(d){return "lark.concat_parsers(["+d[0].join(",")+",])";} %}
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
