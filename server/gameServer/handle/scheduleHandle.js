const glb = require("../const/glb");
const schedule = require('node-schedule');

/**
 * 服务类，提供消息接收和发送接口
 * @class Server
 */
class ScheduleHandle {
    constructor() {
		this.init();
    }
	
	init(){
		var self = this;
		//定时任务事件
		this.events = {};
		//定时任务函数
		this.timeEvents = {};
		this.scheduleCronstyle = ()=>{
		  //每秒定时执行一次:
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
	向定时任务添加要执行的方法名级参数
	nm:注册的函数名
	callback：没秒要执行的函数
	params：函数的参数{time:倒计时时间，func：倒计时结束时执行的函数}
	time：定时秒数，time为0则结束本次定时任务（一般定时结束执行回调函数）
	*/
	add(nm,callback,params){
		var o = {
			nm:nm,//函数名称
			params:params,//函数参数
		};
		//设置默认参数
		if(params){
			//设置倒计时时间
			if(params.time){
				o.time = params.time;
			}
			//设置倒计时结束时的回调函数
			if(params.func){
				o.func = params.func;
			}
		}
		//注册函数
		global.event.on(nm,callback);
		//把函数加入队列中
		this.events[nm] = o;
	}
	//执行倒计时任务
	addTime(nm,callback,time){
		var o = {
			nm:nm,//函数名称
			func:callback,//函数参数
			time:1//默认函数倒计时1秒，即默认执行一次
		};
		if(time){
			o.time = time;
		}
		//把函数加入队列中
		this.timeEvents[nm] = o;
	}
	
	//删除指定函数对象，即已经运行完的函数
	remove(nm){
		delete this.events[nm];
	}
	
	//删除指定函数对象，即已经运行完的函数
	removeTime(nm){
		delete this.timeEvents[nm];
	}
	
	run(){
		//遍历队列中要执行的函数
		for(let e in this.events){
			let o = this.events[e];
			//未设置时间，即一直执行
			if(!o.time){
				global.event.emit(o.nm,o.params);
			}else if(o.time <=0){
				//计算倒计时是否结束
				this.remove(o.nm);
			}else if(o.time>0){
				o.time--;
				//执行函数
				global.event.emit(o.nm,o.params);
			}
		}
		//遍历队列中要执行的函数
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