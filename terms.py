from lark_utils import Fail,dict_union
class lit:
    def __init__(self, val):
        self.val = val

    def match(self, x):
        # so.... nah... no execing needed?
        if isinstance(x, lit) and self.val == x.val:
            return {}
        else:
            return Fail
    def sub(self, matched_dict):
        return self

    def __repr__(self):
        return self.val
    def exe(self,exprs):
        return self

class expr:
    normal = False

            # lazy exec sets everything on lazy mode so when
    def exe_parts(self,exprs):
        return self
    def lazy_exe(self, x, exprs):
        return x
    def exe_normal(self, exprs):
        current = self
        for input_form, output_form in exprs:
            current = input_form.lazy_exe(current, exprs)
            attempt = input_form.match(current)
            if attempt != Fail:
                attempt = output_form.sub(attempt)
                if attempt == self:
                    return attempt
                else:
                    return attempt.exe(exprs)
        assert("I should not be here" == False) # bad style?
    def exe(self, exprs): # should memoize after normal
        if self.normal:
            return self
        # its the exe parts... ideally that would load the parts with something and someone attempting to matched would attempt it
        # so... lazy exe parts loads with exprs that will be activated during seq
        ret = self.exe_normal(exprs) #removed .exe_parts(exprs)
        ret.normal = True
        return ret

    def match(self, x):
        return Fail
    def sub(self, matched_dict):
        return self

class wild(expr):
    def __init__(self, name):
        self.name = name

    def match(self, x):
        if isinstance(x, expr):
            ret = {}
            ret[self.name] = x
            return ret
        else:
            return Fail

    def sub(self, matched_dict):
        if self.name in matched_dict:
            return matched_dict[self.name]
        return self
    def exe(self, exprs): # is this okay?
        return self
    def __repr__(self):
        return self.name

class seq(tuple, expr):
    def exe_parts(self, exprs):
        return seq([i.exe(exprs) for i in self])
    def lazy_exe(self, x, exprs): # I think this works?
        if isinstance(x, seq) and len(x) == len(self): # this should report back
            ret = ()
            for my_term, input_term in zip(self, x):
                if True or (not isinstance(my_term, wild)) or (my_term.match(input_term) == Fail): # does not work, need a way to cause it to finalize
                    ret+=(input_term.exe(exprs),)
                else:
                    ret+=(input_term,)

            return seq(ret)
        else:
            return x
    def match(self, x):
        if isinstance(x, seq) and len(self) == len(x):
            matched_dicts = tuple(match_term.match(term) for match_term, term in zip(self, x))

            if Fail in matched_dicts:
                return Fail
            else:
                return dict_union(matched_dicts)

        else:
            return Fail

    def sub(self, matched_dict):
        return seq(i.sub(matched_dict) for i in self)

class builtin_func(wild):

    def __init__(self, func):
        self.func = func

    def sub(self, matched_dict):
        return self.func(matched_dict)

class pattern_wild(wild):
    def __init__(self, name, pattern):
        self.pattern = pattern
        self.name = name

    def match(self, x):
        # if isinstance(x,lit) or (isinstance(x, seq) and all(isinstance(i, lit) for i in x)):
        #     if isinstance(x,lit):
        #         str_val = x.val
        #     else:
        #         str_val = "".join(str(i.val) for i in x)
        attempt = self.pattern(x)
    #    print attempt, str_val
        if attempt != Fail: # Fail
            ret = {}
            ret[self.name] = attempt
            return ret
        else:
            return Fail
