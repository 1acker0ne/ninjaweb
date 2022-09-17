//const glb = require("../const/glb");
const dbcom = require("../db/dbcom.js");
const me = require("./manage");
const glb = me.glb;
const func = me.func;
const formula = me.formula;
/**
 * LoginAction
 */
class LoginAction {
	
	constructor(client){
        this.client = client;
		this.id = client.id;
	}
	
	start(){
		//������Ҫ�����ı�
		let accountTbl = 'account';
		let userTbl = 'user';
		
		let self = this;
		this.client.onHandleMsg('login',function(str,data){
			//console.log(str);
			//console.log(data);
			//����account��ṹ
			let userAccount = {account:data.account,password:data.password};
			//��֤��ҵ�¼��Ϣ
			dbcom.findOne(accountTbl,{account:data.account},function(res){
				if(res){
					if(res.password != data.password){
						//console.log('password error!');
						//���벻�Է��ش���
						let msg = {};
						msg.type = 1;//password error
						self.client.sendMsg('err',msg);
					}else{
						dbcom.findOne(userTbl,{fid:res._id},function(res){
							self.handleLogin(res,1);
						});
					}
				}else{
					//�˺Ų�����
					let msg = {};
					msg.type = 1;//�˺Ų�����
					self.client.sendMsg('err',msg);
				}
			});
		});
		this.client.onHandleMsg('register',function(str,data){
			let userAccount = {account:data.account,password:data.password};
			//��֤���ע����Ϣ
			dbcom.findOne('account',{account:data.account},function(res){
				if(res){
					//����û����Ѿ���ע��
					let msg = {};
					msg.type = 2;
					self.client.sendMsg('err',msg);
				}else{
					//ע�������Ϣ
					dbcom.insert(accountTbl,userAccount,function(res){
						let entity = formula.entity(1);
						let user = {
							fid:res._id,
							nm:"",
							space:0,
							map:0,
							base:{
								role:'001',
								shadow:'001',//��Ӱ
								lv:1,
								hp:entity.hp,
								hpMax:entity.hp,
								mc:entity.mc,
								mcMax:entity.mc,
								speed:entity.speed,
								evil:0,//���ֵ-������ɫ��
								exp:0,
								expMax:entity.expMax,
							},
							ability:{
								power:entity.power,
								atkSpeed:entity.atkSpeed,
								attack:entity.attack,
								defense:entity.defense,
								crit:entity.crit,//����
								dodge:entity.dodge,//����
								drebound:0,//�˺�����
								dreduction:0,//�˺�����
							},
							/**
								��������
							*/
							extraAttr:{
								/**
									ͫ��(д��������)
									д���۵ȼ���e1,e2,....e12
									e0:δ����д����
								*/
								pupilForce:{nm:'e0',lv:'1'},
							},
							priAttr:{
								particle:0,//����
								gold:0,
								copper:0,//ͭ��
							},
							/**
							* ����Ѿ�ӵ�еļ���
							* key��sk
							* value��lv
							*/
							skills:{
								1:1,
								2:10,
								3:10,
							},
							/**
							���ܶ�Ӧ�ļ��̰���
							* skill correspond
							* key : kebbord
							* value:skillnm
							*/
							skillCorres:{
								1:1,
								2:2,
								3:3,
							},
							buffs:{},//�洢�����ݿ⣬�����־ô����Է�ֹ��ˢ����Ϸ�����Ч��������
							effects:{},//�洢�����ݿ�
							timers:{},//�����������ȴʱ��
						};
						//����������Ա�
						dbcom.insert(userTbl,user,function(res){
							self.handleLogin(res,2);
						});
					});
				}
			});
			
		});
	}
	/**
	* ��ҵ�¼�ɹ������߼�
	* accountData��account table data
	*/
	handleLogin(user,type){
		let self = this;
		//��鵱ǰ����Ƿ��Ѿ���¼
		let socketid = glb.get(glb.o.primarykeys,user._id);
		if(socketid!=undefined && socketid!=''){
			/*let userData = glb.get(glb.o.players,socketid);
			let spaceMapId = func.spaceMap(userData);
			self.client.doDisconnect(spaceMapId,'leave',userData);*/
			//�ر�ԭ���Ŀͻ�������TODO socket.disconnect();
			self.client.forceDisconnect(socketid);
		}
		//�����ظ���ʶ
		glb.set(glb.o.primarykeys,user._id,self.id);
		
		user.conid=func.encrykey(self.id);
		//����conid ��socketid��Ӧ��ϵ
		glb.set(glb.o.consocket,user.conid,self.id);
		//������һ�������
		glb.set(glb.o.users,self.id,user);
		
		
		let userData = {};
		userData.conid=user.conid;
		userData.nm = user.nm;
		if(user.nm == ""){
			type = 2;
		}
		userData.type = type;
		/**
		* need to do
		* ���ÿռ��Ĭ��ֵ
		* ������Ϸʱ���������û����ﵽĳ��ֵʱ
		* ����ÿ���ռ���û���������Ҫ�����ĸ��ռ�
		*/
		userData.space = 0;
		userData.map = user.map;
		glb.set(glb.o.players,self.id,userData);
		//console.log(glb.o.players);
		//console.log(glb.get(glb.o.players,self.id));
		
		self.client.sendMsg('login',userData);
	}
	
	RndNum(n){
		var rnd="";
		for(var i=0;i<n;i++)
			rnd+=Math.floor(Math.random()*10);
		return rnd;
	}
}

module.exports=LoginAction;