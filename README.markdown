Divergence is a JavaScript library designed to manipulate functions. It provides a few things:

1. Explicit and implicit function promotion
2. Inline macro processing
3. Flat-stack tail calls (in delimited CPS mode)

# Function promotion

JavaScript's function syntax is quite verbose, so Divergence allows you to use other literals in place of functions. You can use strings, numbers, regular expressions, booleans, or arrays anywhere you would normally use a function:

    [1, 2, 3].map (function (x) {return x + 1})   // => [2, 3, 4]
    [1, 2, 3].map ('$0 + 1')                      // => [2, 3, 4]
    [1, 2, 3].map (0)                             // => [1, 2, 3]
    [1, 2, 3].map ([0, '$0 + 1'])                 // => [[1, 2], [2, 3], [3, 4]]
    [1, 2, 3].map (/(\d+)/)                       // => [['1', '1'], ['2', '2'], ['3', '3']]

    ['foo', 'bar', 'bif'].grep (/b/)              // => ['bar', 'bif']

Here are the rules for promotion:

1. Strings get macro-expanded and then evaled.
2. Numbers return arguments[n].
3. Booleans are curried Church-encoded (that is, true is x -> y -> x, and false is x -> y -> y).
4. Arrays are homomorphic across function promotion; that is, [f, g].fn() (x) = [f.fn()(x), g.fn()(x)]
5. Regular expressions are executed on their arguments; that is, /foo/.fn() (x) = /foo/.exec (x)

The `fn` function explicitly promotes something and lets you preload it with parameters. For example:

    '$0 + $1 + $2'.fn (1, 2) (3)                  // => 6

You can also use `fn` on regular functions:

    (function (x, y, z) {return x + y + z}).fn (1, 2) (3)

Function-promotable things also provide a bunch of common methods so that you don't have to explicitly promote them. For example:

    '$0.foo'.compose ('$0.bar')

Flat compose is a method that obeys this contract:

    f.flat_compose (g) (x, y, ...) = f.apply (this, g (x, y, ...))

The idea is that it gives `g` access to all of `f`'s parameters, not just the first one. This has some nice properties, among them that arrays of numbers, somewhat intuitively, form argument permutations under flat-compose:

    'some-function'.flat_compose ([1, 0])         // Reverses the first two arguments and removes the rest

The `d` object also provides some functions for working with arbitrary objects:

    d.map ({foo: 'bar', bif: 'baz'}, '$0.maps_to($1 + "q")')              // => {foo: 'barq', bif: 'bazq'}
    d.map ({foo: 'bar', bif: 'baz'}, '/f/.test ($0) && $0.maps_to($1)')   // => {foo: 'bar'}

# Inline macro processing

When a string is promoted to a function, it is run through macro transformations first. This allows you to use shorthands such as `$_` for `this`, `@_` for `Array.prototype.slice.call(arguments)`, `$n` for `arguments[n]`, and `@foo` for `this.foo`. You can add new macros by specifying a regular expression with an expander function (new macros are processed after all previously-defined ones):

    /sqr\(([^)]+)\)/g.macro ('"(" + $1 + " * " + $1 + ")"'.fn());

    [1, 2, 3].map ('sqr($0)')                     // => [1, 4, 9]

You can also use aliased functions:

    [1, 2, 3].fold ('plus')                       // => 6
    [0, 1, 2].map ('notnot')                      // => [false, true, true]

Full alias lists are defined in `d.operators.{binary, unary, assignment, applicative}`.

Used with `ctor`, which initializes the prototype of a function, you can end up writing code that looks much like Ruby:

    var point_class = '@x = $0, @y = $1'.ctor ({length: 'Math.sqrt (@x*@x + @y*@y)'.fn()});
    var p = new point_class (3, 4);
    p.length()    // => 5

There are also macros available for defining nested functions:

    '$0.map({< $0 + 1 >})'.fn() ([1, 2, 3]                                // => [2, 3, 4]
    'd.map($0, {|k, v| v.maps_to (k) |})'.fn() ({foo: 'bar'})             // => {bar: 'foo'}

The code this generates looks like this:

    {< $0 + 1 >}                                // => (function(){return arguments[0] + 1})
    {|k, v| v.maps_to(k) |}                     // => (function(k, v){return v.maps_to(k)})

# Delimited continuations

JavaScript normally doesn't optimize tail calls, but using CPS to encode tail call optimization isn't difficult. The idea is that rather than winding up the call stack with recursion:

    call/cc (cc -> factorial (5, 1, cc))
                    -> factorial (4, 5, cc)
                      -> factorial (3, 20, cc)
                        -> factorial (2, 60, cc)
                          -> factorial (1, 120, cc)
                            -> cc (120)

we can eliminate the temporary frames by returning them:

    call/cc (cc -> factorial (5,   1, cc)   // returns [factorial, [4,   5, cc]]
                -> factorial (4,   5, cc)   // returns [factorial, [3,  20, cc]]
                -> factorial (3,  20, cc)   // returns [factorial, [2,  60, cc]]
                -> factorial (2,  60, cc)   // returns [factorial, [1, 120, cc]]
                -> factorial (1, 120, cc)   // returns [cc, [120]]
                -> cc (120))

The source code for the `cps` function contains the algorithm, but here is the idea:

    var cc = function (x) {return x}, call = [factorial, [5, 1, cc]];     // Preload the function with initial arguments
    while (call[0] !== cc) call = call[0].apply (this, call[1]);          // Run until the escaping continuation is called
    return cc.apply (this, call[1]);                                      // Call the escaping continuation to return to value-space

Here is how a tail-recursive factorial function would be implemented:

    var tail_factorial = function (n, accumulator, k) {
      return n > 1 ? tail_factorial.tail (n - 1, accumulator * n, k) : k.tail (accumulator)};

You could then call it this way:

    tail_factorial.fn (5, 1).cps ()               // => 120

You can also specify the escaping continuation explicitly (if unspecified it is the identity function) like this:

    tail_factorial.fn (5, 1).cps (alert);         // alerts 120 and returns undefined
