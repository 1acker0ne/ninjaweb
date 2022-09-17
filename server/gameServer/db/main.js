const mongojs = require("mongojs");

class DB {
    constructor() {
		var mongoDBUrl = 'localhost:27017/shadow'
		this.db = mongojs(mongoDBUrl, ['account', 'progress']);
    }
}
module.exports=DB;