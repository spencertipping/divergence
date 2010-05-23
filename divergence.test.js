// Divergence core unit tests | Spencer Tipping <spencer@spencertipping.com>
// Licensed under the terms of the MIT source code license

// Divergence core library | Spencer Tipping <spencer@spencertipping.com>
// Licensed under the terms of the MIT source code license

var d = (function () {
  var c = {}, d = function () {return d[d.default_action].apply (this, arguments)};
  d.init = function (o) {for (var i = 1, l = arguments.length, $_ = null; $_ = arguments[i], i < l; ++i) if ($_.call && $_.call.apply) $_.call (o);
                                                                                                         else                          for (var k in $_) $_.hasOwnProperty (k) && (o[k] = $_[k]); return o};
  d.init (d, {inline_macros:  [],            id: function    (x) {return x},
                functionals:  [],           arr: function    (o) {return Array.prototype.slice.call (o)},
      functional_extensions:  {},           map: function (o, f) {var x = {}; d.keys (o).each (function (k) {d.init (x, f (k, o[k]) || {})}); return x},
             default_action: 'init',       keys: function    (o) {var xs = []; for (var k in o) o.hasOwnProperty (k) && xs.push (k); return xs},
                                      functions: function     () {var as = d.arr (arguments); return d.functionals.each (function (p) {d.init.apply (this, [p].concat (as))}), d},
                                   macro_expand: function    (s) {return d.inline_macros.fold (function (s, m) {return m(s)}, s)},
                                          alias: function (s, f) {d.aliases[s] = f.fn(); return d},
                                          macro: function (r, f) {d.inline_macros.push (r.maps_to (f)); c = {}; return d},
                                          trace: function    (x) {d.tracer && d.tracer (d.arr (arguments).join (', ')); return x}});

  d (String.prototype, {maps_to: function (v) {var result = {}; result[this] = v; return result},
                         lookup: function  () {return '$0.split(".").fold("$0[$1]", $1)'.fn(this)},
                          alias: function (f) {return d.alias (this, f)},
                           fail: function  () {throw new Error (this.toString())},
                             fn: function  () {var s = this.toString(), f = c[s] || (c[s] = eval ('(function(){return ' + d.macro_expand(s) + '})')); return f.fn.apply (f, arguments)}});

  d (RegExp.prototype, {maps_to: function (f) {var s = this; return function (x) {return x.replace (s, f)}},
                          macro: function (f) {return d.macro (this, f)},
                             fn: function  () {var f = this.exec.bind (this); return f.fn.apply (f, arguments)}});

  d (Array.prototype, {flat_map: function (f) {var xs = [], f = f.fn(); this.each (function (x) {xs.push.apply (xs, f(x))}); return xs},
                        sort_by: function (f) {return this.sort ('$0($1) < $0($2)'.fn (f.fn()))},
                           each: function (f) {f = f.fn(); for (var i = 0, l = this.length; i < l; ++i) f (this[i]); return this},
                           grep: function (f) {var xs = [], f = f.fn(); for (var i = 0, l = this.length; i < l; ++i) f (this[i]) && xs.push (this[i]); return xs},
                           fold: function (f) {var f = f.fn(), xl = arguments.length, x = xl > 1 ? arguments[1] : this[0];
                                               for (var i = 2, l = xl + this.length; i < l; ++i) x = f (x, i < xl ? arguments[i] : this[i - xl]); return x},
                            map: function (f) {var xs = [], f = f.fn(); for (var i = 0, l = this.length; i < l; ++i) xs.push (f (this[i])); return xs},
                             fn: function  () {var xs = this, f = function () {return xs.map ('$1.fn().apply($_,$0)'.fn (arguments))}; return f.fn.apply (f, arguments)}});

  d (Function.prototype, {fn: function () {var f = this, xs = d.arr (arguments); return xs.length ? function () {return f.apply (this, xs.concat (d.arr (arguments)))} : f}});
  d  (Boolean.prototype, {fn: function () {return this.valueOf () ? d.id.fn.apply (d.fn, arguments) : (1).fn ()}});
  d   (Number.prototype, {fn: function () {var x = this, f = function () {return arguments[x]}; return f.fn.apply (f, arguments)}});

               /^\./ .macro ('(arguments[0] || this).');
                /@_/g.macro ('Array.prototype.slice.call(arguments)');
               /\$_/g.macro ('this');
           /\$(\d+)/g.macro ('"arguments[" + arguments[1] + "]"'.fn());
            /@(\w+)/g.macro ('"this." + $1'.fn());

  /\{\|([\w,\s]+)\|/g.macro ('"(function(" + $1 + "){return "'.fn()); /\|\}/g.macro ('})');
              /\{\</g.macro ('(function(){return ');                  /\>\}/g.macro ('})');

  (d.functionals = [Array, Number, Boolean, Function, String, RegExp].map ('.prototype')).push (d.functional_extensions);

  d.functions ({
      compose:  function (g) {var f = this.fn(); g = g.fn(); return function () {return f (g.apply (this, arguments))}},
 flat_compose:  function (g) {var f = this.fn(); g = g.fn(); return function () {return f.apply (this, g.apply (this, arguments))}},
        curry:  function (n) {var f = this.fn(); return n > 1 ? function () {var as = d.arr(arguments); return function () {return f.curry (n - 1).apply (this, as.concat (d.arr (arguments)))}} : f},
        proxy:  function (g) {var f = this.fn(); return g ? function () {return f.apply.apply (f, g.fn() (this, arguments))} : function () {return f.apply (this, arguments)}},
         bind:  function (x) {var f = this.fn(); return d.init (function () {return f.apply (x, arguments)}, {binding: x, original: f})},
         type:  function  () {var f = function () {}, c = this.fn(); f = f.ctor.apply (f, arguments); return function () {return c.apply (new f(), arguments)}},
         ctor:  function  () {var f = this.fn(), g = function () {f.apply (this, arguments)}; d.init.apply (this, [g.prototype].concat (d.arr (arguments))); return g},
         tail: '[$_.fn(), arguments]'.fn(),
          cps:  function (c) {var cc = [this.fn(), [c = (c || d.id).fn().proxy()]]; while (cc[0] !== c) cc = cc[0].fn().apply (this, cc[1]); return c.apply (this, cc[1])}});

  return d}) ();

