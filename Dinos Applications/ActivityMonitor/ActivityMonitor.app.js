_self_ = {

	menubar: {	
		'ActivityMonitor': {
			'About ActivityMonitor': function(){ _self_.about(); },
			'Quit': function(){ joAppManager.quit(_id_); },
		},
	},
	
	start: function(){
		var t = new this.window({
			width: 500,
			height: 500,
			application: _id_,
		});
	},

};

_self_.window = function(param){
	this.param = param;
	
	this.init();
	this.init_self();
}
_self_.window.prototype = {

	defaultTitle: 'Activity Monitor',

	init_self: function(){
	
		//Memory Usage領域の準備
		this.addStatusbar('<div class="am-memory-stat"></div>');
		this.display.memoryStat = $C('am-memory-stat', this.display.statusbar);

		this.update();
	},
	
	update: function(){
		this.setContent('<h3>起動中のソフトウェア</h3>');
		
		for(var i in joApps){
			var appInfo = joAppManager.getAppInfoByID(i);
			
			if(!appInfo) continue;
		
			this.addContent('<p>' + appInfo.name + ' (' + appInfo.id + ')</p>');
		}
	
		var memory = this.getMemoryInfo();
		memory = joCore.utils.analyzeByteSize(memory);
		
		this.display.memoryStat.innerHTML = 'メモリ使用量： ' + memory.summary + ' (' + memory.byte + ' bytes)';
		
		var self = this;
		setTimeout(function(){ self.update(); }, 1000);
	},
	
	
	getMemoryInfo: function(){
	
		return ( console && console.memory && console.memory.usedJSHeapSize ) ||
			   ( window.performance && window.performance.memory && window.performance.memory.usedJSHeapSize ) ||
			   ( window.webkitPerformance && window.webkitPerformance.memory && window.webkitPerformance.memory.usedJSHeapSize ) ||
			   0;
	
	},

};
joCore.utils.inherit(_self_.window, joWindow);