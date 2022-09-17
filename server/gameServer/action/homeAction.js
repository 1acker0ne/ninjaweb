//const glb = require("../const/glb");
const dbcom = require("../db/dbcom.js");
const me = require("./manage");
const glb = me.glb;
const func = me.func;
const formula = me.formula;
/**
 * LoginAction
 */
class HomeAction {
	
	constructor(client){
        this.client = client;
		this.id = client.id;
	}
	
	start(){
		//������Ҫ�����ı�
		let userTbl = 'user';
		let self = this;
		this.client.onHandleMsg('createUserName',function(str,data){
			let userData = glb.get(glb.o.players,self.id);
			let user = glb.get(glb.o.users,self.id);
			
			//�ͻ��˺Ϸ��Լ��TODO
			if(user.conid!=data.conid){
				return;
			}
			//TODO
			user.nm = data.nm;
			userData.nm = data.nm;
			
			//��֤��������Ƿ����
			dbcom.findOne(userTbl,{nm:user.nm},function(res){
				//console.log(res);
				if(res){
					//����û����Ѿ���ע��
					let msg = {};
					msg.type = 0;
					self.client.sendMsg('err',msg);
				}else{
					dbcom.updateOne(userTbl,{_id:user._id},{nm:user.nm},function(res){
						let msg = {};
						msg.flg = 1;
						self.client.sendMsg('onCreateUserName',msg);
					});
				}
			});
		});
		
		this.client.onHandleMsg('selectRole',function(str,data){
			let user = glb.get(glb.o.users,self.id);
			
			//�ͻ��˺Ϸ��Լ��TODO
			if(user.conid!=data.conid){
				console.log('user.conid:'+user.conid);
				console.log('data.conid:'+data.conid);
				return;
			}
			//TODO
			user.base.role = data.roleId;
			
			let msg = {};
			msg.flg = 1;
			self.client.sendMsg('onSelectRole',msg);
		});
	}
}

module.exports=HomeAction;