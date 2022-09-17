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
		//定义需要操作的表
		let userTbl = 'user';
		
		this.client.onHandleMsg('start',function(str,data){
			
			let userData = glb.get(glb.o.players,self.id);
			let user = glb.get(glb.o.users,self.id);
			
			//客户端合法性检查TODO
			if(user.conid!=data.conid){
				return;
			}
			userData.space = 1;
			userData.map = gmap.main;
			
			userData.base = user.base;
			
			//save player data
			//glb.set(glb.o.players,self.id,userData);
			/**=============指定玩家所在的线，及所在的地图并设置socket的适用范围=============*/
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
			//获得当前地图的在线的其它玩家非私有信息
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
				//这个方法需要改一下才能发送
				//可以暂时用下面doDisconnect方法
				self.client.roomBroadcastToOther(spaceMapId,'leave',userData);
			});*/
			//=========>>>>>>>>>>>>>>>>>>>
			self.client.doDisconnect(spaceMapId,'leave',userData);
			
			//开始执行任务(每分钟的第30秒执行一次)TODO
			/*global.schedule.job('30 * * * * *',()=>{
				//self.log.info('conid-',self.id,user);
				if(user.base.exp >= user.base.expMax){
					//TODO 提醒玩家可以升级了
					let msg = {};
					self.client.sendMsg('err',msg);
				}
			});*/
		});
		//玩家位置和状态同步逻辑
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
		//对战状态同步逻辑
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
						//检测是否可以释放技能，并扣除相应的法力值
						var skillKey = user.skillCorres[data.key];
						data.sk = skillKey;
						data.skill = glb.get(glb.o.skills,skillKey);
						//=========>>>>>>>>>>>>>>>>>>>
						self.client.roomBroadcastTo(spaceMapId,'pkStatusSync',data);
					}
					break;
			}
		});
		//切换须佐状态
		this.client.onHandleMsg('switchShadow',function(str,data){
			let user = glb.get(glb.o.users,self.id);
			//客户端合法性检查TODO
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
		//切换防御状态
		this.client.onHandleMsg('switchDefense',function(str,data){
			let user = glb.get(glb.o.users,self.id);
			//客户端合法性检查TODO
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
		//伤害及判断逻辑
		this.client.onHandleMsg('damage',function(str,data){
			//检查伤害是否作弊
			gamedle.damageCalcula(self.id,data,function(spaceMapFromId,fromUser,toUser){
				//=-1 不做任何处理
				if(fromUser.damageMsg.type == '-1'){
					return false;
				}
				var sendData = {};
				sendData.states = {};
				sendData.states[data.from] ={
					conid:data.from,
					base:fromUser.base,
					//伤害信息
					damageMsg:fromUser.damageMsg,
					battleAttri:fromUser.battleAttri,
					ability:fromUser.ability,
					buffs:fromUser.buffs,
					effects:fromUser.effects,
				};
				sendData.states[data.to] = {
					conid:data.to,
					base:toUser.base,
					//伤害信息
					damageMsg:toUser.damageMsg,
					battleAttri:toUser.battleAttri,
					ability:toUser.ability,
					buffs:toUser.buffs,
					effects:toUser.effects,
				};
				//升级控制
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
				});//改成手动升级方式
				//倒地5秒计时计算
				self.onDead(data.from,fromUser,spaceMapFromId)
				self.onDead(data.to,toUser,spaceMapFromId);
				//2 发送更新客户端角色状态
				//3 发送更新客户端角色技能特效
				//=========>>>>>>>>>>>>>>>>>>>
				self.client.roomBroadcastTo(spaceMapFromId,'damage',sendData);
			});
		});
	}
	/**
	hp为0时处理
	*/
	onDead(id,user,spaceMapId){
		var self = this;
		try{
			var hpZero = user.base.hp<=0?true:false;
			
			if(hpZero){
				//开始倒计时任务
				global.schedule.addTime('onDead_'+id,function(){
					user.base.hp = formula.entity(user.base.lv).hp;
					var sendData = {};
					sendData.conid = user.conid;
					sendData.userBase = user.base;
					//复活revive
					self.client.roomBroadcastTo(spaceMapId,'revive',sendData);
				},5);
			}
		}catch(e){}
	};
	
	/**
	技能释放目标hp为0时，释放技能的角色加经验
	TODO
	*/
	onUpgrade(fromUser,toUser,callback){
		//=-1 不做任何处理
		if(fromUser.damageMsg.type == '-1'){
			return false;
		}
		if(toUser.base.hp<=0){
			let exp = formula.getExp(fromUser.base.lv,toUser.base.lv);
			let log = global.log;
			let upgradeFlg = false;
			fromUser.base.exp += exp;
			fromUser.base.evil += 1;//TODO boss不计算
			if(fromUser.base.exp>=fromUser.base.expMax){
				upgradeFlg = true;
				let nextLv = fromUser.base.lv+1;
				fromUser.base.exp = 0;
				//由玩家主动点击升级按钮升级
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