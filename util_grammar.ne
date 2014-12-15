rule -> left "=" right {% function(d){return (function(lark){return {match:d[0],postprocessor:d[2]};});} %}
left -> (charL | wildL):* {% function(d){return function(){lark.concat_rules(d[0]);}} %}
wildL -> "$" [a-zA-Z]:+ {% function(d){return function(){lark.exec_lark(d[1]);}} %}
charL -> [^$=\\\n] {% function(d){return function(){lark.lit(d[0]);};} %}
      | "\\$" {% function(d){return function(){lark.lit("$");} %}
      | "\\=" {% function(d){return function(){lark.lit("=");}} %}
      | "\\n" {% function(d){return function(){lark.lit('\n')";};} %}
right -> (charR | wildR):* {% function(d){return function(captured_vars){return d[0].+";}";} %}
wildR -> "$" [a-zA-Z]:+ {% function(d){return function(){captured_vars.[d[1]]};} %}
charR -> [^$=\\\n] {% function(d){return d[0];} %}
      | "\\$" {% function(d){return "$";} %}
      | "\\=" {% function(d){return "=";} %}
      | "\\n" {% function(d){return "\n";} %}
