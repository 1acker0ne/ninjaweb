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
		//定义需要操作的表
		let accountTbl = 'account';
		let userTbl = 'user';
		
		let self = this;
		this.client.onHandleMsg('login',function(str,data){
			//console.log(str);
			//console.log(data);
			//定义account表结构
			let userAccount = {account:data.account,password:data.password};
			//验证玩家登录信息
			dbcom.findOne(accountTbl,{account:data.account},function(res){
				if(res){
					if(res.password != data.password){
						//console.log('password error!');
						//密码不对返回处理
						let msg = {};
						msg.type = 1;//password error
						self.client.sendMsg('err',msg);
					}else{
						dbcom.findOne(userTbl,{fid:res._id},function(res){
							self.handleLogin(res,1);
						});
					}
				}else{
					//账号不存在
					let msg = {};
					msg.type = 1;//账号不存在
					self.client.sendMsg('err',msg);
				}
			});
		});
		this.client.onHandleMsg('register',function(str,data){
			let userAccount = {account:data.account,password:data.password};
			//验证玩家注册信息
			dbcom.findOne('account',{account:data.account},function(res){
				if(res){
					//玩家用户名已经被注册
					let msg = {};
					msg.type = 2;
					self.client.sendMsg('err',msg);
				}else{
					//注册玩家信息
					dbcom.insert(accountTbl,userAccount,function(res){
						let entity = formula.entity(1);
						let user = {
							fid:res._id,
							nm:"",
							space:0,
							map:0,
							base:{
								role:'001',
								shadow:'001',//虚影
								lv:1,
								hp:entity.hp,
								hpMax:entity.hp,
								mc:entity.mc,
								mcMax:entity.mc,
								speed:entity.speed,
								evil:0,//罪恶值-击倒角色数
								exp:0,
								expMax:entity.expMax,
							},
							ability:{
								power:entity.power,
								atkSpeed:entity.atkSpeed,
								attack:entity.attack,
								defense:entity.defense,
								crit:entity.crit,//暴击
								dodge:entity.dodge,//闪避
								drebound:0,//伤害反弹
								dreduction:0,//伤害减免
							},
							/**
								附加属性
							*/
							extraAttr:{
								/**
									瞳力(写轮眼属性)
									写轮眼等级：e1,e2,....e12
									e0:未开启写轮眼
								*/
								pupilForce:{nm:'e0',lv:'1'},
							},
							priAttr:{
								particle:0,//粒子
								gold:0,
								copper:0,//铜币
							},
							/**
							* 玩家已经拥有的技能
							* key：sk
							* value：lv
							*/
							skills:{
								1:1,
								2:10,
								3:10,
							},
							/**
							技能对应的键盘按键
							* skill correspond
							* key : kebbord
							* value:skillnm
							*/
							skillCorres:{
								1:1,
								2:2,
								3:3,
							},
							buffs:{},//存储到数据库，都做持久处理，以防止以刷新游戏来解除效果而作弊
							effects:{},//存储到数据库
							timers:{},//该玩家所有冷却时间
						};
						//插入玩家属性表
						dbcom.insert(userTbl,user,function(res){
							self.handleLogin(res,2);
						});
					});
				}
			});
			
		});
	}
	/**
	* 玩家登录成功后处理逻辑
	* accountData：account table data
	*/
	handleLogin(user,type){
		let self = this;
		//检查当前玩家是否已经登录
		let socketid = glb.get(glb.o.primarykeys,user._id);
		if(socketid!=undefined && socketid!=''){
			/*let userData = glb.get(glb.o.players,socketid);
			let spaceMapId = func.spaceMap(userData);
			self.client.doDisconnect(spaceMapId,'leave',userData);*/
			//关闭原来的客户端连接TODO socket.disconnect();
			self.client.forceDisconnect(socketid);
		}
		//保存重复标识
		glb.set(glb.o.primarykeys,user._id,self.id);
		
		user.conid=func.encrykey(self.id);
		//保存conid 与socketid对应关系
		glb.set(glb.o.consocket,user.conid,self.id);
		//保存玩家基础数据
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
		* 设置空间的默认值
		* 进入游戏时根据在线用户数达到某个值时
		* 根据每个空间的用户数计算需要加入哪个空间
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