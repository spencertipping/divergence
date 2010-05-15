// Divergence core library | Spencer Tipping <spencer@spencertipping.com>
// Licensed under the terms of the MIT source code license

var d = (function () {
  var d = function () {return d[d.default_action].apply (this, arguments)};
  d.init = function (o) {for (var i = 1, l = arguments.length, $_; $_ = arguments[i], i < l; ++i) if ($_.call && $_.call.apply) $_.call (o);
                                                                                                  else                          for (var k in $_) o[k] = $_[k]; return o};
  d.init (d, {inline_macros:  [],            id: function    (x) {return x},
                functionals:  [],           arr: function    (o) {return Array.prototype.slice.call (o)},
                    aliases:  {},           map: function (o, f) {var x = {}; d.keys (o).each (function (k) {d.init (x, f (k, o[k]))}); return x},
             default_action: 'init',       keys: function    (o) {var xs = []; for (var k in o) o.hasOwnProperty (k) && xs.push (k); return xs},
      functional_extensions:  {},     functions: function     () {var as = d.arr (arguments); return d.functionals.each (function (p) {d.init.apply (this, [p].concat (as))}), d},
                                   macro_expand: function    (s) {d.inline_macros.each (function (m) {s = m(s)}); return s},
                                          alias: function (s, f) {d.aliases[s] = f.fn(); return d},
                                          macro: function (r, f) {d.inline_macros.push (r.maps_to (f)); return d}});

  d (String.prototype, (function (c) {return {maps_to: function (v) {var result = {}; result[this] = v; return result},
                                               lookup: function  () {return '[$1].concat ($0.split(".")).fold("[]")'.fn(this)},
                                                alias: function (f) {return d.alias (this, f)},
                                                   fn: function  () {var s = d.macro_expand (this), f = d.aliases[s] || c[s] || (c[s] = eval ('(function(){return ' + s + '})'));
                                                                     return f.fn.apply (f, arguments)}}}) ({}));

  d (RegExp.prototype, {maps_to: function (f) {var s = this; return function (x) {return x.replace (s, f)}},
                          macro: function (f) {return d.macro (this, f)},
                             fn: function  () {var f = this.exec.bind (this); return f.fn.apply (f, arguments)}});

  d (Array.prototype, {flat_map: function (f) {var xs = [], f = f.fn(); this.each (function (x) {xs.push.apply (xs, f(x))}); return xs},
                        sort_by: function (f) {return this.sort ('$0($1) < $0($2)'.fn (f.fn()))},
                           each: function (f) {f = f.fn(); for (var i = 0, l = this.length; i < l; ++i) f (this[i]); return this},
                           grep: function (f) {var xs = [], f = f.fn(); for (var i = 0, l = this.length; i < l; ++i) f (this[i]) && xs.push (this[i]); return xs},
                           fold: function (f) {var x = this[0], f = f.fn(); for (var i = 1, l = this.length; i < l; ++i) x = f (x, this[i]); return x},
                            map: function (f) {var xs = [], f = f.fn(); for (var i = 0, l = this.length; i < l; ++i) xs.push (f (this[i])); return xs},
                             fn: function  () {var xs = this, f = function () {return xs.map ('$1.fn().apply($_,$0)'.fn (arguments))}; return f.fn.apply (f, arguments)}});

  d (Function.prototype, {fn: function () {var f = this, xs = d.arr (arguments); return xs.length ? function () {return f.apply (this, xs.concat (d.arr (arguments)))} : f}});
  d  (Boolean.prototype, {fn: function () {return this.valueOf () ? d.id.fn.apply (d.fn, arguments) : (1).fn ()}});
  d   (Number.prototype, {fn: function () {var x = this, f = function () {return arguments[x]}; return f.fn.apply (f, arguments)}});

  /\$(\d+)/g.macro ('"arguments[" + arguments[1] + "]"'.fn());
       /@_/g.macro ('Array.prototype.slice.call(arguments)');
      /\$_/g.macro ('this');

  (d.functionals = [Array, Number, Boolean, Function, String, RegExp].map ('$0.prototype')).push (d.functional_extensions);

  (function (fns, ops) {d.keys (fns).each ('$1.alias($0[$1])'.fn (fns));
                        d.keys (ops).each (function (k) { ops[k]       .alias ( k       .alias (eval ('(function(x,y){return x'                                              + ops[k] + 'y})')));
                                                         (ops[k] + '$').alias ((k + '$').alias (eval ('(function(f,g){return function(){return f.fn().apply(this,arguments)' + ops[k] +
                                                                                                                                              'g.fn().apply(this,arguments)}})')))})}) (
    {'()':'$0($1)', '[]':'$0[$1]', '!':'!$0', '!!':'!!$0', '~':'~$0'},
    {plus:'+', minus:'-', times:'*', over:'/', modulo:'%', lt:'<', gt:'>', le:'<=', ge:'>=', eq:'==', ne:'!=', req:'===', rne:'!==', and:'&&', or:'||', xor:'^', bitand:'&', bitor:'|', then:','});

  d.functions ({
    prototype:  function  () {var f = this.fn(), g = function () {f.apply (this, arguments)}; d.init.apply (this, [g.prototype].concat (d.arr (arguments))); return g},
      compose:  function (g) {var f = this.fn(); g = g.fn(); return function () {return f (g.apply (this, arguments))}},
       plural:  function  () {return '$1.map ($0)'.fn(this)},
        curry:  function (n) {var f = this.fn(); return n > 1 ? function () {var as = d.arr(arguments); return function () {return f.curry (n - 1).apply (this, as.concat (d.arr (arguments)))}} : f},
        proxy:  function (g) {var f = this.fn(); return g ? function () {return f.apply.apply (f, g.fn() (this, arguments))} : function () {return f.apply (this, arguments)}},
         bind:  function (x) {var f = this.fn(); return d.init (function () {return f.apply (x, arguments)}, {binding: x, original: f})},
         type:  function  () {var f = function () {}, c = this.fn(); d.init.apply (this, [f.prototype].concat (d.arr (arguments))); return function () {return c.apply (new f(), arguments)}},
         tail: '[$_, @_]'.fn(),
          cps:  function (c) {var cc = [this.fn(), [c = (c || d.id).fn().proxy()]]; while (cc[0] !== c) cc = cc[0].fn().apply (this, cc[1]); return c.apply (this, cc[1])}});

  return d}) ();