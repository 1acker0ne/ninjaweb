const glb = require("./glb");
const func = require("./func");
/**
* formula
* TOTO:公式里的一些属性需要放到数据库中
*/
module.exports = {
	entity:function(lv){
		var entity = {};
		var expLv = lv;
		if(lv>=500){
			expLv = 500;
		}
		entity.lv = lv;
		entity.exp = 0;
		entity.expMax = Math.round((Math.pow(expLv - 1, 3) + 60) / 20 * ((expLv - 1) * 5 + 10)) * 10;//升级经验所需经验值
		entity.hpMax = Math.pow(lv - 1, 2)*10  + lv * 200;
		entity.mcMax = entity.hpMax/2;//法力值
		entity.hp = entity.hpMax;
		entity.mc = entity.mcMax;//法力值
		entity.power = lv*2;
		entity.speed = 300+(lv - 1)*5;
		entity.atkSpeed = 100+(lv - 1)*5;
		entity.attack = (lv+50) * (lv - 1) + 100;
		entity.defense = (lv + 10) * (lv - 1) + 50;
		entity.crit = Math.round((lv + 1) * (lv - 1) / 2) + 10;//暴击
		entity.dodge = Math.round((lv + 1) * (lv - 1) / 5) + 10;//闪避
		return entity;
	},
	/**
	lv1:升级方
	lv2:目标方
	*/
	getExp:function(lv1,lv2){
		let abs = Math.abs(lv1-lv2);
		let res = 1/(abs+1)*lv1*50;
		return Math.round(res);
	},
	/**
	角色升级获得base属性
	*/
	upgradeBase:function(base,lv){
		let entity = this.entity(lv);
		base.lv = lv;
		base.expMax = entity.expMax;
		base.hp = entity.hp;
		base.hpMax = entity.hp;
		base.mc= entity.mc;
		base.mcMax= entity.mc;
		base.speed = entity.speed;
		base.exp = 0;
		base.expMax = entity.expMax;
	},
	/**
	角色升级获得ability属性
	*/
	upgradeAbility:function(ability,lv){
		let entity = this.entity(lv);
		ability.power = entity.power;
		ability.atkSpeed = entity.atkSpeed;
		ability.attack = entity.attack;
		ability.defense = entity.defense;
		ability.crit = entity.crit;//暴击
		ability.dodge = entity.dodge;//闪避
	},
	/**
	* 技能伤害计算公式（skill。ai = 1 向目标作用的技能）
	* mUser
	* tUser
	* data:skill ability
	*/
	damageFormula:function(mUser,tUser,data){
		let mBase = mUser.base;
		let tBase = tUser.base;
		let sk = data.sk;
		
		//定义伤害计算结果
		/**
		type:战斗类型
		value:战斗是显示的值
		*/
		mUser.damageMsg = {};
		tUser.damageMsg = {};
		
		//获得释放的技能信息
		let skill = func.get(glb.o.skills,sk);
		if(0 == skill.ai){//对自己释放的技能没有忽略（穿透）属性
			if(mUser.conid != tUser.conid){
				mUser.damageMsg.type = '-1';
				return "释放目标只能是自己";
			}
		}else{
			if(mUser.conid == tUser.conid){
				mUser.damageMsg.type = '-1';
				return "释放目标不能是自己";
			}else{
				if(tBase.hp<=0){
					mUser.damageMsg.type = '-1';
					return "对方hp为0，不能受到攻击";
				}
			}
		}
		
		let buffEfRes = this.buffEffectCheck(mUser,tUser);
		// ck start
		if(buffEfRes.invincible){
			tUser.damageMsg.type = 'invincible';
			return 'invincible';//无敌
		}
		if(buffEfRes.nohit){
			tUser.damageMsg.type = 'nohit';
			return 'nohit';//未命中
		}
		//命中前计算buff加成后的战斗属性
		this.battleAttriCal(mUser);
		this.battleAttriCal(tUser);
		let m = mUser.battleAttri;
		let t = tUser.battleAttri;
		/**
			piercedf:忽视防御
			piercedodge:忽视闪避
		*/
		let skillEfRes = this.skillEffectCheck(sk);
		/**
		* 1闪避计算（含技能加成）
		* 命中：保存命中率，即为加权值
		* 未命中：结束，并返回未命中状态
		*/
		let dodgeRatio =  0;
		if(skillEfRes.piercedodge){//忽视闪避
			dodgeRatio = 2;
		}else {
			dodgeRatio = this.dodgeProba(m.dodge,t.dodge);
			if(dodgeRatio == 0){
				tUser.damageMsg.type = 'nohit';
				return 'nohit';//未命中
			}
		}
		//计算效果及buffs
		this.skillEffectHandle(mUser,tUser,sk,buffEfRes);
		//命中后计算敌人buff加成后的战斗属性
		this.battleAttriCal(tUser);
		t = tUser.battleAttri;
		/**
		* 2暴击计算（含技能加成）
		* 命中：保存命中率，即为加权值
		* 未命中：保存命中率，命中率为0
		*/
		let crit =  this.critDamage(dodgeRatio,m.crit);
		//console.log('crit',crit);
		/**
		* 3伤害计算（含技能加成）
		*  ===〉计算目标的伤害反弹（以后可以考虑加入镜反属性，即以敌方攻击为基础值，直接反弹）
		*   说明
		*   	触发伤害反弹，自己受到同样的伤害
		*   	根据反弹值计算反弹的触发比率TODO
		*   	根据反弹值反弹一部分伤害给发动技能者
		*   计算
		* 		定义：a：攻击方，b：目标方，
		*			  c：承受伤害值(由目标角色的防御与血作为基础值，即能承受的最大伤害)，
		*			  D；基础伤害值（伤害反弹比率，用来计算反弹多少的伤害）
		* 		详细：a的伤害（攻击与暴击计算得出）小于b的最大承受伤害，那吗a的伤害为基础值，反之为b的承受为基础值
		* 		TODO：伤害反弹是否做概率触发，还是100%触发
		*  ===〉计算目标的伤害减免
		*   说明
		*   	根据减免值计算减免的触发比率TODO
		*   	根据减免值减少一部分伤害
		*   计算
		* 		定义：a：攻击方，b：目标方
		*			  c：减免不能大于80%
		*			  D；基础值（减免基础值）
		* 		详细：无视其它属性，直接减免a的伤害
		* 		TODO：伤害反弹是否做概率触发，还是100%触发
		*/
		let sumDamage = m.attack + crit;
		//console.log('sumDamage',sumDamage);
		//伤害反弹
		let dreboundDamage =  this.dreboundProba(dodgeRatio,t.drebound,sumDamage);
		//console.log('dreboundDamage',dreboundDamage);
		mBase.hp -= Math.floor(dreboundDamage);
		if(Math.floor(dreboundDamage)>0){
			mUser.damageMsg.type = "dreboundDamage";//伤害反弹
			mUser.damageMsg.value = -Math.floor(dreboundDamage);
		}
		if(mBase.hp < 0 ){
			mBase.hp = 0;
		}
		//伤害减免
		let dreductionDamage =  this.dreductionProba(t.dreduction,sumDamage);
		//console.log('dreductionDamage',dreductionDamage);
		sumDamage = sumDamage - dreductionDamage;
		//console.log('sumDamage',sumDamage);
		//判断是否忽视防御
		let tdf = t.defense;
		if(skillEfRes.piercedf){
			tdf = 0;
		}
		//防御计算
		sumDamage = this.defenseDamage(dodgeRatio,tdf,sumDamage);
		//console.log('sumDamage',sumDamage);
		tBase.hp -= Math.floor(sumDamage);
		tUser.damageMsg.type = "damage";//伤害
		tUser.damageMsg.value = -Math.floor(sumDamage);
		if(tBase.hp < 0 ){
			tBase.hp = 0;
		}
		return 0;
	},
	/**
	* 计算各种效果，药品加成后的战斗属性
	battleAttri:{
		hp:entity.hp,
		mc:entity.mc,
		speed:entity.speed,
		power:entity.power,
		atkSpeed:entity.atkSpeed,
		attack:entity.attack,
		defense:entity.defense,
		crit:entity.crit,//暴击
		dodge:entity.dodge,//闪避
		drebound:0,//伤害反弹
		dreduction:0,//伤害减免
	}
	*/
	battleAttriCal:function(user){
		if(!user.battleAttri){
			user.battleAttri = {
				hp:user.base.hp,
				mc:user.base.mc,
				speed:user.base.speed,
				power:user.ability.power,
				atkSpeed:user.ability.atkSpeed,
				attack:user.ability.attack,
				defense:user.ability.defense,
				crit:user.ability.crit,//暴击
				dodge:user.ability.dodge,//闪避
				drebound:user.ability.drebound,//伤害反弹
				dreduction:user.ability.dreduction,//伤害减免
			};
		}
		let attri = user.battleAttri;
		if(!func.isEmptyObj(user.effects)){
			//遍历buff效果
			for(let o in user.effects){
				let ef = user.effects[o];//获取buff效果影响值
				switch(o){
					case 'hp'://+加/-减血
						attri.hp = this.battleAttriValueCal(attri.hp,ef);
						break;
					case 'mc'://加/减魔法值
						attri.mc = this.battleAttriValueCal(attri.mc,ef);
						break;
					case 'atk'://加/减攻击
						attri.atk = this.battleAttriValueCal(attri.atk,ef);
						break;
					case 'df'://加/减防御
						attri.df = this.battleAttriValueCal(attri.df,ef);
						break;
					case 'crit'://加/减暴击
						attri.crit = this.battleAttriValueCal(attri.crit,ef);
						break;
					case 'dodge'://加/减闪避
						attri.dodge = this.battleAttriValueCal(attri.dodge,ef);
						break;
				}
			}
		}
	},
	battleAttriValueCal:function(v,ef){
		let p = 0;
		for(let i in ef){
			p += ef[i]
		}
		return  Math.floor(v*(1+p));
	},
	/**
	* 闪避计算公式
	* v1:攻击方的闪避
	* v2:目标方的闪避
	*/
	dodgeProba:function(v1,v2){
		let sc = 1;
		let result = 0;
		if(v2==0){
			v2 = 1;
		}
		if(v1>=v2){
			let l = Math.floor(v1/v2).toString().length;
			result = 1 + (v1 - v2) / v1;
			//闪避比例大于100倍，命中率100%
			//闪避比例小于100倍，根据比例降低命中率
			if(l<3){
				sc = v1/v2;
				if(sc<10){
					sc = 10;
				}
				if(this.probability(sc)){
					result = 0;
				}
			}
		}else{
			sc = v2/v1+0.1;
			if(this.probability(sc)){
				result = v1/v2;
			}
		}
		return result;
	},
	/**
	* 暴击计算公式
	* dodge：闪避率
	* crit:暴击
	*/
	critDamage:function(dodge,crit){
		let sc = (2.5-dodge)*5;//sc越大，越容易触发暴击
		let result = 0;
		if(this.probability(sc)){
			result = crit*this.luckRate(5);
		}
		return result;
	},
	/**
	* 伤害反弹计算公式
	* dodge：闪避率，用以闪避掉被反弹的伤害
	* drebound：伤害反弹，反弹的伤害
	* damage：伤害
	*/
	dreboundProba:function(dodge,drebound,damage){
		let result = 0;
		if(drebound == 0){
			return result;
		}
		let sc = dodge*2;//sc越大，越容易闪避掉反弹的伤害
		
		//计算释放命中
		if(this.probability(sc)){
			result = damage*drebound/100*this.luckRate(5);
		}
		return result;
	},
	/**
	* 伤害减免计算公式
	* dodge：闪避率，用以闪避掉被减免的伤害
	* dreduction：伤害减免计
	* damage：伤害
	*/
	dreductionProba:function(dreduction,damage){
		if(dreduction == 0){
			return 0;
		}
		return damage*dreduction/100*this.luckRate(5);
	},
	/**
	* 防御计算
	* 防御最多只能抗掉80%伤害
	* 防御伤害时会有炸裂伤害
	* return：防御后剩余的伤害
	*/
	defenseDamage:function(dodge,defense,damage){
		let result = 0;
		let sc = (5-dodge)*10;//sc越大，越容易闪避掉反弹的伤害
		let defHurt = 0;
		
		//计算命中，命中后防御无效
		if(this.probability(sc)){
			result = damage*0.8;
		}else{
			result = damage*0.8-defense;
			if(result<0){
				defHurt =damage*0.8*Math.random()/10;
				result = defHurt;
			}else{
				defHurt =defense*Math.random()/5;
				result = result + defHurt;
			}
		}
		result = result + damage*0.2;
		return result;
	},
	/**
	* 幸运权重值，左右数值输出比例
	*/
	luckRate:function(weight){
		return 1-Math.random()/weight;
	},
	//概率
	probability:function(scale){
		let p = Math.random()*scale;
		if(p<1){
			return true;
		}
		return false;
	},
	/**
	* 计算忍术特性，是否是忽略闪避/防御的
	*/
	skillEffectCheck:function(sk){
		//获得释放的技能信息
		let skill = func.get(glb.o.skills,sk);
		if(0 == skill.ai){//对自己释放的技能没有忽略（穿透）属性
			return false;
		}
		let result = {};
		let effects = skill.efs;
		if(!func.isEmptyObj(skill.efs)){
			//遍历技能效果
			for(let o in skill.efs){
				//let ef = skill.efs[o];//获取buff效果影响值
				/**
					TODO以后可以算穿透百分比，现在都按100%算
					piercedf:忽视防御
					piercedodge:忽视闪避
				*/
				switch(o){
					case 'piercedf' :
						result[o] = true;
						break;
					case 'piercedodge' :
						result[o] = true;
						break;
				}
			}
		}
		if(func.isEmptyObj(result)){
			return false;
		}
		return result;
	},
	/**
	* 计算buff特性，是否是不能闪避/防御的
	*/
	buffEffectCheck:function(mu,mt){
		let result = {};
		/** 
			检查技能释放者是否有xuzuo带来的属性=〉
			pierce:忽视所有防御，闪避
			piercedf:忽视防御
			piercedodge:忽视闪避
		*/
		if(!func.isEmptyObj(mu.effects)){
			//遍历技能效果
			for(let o in mu.effects){
				//let ef = skill.efs[o];//获取buff效果影响值
				/**
					TODO以后可以算穿透百分比，现在都按100%算
					pierce:忽视所有防御，闪避
					piercedf:忽视防御
					piercedodge:忽视闪避
				*/
				switch(o){
					case 'pierce' :
						result[o] = true;
						break;
					case 'piercedf' :
						result[o] = true;
						break;
					case 'piercedodge' :
						result[o] = true;
						break;
				}
			}
		}
		/** 
			检查技能目标者是否有xuzuo带来的属性=〉
			invincible:无敌
			nohit:不能被命中
			noskill:无视技能攻击
		*/
		if(!func.isEmptyObj(mt.effects)){
			//遍历技能效果
			for(let o in mt.effects){
				//let ef = skill.efs[o];//获取buff效果影响值
				/**
					TODO以后可以算穿透百分比，现在都按100%算
					invincible:无敌
					nohit:不能被命中
					noskill:免疫技能效果
				*/
				switch(o){
					case 'invincible' :
						result[o] = true;
						break;
					case 'nohit' :
						result[o] = true;
						break;
					case 'noskill' :
						result[o] = true;
						break;
				}
			}
		}
		if(func.isEmptyObj(result)){
			return false;
		}
		return result;
	},
	/**
	* mu : 释放技能方
	* mt : 向谁释放技能
	* data : 技能信息
	*/
	skillEffectHandle:function(mu,mt,sk,buffEfRes){
		//获得释放的技能信息
		let skill = glb.get(glb.o.skills,sk);
		let buffs = {};
		let effects = {};
		let timers = mu.timers;
		let isLimit = false;
		//计算攻击者与目标的技能等级比（技能克制属性，），TODO
		if(!buffEfRes.noskill && undefined!=mu.skills[sk]){
			let mulv = mu.skills[sk];
			let mtlv = 0;
			if(undefined!=mt.skills[sk]){
				mtlv = mt.skills[sk];
			}
			if(mulv > mtlv){
				isLimit = false;
			}else if(mulv < mtlv){
				isLimit = true;
			}else if(this.probability(2)){
				isLimit = true;
			}
			//有50分之一的概率反转
			if(this.probability(50)){
				isLimit = isLimit?false:true;
			}
		}
		//目标有免疫机能效果则不计算效果
		if(!buffEfRes.noskill && !isLimit){
			/*if(0 == skill.ai){
				buffs = mu.buffs;
				effects = mu.effects;
			}else if(1 == skill.ai){
				buffs = mt.buffs;
				effects = mt.effects;
			}*/
			buffs = mt.buffs;
			effects = mt.effects;
			this.skillBuffCal(buffs,sk,mt);
			this.skillEffectCal(effects,sk,mt);
		}
		this.skillTimerCal(timers,sk,mu);
	},
	skillBuffCal:function(buffs,sk,mt){
		//获得释放的技能信息
		let skill = glb.get(glb.o.skills,sk);
		let curTime = new Date().getTime();
		//技能效果剩余时间 min：0s，max43200s（12h）
		let lastTime = skill.dt*mt.skills[sk];
		if(lastTime<0){
			lastTime = 0;
		}else if(lastTime>43200){
			lastTime = 43200;
		}
		//技能结束时间
		let endTime = curTime+lastTime*1000;
		let type = 's';
		let bk = type +'_'+sk;//buff 主键
		let buff = {t:type,k:sk,et:endTime};
		buffs[bk] = buff;
	},
	skillEffectCal:function(effects,sk,mt){
		//获得释放的技能信息
		let skill = glb.get(glb.o.skills,sk);
		let bk = 's_'+sk;//buff 主键
		//判断忍术是否有技能buff效果
		if(!func.isEmptyObj(skill.efs)){
			//遍历技能效果
			for(let o in skill.efs){
				let ef = skill.efs[o];//获取buff效果影响值
				//判断目标玩家又有没当前buff效果TODO需要做一个技能效果计算处理方法，用来计算技能效果值
				this.effectCal(effects,bk,o,ef,mt.skills[sk]);
			}
		}
	},
	skillTimerCal:function(timers,sk,mu){
		//获得释放的技能信息
		let skill = glb.get(glb.o.skills,sk);
		let curTime = new Date().getTime();
		//经过计算，给目标产生效果（记录当前技能的buff效果）
		//技能冷却时间 min：1s，max600s
		let coolTime = skill.ct + mu.skills[sk]*skill.step;
		if(coolTime<1){
			coolTime = 1;
		}else if(coolTime>600){
			coolTime = 600;
		}
		//技能结束时间
		let endTime = curTime+coolTime*1000;
		let type = 's';
		let bk = type+'_'+sk;//buff 主键
		let timer = {t:type,k:sk,et:endTime};
		timers[bk] = timer;
	},
	/**
	* 计算兵记录玩家所有buff的实际效果
	* effects : 角色效果属性集合
	* bk : 效果主键
	* ef : 效果名
	* efv : 效果值
	* lv : 技能等级
	*/
	effectCal:function(effects,bk,ef,efv,lv){
		let curef = {};
		if(func.isEmptyObj(effects[ef])){
			effects[ef] = curef;
		}else{
			curef = effects[ef];
		}
		switch(ef){
			/**不同技能可以叠加效果，相同技能则替换效果*/
			case 'hp'://+加/-减血
			case 'mc'://加/减魔法值
			case 'atk'://加/减攻击
			case 'df'://加/减防御
			case 'crit'://加/减暴击
			case 'dodge'://加/减闪避
				curef[bk] = efv * lv;
				break;
			case 'seal'://不能做任何操作（定身）
			case 'sealme'://不能移动
			case 'sealmc'://不能释放技能，可以普攻
			case 'sealatk'://不能攻击
			case 'sealdf'://不能防御
			case 'sealdodge'://不能闪避
			case 'sealhp'://不能加血
			case 'invincible'://无敌
			case 'nohit'://不能被命中
			case 'noskill'://无视技能攻击
			case 'bouncedamage'://100%反弹伤害
				curef[bk] = 1;
				break;
			default:
				delete effects[ef];
				break;
		}
	},
}