// Unit test utilities.

  var assert       = function (x, msg) {if (! x) throw new Error ("Assertion failed: " + msg)};
  var assert_equal = function (x, y, msg) {x === y || assert (x === y, msg + ' -- ' + x.toString () + ' !== ' + y.toString ())};
  var trace        = function (x) {print (x); return x};

// String tests.

  assert_equal ('foo'.maps_to ('bar').foo, 'bar', 'String.maps_to');
  assert_equal (d.macro_expand ('$_'), 'this', 'String.expand');

  assert_equal ('@foo'.fn().call ({foo: 'bar'}), 'bar', 'Ruby-style this accessors');

// Array method tests.

  assert_equal ([1, 2, 3].fold ('$0 + $1', 4, 5, 6), 21, 'Variadic Array.fold with 3');
  assert_equal ([1, 2, 3].fold ('$0 + $1', 4),       10, 'Variadic Array.fold');
  assert_equal ([1].fold ('$0 + $1'),                 1, 'Unary Array.fold');

// Function tests.

  var add = '@_.fold("$0 + $1")'.fn();
  assert_equal (add (1, 2, 3, 4, 5), 15,               'Fold over operator name');
  assert_equal (add.curry (2) (1, 2) (3, 4, 5), 15,    'Function curry');
  assert_equal (add.curry (5) (1) (2) (3) (4) (5), 15, 'Function curry');

  assert_equal (d.macro_expand ('{|xs| xs[0] + xs[1] |}'), '(function(xs){return  xs[0] + xs[1] })', 'Enclosed function macroexpansion');
  assert_equal ('{|x, y, z| x + y + z |}.fn ($0, $1)'.fn() (1, 2) (3), 6, 'Enclosed functions');
  assert_equal ('{|x, y, z, t| x + y + z * t |}'.fn() () (1, 2, 3, 4), 15, 'Enclosed functions');

  assert_equal ('$0.map ({<$0 + 1>})'.fn () ([1, 2, 3]).join (','), '2,3,4', 'Enclosed nullary functions');

  assert_equal ('$0.tail(5)'.cps ('$0'), 5, 'Function.cps');

  var factorial_cps = '$0 > 1 ? factorial_cps.tail ($0 - 1, $0 * $1, $2) : $2.tail ($1)'.fn ();         // factorial_cps (n, accumulator, continuation)
  assert_equal (factorial_cps.fn (5, 1).cps ('$0'), 120, 'Function.cps 2');

  var sum = '$0 > 0 ? sum.tail ($0 - 1, $0 + $1, $2) : $2.tail ($1)'.fn ();
  assert_equal (sum.fn (10000, 0).cps (), (10000 * 10001) >> 1, 'Function.cps 3');                      // Runs in constant stack space

  var c = '@foo = "bar"'.fn().ctor ({get_foo: '@foo'.fn()});
  var i = new c ();
  assert_equal (i.get_foo(), 'bar', 'Function.ctor');

// Re-entrant continuation tests.
// In Scheme, you can emulate /return/ like this:

//   | (call/cc (lambda (return)
//       ...
//       (return 5)
//       ...
//       ))

// This expression will result in the value 5, because the /return/ continuation escaped and bypassed other execution in the lambda body. We can't do quite that well, but we can come close. The
// only difference is that the call/cc must be a tail call, so instead of something like above, we now have:

//   | (call/cc (lambda (...)) (lambda (result) ...))

// This ends up being a delimited continuation.

// You can implement re-entrant continuations in JavaScript as long as you make all call/cc invocations tail calls. (This is normal CPS anyway.) Here's how you use it (naturally, normal caveats
// about code readability apply even though this isn't Scheme):

  var factorial_cps_2 = '$0 > 1 ? factorial_cps_2.tail ($0 - 1, $0 * $1, $2) : $2.tail ($2)'.fn ();     // Returns its continuation
  factorial_cps_2.count = 0;
  assert_equal (factorial_cps_2.fn (5, 1).cps ('$0.cc || ($0.cc = $1), ++$0.count'.fn (factorial_cps_2)), 1, 'Function.cps re-entrant 1');
  assert_equal (factorial_cps_2.cc (), 2, 'Function.cps re-entrant 2');
  assert_equal (factorial_cps_2.cc (), 3, 'Function.cps re-entrant 3');
  assert_equal (factorial_cps_2.cc (), 4, 'Function.cps re-entrant 4');