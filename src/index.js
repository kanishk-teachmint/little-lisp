const readline = require('readline');

(function(exports) {
    var library = {
        first: function(x) {
            return x[0];
        },

        rest: function(x) {
            return x.slice(1);
        },

        print: function(x) {
            console.log(x);
            return x;
        },

        '+': function(a, b) {
            return a + b;
        },

        '-': function(a, b) {
            return a - b;
        },

        '*': function(a, b) {
            return a * b;
        },

        '/': function(a, b) {
            return a / b;
        }
    };

    var Context = function(scope, parent) {
        this.scope = scope;
        this.parent = parent;

        this.get = function(identifier) {
            if (identifier in this.scope) {
                return this.scope[identifier];
            } else if (this.parent !== undefined) {
                return this.parent.get(identifier);
            }
        };
    };

    var special = {
        let: function(input, context) {
            var letContext = input[1].reduce(function(acc, x) {
                acc.scope[x[0].value] = interpret(x[1], context);
                return acc;
            }, new Context({}, context));

            return interpret(input[2], letContext);
        },

        lambda: function(input, context) {
            return function() {
                var lambdaArguments = Array.prototype.slice.call(arguments);
                var lambdaScope = input[1].map(function(arg) {
                    return arg.value;
                });

                var lambdaFunction = input[2];
                var lambdaBody = lambdaFunction.map(function(x) {
                    return interpret(x, context);
                });

                var combinedScope = lambdaArguments.reduce(function(acc, arg, index) {
                    acc[lambdaScope[index]] = arg;
                    return acc;
                }, {});

                return interpret(lambdaBody, new Context(combinedScope, context));
            };
        },

        define: function(input, context) {
            var name = input[1].value;
            var value = interpret(input[2], context);
            context.scope[name] = value;
            return value;
        },

        if: function(input, context) {
            return interpret(input[1], context) ?
                interpret(input[2], context) :
                interpret(input[3], context);
        }
    };

    var interpretList = function(input, context) {
        if (input.length > 0 && input[0].value in special) {
            return special[input[0].value](input, context);
        } else {
            var list = input.map(function(x) {
                return interpret(x, context);
            });
            if (list[0] instanceof Function) {
                return list[0].apply(undefined, list.slice(1));
            } else {
                return list;
            }
        }
    };

    var interpret = function(input, context) {
        if (context === undefined) {
            return interpret(input, new Context(library));
        } else if (input instanceof Array) {
            return interpretList(input, context);
        } else if (input.type === "identifier") {
            return context.get(input.value);
        } else if (input.type === "number" || input.type === "string") {
            return input.value;
        }
    };

    var categorize = function(input) {
        if (!isNaN(parseFloat(input))) {
            return { type: 'number', value: parseFloat(input) };
        } else if (input[0] === '"' && input.slice(-1) === '"') {
            return { type: 'string', value: input.slice(1, -1) };
        } else {
            return { type: 'identifier', value: input };
        }
    };

    var parenthesize = function(input, list) {
        list = list || [];
        var token = input.shift();
        if (token === undefined) {
            return list.pop();
        } else if (token === "(") {
            list.push(parenthesize(input));
            return parenthesize(input, list);
        } else if (token === ")") {
            return list;
        } else {
            return parenthesize(input, list.concat(categorize(token)));
        }
    };

    var tokenize = function(input) {
        return input.split('"')
            .map(function(x, i) {
                return i % 2 === 0 ?
                    x.replace(/\(/g, ' ( ').replace(/\)/g, ' ) ') :
                    x.replace(/ /g, "!whitespace!");
            })
            .join('"')
            .trim()
            .split(/\s+/)
            .map(function(x) {
                return x.replace(/!whitespace!/g, " ");
            });
    };

    var parse = function(input) {
        var tokens = tokenize(input);
        var expressions = [];
        while (tokens.length > 0) {
            expressions.push(parenthesize(tokens));
        }
        return expressions;
    };

    exports.littleLisp = {
        parse: parse,
        interpret: interpret
    };

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Enter a Lisp program: ', (input) => {
        try {
            var expressions = parse(input);
            var context = new Context(library);
            expressions.forEach(expr => {
                let result = interpret(expr, context);
                console.log("Result:", result);
            });
        } catch (e) {
            console.error('Error:', e.message);
        }
        rl.close();
    });

})(typeof exports === 'undefined' ? this : exports);


/*
move to directory 
run node index.js
write the lisp program in one line 
eg. (print (/ (* 5 3) 2))
should return 7.5

*/