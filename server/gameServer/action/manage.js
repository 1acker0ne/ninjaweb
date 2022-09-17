var glb;
var func;
var formula;
var msg;
try {
    glb = require("../const/glb");
    func = require("../const/func");
    formula = require("../const/formula");
    msg = require("../const/Message");
} catch (e) {
	console.warn("load manage fail,"+e.message);
}
module.exports = {
	glb:glb,
	func:func,
	formula:formula,
	msg:msg,
}
