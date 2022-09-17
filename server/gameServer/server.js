const http = require('http');
const io = require('socket.io');

const MainAction = require("./action/mainAction");

/**
 * 服务类，游戏服务
 * @class Server
 */
class Server {
    /**
     * Creates an instance of Server.
     * @param {string} url 服务监听地址
     * @memberof Server
     */
    constructor(conf) {
        this.port = conf.port;
        this.clients = {};
    }

    /**
     * 启动 service
     * @param {Message} message 消息处理接口
     * @memberof Server
     */
    start() {
		this.server = http.createServer((req,res)=>{});
		this.listen();
    }
	
    /**
     * listen
     * @param {Message} message 消息处理接口
     * @memberof Server
     */
    listen() {
		this.server.listen(this.port);
		
		let ioServer = io.listen(this.server);
		let mainAction = new MainAction(ioServer);
		mainAction.start();
    }
}

module.exports = Server;