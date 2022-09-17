const fs = require('fs');
const path = require('path');
const log4js = require('log4js');
//ȫ���쳣����
const domain = require('domain');
const d_handle = domain.create();
const Server = require("./gameServer/server")

const CONFIG_PATH = path.resolve(__dirname, './conf/config.json');

/**
 * gameServer���
 * ��ȡ�����ļ�����ʼ����־������gameServer����
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
		
		//����ȫ���������
		global.log = log;
		
        log.info('Game server started, listen on:', conf.url + ':' + conf.port);
    });
}

//TODO �Ժ���log4js������������ļ���
//ȫ���쳣����
d_handle.on('error', (e) => {
  //console.log('\r\n', e, '\r\n', e.stack);
  console.log('=============== Exception Occurred Start =================');
  console.log(e);
  console.log('=============== Exception Occurred End   =================');
});

d_handle.run(() => {
  main();
});