_self_ = {

	menubar: {
		'TextEditor': {
			'About TextEditor': function(){ _self_.about(); },
			'Quit': function(){ joAppManager.quit(_id_); },
		},

		'File': {
			'New':         function(){ _self_.newFile(); },
			'Open...':     function(){ _self_.open();    },
			'Save':        function(){ _self_.save();    },
			'Save As...':  function(){ _self_.saveAs();  },
		},
	},
	
	start: function(param){
		if(!param) this.newFile();
		else if(param.file) this.openFile(param.file.path);
	},

	about: function(){
		joUI.dialog({
			message: 'Text Editor ver 0.0.1<br />Created by nodaguti',
			title: 'About TextEditor',
			application: _id_,
		});
	},

	newFile: function(){
		var t = new _self_.window({
			width: 300,
			height: 300,
			application: _id_
		});
	},

	open: function(){
		var fp = new joFilePicker({
			mode: 'Open',
			application: _id_,
			multiple: true,
		});
		
		fp.show().next(function(pathes){
		
			if(!pathes) return;
			
			pathes.forEach(function(path){ _self_.openFile(path); });
			
		}).error(function(e){ joCore.logger.error(e); });
	},
	
	openFile: function(aPath){
		var t = new _self_.window({
			width: 300,
			height: 300,
			application: _id_,
			path: aPath
		});
	
		t.display.editor.value = joCore.IO.Dinos.read(aPath);
	},

	save: function(){
		var win = joAppManager.getFrontWindow(_id_);
		var fileContent = win.owner.display.editor.value;
		
		if(!win) return;
		else win = win.owner;
		
		//もしウィンドウにパスが関連付けられていない場合は、別名で保存にする
		if(!win.path) return this.saveAs();
		
		//書き込む
		joCore.IO.Dinos.write(fileContent, win.path, true);
		
		//いろいろな設定
//		joFileManager.getFile(path).setAttribute('oncommand', 'joApps.TextEditor.openFile("' + win.param.path + '");');
	},
	
	saveAs: function(){
		//保存先を決める
		var fp = new joFilePicker({
			mode: 'Save',
			application: _id_
		});
		
		fp.show().next(function(path){
			if(!path) return;
		
			var win = joAppManager.getFrontWindow(_id_);
			var fileContent = win.owner.display.editor.value;
			
			//書き込む
			joCore.IO.Dinos.write(fileContent, path, false);
			
			//いろいろな設定
			win.path = path;
//			joFileManager.getFile(path).setAttribute('oncommand', 'joApps.TextEditor.openFile("' + path + '");');
			win.owner.setTitle(joFileManager.getFileNameFromPath(path));
		});
	},

};


_self_.window = function(param){
	this.param = param;

	this.init();
	this.init_self();
}

_self_.window.prototype = {

	init_self: function(){
		this.display.editor = joCore.Node.createNode('textarea', null, this.display.content);
		this.contextmenu.unset(this.display.editor);
		
		//指定されたファイルを開く
		if(this.param.path){
			this.path = this.param.path;
			this.setTitle(joFileManager.getFileNameFromPath(this.param.path));
		}
	},
	
	onDrop: function(file){
		_self_.openFile(file.path);
	},
	
};
joCore.utils.inherit(_self_.window, joWindow);