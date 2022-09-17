const r = require("../const/route.js");
const SocketHandle = require("./socketHandle");
const InitData = require("./initData");
const LoginAction = require("./loginAction");
const HomeAction = require("./homeAction");
const GameAction = require("./gameAction");
const DB = require("../db/main.js");
const me = require("./manage");
const glb = me.glb;
const func = me.func;
/**
 * ע��action
 * action���
 */
class MainAction {
	
    constructor(io) {
        this.io = io;
    }
	
	start(){
		this.io.on('connection',this.connect);
		this.instance();
		
		InitData.instance();
	}
	
	//ע��action
	instance(){
		glb.o.db = new DB().db;
		//console.log(glb.o.db);
		// login handle
		this.setAction(r.ROUTE_LOGIN,LoginAction);
		// login handle
		this.setAction(r.ROUTE_HOME,HomeAction);
		// game handle
		this.setAction(r.ROUTE_GAME,GameAction);
	}
	
	/**
	 * ע��action func
     * @param {route.ROUTE_XXX} route
     * @param {xxxAction} action
	 */
	setAction(route,action){
		var self = this;
		var nsp = this.io.of(route);
		nsp.on('connection', function(socket){
			let client = new SocketHandle(self.io,nsp,socket);
			let act = new action(client);
			act.start();
		});
	}
	
	connect(socket){
		socket.emit('connection',0);
		socket.on('disconnect',function(){
			//�Ƴ������������Դ
			func.disconnectRemove(socket.id);
			console.log('client:' + socket.id +' disconnected');
		});
	}
}

module.exports=MainAction;