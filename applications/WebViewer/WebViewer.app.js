_self_ = {

	menubar: {	
		'WebViewer': {
			'About WebViewer': function(){ _self_.about(); },
			'Quit': function(){ joAppManager.quit(_id_); },
		},
		
		'File': {
			'Open File...': function(){ _self_.openFile(); },
		},
		
		'View': {
			'Page Source': function(){ _self_.showSource(); },
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
	this.openLocation(path);
}
_self_.window.prototype = {

	init_self: function(){
		this.addMenubar(joCore.Node.createNode('input', { type: 'text', 'class': 'webviewer-browser-locationbar' }));
		this.addContent('<iframe class="webviewer-browser-content"></iframe>');
		
		this.display.locationbar = $C('webviewer-browser-locationbar', this.display.menubar);
		this.display.pagecontent = $C('webviewer-browser-content', this.display.content);
		
		this.display.pagecontent.contentDocument.close();
		
		joEvent.addEvent(this.display.locationbar, 'change blur', function(event){
			if(event.target.value !== this.path) this.openLocation(event.target.value);
		}, false, this);
		joEvent.addEvent(this.display.locationbar, 'mousedown mousemove mouseup', function(event){}, false);
		
		this.contextmenu.unset(this.display.locationbar);
	},
	
	openLocation: function(path){
		this.path = path;
		this.display.locationbar.value = path;
	
		if(path.indexOf('dinos://') === 0){
			var file = joCore.IO.Dinos.read(path);
			var doc = this.display.pagecontent.contentDocument;
			doc.open();
			doc.clear();
			doc.write(file);
			doc.close();
			
//			this.display.pagecontent.src = 'data:text/html,' + encodeURIComponent(file.getAttribute('data'));
		}else{
			this.display.pagecontent.src = path;
		}
		
		try{
			if(this.display.pagecontent.contentDocument){
				this.hasPermission = true;
				this.setTitle(this.display.pagecontent.contentDocument.title || 'Untitled');
			}
		}catch(e){
			this.hasPermission = false;
		}
	},
	
	onDrop: function(icon, x, y){
		this.openLocation(icon.path);
	},
	
	showSource: function(){
		if(this.hasPermission){
			joUI.dialog({
				width: 300,
				height: 500,
				message: joCore.utils.sanitizeHTML(this.display.pagecontent.contentDocument.getElementsByTagName('html')[0].innerHTML, true),
				title: 'Source of "' + this.title + '"',
			});
		}else{
			joUI.dialog({
				width: 300,
				height: 150,
				message: 'You don\'t have permission to access information of this page.'
			});	
		}
	},
	

};
joCore.utils.inherit(_self_.window, joWindow);