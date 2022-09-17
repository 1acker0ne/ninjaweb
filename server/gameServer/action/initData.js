const glb = require("../const/glb");
const EventHandle = require("../handle/EventHandle");
const scheduleHandle = require("../handle/ScheduleHandle");
const gmap = glb.o.map;
/**
 * data init
 */
module.exports = {
	instance:function(){
		this.initGlobal();
		this.initData();
		this.initSchedule();
	},
	
	initGlobal:function(){
		global.event = new EventHandle();
		global.schedule = new scheduleHandle();
	},
	
	initData:function(){
		console.log('data init');
		var count = glb.o.spaceNum;
		var map = {};
		for(var m in gmap){
			map[gmap[m]] = {};
		}
		for(var i=1;i<=count;i++){
			glb.set(glb.o.space,i,map);
		}
		console.log(glb.o.space);
	},
	
	initSchedule:function(){
		//运行定时任务
		global.schedule.start();
	},
}