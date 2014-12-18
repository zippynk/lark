var lark = require("./core_parser.js");
function js_lit(lit_type){
  return func_to_parser(function(x){
    //this is purely temporary
    try{
      var attempt=JSON.parse(a);
      //this does work actually.... I'm gonna hope this is fast enough
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
$string:a
=named_parser()
is really a parser that will check a is of the form String(Lit(asdasdas)) and
if it is will parse it to that same value...
//how do rule executions take place???
// well... they are treated just the same as anything else...
// just with the var expression added on I guess (the var is the recursion
// rule technicly)... vars match whatever .... but what kinda rule am I gonna
// have in it? well...
// wait, why is the rule the main type? I should think about this... there is
// something for having string or data as the base type... in fact I may do just
// that... lets make string the main type I think.... yeah... that is definitely
// Nice... so, type checking on string itself will be weird but too bad...
// So the rule type? well, it will have to technicaly be a type
// yeah, I like the idea of string as the only base type.... so how will numbers
// be compiled? well...
//since no space... but won't this cause problems when there is a space??...
//well... I can make initially thing just concataned strings... meaning symbols
//... okay so... ... wait, not string... syms really? I guess... well... sym
// is all I actually need... but than lack of " enforcment may cause a problem
// I could probaly make this work.... nah, lets do strings... so...
// (with ($x0=) (with ($x1=) $x))// I could do this with just syms type of checking
//but that would be boring.... wait... do I even like this??? I feel like I am
// trying to force some weird type of lexing on to my language that probaly
// doesn't have to be here... yeah...
// Number($x)String(0) continue.... hmmm... so, how do I deal with whitespace?
// well.... I could allow some sort of flag that says whether a rule is
// whitespace strict or not... the number rule may happen later
// so.... whitespace will have to be optional? yeah, output would be taken
// literally... so... than it would work I guess.... yeah...
// $x is equivlent too expr($string:x) where $string:x is the real
// deal ,aka $string:[varname] will be the fundemental matcher... (or something)
// like it will be                          basicly a slash ends it early
// literal:Number($string:x)0=Number($string:x+"0")

//so... I need a rule() type thing
//than I need to have compilers of types...
//first for strings
