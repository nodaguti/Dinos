/**
 * Dinos File System
 * @class
 */
var joFileManager = {

	fileTree: null,

	/**
	 * 起動時に一度だけ実行される
	 * @private
	 */
	init: function(){
		var deferred = new Deferred();

//		this.storage = uu('Storage');
//			if(this.storage.toString() === 'MemStorage') this.storage = null;

		if(this.storage){
		
			this.fileTree = joCore.Node.textToDOM(this.storage.get('fileTree'));
			
		}else{
		
			return joCore.IO.Network.read('disk.xml').next(function(req){
			
				if(req.responseXML){
				
					//responseXMLがある時 - for Firefox, Safari
					joFileManager.fileTree = req.responseXML;
				
				}else if(req.responseText){
				
					//responseTextはある時
					var xml = joCore.Node.textToDOM(req.responseText);
					if(!xml) throw new Error('[joFileManager] Cannot load disk.xml from responseText');
				
					joFileManager.fileTree = xml;
				}
				
			}).error(function(e){
			
				//Cross Domain Errorの時　- for Google Chrome, Opera
				return joCore.IO.Local.read('disk.xml', 'text/html').next(function(data){
				
					joFileManager.fileTree = joCore.Node.textToDOM(data);
					
				}).error(function(ex){
					joCore.logger.error('[joFileManager] Cannot load disk.xml', e, ex);
				});
				
			});
		}
	},
	
	/**
	 * 終了処理
	 * @private
	 */
	uninit: function(){
		var treeText = joCore.Node.DOMToText(joFileManager.fileTree);
		joCore.IO.Local.write(treeText, 'disk.xml');
	},

	onChangeTree: function(path){
		//変更を通知
		joEvent.fireEvent('joFileChanged', window.document, path);
			
		//this._saveFileTree();
	},
	
	/**
	 * ファイルツリーを保存する
	 */
	_saveFileTree: function(){
//		var treeText = joCore.Node.DOMToText(joFileManager.fileTree);
//		location.href = 'data:application/octet-stream,' + encodeURIComponent(treeText);
	},
	
	/**
	 * パスをCSSに変換する
	 *
	 * @param {String/DinosPath} aPath パス
	 * @return {String} そのパスが指すフォルダを示すCSS	
	 */
	_pathToCSS: function(aPath){
		return aPath.replace('dinos:/', 'root')
					.replace(/\//g, '>')
					.replace(/>([^>]+)$/, '>file[name="$1"]')    //file name
					.replace(/(.[^>]*)>/g, 'folder[name="$1"]>')
					.replace(/>$/, '');
	},
	
	/**
	 * ファイルの名前を返す<br>
	 *   ファイルのパスを指定した場合： そのファイルの名前を返す<br>
	 *   フォルダのパスを指定した場合： 空文字を返す
	 *
	 * @param {String/DinosPath} aPath パス
	 * @return {String} ファイルの名前
	 */
	getFileNameFromPath: function(aPath){
		return aPath.match(/([^\/]*)$/)[1];
	},

	/**
	 * フォルダの名前を返す<br>
	 *   ファイルのパスを指定した場合： ファイルが入っているフォルダの名前を返す<br>
	 *   フォルダのパスを指定した場合： そのフォルダの名前を返す
	 *
	 * @param {String/DinosPath} aPath パス
	 * @return {String} フォルダの名前
	 */
	getFolderNameFromPath: function(aPath){
		return aPath.match(/([^\/]*)\/[^\/]*$/, '')[1] || 'Dinos';
	},

	/**
	 * 親フォルダのパスを返す
	 *
	 * @param {String/DinosPath} aPath パス
	 * @return {String/DinosPath} フォルダのパス
	 */
	getParentFolderFromPath: function(aPath){
		if(/\/$/.test(aPath)){
			//フォルダのとき
			return aPath.replace(/[^\/]*\/?$/, '');
		}else{
			//ファイルのとき
			return this.getParentFolderFromPath(aPath.replace(/[^\/]+$/, 'dammy/'));
		}	
	},

	/**
	 * 親フォルダのパスツリーを返す
	 *
	 * @param {String/DinosPath} aPath パス
	 * @return {Array} 親フォルダのパス群が入った配列
	 */
	getFolderTreeFromPath: function(aPath){
		var returnArray = [], aPath = aPath.replace(/[^\/]+$/, '');
		
		function getTree(path){
			returnArray.push(path);
			var parent = joFileManager.getParentFolderFromPath(path);
			if(parent.length > 8) getTree(parent); // dinos:// になったらやめる
		}

		getTree(aPath);
		
		return returnArray;
	},
	

	/**
	 * ファイルを取得する
	 *
	 * @param {String/DinosPath} aPath パス
	 * @return {Node} ファイルのノード
	 */
	getFile: function(aPath){
		var path = this._pathToCSS(aPath);
		joCore.logger.log('Get File:', path);
		
		var result;
		
		try{
			result = uuQuery(path, this.fileTree);
		}catch(e){
			//uuQuery error - IE?
			result = this._getNode(path);
		}
		
		return result.length ? result[0] : null;
	},
	
	_getNode: function(path){
		var files = path.split('>');
		var current = this.fileTree;
		
		for(var i=0,l=files.length; i<l; i++){
			var isFolder = files[i].indexOf('folder[') === 0;
			var name = files[i].match(/name="([^"]+)"\]$/)[1];
			
			for(var j=0,m=current.childNodes.length; j<m; j++){
				var file = current.childNodes[j];
				
				if( (isFolder && file.tagName === 'folder') ||
					(!isFolder && file.tagName === 'file')     ){
					
					if(file.getAttribute('name') === name){
						current = file;
						break;
					}
				}
			}
		}

		return [current];
	},

	/**
	 * ファイルを作成する<br>
	 * 指定した親フォルダがない場合は自動で作成する
	 *
	 * @param {String} aName 作成するファイルの名前
	 * @param {String/DinosPath} aPath 親フォルダのパス
	 * @param {Object} [aAttrs] ファイルに付加する属性
	 * @return {Node} 作成されたファイルのノード
	 */
	createFile: function(aName, aPath, aAttrs){
		var parent = this.getFile(aPath);
		if(!parent) parent = this.createFolder(aPath);
		
		if(aAttrs){
			aAttrs.name = aName;
			aAttrs.createdate = (new Date()).getTime();
		}
		
		//ファイルがすでに存在していたら上書きする
		var alreadyExistsFile = this.getFile(aPath + aName);
		if(alreadyExistsFile) this.deleteFile(alreadyExistsFile);
		
		var file = joCore.Node.createNode('file', aAttrs || { name: aName, createdate: (new Date()).getTime() }, '');
		parent.appendChild(file);

		//更新を通知
		this.onChangeTree(aPath);
		
		return file;
	},

	/**
	 * フォルダを作成する<br>
	 * 指定したフォルダが存在しない場合は自動で作成する
	 *
	 * @param {String/DinosPath} aPath 作成するフォルダのパス
	 * @return {Node} 作成したフォルダのノード
	 */
	createFolder: function(aPath){
		//すでにフォルダが存在している場合は上書きする
		var alreadyExistsFolder = this.getFile(aPath);
		if(alreadyExistsFolder) this.deleteFile(alreadyExistsFolder);
	
		var folderTree = this.getFolderTreeFromPath(aPath);
		
		//存在する最も深いフォルダを調べる
		var deepestIndex = 0;
		folderTree.forEach(function(aFolder, aIndex, aArray){
			if(!joFileManager.exist(aFolder)) deepestIndex = aIndex;
		});

		var parent = this.getFile(folderTree[deepestIndex+1]);
		var _parentPath = folderTree[deepestIndex+1];
		var folderName;
		
		//存在しないフォルダをすべて作成
		for(var i=deepestIndex;i>=0;i--){
		
			folderName = this.getFolderNameFromPath(folderTree[i]);
			joCore.logger.log('Create Folder:', folderName);
			
			var node = joCore.Node.createNode('folder', { name: folderName, createdate: (new Date()).getTime() }, '');
			parent.appendChild(node);
			parent = node;
			
		}

		this.onChangeTree(_parentPath);
		
		return parent;
	},

	/**
	 * フォルダ/ファイルが存在するかどうか調べる
	 *
	 * @param {String/DinosPath} aPath パス
	 * @return {Boolean}
	 */
	exist: function(aPath){
		return this.getFile(aPath) ? true : false;
	},
	
	/**
	 * あるフォルダが指定したファイルを含んでいるかどうか調べる
	 *
	 * @param {String/DinosPath} aContainer 調べるフォルダ
	 * @param {String/DinosPath} aPath 調べるファイル
	 * @param {Boolean} [isRecursive=false] 子フォルダも対象にするかどうか
	 * @return {Boolean}
	 */
	isContain: function(aContainer, aPath, isRecursive){
		if(isRecursive){
			return aPath.indexOf(aContainer) !== -1;
		}else{
			return this.getParentFolderFromPath(aPath) === aContainer;
		}
	},

	/**
	 * ファイルに書き込む
	 *
	 * @param {String} aData 書き込むデータ
	 * @param {String/DinosPath} aPath 書き込み先のファイルのパス
	 * @return {Node} 書き込んだファイルのノード
	 */
	write: function(aData, aPath){
		var file = this.getFile(aPath);
		
		while(file.childNodes.length > 0){
			joCore.Node.remove(file.firstChild);
		}
		
		file.appendChild(document.createTextNode(aData));

		this.onChangeTree(this.getParentFolderFromPath(aPath));
		
		return file;
	},
	
	/**
	 * ファイルを移動する
	 *
	 * @param {String/DinosPath} aPath 移動するファイルのパス
	 * @param {String/DinosPath} moveTo 移動先のフォルダのパス
	 * @return {Boolean} 移動に成功したかどうか
	 */
	move: function(aPath, moveTo){
		var file = this.getFile(aPath);
		var parent = this.getParentFolderFromPath(aPath);
		var fileName = this.getFileNameFromPath(aPath) || (this.getFolderNameFromPath(aPath) + '/');
				
		var moveToFolder = this.getFile(moveTo);
		
		joCore.logger.log('Move file from ', parent, ' to ', moveTo);
		
		//同名ファイルが移動先に存在していた時は失敗させる
		//ただし、移動先のフォルダが元あったフォルダと同じ場合は、単にフォルダ内でクリック/移動しただけなので問題ない
		if(parent !== moveTo && this.exist(moveTo + fileName)){

			return false;
		
		}
		
		joCore.Node.moveNode(file, moveToFolder);
		
		//単にフォルダ内で移動しただけ以外のときは更新を通知する
		if(parent !== moveTo){
			this.onChangeTree(parent);
			this.onChangeTree(moveTo);
		}
		
		return true;
	},
	
	/**
	 * ファイルをリネームする
	 *
	 * @param {String/DinosPath} aPath リネームするファイル
	 * @param {String} newName リネーム後の名前
	 * @param {Boolean} リネームに成功したかどうか
	 */
	rename: function(aPath, newName){
		var file = this.getFile(aPath);
		var parent = this.getParentFolderFromPath(aPath);
		
		//すでに同名のファイルが存在した場合は失敗させる
		if(this.exist(aPath.replace(/[^\/]+\/?$/, newName))) return false;
		
		this.onChangeTree(this.getParentFolderFromPath(aPath));
		
		file.setAttribute('name', newName);
		
		return true;
	},
	
	/**
	 * ファイルを削除する
	 *
	 * @param {String/DinosPath} aPath 削除するファイル
	 * @return {Boolean} 削除に成功したかどうか
	 */
	deleteFile: function(aPath){
		var file = this.getFile(aPath);
		if(!file) return false;
		
		try{
			file.parentNode.removeChild(file);
			this.onChangeTree(this.getParentFolderFromPath(aPath));
			return true;
		}catch(e){
			return false;
		}
	},
	
	_defaultProgram: {
		'html' : 'dinos.texteditor',
		'txt' : 'dinos.texteditor',
		'json' : 'dinos.texteditor',
		'css' : 'dinos.texteditor',
		'png' : 'dinos.imageviewer',
	},
	
	/**
	 * ファイルの種類に応じたデフォルトプログラムを返す
	 * @param {String} aFileName ファイル名
	 */
	getDefaultProgram: function(aFileName){
		var filename = aFileName.replace(/(.*)\.[^.]+$/, '$1');
		var ext = aFileName.replace(/.*\.([^.]+)$/, '$1');
		
		if(!ext) return null;
		else return this._defaultProgram[ext];
	},
};


