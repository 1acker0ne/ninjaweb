const glb = require("../const/glb");
const EventEmitter = require('events');

/**
 * 服务类，提供消息接收和发送接口
 * @class Server
 */
class EventHandle {
    constructor() {
		this.event = new EventEmitter();
    }
	
	/**
	向事件中注册函数
	*/
	on(eventName,callBack){
		this.event.on(eventName,function(params){
			if(params){
				callBack(params);
			}else{
				callBack();
			}
		});
	}
	
	/**
	根据函数名和参数执行函数
	*/
	emit(eventName,params){
		this.event.emit(eventName,params);
	}
}

module.exports = EventHandle;