import parse_expr
from lark_utils import Fail
def pre_parse_rules(raw_rules):
    rules = []
    for i in range(len(raw_rules)):
        trying_form, trying_out = raw_rules.pop()
        attempt_form = parse_expr.parse_expr(trying_form, map(lambda i:(i[0],i[0]),rules+raw_rules)) #include raw forms instead?
        if attempt_form == Fail:
            rules.append((trying_form, trying_out))
        else:
            rules.append((attempt_form, trying_out))
    return rules

def order_rules(rules):
    ret = []
    while rules:
        current= rules.pop()
        if not any((current[0].match(i[0]) != Fail and i[0].match(current[0]) == Fail) for i in rules):
            ret.append(current)
        else:
            rules = [current] + rules
    ret.reverse()
    return ret
def parse_rules(raw_rules):
    return post_parse_rules(order_rules(pre_parse_rules(raw_rules)))

def post_parse_rules(sorted_rules):
    rules = []
    for i in range(len(sorted_rules)):
        trying_form, trying_out = sorted_rules.pop()
        attempt_out = parse_expr.parse_expr(trying_out, rules+sorted_rules+[(trying_form,trying_form)]) #include raw forms instead?
        if attempt_out == Fail:
#             if trying_out.match(trying_form) != Fail and trying_form.match(trying_out) != Fail:
#                 rules.append((trying_form, Final))
#           else:
            rules.append((trying_form.exe_parts(rules+sorted_rules+[(trying_form,trying_form)]), trying_out))
        else:
#             if attempt_out.match(trying_form) != Fail and trying_form.match(attempt_out) != Fail:
#                 rules.append((trying_form, Final))
#           else:
            rules.append((trying_form.exe_parts(rules+sorted_rules+[(trying_form,trying_form)]), attempt_out))
    return rules
