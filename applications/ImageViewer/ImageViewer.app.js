_self_ = {

	menubar: {	
		'ImageViewer': {
			'About ImageViewer': function(){ _self_.about(); },
			'Quit': function(){ joAppManager.quit(_id_); },
		},
		
		'File': {
			'Open File...': function(){ _self_.openFile(); },
		},
	},
	
	start: function(param){
		var path = param && param.file ? param.file.path : '';
	
		var t = new this.window(path, {
			width: 500,
			height: 500,
			application: _id_,
		});
	},

	openFile: function(){
		var fp = new joFilePicker({
			mode: 'Open',
		});
		fp.show().next(function(path){
			if(!path) return;
			var t = new _self_.window(path, {
				width: 500,
				height: 500,
				application: _id_,
			});
		});
	},
	
	
	showSource: function(){
		var win = joAppManager.getFrontWindow(_id_);
		win.owner.showSource();
	},

};

_self_.window = function(path, param){
	this.param = param;
	this.path = path;
	
	this.init();
	this.init_self();
	if(path) this.openFile(path);
}
_self_.window.prototype = {

	init_self: function(){
		joCore.Node.createNode('canvas', { 'class': 'imageviewer-canvas', width: '500', height: '500' }, this.display.content);
		this.display.canvas = $C('imageviewer-canvas', this.display.content);
		this.display.canvas_context = this.display.canvas.getContext('2d');
		
		this.addMenubar('<button class="button-big">↑</button>');
		this.addMenubar('<button class="button-small">↓</button>');
		this.addMenubar('<button class="button-natural">N</button>');
		joEvent.addEvent($C('button-big', this.menubar), 'click', this.toBig, false, this);
		joEvent.addEvent($C('button-small', this.menubar), 'click', this.toSmall, false, this);
		joEvent.addEvent($C('button-natural', this.menubar), 'click', this.toNatural, false, this);
		
		this.onResize();
	},
	
	openFile: function(path){
		var name = joFileManager.getFileNameFromPath(path);
		var dataURI = joCore.IO.Dinos.read(path);
	
		if(!dataURI) return;
	
		this.path = path;
		this.setTitle(name);
		
		var deferred = new Deferred();
		var self = this;

		var image = new Image();
		image.src = dataURI;
		
		setTimeout(function(){
			if(!image.complete) return setTimeout(arguments.callee, 100);
			self.image = image;
			deferred.call();
		}, 0);
		
		var context = this.display.canvas_context;
		deferred.next(function(){
			var actualDim = self.getActualDimention();
			context.clearRect(0, 0, self.display.canvas.width, self.display.canvas.height);
			context.drawImage(image, 0, 0, actualDim.width, actualDim.height);
		}).error(function(e){ joCore.logger.error(e) });
		
		return deferred;
	},
	
	onDrop: function(icon, x, y){
		this.openFile(icon.path);
	},
	
	toBig: function(){
		var dim = this.getNowDimention();
		this.image.width = dim.width * 1.1;
		this.image.height = dim.height * 1.1;
	},
	
	toSmall: function(){
		var dim = this.getNowDimention();
		this.image.width = dim.width * 0.9;
		this.image.height = dim.height * 0.9;
	},
	
	toNatural: function(){
		var dim = this.getActualDimention();
		this.image.width = dim.width;
		this.image.height = dim.height;
	},
	
	getActualDimention: function(){
		return {
			width: this.image.naturalWidth,
			height: this.image.naturalHeight
		};
	},
	
	getNowDimention: function(){
		return {
			width: this.image.width,
			height: this.image.height,		
		};	
	},

};
joCore.utils.inherit(_self_.window, joWindow);