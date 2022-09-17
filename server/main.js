const fs = require('fs');
const path = require('path');
const log4js = require('log4js');
//全局异常处理
const domain = require('domain');
const d_handle = domain.create();
const Server = require("./gameServer/server")

const CONFIG_PATH = path.resolve(__dirname, './conf/config.json');

/**
 * gameServer入口
 * 读取配置文件，初始化日志，启动gameServer服务
 */
function main() {
    fs.readFile(CONFIG_PATH, function(err, data) {
        if (err) throw err;

        let conf = JSON.parse(data);
        log4js.configure(conf.log);
		
		//server start : business processing 
		let server = new Server(conf);
		server.start();
		//server end 
		
        const log = log4js.getLogger();
		
		//定义全局引入对象
		global.log = log;
		
        log.info('Game server started, listen on:', conf.url + ':' + conf.port);
    });
}

//TODO 以后用log4js按日期输出到文件中
//全局异常处理
d_handle.on('error', (e) => {
  //console.log('\r\n', e, '\r\n', e.stack);
  console.log('=============== Exception Occurred Start =================');
  console.log(e);
  console.log('=============== Exception Occurred End   =================');
});

d_handle.run(() => {
  main();
});