const glb = require("../const/glb");
/**
* common function
*/
module.exports = {
	db:function(){
		return glb.o.db;
	},
	/**
	* tb:table name
	* params:params
	* cb:callback function
	*/
	insert:function(tb,params,cb){
		let self = this;
		this.db()[tb].insert(params,function(err,res) {
			self.handleRes(res,cb,err);
		});
	},
	/**
	* tb:table name
	* wheres:{}
	* updateParams:{}
	* cb:callback function
	*/
    updateOne:function(tb,wheres, updateParams,cb){
		let self = this;
		let updateStr = {$set: updateParams};
		this.db()[tb].updateOne(wheres, updateStr,function(err,res){
			self.handleRes(res,cb,err);
		});
    },
	/**
	* tb:table name
	* params:{}
	* cb:callback function
	*/
    findOne:function(tb,params,cb){
		let self = this;
		this.db()[tb].findOne(params,function(err,res){
			self.handleRes(res,cb,err);
		});
    },
	/**
	* tb:table name
	* cb:callback function
	*/
    findAll:function(tb,cb){
		let self = this;
		this.db()[tb].find({},function(err,res){
			self.handleRes(res,cb,err);
		});
    },
	/**
	* res:search data
	* cb:callback function
	*/
	handleRes:function(res,cb,err){
		if(!cb){
			return;
		}
		if(res){
			cb(res);
		}	
		else{
			cb(false);
		}
	},
}
