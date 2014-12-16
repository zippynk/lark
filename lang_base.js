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
//so... wilds, need to be a type.... really they are var()
//so.... everything and do conversions...
//so, also... we need to tokenize things...namely strings and numbers ....
//so...
