const glb = require("./glb");
const crypto = require('crypto');
/**
* common function
*/
module.exports = {
	/**
	* handle obj array
	*/
    set:function(o,k,v){
		if(typeof o=='undefined' || typeof k=='undefined' || typeof v=='undefined')
			return
		o[k] = v;
    },
	get:function(o,k){
		if(typeof o=='undefined' || typeof k=='undefined')
			return null;
		return o[k];
	},
	remove:function(o,k){
		if(typeof o=='undefined' || typeof k=='undefined')
			return;
		delete o[k];
	},
	spaceMap:function(userData){
		if(userData){
			return userData.space+'_'+userData.map;
		}
		return '';
	},
	/**
	* player join map
	* 
	* ������Ϸʱ���������û����ﵽĳ��ֵʱ
	* ����ÿ���ռ���û���������Ҫ�����ĸ��ռ�
	*/
	joinMap:function(userData,id){
		if(userData){
			glb.set(glb.o.space[userData.space][userData.map],id,userData);
		}
	},
	/**
	* ���������ڵ�ͼ�ڵ����������Ϣ
	*/
	getMap:function(userData){
		if(glb.o.space && glb.o.space[userData.space]){
			return glb.o.space[userData.space][userData.map];
		}
	},
	/**
	* ɾ����ǰ����ڷ�����������
	*/
	removeMap:function(id){
		var userData = glb.get(glb.o.players,id);
		if(userData){
			this.remove(this.getMap(userData),id);
		}
	},
	/**
	* disconnect  handle
	* Release resources
	*/
	disconnectRemove:function(id){
		if(typeof glb.o=='undefined' || typeof id=='undefined')
			return;
		//delete connects data
		//delete players map data
		this.removeMap(id);
		//delete players attr data
		this.remove(glb.o.attrs,id);
		//delete ids start
		//var outplayer = glb.get(glb.o.players,id);
		var outuser = glb.get(glb.o.users,id);
		if(outuser){
			if(outuser._id){
				this.remove(glb.o.primarykeys,outuser._id);
			}
			if(outuser.conid){
				this.remove(glb.o.consocket,outuser.conid);
			}
		}
		//delete ids end
		//delete players data
		this.remove(glb.o.players,id);
		//delete users data
		this.remove(glb.o.users,id);
	},
	/**
	* md5 ����
	*/
	encrykey(id){
		return this.encrypt(id+Date.now().toString());
	},
	/**
	* �������������ظ��ͻ�����
	*/
	encrypt(content){
		return crypto.createHash('md5').update(content.toString(), 'utf8').digest("hex");
	},
	/**
	* try catch run
	*/
	forceRun(func,flg){
		if(flg){
			func();
		}else{
			try{
				func();
			}catch(e){
				//console.log(e);
				console.log(e.message);
			}
		}
	},
	deepCopy(obj){
		if(typeof obj != 'object'){
			return obj;
		}
		var newobj = {};
		for ( var attr in obj) {
			newobj[attr] = deepCopy(obj[attr]);
		}
		return newobj;
	},
	isEmptyObj(o){
		if(undefined == o){
			return true;
		}
		if(JSON.stringify(o) == '{}'){
			return true;
		}
		return false;
	},
}
