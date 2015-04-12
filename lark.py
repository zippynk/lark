#!/usr/bin/env python
# -*- coding: utf-8 -*-
# <nbformat>3.0</nbformat>

# <codecell>

import re, parse,sys, collections
def validity(x):
    level = 0
    for i in x:
        if i == "\x01":
            level +=1
        if i == "\x02":
            level -=1
        if level < 0:
            return False
    return level == 0

def level(raw_string, start,end):
    level = 0
    for i in raw_string[:start]:
        if i == "\x01":
            level +=1
        if i == "\x02":
            level -=1
        if level < 0:
            return False
    for i in raw_string[start:end]:
        if level == 0:
            return True
        if i == "\x01":
            level +=1
        if i == "\x02":
            level -=1
        if level < 0:
            return False
    return level==0


# <codecell>

def process_raw(raw_input_form):
    adding = True
    processed_form = "{:escaped}"
    for i in raw_input_form:
        processed_form += i
        if adding  and i == "{":
            adding = False
        elif (not adding) and i == "}":
            adding = True
            processed_form += "{:escaped}"
        elif adding:
            processed_form += "{:escaped}"
    return processed_form

def sys_pattern(raw_input_form, output_func):

    # { } should become something else??? $ should become brackets?
    p = re.compile(r"\{:([^}]+)\}") #prevents colons ... so other wacko types are allowed
    input_form = p.sub("\x01\\1\x02",raw_input_form)
    p_2 = re.compile(r"\{([^}:]+)\}") #prevents colons ... so other wacko types are allowed

    input_form = p_2.sub("{\\1:expr}",input_form)
    input_form = process_raw(input_form)
    # something that matches any matchable would be good... just saying
    parser = parse.compile(input_form, base_types)
    # may change........

    def pattern(x):
        attempt = parser.parse(x)
        if attempt != None:
          #  print "attempt worked",x,output_func(**attempt.named),input_form
            return output_func(**attempt.named)
        else:
            return None
    return pattern

def make_pattern(raw_input_form, output_form):
    return sys_pattern(raw_input_form, output_form.format)



base = "\x01[^\x01\x02]*\x02"
for i in range(10):
    base = base.replace("[^\x01\x02]*","(?:(?:\x01[^\x01\x02]*\x02)?[^\x01\x02])*")

@parse.with_pattern(base)
def expr_pattern(raw_string):
    if not validity(raw_string):
        return "\x03"
    return raw_string




@parse.with_pattern("((-)?[0-9]+)|(\x01(-)?[0-9]+\x02)")
def int_pattern(raw_string):
    if "\x01" in raw_string:
        return raw_string[1:-1]
    return raw_string

@parse.with_pattern("[\x01\x02]*")
def escaped_pattern(raw_string):
    return ""

base_types = {"expr" : expr_pattern,
              "int"  : int_pattern,
              "escaped" : escaped_pattern}

