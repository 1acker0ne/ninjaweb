const glb = require("../const/glb");
/**
 * 服务类，提供消息接收和发送接口
 * @class Server
 */
class SocketHandle {
    /**
     * Creates an instance of Server.
     * @param {string} url 服务监听地址
     * @memberof Server
     */
    constructor(io,nsp,socket) {
		//主socket对象
        this.io = io;
        this.nsp = nsp;
        this.socket = socket;
		this.id = glb.connId(socket.id);
		this.rid = socket.id;
    }
	
    /**
     * 发送消息
	 * 单独发送，仅给自己发送消息
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
     * 发送消息
	 * 单独发送，向指定客户端发送消息
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
	 * 全局广播消息（不包含自己）
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
	 * 房间内广播消息（不包括自己）
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
	 * 全局广播消息（包括自己）
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
	 * 房间内广播消息（包括自己）
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
     * 接收消息
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
     * 接收消息
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
	 * 玩家断开连接
	 * 房间内广播消息（不包括自己）
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
	* 根据socketid 强制关闭目标客户端
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
	*是否违规数据
	*/
	isNonLegal(str){
		if(!str || !str.type || !str.data){
			return true;
		}
		return false;
	}
}

module.exports = SocketHandle;