const dbcom = require("../db/dbcom.js");
const me = require("./manage");
const glb = me.glb;
const func = me.func;
const msg = me.msg;
const gamedle = require("../handle/gameHandle.js");
const formula = me.formula;
//data define
var gmap = glb.o.map;
/**
 * GameAction
 */
class GameAction {
	
	constructor(client){
        this.client = client;
		this.id = client.id;
		this.log = global.log;
	}
	
	start(){
		var self = this;
		//������Ҫ�����ı�
		let userTbl = 'user';
		
		this.client.onHandleMsg('start',function(str,data){
			
			let userData = glb.get(glb.o.players,self.id);
			let user = glb.get(glb.o.users,self.id);
			
			//�ͻ��˺Ϸ��Լ��TODO
			if(user.conid!=data.conid){
				return;
			}
			userData.space = 1;
			userData.map = gmap.main;
			
			userData.base = user.base;
			
			//save player data
			//glb.set(glb.o.players,self.id,userData);
			/**=============ָ��������ڵ��ߣ������ڵĵ�ͼ������socket�����÷�Χ=============*/
			var spaceMapId = func.spaceMap(userData);
			func.joinMap(userData,self.id);
			//join map
			//=========>>>>>>>>>>>>>>>>>>>
			self.client.socket.join(spaceMapId);
			/**=====================================================*/
			
			user.map = userData.map;
			
			var sendData = {};
			sendData.conid = user.conid;
			sendData.user = user;
			//��õ�ǰ��ͼ�����ߵ�������ҷ�˽����Ϣ
			sendData.users = func.getMap(userData);
			//console.log(glb.get(glb.o.players,self.id));
			//console.log(func.getMap(userData));
			
			//send data to oneself
			//=========>>>>>>>>>>>>>>>>>>>
			self.client.sendMsg('start',sendData);
			//send data other users that current map users 
			//=========>>>>>>>>>>>>>>>>>>>
			self.client.roomBroadcastToOther(spaceMapId,'join',userData);
			//send data other users that current map users 
			/*self.client.disconnect(function(){
				console.log('disconnect');
				//���������Ҫ��һ�²��ܷ���
				//������ʱ������doDisconnect����
				self.client.roomBroadcastToOther(spaceMapId,'leave',userData);
			});*/
			//=========>>>>>>>>>>>>>>>>>>>
			self.client.doDisconnect(spaceMapId,'leave',userData);
			
			//��ʼִ������(ÿ���ӵĵ�30��ִ��һ��)TODO
			/*global.schedule.job('30 * * * * *',()=>{
				//self.log.info('conid-',self.id,user);
				if(user.base.exp >= user.base.expMax){
					//TODO ������ҿ���������
					let msg = {};
					self.client.sendMsg('err',msg);
				}
			});*/
		});
		//���λ�ú�״̬ͬ���߼�
		this.client.onHandleMsg('frameSync',function(str,data){
			var userData = glb.get(glb.o.players,self.id);
			if(undefined == userData){
				return;
			}
			userData.sync = data;
			var user = glb.get(glb.o.users,self.id);
			var spaceMapId = func.spaceMap(userData);
			
			switch(data.action){
				case msg.POSINTON_CHANGED:
					//=========>>>>>>>>>>>>>>>>>>>
					self.client.roomBroadcastTo(spaceMapId,'frameSync',data);
					break;
			}
		});
		//��ս״̬ͬ���߼�
		this.client.onHandleMsg('pkStatusSync',function(str,data){
			var userData = glb.get(glb.o.players,self.id);
			if(undefined == userData){
				return;
			}
			userData.sync = data;
			var user = glb.get(glb.o.users,self.id);
			var spaceMapId = func.spaceMap(userData);
			switch(data.action){
				case msg.EVENT_ATTACK:
					if(data.key){
						//����Ƿ�����ͷż��ܣ����۳���Ӧ�ķ���ֵ
						var skillKey = user.skillCorres[data.key];
						data.sk = skillKey;
						data.skill = glb.get(glb.o.skills,skillKey);
						//=========>>>>>>>>>>>>>>>>>>>
						self.client.roomBroadcastTo(spaceMapId,'pkStatusSync',data);
					}
					break;
			}
		});
		//�л�����״̬
		this.client.onHandleMsg('switchShadow',function(str,data){
			let user = glb.get(glb.o.users,self.id);
			//�ͻ��˺Ϸ��Լ��TODO
			if(user.conid!=data.conid){
				return;
			}
			let userData = glb.get(glb.o.players,self.id);
			if(undefined == userData){
				return;
			}
			userData.shadowkey = data.shadowkey;
			if(!userData.switchShadow){
				userData.switchShadow = true;
			}else{
				userData.switchShadow = false;
			}
			let spaceMapId = func.spaceMap(userData);
			let msg = {
				conid:user.conid,
				shadowkey:userData.shadowkey,
				switchShadow:userData.switchShadow
			};
			self.client.roomBroadcastTo(spaceMapId,'switchShadow',msg);
		});
		//�л�����״̬
		this.client.onHandleMsg('switchDefense',function(str,data){
			let user = glb.get(glb.o.users,self.id);
			//�ͻ��˺Ϸ��Լ��TODO
			if(user.conid!=data.conid){
				return;
			}
			let userData = glb.get(glb.o.players,self.id);
			if(undefined == userData){
				return;
			}
			if(!userData.switchDefense){
				userData.switchDefense = true;
			}else{
				userData.switchDefense = false;
			}
			let spaceMapId = func.spaceMap(userData);
			let msg = {
				conid:user.conid,
				switchDefense:userData.switchDefense
			};
			self.client.roomBroadcastTo(spaceMapId,'switchDefense',msg);
		});
		//�˺����ж��߼�
		this.client.onHandleMsg('damage',function(str,data){
			//����˺��Ƿ�����
			gamedle.damageCalcula(self.id,data,function(spaceMapFromId,fromUser,toUser){
				//=-1 �����κδ���
				if(fromUser.damageMsg.type == '-1'){
					return false;
				}
				var sendData = {};
				sendData.states = {};
				sendData.states[data.from] ={
					conid:data.from,
					base:fromUser.base,
					//�˺���Ϣ
					damageMsg:fromUser.damageMsg,
					battleAttri:fromUser.battleAttri,
					ability:fromUser.ability,
					buffs:fromUser.buffs,
					effects:fromUser.effects,
				};
				sendData.states[data.to] = {
					conid:data.to,
					base:toUser.base,
					//�˺���Ϣ
					damageMsg:toUser.damageMsg,
					battleAttri:toUser.battleAttri,
					ability:toUser.ability,
					buffs:toUser.buffs,
					effects:toUser.effects,
				};
				//��������
				self.onUpgrade(fromUser,toUser,function(upgradeFlg){
					dbcom.updateOne(userTbl,{_id:fromUser._id},{base:fromUser.base,ability:fromUser.ability},function(res){
						if(upgradeFlg){
							let msg = {
								conid:data.from,
								base:fromUser.base,
								ability:fromUser.ability,
							};
							self.client.roomBroadcastTo(spaceMapFromId,'upgrade',msg);
						}
					});
				});//�ĳ��ֶ�������ʽ
				//����5���ʱ����
				self.onDead(data.from,fromUser,spaceMapFromId)
				self.onDead(data.to,toUser,spaceMapFromId);
				//2 ���͸��¿ͻ��˽�ɫ״̬
				//3 ���͸��¿ͻ��˽�ɫ������Ч
				//=========>>>>>>>>>>>>>>>>>>>
				self.client.roomBroadcastTo(spaceMapFromId,'damage',sendData);
			});
		});
	}
	/**
	hpΪ0ʱ����
	*/
	onDead(id,user,spaceMapId){
		var self = this;
		try{
			var hpZero = user.base.hp<=0?true:false;
			
			if(hpZero){
				//��ʼ����ʱ����
				global.schedule.addTime('onDead_'+id,function(){
					user.base.hp = formula.entity(user.base.lv).hp;
					var sendData = {};
					sendData.conid = user.conid;
					sendData.userBase = user.base;
					//����revive
					self.client.roomBroadcastTo(spaceMapId,'revive',sendData);
				},5);
			}
		}catch(e){}
	};
	
	/**
	�����ͷ�Ŀ��hpΪ0ʱ���ͷż��ܵĽ�ɫ�Ӿ���
	TODO
	*/
	onUpgrade(fromUser,toUser,callback){
		//=-1 �����κδ���
		if(fromUser.damageMsg.type == '-1'){
			return false;
		}
		if(toUser.base.hp<=0){
			let exp = formula.getExp(fromUser.base.lv,toUser.base.lv);
			let log = global.log;
			let upgradeFlg = false;
			fromUser.base.exp += exp;
			fromUser.base.evil += 1;//TODO boss������
			if(fromUser.base.exp>=fromUser.base.expMax){
				upgradeFlg = true;
				let nextLv = fromUser.base.lv+1;
				fromUser.base.exp = 0;
				//������������������ť����
				formula.upgradeBase(fromUser.base,nextLv);
				formula.upgradeAbility(fromUser.ability,nextLv);
			}
			if(callback){
				callback(upgradeFlg);
			}
		}
	};
}

module.exports=GameAction;