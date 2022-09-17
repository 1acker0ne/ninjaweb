const glb = require("../const/glb");
const EventEmitter = require('events');

/**
 * �����࣬�ṩ��Ϣ���պͷ��ͽӿ�
 * @class Server
 */
class EventHandle {
    constructor() {
		this.event = new EventEmitter();
    }
	
	/**
	���¼���ע�ắ��
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
	���ݺ������Ͳ���ִ�к���
	*/
	emit(eventName,params){
		this.event.emit(eventName,params);
	}
}

module.exports = EventHandle;