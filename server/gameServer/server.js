const http = require('http');
const io = require('socket.io');

const MainAction = require("./action/mainAction");

/**
 * �����࣬��Ϸ����
 * @class Server
 */
class Server {
    /**
     * Creates an instance of Server.
     * @param {string} url ���������ַ
     * @memberof Server
     */
    constructor(conf) {
        this.port = conf.port;
        this.clients = {};
    }

    /**
     * ���� service
     * @param {Message} message ��Ϣ����ӿ�
     * @memberof Server
     */
    start() {
		this.server = http.createServer((req,res)=>{});
		this.listen();
    }
	
    /**
     * listen
     * @param {Message} message ��Ϣ����ӿ�
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