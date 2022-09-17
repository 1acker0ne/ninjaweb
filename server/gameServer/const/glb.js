var obj = {
	/**
	* 数据库连接对象
	*/
	db:null,
	/**
	*检查客户端重复是否登陆，
	*保存conid与socketId的对应关系
	*key:_id（表主键）
	*value:socketId
	*/
	primarykeys:{},
	/**
	*保存conid与socketId的对应关系
	*key:conid
	*value:socketId
	*/
	consocket:{},
	/**
	*与数据库对应的临时玩家数据
	*key:socketId
	*value:user
	*/
	users:{},
	/**
	*非私密的临时玩家数据
	*key:socketId
	*value:user.base..
	*/
	players:{},
	/**
	* buff 定义
	* 技能命中效果buff
	* 特殊效果buff
	*/
	/**
	共通技能数据=〉
		sk:技能主键
		pk:预制对象名字
		nm:技能名字
		type:主动释放还是被动释放
		ai:自己还是敌方0：自己，1：敌方
		lv:技能等级
		re:释放技能类型，释放需要位移
		ct:技能冷却时间
		step:冷却时间步长
		dt:技能效果持续时间
		mt:技能释放消耗类型，0:无消耗，1:法力，2:血（少数的禁术）
		mc:技能释放所消耗的法力基准值，技能释放需要的法力值=技能等级*基准值
		mr:按百分比消耗mr对应的值，mr为固定百分比值，不随lv改变
		rate:rate存在时，伤害以rate百分比计算
		icon:技能图标/技能效果buff图标
	te:技能效果区分==〉
		0：加成类
		{hp,atk,df,crit,dodge,}
		，1：穿透类
		{pierce,piercedf,piercedodge,}
		，2：封印类
		{}
		，3：解印类
		{}
		，4：无敌类
		{}
		，5：复合类
		{}
	技能效果==〉，减少敌方属性的技能，会有相对应的buff
	===〉下面效果，可以存一到两个属性ru：{{t:1,k:1,v:20}，{t:1,k:1,v:-10}}//t:类型，k：主键，v：加减百分比
		hp：+加/-减血
		mc：加/减魔法值
		atk:加/减攻击
		df：加/减防御
		crit：加/减暴击
		dodge：加/减闪避
		dmage:1，damage=1 伤害由攻击力决定
	穿透类=〉单次攻击伤害计算（百分比xxx,1/0） 
		pierce:忽视所有防御，闪避
		piercedf:忽视防御
		piercedodge:忽视闪避
	封印类=〉持续类（1/0）
		seal:不能做任何操作（定身）
		sealme:不能移动
		sealmc:不能释放技能，可以普攻
		sealatk:不能攻击
		sealdf:不能防御
		sealdodge:不能闪避
		sealhp:不能加血
	
	解印类=〉一次性
		unseal:解印克制unseal
		unsealme:克制sealme
		unsealmc:克制sealmc
		unsealatk:克制sealatk
		unsealdf:克制sealdf
		unsealdodge:克制sealdodge
	无敌类（须佐技能）=〉持续类（释放技能后持续一段时间），只有有须佐时才有的特定技能
		  =〉当攻击与防御属性相对时，克制类优先
		invincible:无敌
		nohit:不能被命中
		nogatk:无视普通攻击
		noskill:无视技能攻击
		
		desc:技能描述
		armature:骨骼动画armature名字
		anim:骨骼动画anim名字
	玩家技能数据=〉
		{sk，lv}*M
	TODO:需要一个技能处理类，计算技能伤害
	*/
	skills:{
		1:{
			pk:'001',
			nm:'天照',
			type:'主动',
			ai:1,
			lv:100,
			re:1,//release type
			te:2,
			mt:2,//消耗hp
			mc:300,
			step:-0.01,
			ct:300,
			dt:5,
			efs:{
				hp:-0.002,
				pierce:1,
				sealhp:1,
				sealdf:1,
				sealdodge:1,
			},
			desc:'',
			icon:8,
			armature:'Sprite',
			anim:'Sprite'
		},
		2:{
			pk:'002',
			nm:'荆棘',
			type:'主动',
			ai:1,
			lv:10000,
			re:1,//release type
			te:5,
			ct:120,
			step:-0.01,
			dt:60,
			efs:{
				seal:1,
			},
			desc:'',
			icon:1,
			armature:'Sprite',
			anim:'Sprite'
		},
		3:{
			pk:'003',
			nm:'风遁螺旋丸',
			type:'主动',
			ai:1,
			lv:10000,
			re:2,//release type
			te:5,
			ct:120,
			step:-0.01,
			dt:60,
			efs:{
				seal:1,
			},
			desc:'',
			icon:1,
			armature:'Sprite',
			anim:'Sprite'
		}
	},
	/**
	* 游戏大分类，空间
	*/
	space:{},
	spaceNum:2,
	/**
	* map
	*/
	map:{
		main:1,//主城
		colorful:2,//七彩界
	}
}

module.exports = {
	o:obj,
	/**
	*get socket id
	*/
	connId:function(socketId){
		if(typeof socketId=='string'){
			var coonstr = socketId.split('#');
			if(coonstr.length>1){
				return coonstr[1];
			}else{
				return coonstr[0];
			}
		}
		return -1;
	},
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
}
