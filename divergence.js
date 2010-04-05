// Divergence Javascript library | Spencer Tipping <spencer@spencertipping.com>
// Licensed under the terms of the MIT source code license

var d = (function () {
  // Memoized eval of code. Behaves as the identity function for objects which are already functions, and assembles strings into functions.
  var code = (function (cache) {return function (o) {var result = o.constructor === Function ? o : cache[o] || (cache[o] = eval(o));
                                                     return result.origin = o.origin || o, result}}) ({});

  // 
}) ();
