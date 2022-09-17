const glb = require("./glb");
const func = require("./func");
/**
* formula
* TOTO:��ʽ���һЩ������Ҫ�ŵ����ݿ���
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
		entity.expMax = Math.round((Math.pow(expLv - 1, 3) + 60) / 20 * ((expLv - 1) * 5 + 10)) * 10;//�����������辭��ֵ
		entity.hpMax = Math.pow(lv - 1, 2)*10  + lv * 200;
		entity.mcMax = entity.hpMax/2;//����ֵ
		entity.hp = entity.hpMax;
		entity.mc = entity.mcMax;//����ֵ
		entity.power = lv*2;
		entity.speed = 300+(lv - 1)*5;
		entity.atkSpeed = 100+(lv - 1)*5;
		entity.attack = (lv+50) * (lv - 1) + 100;
		entity.defense = (lv + 10) * (lv - 1) + 50;
		entity.crit = Math.round((lv + 1) * (lv - 1) / 2) + 10;//����
		entity.dodge = Math.round((lv + 1) * (lv - 1) / 5) + 10;//����
		return entity;
	},
	/**
	lv1:������
	lv2:Ŀ�귽
	*/
	getExp:function(lv1,lv2){
		let abs = Math.abs(lv1-lv2);
		let res = 1/(abs+1)*lv1*50;
		return Math.round(res);
	},
	/**
	��ɫ�������base����
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
	��ɫ�������ability����
	*/
	upgradeAbility:function(ability,lv){
		let entity = this.entity(lv);
		ability.power = entity.power;
		ability.atkSpeed = entity.atkSpeed;
		ability.attack = entity.attack;
		ability.defense = entity.defense;
		ability.crit = entity.crit;//����
		ability.dodge = entity.dodge;//����
	},
	/**
	* �����˺����㹫ʽ��skill��ai = 1 ��Ŀ�����õļ��ܣ�
	* mUser
	* tUser
	* data:skill ability
	*/
	damageFormula:function(mUser,tUser,data){
		let mBase = mUser.base;
		let tBase = tUser.base;
		let sk = data.sk;
		
		//�����˺�������
		/**
		type:ս������
		value:ս������ʾ��ֵ
		*/
		mUser.damageMsg = {};
		tUser.damageMsg = {};
		
		//����ͷŵļ�����Ϣ
		let skill = func.get(glb.o.skills,sk);
		if(0 == skill.ai){//���Լ��ͷŵļ���û�к��ԣ���͸������
			if(mUser.conid != tUser.conid){
				mUser.damageMsg.type = '-1';
				return "�ͷ�Ŀ��ֻ�����Լ�";
			}
		}else{
			if(mUser.conid == tUser.conid){
				mUser.damageMsg.type = '-1';
				return "�ͷ�Ŀ�겻�����Լ�";
			}else{
				if(tBase.hp<=0){
					mUser.damageMsg.type = '-1';
					return "�Է�hpΪ0�������ܵ�����";
				}
			}
		}
		
		let buffEfRes = this.buffEffectCheck(mUser,tUser);
		// ck start
		if(buffEfRes.invincible){
			tUser.damageMsg.type = 'invincible';
			return 'invincible';//�޵�
		}
		if(buffEfRes.nohit){
			tUser.damageMsg.type = 'nohit';
			return 'nohit';//δ����
		}
		//����ǰ����buff�ӳɺ��ս������
		this.battleAttriCal(mUser);
		this.battleAttriCal(tUser);
		let m = mUser.battleAttri;
		let t = tUser.battleAttri;
		/**
			piercedf:���ӷ���
			piercedodge:��������
		*/
		let skillEfRes = this.skillEffectCheck(sk);
		/**
		* 1���ܼ��㣨�����ܼӳɣ�
		* ���У����������ʣ���Ϊ��Ȩֵ
		* δ���У�������������δ����״̬
		*/
		let dodgeRatio =  0;
		if(skillEfRes.piercedodge){//��������
			dodgeRatio = 2;
		}else {
			dodgeRatio = this.dodgeProba(m.dodge,t.dodge);
			if(dodgeRatio == 0){
				tUser.damageMsg.type = 'nohit';
				return 'nohit';//δ����
			}
		}
		//����Ч����buffs
		this.skillEffectHandle(mUser,tUser,sk,buffEfRes);
		//���к�������buff�ӳɺ��ս������
		this.battleAttriCal(tUser);
		t = tUser.battleAttri;
		/**
		* 2�������㣨�����ܼӳɣ�
		* ���У����������ʣ���Ϊ��Ȩֵ
		* δ���У����������ʣ�������Ϊ0
		*/
		let crit =  this.critDamage(dodgeRatio,m.crit);
		//console.log('crit',crit);
		/**
		* 3�˺����㣨�����ܼӳɣ�
		*  ===������Ŀ����˺��������Ժ���Կ��Ǽ��뾵�����ԣ����Եз�����Ϊ����ֵ��ֱ�ӷ�����
		*   ˵��
		*   	�����˺��������Լ��ܵ�ͬ�����˺�
		*   	���ݷ���ֵ���㷴���Ĵ�������TODO
		*   	���ݷ���ֵ����һ�����˺�������������
		*   ����
		* 		���壺a����������b��Ŀ�귽��
		*			  c�������˺�ֵ(��Ŀ���ɫ�ķ�����Ѫ��Ϊ����ֵ�����ܳ��ܵ�����˺�)��
		*			  D�������˺�ֵ���˺��������ʣ��������㷴�����ٵ��˺���
		* 		��ϸ��a���˺��������뱩������ó���С��b���������˺�������a���˺�Ϊ����ֵ����֮Ϊb�ĳ���Ϊ����ֵ
		* 		TODO���˺������Ƿ������ʴ���������100%����
		*  ===������Ŀ����˺�����
		*   ˵��
		*   	���ݼ���ֵ�������Ĵ�������TODO
		*   	���ݼ���ֵ����һ�����˺�
		*   ����
		* 		���壺a����������b��Ŀ�귽
		*			  c�����ⲻ�ܴ���80%
		*			  D������ֵ���������ֵ��
		* 		��ϸ�������������ԣ�ֱ�Ӽ���a���˺�
		* 		TODO���˺������Ƿ������ʴ���������100%����
		*/
		let sumDamage = m.attack + crit;
		//console.log('sumDamage',sumDamage);
		//�˺�����
		let dreboundDamage =  this.dreboundProba(dodgeRatio,t.drebound,sumDamage);
		//console.log('dreboundDamage',dreboundDamage);
		mBase.hp -= Math.floor(dreboundDamage);
		if(Math.floor(dreboundDamage)>0){
			mUser.damageMsg.type = "dreboundDamage";//�˺�����
			mUser.damageMsg.value = -Math.floor(dreboundDamage);
		}
		if(mBase.hp < 0 ){
			mBase.hp = 0;
		}
		//�˺�����
		let dreductionDamage =  this.dreductionProba(t.dreduction,sumDamage);
		//console.log('dreductionDamage',dreductionDamage);
		sumDamage = sumDamage - dreductionDamage;
		//console.log('sumDamage',sumDamage);
		//�ж��Ƿ���ӷ���
		let tdf = t.defense;
		if(skillEfRes.piercedf){
			tdf = 0;
		}
		//��������
		sumDamage = this.defenseDamage(dodgeRatio,tdf,sumDamage);
		//console.log('sumDamage',sumDamage);
		tBase.hp -= Math.floor(sumDamage);
		tUser.damageMsg.type = "damage";//�˺�
		tUser.damageMsg.value = -Math.floor(sumDamage);
		if(tBase.hp < 0 ){
			tBase.hp = 0;
		}
		return 0;
	},
	/**
	* �������Ч����ҩƷ�ӳɺ��ս������
	battleAttri:{
		hp:entity.hp,
		mc:entity.mc,
		speed:entity.speed,
		power:entity.power,
		atkSpeed:entity.atkSpeed,
		attack:entity.attack,
		defense:entity.defense,
		crit:entity.crit,//����
		dodge:entity.dodge,//����
		drebound:0,//�˺�����
		dreduction:0,//�˺�����
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
				crit:user.ability.crit,//����
				dodge:user.ability.dodge,//����
				drebound:user.ability.drebound,//�˺�����
				dreduction:user.ability.dreduction,//�˺�����
			};
		}
		let attri = user.battleAttri;
		if(!func.isEmptyObj(user.effects)){
			//����buffЧ��
			for(let o in user.effects){
				let ef = user.effects[o];//��ȡbuffЧ��Ӱ��ֵ
				switch(o){
					case 'hp'://+��/-��Ѫ
						attri.hp = this.battleAttriValueCal(attri.hp,ef);
						break;
					case 'mc'://��/��ħ��ֵ
						attri.mc = this.battleAttriValueCal(attri.mc,ef);
						break;
					case 'atk'://��/������
						attri.atk = this.battleAttriValueCal(attri.atk,ef);
						break;
					case 'df'://��/������
						attri.df = this.battleAttriValueCal(attri.df,ef);
						break;
					case 'crit'://��/������
						attri.crit = this.battleAttriValueCal(attri.crit,ef);
						break;
					case 'dodge'://��/������
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
	* ���ܼ��㹫ʽ
	* v1:������������
	* v2:Ŀ�귽������
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
			//���ܱ�������100����������100%
			//���ܱ���С��100�������ݱ�������������
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
	* �������㹫ʽ
	* dodge��������
	* crit:����
	*/
	critDamage:function(dodge,crit){
		let sc = (2.5-dodge)*5;//scԽ��Խ���״�������
		let result = 0;
		if(this.probability(sc)){
			result = crit*this.luckRate(5);
		}
		return result;
	},
	/**
	* �˺��������㹫ʽ
	* dodge�������ʣ��������ܵ����������˺�
	* drebound���˺��������������˺�
	* damage���˺�
	*/
	dreboundProba:function(dodge,drebound,damage){
		let result = 0;
		if(drebound == 0){
			return result;
		}
		let sc = dodge*2;//scԽ��Խ�������ܵ��������˺�
		
		//�����ͷ�����
		if(this.probability(sc)){
			result = damage*drebound/100*this.luckRate(5);
		}
		return result;
	},
	/**
	* �˺�������㹫ʽ
	* dodge�������ʣ��������ܵ���������˺�
	* dreduction���˺������
	* damage���˺�
	*/
	dreductionProba:function(dreduction,damage){
		if(dreduction == 0){
			return 0;
		}
		return damage*dreduction/100*this.luckRate(5);
	},
	/**
	* ��������
	* �������ֻ�ܿ���80%�˺�
	* �����˺�ʱ����ը���˺�
	* return��������ʣ����˺�
	*/
	defenseDamage:function(dodge,defense,damage){
		let result = 0;
		let sc = (5-dodge)*10;//scԽ��Խ�������ܵ��������˺�
		let defHurt = 0;
		
		//�������У����к������Ч
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
	* ����Ȩ��ֵ��������ֵ�������
	*/
	luckRate:function(weight){
		return 1-Math.random()/weight;
	},
	//����
	probability:function(scale){
		let p = Math.random()*scale;
		if(p<1){
			return true;
		}
		return false;
	},
	/**
	* �����������ԣ��Ƿ��Ǻ�������/������
	*/
	skillEffectCheck:function(sk){
		//����ͷŵļ�����Ϣ
		let skill = func.get(glb.o.skills,sk);
		if(0 == skill.ai){//���Լ��ͷŵļ���û�к��ԣ���͸������
			return false;
		}
		let result = {};
		let effects = skill.efs;
		if(!func.isEmptyObj(skill.efs)){
			//��������Ч��
			for(let o in skill.efs){
				//let ef = skill.efs[o];//��ȡbuffЧ��Ӱ��ֵ
				/**
					TODO�Ժ�����㴩͸�ٷֱȣ����ڶ���100%��
					piercedf:���ӷ���
					piercedodge:��������
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
	* ����buff���ԣ��Ƿ��ǲ�������/������
	*/
	buffEffectCheck:function(mu,mt){
		let result = {};
		/** 
			��鼼���ͷ����Ƿ���xuzuo����������=��
			pierce:�������з���������
			piercedf:���ӷ���
			piercedodge:��������
		*/
		if(!func.isEmptyObj(mu.effects)){
			//��������Ч��
			for(let o in mu.effects){
				//let ef = skill.efs[o];//��ȡbuffЧ��Ӱ��ֵ
				/**
					TODO�Ժ�����㴩͸�ٷֱȣ����ڶ���100%��
					pierce:�������з���������
					piercedf:���ӷ���
					piercedodge:��������
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
			��鼼��Ŀ�����Ƿ���xuzuo����������=��
			invincible:�޵�
			nohit:���ܱ�����
			noskill:���Ӽ��ܹ���
		*/
		if(!func.isEmptyObj(mt.effects)){
			//��������Ч��
			for(let o in mt.effects){
				//let ef = skill.efs[o];//��ȡbuffЧ��Ӱ��ֵ
				/**
					TODO�Ժ�����㴩͸�ٷֱȣ����ڶ���100%��
					invincible:�޵�
					nohit:���ܱ�����
					noskill:���߼���Ч��
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
	* mu : �ͷż��ܷ�
	* mt : ��˭�ͷż���
	* data : ������Ϣ
	*/
	skillEffectHandle:function(mu,mt,sk,buffEfRes){
		//����ͷŵļ�����Ϣ
		let skill = glb.get(glb.o.skills,sk);
		let buffs = {};
		let effects = {};
		let timers = mu.timers;
		let isLimit = false;
		//���㹥������Ŀ��ļ��ܵȼ��ȣ����ܿ������ԣ�����TODO
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
			//��50��֮һ�ĸ��ʷ�ת
			if(this.probability(50)){
				isLimit = isLimit?false:true;
			}
		}
		//Ŀ�������߻���Ч���򲻼���Ч��
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
		//����ͷŵļ�����Ϣ
		let skill = glb.get(glb.o.skills,sk);
		let curTime = new Date().getTime();
		//����Ч��ʣ��ʱ�� min��0s��max43200s��12h��
		let lastTime = skill.dt*mt.skills[sk];
		if(lastTime<0){
			lastTime = 0;
		}else if(lastTime>43200){
			lastTime = 43200;
		}
		//���ܽ���ʱ��
		let endTime = curTime+lastTime*1000;
		let type = 's';
		let bk = type +'_'+sk;//buff ����
		let buff = {t:type,k:sk,et:endTime};
		buffs[bk] = buff;
	},
	skillEffectCal:function(effects,sk,mt){
		//����ͷŵļ�����Ϣ
		let skill = glb.get(glb.o.skills,sk);
		let bk = 's_'+sk;//buff ����
		//�ж������Ƿ��м���buffЧ��
		if(!func.isEmptyObj(skill.efs)){
			//��������Ч��
			for(let o in skill.efs){
				let ef = skill.efs[o];//��ȡbuffЧ��Ӱ��ֵ
				//�ж�Ŀ���������û��ǰbuffЧ��TODO��Ҫ��һ������Ч�����㴦�������������㼼��Ч��ֵ
				this.effectCal(effects,bk,o,ef,mt.skills[sk]);
			}
		}
	},
	skillTimerCal:function(timers,sk,mu){
		//����ͷŵļ�����Ϣ
		let skill = glb.get(glb.o.skills,sk);
		let curTime = new Date().getTime();
		//�������㣬��Ŀ�����Ч������¼��ǰ���ܵ�buffЧ����
		//������ȴʱ�� min��1s��max600s
		let coolTime = skill.ct + mu.skills[sk]*skill.step;
		if(coolTime<1){
			coolTime = 1;
		}else if(coolTime>600){
			coolTime = 600;
		}
		//���ܽ���ʱ��
		let endTime = curTime+coolTime*1000;
		let type = 's';
		let bk = type+'_'+sk;//buff ����
		let timer = {t:type,k:sk,et:endTime};
		timers[bk] = timer;
	},
	/**
	* �������¼�������buff��ʵ��Ч��
	* effects : ��ɫЧ�����Լ���
	* bk : Ч������
	* ef : Ч����
	* efv : Ч��ֵ
	* lv : ���ܵȼ�
	*/
	effectCal:function(effects,bk,ef,efv,lv){
		let curef = {};
		if(func.isEmptyObj(effects[ef])){
			effects[ef] = curef;
		}else{
			curef = effects[ef];
		}
		switch(ef){
			/**��ͬ���ܿ��Ե���Ч������ͬ�������滻Ч��*/
			case 'hp'://+��/-��Ѫ
			case 'mc'://��/��ħ��ֵ
			case 'atk'://��/������
			case 'df'://��/������
			case 'crit'://��/������
			case 'dodge'://��/������
				curef[bk] = efv * lv;
				break;
			case 'seal'://�������κβ���������
			case 'sealme'://�����ƶ�
			case 'sealmc'://�����ͷż��ܣ������չ�
			case 'sealatk'://���ܹ���
			case 'sealdf'://���ܷ���
			case 'sealdodge'://��������
			case 'sealhp'://���ܼ�Ѫ
			case 'invincible'://�޵�
			case 'nohit'://���ܱ�����
			case 'noskill'://���Ӽ��ܹ���
			case 'bouncedamage'://100%�����˺�
				curef[bk] = 1;
				break;
			default:
				delete effects[ef];
				break;
		}
	},
}
