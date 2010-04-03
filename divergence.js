// Divergence Javascript library | Spencer Tipping <spencer@spencertipping.com>
// Licensed under the terms of the MIT source code license

  Function.prototype.fn = (function (c) {return function () {var f = this, xs = c.call (arguments);
                                                             return function () {return f.apply (this, xs.concat (c.call (arguments)))}}}) (Array.prototype.slice);

  String.prototype.fn = (function (c, parse) {return function () {var f = c[this] || (c[this] = eval (parse (this))); return f.fn.apply (f, arguments)}})
                        ({}, function (s) {return 'function(_){return ' + s.replace (/</g,              '(function(_){return ').
                                                                            replace (/>/g,              '})').
                                                                            replace (/([^_]|^)(\d+)/g,  function (q, d, n) {return d + 'arguments[' + n + ']'}).
                                                                            replace (/_([^\w ])/g,      function (q, x)    {return x}) + '}'});

  var def     = function (o, ks) {for (var k in ks) o[k] = ks[k]; o};
  var english = {};

  english.canonical_operator_names = {plus: '+', minus: '-', times: '*', over: '/', modulo: '%', and: '&&', or: '||', bitwise_and: '&', bitwise_or: '|', xor: '^', then: ','};
  english.canonical_conditionals   = {when: '~and', unless: '~or', before: 'then', after: '~then'};
  english.canonical_mappings       = {across: '~map', collapsing: '~fold'};

  for (var k in english.canonical_operator_names) {     
    String.prototype[k]   = '("(" + this + ")" + _ + "(" + 1 + ")").fn()'.fn (english.canonical_operator_names[k]);
    Function.prototype[k] = '0.apply (this, arguments)'[k]('1.apply (this, arguments)').fn ();
  }

  def (Function.prototype, {o: '<0.apply (this, [1.apply (this, arguments)])> (this, 0)'.fn()});
