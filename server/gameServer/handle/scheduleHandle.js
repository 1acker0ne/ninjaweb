const glb = require("../const/glb");
const schedule = require('node-schedule');

/**
 * �����࣬�ṩ��Ϣ���պͷ��ͽӿ�
 * @class Server
 */
class ScheduleHandle {
    constructor() {
		this.init();
    }
	
	init(){
		var self = this;
		//��ʱ�����¼�
		this.events = {};
		//��ʱ������
		this.timeEvents = {};
		this.scheduleCronstyle = ()=>{
		  //ÿ�붨ʱִ��һ��:
			schedule.scheduleJob('* * * * * *',()=>{
				self.run();
			}); 
		}
	}
	
	start(){
		this.scheduleCronstyle();
	}
	
	job(params,callback){
		schedule.scheduleJob(params,callback); 
	}
	
	/**
	��ʱ�������Ҫִ�еķ�����������
	nm:ע��ĺ�����
	callback��û��Ҫִ�еĺ���
	params�������Ĳ���{time:����ʱʱ�䣬func������ʱ����ʱִ�еĺ���}
	time����ʱ������timeΪ0��������ζ�ʱ����һ�㶨ʱ����ִ�лص�������
	*/
	add(nm,callback,params){
		var o = {
			nm:nm,//��������
			params:params,//��������
		};
		//����Ĭ�ϲ���
		if(params){
			//���õ���ʱʱ��
			if(params.time){
				o.time = params.time;
			}
			//���õ���ʱ����ʱ�Ļص�����
			if(params.func){
				o.func = params.func;
			}
		}
		//ע�ắ��
		global.event.on(nm,callback);
		//�Ѻ������������
		this.events[nm] = o;
	}
	//ִ�е���ʱ����
	addTime(nm,callback,time){
		var o = {
			nm:nm,//��������
			func:callback,//��������
			time:1//Ĭ�Ϻ�������ʱ1�룬��Ĭ��ִ��һ��
		};
		if(time){
			o.time = time;
		}
		//�Ѻ������������
		this.timeEvents[nm] = o;
	}
	
	//ɾ��ָ���������󣬼��Ѿ�������ĺ���
	remove(nm){
		delete this.events[nm];
	}
	
	//ɾ��ָ���������󣬼��Ѿ�������ĺ���
	removeTime(nm){
		delete this.timeEvents[nm];
	}
	
	run(){
		//����������Ҫִ�еĺ���
		for(let e in this.events){
			let o = this.events[e];
			//δ����ʱ�䣬��һֱִ��
			if(!o.time){
				global.event.emit(o.nm,o.params);
			}else if(o.time <=0){
				//���㵹��ʱ�Ƿ����
				this.remove(o.nm);
			}else if(o.time>0){
				o.time--;
				//ִ�к���
				global.event.emit(o.nm,o.params);
			}
		}
		//����������Ҫִ�еĺ���
		for(let e in this.timeEvents){
			let o = this.timeEvents[e];
			
			if(o.time <=0){
				o.func();
				this.removeTime(o.nm);
			}else if(o.time>0){
				o.time--;
			}
		}
	}
}

module.exports = ScheduleHandle;