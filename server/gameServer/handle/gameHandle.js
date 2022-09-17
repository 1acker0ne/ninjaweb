const me = require("../action/manage");
const glb = me.glb;
const func = me.func;
const formula = me.formula;
/**
* common function
*/
module.exports = {
	/**
	* �����˺�����
	*/
    damageCalcula:function(socketId,data,callBack){
		//let log = global.log;
		//log.info('--',data);
		//����˺��Ƿ�����
		//from user
		var userFromData = glb.get(glb.o.players,socketId);
		if(userFromData.conid!=data.from){
			return;
		}
		var spaceMapFromId = func.spaceMap(userFromData);
		//to user
		//ͨ��conid���Ŀ����ҵ�sockedId
		var userToSocid = glb.get(glb.o.consocket,data.to);
		var userToData = glb.get(glb.o.players,userToSocid);
		var spaceMapToId = func.spaceMap(userToData);
		//1 ����Ƿ���ͬһ�ߣ�ͬһ��ͼ
		if(spaceMapFromId != spaceMapToId){
			return;
		}
		//console.log(' start damage ok');
		var fromUser = glb.get(glb.o.users,socketId);
		var toUser = glb.get(glb.o.users,userToSocid);
		//�˺�����test
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
