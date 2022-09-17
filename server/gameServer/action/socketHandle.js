const glb = require("../const/glb");
/**
 * �����࣬�ṩ��Ϣ���պͷ��ͽӿ�
 * @class Server
 */
class SocketHandle {
    /**
     * Creates an instance of Server.
     * @param {string} url ���������ַ
     * @memberof Server
     */
    constructor(io,nsp,socket) {
		//��socket����
        this.io = io;
        this.nsp = nsp;
        this.socket = socket;
		this.id = glb.connId(socket.id);
		this.rid = socket.id;
    }
	
    /**
     * ������Ϣ
	 * �������ͣ������Լ�������Ϣ
     * @param {Object} msg
     * @param {number} cmd
     * @param {function} callback
     * @memberof RoomManager
     */
    sendMsg(type,data) {
        if (!this.isConnect()) {
            return ;
        }
		var msgData = {};
		msgData.type=type;
		msgData.data =data;
		
		this.socket.emit(type,JSON.stringify(msgData));
	}
	
    /**
     * ������Ϣ
	 * �������ͣ���ָ���ͻ��˷�����Ϣ
     * @param {Object} msg
     * @param {number} cmd
     * @param {function} callback
     * @memberof RoomManager
     */
    sendMsgTo(socketId,type,data) {
        if (!this.isConnect()) {
            return ;
        }
		var msgData = {};
		msgData.type=type;
		msgData.data =data;
		
		let targetSocket = this.io.sockets.connected[socketId];
		if (targetSocket) {
			targetSocket.emit(type,JSON.stringify(msgData));
		}
	}
	
    /**
	 * ȫ�ֹ㲥��Ϣ���������Լ���
     * @param {Object} msg
     * @param {number} cmd
     * @param {function} callback
     * @memberof RoomManager
     */
    broadcastToOther(type,data) {
        if (!this.isConnect()) {
            return ;
        }
		var msgData = {};
		msgData.type=type;
		msgData.data =data;
		
		this.socket.broadcast.emit(type,JSON.stringify(msgData));
	}
	
    /**
	 * �����ڹ㲥��Ϣ���������Լ���
     * @param {Object} msg
     * @param {number} cmd
     * @param {function} callback
     * @memberof RoomManager
     */
    roomBroadcastToOther(roomid,type,data) {
        if (!this.isConnect()) {
            return ;
        }
		var msgData = {};
		msgData.type=type;
		msgData.data =data;
		
		this.socket.broadcast.to(roomid).emit(type,JSON.stringify(msgData));
	}
	
    /**
	 * ȫ�ֹ㲥��Ϣ�������Լ���
     * @param {Object} msg
     * @param {number} cmd
     * @param {function} callback
     * @memberof RoomManager
     */
    broadcast(type,data) {
        if (!this.isConnect()) {
            return ;
        }
		var msgData = {};
		msgData.type=type;
		msgData.data =data;
		
		this.nsp.emit(type,JSON.stringify(msgData));
	}
	
    /**
	 * �����ڹ㲥��Ϣ�������Լ���
     * @param {Object} msg
     * @param {number} cmd
     * @param {function} callback
     * @memberof RoomManager
     */
    roomBroadcastTo(roomid,type,data) {
        if (!this.isConnect()) {
            return ;
        }
		var msgData = {};
		msgData.type=type;
		msgData.data =data;
		
		this.nsp.to(roomid).emit(type,JSON.stringify(msgData));
	}
	
	/**
     * ������Ϣ
     * @param {Object} msg
     * @param {number} cmd
     * @param {function} callback
     * @memberof RoomManager
     */
    onMsg(type, callback) {
        if (!this.isConnect()) {
            return ;
        }
		
        this.socket.on(type,(msg)=>{
            callback(msg);
		});
	}
	
	/**
     * ������Ϣ
     * @param {Object} msg
     * @param {number} cmd
     * @param {function} callback
     * @memberof RoomManager
     */
    onHandleMsg(type, callback) {
        if (!this.isConnect()) {
            return ;
        }
		var self = this;
		
        this.socket.on(type,(msg)=>{
			if(self.isNonLegal(msg)){
				return;
			}
			let data = JSON.parse(msg.data);
            callback(msg,data);
		});
	}
	
	disconnect(func){
		var self = this;
		this.socket.on('disconnect',function(){
			console.log('game => client:' + self.id +' disconnected');
			func();
		});
	}
	
    /**
	 * ��ҶϿ�����
	 * �����ڹ㲥��Ϣ���������Լ���
     * @param {Object} msg
     * @param {number} cmd
     * @param {function} callback
     * @memberof RoomManager
     */
    doDisconnect(roomid,type,data) {
		var self = this;
		this.socket.on('disconnect',function(){
			console.log('game => client:' + self.id +' disconnected');
			
			var msgData = {};
			msgData.type=type;
			msgData.data =data;
			
			self.socket.broadcast.to(roomid).emit(type,JSON.stringify(msgData));
		});
	}
	
	/**
	* ����socketid ǿ�ƹر�Ŀ��ͻ���
	*/
	forceDisconnect(socketId){
		let targetSocket = this.io.sockets.connected[socketId];
		if (targetSocket) {
			targetSocket.disconnect();
		}
	}
	
	isConnect(){
        if (typeof(this.socket) === 'undefined' || this.socket.disconnected) {
            return false;
        }
		return true;
	}
	
	/**
	*�Ƿ�Υ������
	*/
	isNonLegal(str){
		if(!str || !str.type || !str.data){
			return true;
		}
		return false;
	}
}

module.exports = SocketHandle;