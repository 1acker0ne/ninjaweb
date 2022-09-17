const me = require("../action/manage");
const glb = me.glb;
const func = me.func;
const formula = me.formula;
/**
* common function
*/
module.exports = {
	/**
	* 技能伤害计算
	*/
    damageCalcula:function(socketId,data,callBack){
		//let log = global.log;
		//log.info('--',data);
		//检查伤害是否作弊
		//from user
		var userFromData = glb.get(glb.o.players,socketId);
		if(userFromData.conid!=data.from){
			return;
		}
		var spaceMapFromId = func.spaceMap(userFromData);
		//to user
		//通过conid获得目标玩家的sockedId
		var userToSocid = glb.get(glb.o.consocket,data.to);
		var userToData = glb.get(glb.o.players,userToSocid);
		var spaceMapToId = func.spaceMap(userToData);
		//1 检查是否在同一线，同一地图
		if(spaceMapFromId != spaceMapToId){
			return;
		}
		//console.log(' start damage ok');
		var fromUser = glb.get(glb.o.users,socketId);
		var toUser = glb.get(glb.o.users,userToSocid);
		//伤害计算test
		formula.damageFormula(fromUser,toUser,data);
		//update users
		userFromData.base = fromUser.base;
		userFromData.battleAttri = fromUser.battleAttri;
		userToData.base = toUser.base;
		userToData.battleAttri = toUser.battleAttri;
		
		//console.log(fromUser);
		//console.log(toUser);
		callBack(spaceMapFromId,fromUser,toUser);
    },
}
