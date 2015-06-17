_self_ = {

	menubar: {	
		'AudioPlayer': {
			'About AudioPlayer': function(){ _self_.about(); },
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
		joCore.Node.createNode('audio', { 'class': 'audioplayer-audio', 'controls': 'controls' }, this.display.content);
		this.display.audio = $C('audioplayer-audio', this.display.content);
	},
	
	openFile: function(path){
		var name = joFileManager.getFileNameFromPath(path);
		var dataURI = joCore.IO.Dinos.read(path);
	
		if(!dataURI) return;
	
		this.path = path;
		this.setTitle(name);
		
		this.display.audio.setAttribute('src', dataURI);
	},
	
	onDrop: function(icon, x, y){
		this.openFile(icon.path);
	}

};
joCore.utils.inherit(_self_.window, joWindow);