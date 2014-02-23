contentType("text");
echo("context? " + (require.main === module) + "\n");

global.foo = "bar";
console.log(foo);

var test = require("./test.js");
echo("Test says \"" + test + "\"\n");

end();