/**
 * File Picker <br>
 * インスタンスを作成したあとshow()を呼ぶと表示される
 * @constructor
 * @param {Object} option
 * @param {String} .mode "Save" or "Open"
 * @param {String} .application アプリケーションID
 * @param {Boolean} [.multiple] 複数選択できるようにするか（Openモードのときのみ有効）
 * @example
 *    var fp = new joFilePicker({ mode: 'Save', application: 'dinos.finder' });
 *    fp.show();
 */
function joFilePicker(option){
	this.option = option || {};
	this.init();
}

joFilePicker.prototype = {

	/**
	 * 初期化処理
	 * @private
	 */
	init: function(){
	
	},
	
	/**
	 * ファイルピッカーを表示する
	 * @return {Deferred|(String|Array)} 選択されたファイルのパス（multipleが有効な時はパスの配列）
	 */
	show: function(){
		this.deferred = new Deferred();
		
		this.win = joUI.window({
			width: 400,
			height: 350,
			application: this.option.application || 'dinos.finder',
		});
		
		this['_build' + this.option.mode]();
		
		return this.deferred;
	},
	
	/**
	 * ファイルピッカーを閉じる
	 */
	close: function(){
		this.win.close();
	},
	
	/**
	 * キャンセルする（キャンセルボタンから呼び出される）
	 */
	cancel: function(){
		this.close();
		this.deferred.call('');
	},
	
	/**
	 * Saveモードの画面を構築する
	 */
	_buildSave: function(){
		this.win.setTitle('Save As');
	
		//ファイル名入力欄
		this.win.addContent('<div class="filepicker-filename">Save As: <input type="text" class="filepicker-filename-input" /></div>');
	
		//ファイルツリー
		this.win.addContent('<div class="filepicker-filetree"></div>');
		
		//ボタン
		this.win.addStatusbar('<div class="filepicker-controls">' + 
							'<button class="button-ok">Save</button>' + 
							'<button class="button-cancel">Cancel</button>' + 
							'</div>');
		
		
		//OKボタンのイベント登録
		joEvent.addEvent($C('button-ok', this.win.display.statusbar), 'click', function(){
		
			var saveToPath = this._listTree.selected[0];
			var fileName = $C('filepicker-filename-input').value;
			
			//フォルダが選択されていない or ファイル名が入力されていない時は何もしない
			if(saveToPath.lastIndexOf('/') !== saveToPath.length-1 ||
			                     !fileName                           ) return;
			
			//ウィンドウを閉じる
			this.close();
			
			//処理を返す
			this.deferred.call(saveToPath + fileName);
			
		}, false, this);
		
		//キャンセルボタンのイベント登録
		joEvent.addEvent($C('button-cancel', this.win.display.statusbar), 'click', this.cancel, false, this);
		
		//ツリーの中身を構築する
		var fileTreeData = this._getFileTreeObject('dinos://');

		this._listTree = joUI.listTree(fileTreeData, $C('filepicker-filetree', this.win.display.content), false);
	},
	
	/**
	 * Openモードの画面を構築する
	 */
	_buildOpen: function(){
		this.win.setTitle('Open As');
	
		//ファイルツリー
		this.win.addContent('<div class="filepicker-filetree"></div>');
		
		//ボタン
		this.win.addStatusbar('<div class="filepicker-controls">' + 
							'<button class="button-ok">Open</button>' + 
							'<button class="button-cancel">Cancel</button>' + 
							'</div>');
		
		//OKボタンのイベント登録
		joEvent.addEvent($C('button-ok', this.win.display.statusbar), 'click', function(){
		
			var openToPath = this.option.multiple ? this._listTree.selected :
													this._listTree.selected[0];
			
			//フォルダが選択されている時は何もしない
//			if(openToPath.lastIndexOf('/') === openToPath.length-1) return;
			
			//ウィンドウを閉じる
			this.close();
			
			//処理を返す
			this.deferred.call(openToPath);
			
		}, false, this);
		
		//キャンセルボタンのイベント登録
		joEvent.addEvent($C('button-cancel', this.win.display.statusbar), 'click', this.cancel, false, this);
		
		//ツリーの中身を構築する
		var fileTreeData = this._getFileTreeObject('dinos://');

		this._listTree = joUI.listTree(fileTreeData, $C('filepicker-filetree', this.win.display.content), this.option.multiple);
	},


	/**
	 * ListTree用のファイルツリーオブジェクトを得る
	 * @param {String/DinosPath} [root=dinos://] 取得するツリーのルート要素
	 * @return {Array} 各要素は以下のようなオブジェクト <br>
	 *     {                                <br>
	 *	     {String} data ファイル名           <br>
	 *		 {String} value ファイルパス         <br>
	 *       {Array} [children] ファイルに子ファイルがある場合、ここに子ファイルのツリーオブジェクトが入る <br>
	 * 	　　 ｝
	 */
	_getFileTreeObject: function(root){
		if(!root) root = 'dinos://';
		
		var parent = joFileManager.getFile(root);
		if(!parent) return null;
		
		
		function hasChildFiles(node){
			if(!node.hasChildNodes()) return false;
		
			for(var i=0, l=node.childNodes.length; i<l; i++){
				if(node.childNodes[i].nodeType === node.ELEMENT_NODE)
					return true;
			}
			
			return false;
		}
		
		
		//子要素を取得し、配列に変換し、文字コード順にソートする
		var children = joCore.utils.toArray(parent.childNodes)
						.sort(function(a, b){ return a.getAttribute('name') > b.getAttribute('name') ? 1 : -1; });
						
		var treeObject = [];
		
		for(var i=0,l=children.length;i<l;i++){
		
			var name = children[i].getAttribute('name');
			var hasChild = hasChildFiles(children[i]);
			
			var item = {
				data: name,
				value: root + name + ( hasChild ? '/' : '' )
			};
			
			if(hasChild)
				item.children = this._getFileTreeObject(root + name + '/');
			
			treeObject.push(item);
		}

		return treeObject;
	},

};