// throw new Error("an error from test.");

$res.write("context? " + (require.main === module) + "\n");
$res.write("I am from test!\n");
console.log(global.foo, foo);
module.exports = "Hello";