base_exprs = [sys_pattern("{x:int}-{y:int}",lambda x,y:str(int(x)-int(y))),
              sys_pattern("{x:int}+{y:int}",lambda x,y:str(int(x)+int(y))),
              sys_pattern("{x:int}*{y:int}",lambda x,y:str(int(x)*int(y))),
              sys_pattern("{x:int}/{y:int}",lambda x,y:str(int(x)//int(y))),
              make_pattern("{x:int}","{x}"),
              make_pattern("-0","0"),
              make_pattern("({x})","{x}")]




def parse_expr_with_list(x,exprs):
    # so... repeal last one when another thing is found
    #first get all
    done = [x]
    strings = [((i,),x) for i in range(len(exprs))]
    while strings:
        place, current_str = strings.pop()
        #print place[:-1], current_str,`current_str`.replace("\\x01","{").replace("\\x02","}")
        expr = exprs[place[-1]]
        for l in range(1,len(current_str)+1):
            for start in range(len(current_str)-l+1):
                end = start + l # correct end index
                test_str = current_str[start:end]
            #    print `test_str`,"HELLO"
                if (not validity(test_str)) or \
                (start>0 and current_str[start-1]== "\x01" and end<len(current_str) and current_str[end] == "\x02") or\
                not level(current_str,start,end) :
                        #                 (test_str[0] == "\x01" and validity(test_str[1:-1])) or\
#                     or (not validity(current_str[:start])) or (not validity(current_str[end:])) :
                    continue
                    #should pass

                attempt = expr(test_str)

                if attempt != None and "\x03" not in attempt:

                  #  attempt = parse_expr_with_list(attempt,exprs)

                    if l == len(current_str):
                        return attempt #not inside \x01 and \x02 ?
#                     attempt = attempt.replace("\x01","").replace("\x02","")
#                     attempt = "\x01%s\x02"%attempt
                    if attempt[0] != "\x01" or (not validity(attempt[1:-1])):
                        #removal could have gone wrong
                        attempt = "\x01%s\x02"%attempt
                    # print attempt[1:-1].replace("\x01","{").replace("\x02","}")
                    attempt = parse_expr_with_list(attempt[1:-1],exprs)
                    if attempt[0] != "\x01" or (not validity(attempt[1:-1])):
                        #removal could have gone wrong
                        attempt = "\x01%s\x02"%attempt
                    to_add = current_str[:start]+attempt + current_str[end:]

                    if to_add not in done:
                        #return to_add
                        done.append(to_add)
                        for i in range(len(exprs)):
                            strings.append((place+(i,),to_add))
    return x

#         for index,expr in enumerate(exprs):
#             for l in range(1,len(current_str)+1):
#                 for start in range(len(current_str)-l+1):
#                     end = start + l # correct end index
#                     test_str = current_str[start:end]
#                     attempt = expr(test_str)
#                     if attempt != None:
#                         if l == len(current_str):
#                             return attempt #not inside \x01 and \x02 ?

#                         to_add = current_str[:start]+"%s"%attempt + current_str[end:]
#                         #heapq.heappush(strings,((i,)+place,to_add))
#                         if to_add not in strings:
#                             strings.append(to_add)


#    return None

def parse_expr(x,expr_dict):
    rules = base_exprs +[make_pattern(i,expr_dict[i]) for i in expr_dict]
    #print rules.reverse()
    return parse_expr_with_list(x,rules)

def exec_rules(x,rules):
    for i in range(100):
        old = x
        x = parse_expr(x, rules)
      #  x = x.replace("\x01","").replace("\x02","")
        #print "HERE",x.replace("\x01","{").replace("\x02","}")
        if x == old:
            return old.replace("\x01","").replace("\x02","")
    return None

def exec_text(x):
    rules = collections.OrderedDict({})
    for line in x.split("\n"):
        printer_on = False
        if line.startswith("print "):
            printer_on = True
            line = line[6:]
        attempt = parse.parse("{x}={y}",line)
        if attempt != None:
            rules[attempt["x"]] = attempt["y"]
        else:
            ret = exec_rules(line,rules)
            if printer_on:
                print ret
    return rules

def main():
    if len(sys.argv) == 1:
        print "At least one argument needed"
    else:
        text = ""
        for f in sys.argv[1:]:
            opened_file = open(f)
            text += opened_file.read().strip()+"\n"
            opened_file.close()
        text = text[:-1]
        exec_text(text)

if __name__ == "__main__":
    main()


# <codecell>



# rules = collections.OrderedDict({})
# rules["({x})"] = "{x}"
# rules["f({x:int})"] = "f({x}-1)+f({x}-2)"
# rules["f(1)"] = "1"
# rules["f(2)"] = "1"
# rules["{x}*{y}"] = "{x}*({y}-1)+{x}"
# rules["{x:int}*0"] = "0"

# rules["Empty"] = "Empty"
# rules["List({a},{b})"] = "List({a},{b})"
# rules["{x:int}"] = "{x}"
# rules["[{a}]"] = "List({a},Empty)"
# rules["[]"] = "Empty"  # 0 is used as place holder for null
# rules["Empty+List({a},{b})"] = "List({a},{b})"
# rules["List({a},{b}).append({c})"]="List({a},{b})+[{c}]"
# rules["Empty.append({c})"]="[{c}]"
# rules["[{a},"] = "[{a}]::"
# rules["{a}::{b},"]="({a}.append({b}))::"
# rules["{a}::{b}]"]="({a}.append({b}))"
# rules["List({a},{b})+Empty"] = "List({a},{b})"
# rules["List({a},{b})+List({c},{d})"] = "List({a},{b}+List({c},{d}))"



# inp ="{List({2},{List({3},{Empty})})}+{List({4},{Empty})}"
# inp = inp.replace("{","\x01").replace("}","\x02")
# exec_rules("[2*3,3,4,5]",rules)




# <codecell>
