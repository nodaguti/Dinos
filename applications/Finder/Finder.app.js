_self_ = {
	
	iconMap: [],  //Finderのアイコンマップ

	menubar: {	
		'Finder': {
			'About Finder': function(){ _self_.about(); },
		},
	},
	
	onload: function(){
		joAppManager.changeActiveApp(_id_);
		
		joEvent.addEvent($('display'), 'mousedown', this.onClickDisplay, false, this);
		joEvent.addEvent(window.document, 'joPrefChange', this.applyPrefs, false, this);
		joEvent.addEvent(window.document, 'joFileChanged', this.applyFileChange, false, this);
		
		this.applyPrefs();
		this.Desktop.init();
	},
	
	
	start: function(){
		var t = new this.Window('dinos://', {
			application: _id_,
			title: joFileManager.getFolderNameFromPath('dinos://'),
		});
	},


	onClickDisplay: function(){
		var frontWindow = joAppManager.getFrontWindow(_id_);
		if(!frontWindow) return;
		frontWindow.owner.onFocus();
	},
	
	
	/**
	 * 新規フォルダを作成する
	 * @param {joWindow|joDesktop} win
	 */
	add: function(win){
		joFileManager.createFolder(win.path + '名称未設定/');
		
		win.icons.push(
			new _self_.Icon(
				'名称未設定', 
				{
					isFolder: true,
				},
				win, win.path
			)
		);
		
		win.updateIconsPosition();
	},
	
	/**
	 * ファイル/フォルダの情報を見る
	 * @param {joFinderIcon} icon 情報を見るファイルのアイコン
	 */
	viewInfo: function(icon){
		var path = icon.aPath || icon.path;
		var name = icon.name;
		var file = joFileManager.getFile(path);
	
		var win = joUI.dialog({
			width: 300,
			height: 450,
			title: name + 'の情報',
			application: _id_,
			resizable: true,
		});
		
		joCore.Node.addClass(win.display.window, 'finder-window-info');

		win.addContent('<p>名前： <input type="text" style="width: 85%;" class="finder-window-info-name" /></p>');
		var dName = $C('finder-window-info-name', win.display.content);
		dName.value = name;
		joEvent.addEvent(dName, 'change', function(e){
			icon.setName(e.target.value);
		}, false, this);
		
		win.addContent('<p>種類： </p>');
		
		var fileSize = joCore.utils.analyzeByteSize(joCore.Node.DOMToText(file).length);
		win.addContent('<p>サイズ: ' + fileSize.summary + ' (' + fileSize.byte + ' bytes)</p>');
		win.addContent('<p>場所： ' + joFileManager.getParentFolderFromPath(path) + '</p>');
		win.addContent('<p>作成日時： ' + (file.getAttribute('createdate') ? (new Date(file.getAttribute('createdate')-0)).toLocaleString() : '--') + '</p>');
		win.addContent('<p>変更日時： ' + (file.getAttribute('changedate') ? (new Date(file.getAttribute('changedate')-0)).toLocaleString() : '--') + '</p>');
		win.addContent('<hr />');
		
		win.addContent('<p>ファイルを開くときの挙動: <input type="text" style="width: 85%;" class="finder-window-info-open" /></p>');
		var dOpen = $C('finder-window-info-open', win.display.content);
		dOpen.value = icon.option.oncommand || '';
		joEvent.addEvent(dOpen, 'change', function(e){
			icon.setCommand(e.target.value);
		}, false, this);
		
		win.addContent('<p><input type="checkbox" class="finder-window-info-runAsApplication" />ファイルをアプリケーションとして実行</p>');
	},
	
	
	/**
	 * エイリアスを作成する
	 * @param {joFinderIcon} icon アイコンオブジェクト
	 */
	createAlias: function(icon){
		joFileManager.createFile(icon.name.replace(/(.*)(\.[^\.]+)$/, '$1 のエイリアス $2'), icon.parent.path, { 'for': icon.path });
		icon.parent.updateIcons();
	},

	/**
	 * ファイルを削除する
	 * @param {joFinderIcon} icon アイコンオブジェクト
	 */
	deleteFile: function(icon){
		joFileManager.deleteFile(icon.path);
		icon.parent.updateIcons();
	},

	about: function(){
		joUI.dialog({
			width: 300,
			height: 150,
			message: 'Finder ver 0.0.1<br />Created by nodaguti',
			title: 'About Finder',
		});
	},
	
	applyPrefs: function(){
		if(joPrefManager.getValue('application.Finder.hidden_dotfile')){
			joCore.Node.addClass(document.body, 'pref-finder-hidden-dotfile');
		}else{
			joCore.Node.removeClass(document.body, 'pref-finder-hidden-dotfile');
		}
	},
	
	applyFileChange: function(event, path){
		//変更されたパスのウィンドウがないかどうか調べる
		var shouldUpdates = (function(path, _id_){
			var windows = joAppManager.getWindows(_id_);
			var result = [];
			
			for(var i=0, l=windows.length; i<l; i++)
				if(windows[i].path === path)
					result.push(windows[i]);
			
			if(path === 'dinos://Desktop/')
				result.push(_self_.Desktop);
		
			return result;
		})(path, _id_);
		
		//更新が必要なウィンドウがなければ終了
		if(!shouldUpdates.length) return;
	
		//更新
		shouldUpdates.forEach(function(win){
			win.updateIcons();
		});
	},
};


/**
 * joDesktop
 * デスクトップを扱うオブジェクト
 * @see joWindow, Finder.window
 */
_self_.Desktop = {

	/* implement propaties of joWindow */
	get width(){ return joDisplay.displayWidth },
	get height(){ return joDisplay.displayHeight },
	display: {
		window: $('display'),
		content: $('display'),
	},
	
	get iconRowMax(){
		return Math.floor((this.width - joPrefManager.getValue('application.Finder.cel.width')) / joPrefManager.getValue('application.Finder.cel.width'));
	},
	
	get iconColMax(){
		return Math.floor((this.height - joPrefManager.getValue('application.Finder.cel.height')) / joPrefManager.getValue('application.Finder.cel.height'));
	},

	icons: [],
	iconMap: [],  /** iconMap[row][col] */
	
	path: 'dinos://Desktop/',
	
	init: function(){
		this.display.window.owner = this;
		$('windows').owner = this;
		this.display.window.style.zIndex = '0';
	
		//初期化
		this.updateIcons();
		
		joEvent.addEvent(this.display.content, 'mousedown', this.clearIconSelection, false, this);
		joEvent.addEvent(window, 'resize', this.onResize, false, this);
		
		this.contextmenu = new joContextMenu(this);
		
		this.contextmenu.set(this.display.content, {
			'新規フォルダを作成' : function(){ _self_.add(this); },
			'情報を見る' : function(){ _self_.viewInfo(this); },
			'表示設定' : '',
		});
		
		//ファイルのドラッグ処理を追加
		joUI.dropbox(this.display.content, {
			self: this,
			callback: function(dataArray, files){
				dataArray.forEach(function(data, index){
					if(!data) return;
				
					joUI.prompt({
						message: 'Enter the name of file.',
						resizable: true,
						defaultStr: files[index].name || files[index].filename,
						application: _id_,
						
					}).next(function(name){
					
						//ファイル作成
						var fileNode = joFileManager.createFile(name, 'dinos://Desktop/');
						var cdata = document.createTextNode(data);
						fileNode.appendChild(cdata);
						
						_self_.Desktop.updateIcons();
						
					}).error(function(e){ joCore.logger.error(e); });
				});
			},
		});
	},
	
	initIconMap: function(){
		for(var row=0;row<=this.iconRowMax;row++){
			for(var col=0;col<=this.iconColMax;col++){
				if(!this.iconMap[row]) this.iconMap[row] = [];
				this.iconMap[row][col] = 0;
			}
		}
	},
	
	setIconMap: function(row, col, val){
		this.iconMap[val][col] = val;	
	},

	//後方互換
	updateDesktop: function(){
		this.updateIcons();
	},
	
	updateIcons: function(){
		var finder = joFileManager.getFile(this.path);
		var files = finder.childNodes;
		
		joCore.Node.deleteNodes('#display > .finder-icon');
		this.icons = [];

		for(var i=0,l=files.length;i<l;i++){
			var aItem = files[i];
			this.icons.push(new _self_.Icon(
				aItem.getAttribute('name'), 
				{
					oncommand: aItem.getAttribute('oncommand'),
					isFolder: aItem.nodeName == 'folder',
					absolutePath: aItem.getAttribute('for'),
				},
				this, this.path
			));
		};
		
		this.updateIconsPosition();
	},
	
	updateIconsPosition: function(){
		this.initIconMap();

		var rowMax = this.iconRowMax;
		var colMax = this.iconColMax;
		
		this.icons.sort(function(a, b){ return a.path > b.path ? 1 : -1; });
		
		for(var i=0,l=this.icons.length;i<l;i++){
			//縦置き
			var col=0,row=0,breakFrag=false;
			for(row=rowMax;row>=0;row--){
				for(col=0;col<=colMax;col++){
					if(!this.iconMap[row][col]){ breakFrag = true; break; }
				}
				if(breakFrag) break;
			}
			
			if(row > rowMax) row = rowMax;
			if(col > colMax) col = colMax;			
			
			this.iconMap[row][col] = 1;
			
			joCore.Node.addStyle(this.icons[i].display.icon, {
				top: joPrefManager.getValue('application.Finder.cel.height') * col + joPrefManager.getValue('application.Finder.cel.height') / 2 + 'px',
				left: joPrefManager.getValue('application.Finder.cel.width') * row + joPrefManager.getValue('application.Finder.cel.width') / 2 + 'px',
			});
		}
	},
	
	/**
	 * ウィンドウ内の選択状態をクリアする
	 */
	clearIconSelection: function(){
		var icons = uuQuery.className('selected', this.display.content);
		icons.forEach(function(icon){
			joCore.Node.removeClass(icon, 'selected');
		});
	},
	
	onResize: function(){
		this.updateIconsPosition();
	},
	
	/**
	 * フォルダが開かれた時に呼び出される
	 * @param {String} 開くフォルダのパス
	 */
	openFolder: function(aPath){
		var t = new _self_.Window(aPath, {
			width: 500,
			height: 500,
			application: _id_,
			title: joFileManager.getFolderNameFromPath(aPath),
		});	
	},
	
	/**
	 * ファイルがドロップされた時に呼び出される
	 * @param {joFinderIcon} aIcon ドロップされたアイコン
	 * @param {Number} x アイコンのx座標
	 * @param {Number} y アイコンのy座標
	 */
	onDrop: function(icon, x, y){
		//移動先が妥当なものかどうか調べる
		if(icon.path === this.path || joFileManager.isContain(icon.path, this.path, true)){
			//自分自身が含むところへ移動しようとした -> エラー
			joUI.dialog({
				width: '250',
				height: '100',
				application: _id_,
				message: '予期しないエラーが起きたため、操作を完了できませんでした。（エラー -1）',
				title: 'Finder',
			});
			
			return;
		}
		
		//ファイルをシステム的に移動
		var result = joFileManager.move(icon.path, this.path);
		
		if(!result) {
			joUI.alert({
			
				message: '移動しようとしているファイルと同名のファイルが既に存在します。'
			
			});
			
			return;
		
		}
		
		//パスの更新
		var oldPath = icon.path;
		icon.path = icon.path.replace(joFileManager.getParentFolderFromPath(icon.path), this.path);
	
		//デスクトップへアイコンのノードを移動させる
		var crect = joCore.Node.getNodeRect(this.display.content);
		var centerX = (x - crect.left) + joPrefManager.getValue('application.Finder.icon.width') / 2;
		var centerY = (y - crect.top) + joPrefManager.getValue('application.Finder.icon.height') / 2;
		var row = Math.round(centerX / joPrefManager.getValue('application.Finder.cel.width')) - 1;
		var col = Math.round(centerY / joPrefManager.getValue('application.Finder.cel.height')) - 1;
		
		//端補正
		if(row < 0) row = 0;
		if(col < 0) col = 0;
		if(row > this.iconRowMax) row = this.iconRowMax;
		if(col > this.iconColMax) col = this.iconColMax;
		
		this.setIconMap(row, col, 1);
		
		joCore.Node.addStyle(icon.display.icon, {
			top: joPrefManager.getValue('application.Finder.cel.height') * col + joPrefManager.getValue('application.Finder.cel.height') / 2 + 'px',
			left: joPrefManager.getValue('application.Finder.cel.width') * row + joPrefManager.getValue('application.Finder.cel.width') / 2 + 'px'
		});
		
		joCore.Node.moveNode(icon.display.icon, this.display.content);
	}
};

/* Finder Window */
_self_.Window = function(aPath, param){
	this.param = param;
	this.path = aPath;
	this.display = {};

	this.init();
	this.init_self();
}
_self_.Window.prototype = {

	constract: [
		'<div class="menubar">',
		'	<button class="button-close">x</button>',
		'	<button class="button-minimize">-</button>',
		'	<button class="button-maximize">+</button>',
		'	<div class="title">Untitled</div>',
		'   <div>',
		'      <button class="button-back">&lt;</button>',
		'      <button class="button-forward">&gt;</button>',
		'      <button class="button-up">&and;</button>',
		'      <button class="button-reflesh">O</button>',
		'   </div>',
		'</div>',
		'<div class="content-wrapper"><div class="content"></div></div>',
		'<div class="statusbar">',
		'   <div class="finder-path"></div>',
		'	<div class="resizer"></div>',
		'</div>',
		'<div class="dammy-wrapper"></div>', //non-activeなwindowにかぶせ、clickを効率よく処理するためのwrapper
	].join(''),
	
	iconMap: [],  /** アイコンの所在地を示すマップ iconMap[col][row] */
	icons: [],  /** Icon オブジェクトを管理する配列 */
	
	history: [],  /** 履歴を管理する配列 */
	historyCount: -1,  /** 今表示している履歴番号 hitoryのindexにもなる */

	get iconRowMax(){
		return Math.floor((joCore.Node.getNodeRect(this.display.content).width - joPrefManager.getValue('application.Finder.cel.width')) / joPrefManager.getValue('application.Finder.cel.width'));
	},
	
	get iconColMax(){
		return Math.floor((joCore.Node.getNodeRect(this.display.content).height - joPrefManager.getValue('application.Finder.cel.height')) / joPrefManager.getValue('application.Finder.cel.height'));
	},
	
	init_self: function(){
		joCore.Node.addClass(this.display.window, 'finder-content-window');
		this.display.contentWrapper = $C('content-wrapper', this.display.window);
	
		this.onResize();
		this.openFolder(this.path);

		this.display.content.addEventListener('mousemove', function(e){
			if(joEvent._moveTarget) joEvent._onDrag(e);
		}, false);
		
		joEvent.addEvent(this.display.content, 'mousedown', this.clearIconSelection, false, this);
		
		joEvent.addEvent($C('button-back', this.display.window), 'mousedown', this.goBack, false, this);
		joEvent.addEvent($C('button-forward', this.display.window), 'mousedown', this.goForward, false, this);
		joEvent.addEvent($C('button-up', this.display.window), 'mousedown', this.goUp, false, this);
		joEvent.addEvent($C('button-reflesh', this.display.window), 'mousedown', function(){ this.updateIcons(this.path) }, false, this);
//		joEvent.addEvent(this.display.window, 'joResizeEnd', this.updateIconsPosition, false, this);

		this.contextmenu = new joContextMenu(this);
		this.contextmenu.set(this.display.content, {
			'新規フォルダを作成' : function(){
				_self_.add(this);
			},
			'情報を見る' : function(){ _self_.viewInfo(this); },
			'表示設定' : 'void();',
		});
	},
	
	initIconMap: function(){
		this.iconMap = [];
	
		for(var col=0;col<=this.iconColMax;col++){
			for(var row=0;row<=this.iconRowMax;row++){
				if(!this.iconMap[col]) this.iconMap[col] = [];
				this.iconMap[col][row] = 0;
			}
		}
	},
	
	setIconMap: function(row, col, val){
		this.iconMap[col][row] = val;	
	},
	
	onResize: function(){
		if(!this.display.contentWrapper) return;
		
		this.updateIconsPosition();
	
		var maxCol = this.iconMap.length;
		var windowContentHeight = this.display.statusbar.getBoundingClientRect().top - 
									this.display.menubar.getBoundingClientRect().bottom;

		this.display.content.style.height = Math.max(windowContentHeight, joPrefManager.getValue('application.Finder.cel.height') * maxCol) + 'px';
		this.display.contentWrapper.style.height = windowContentHeight + 'px';
	},

	
	openFolder: function(aPath, isNotCountRefresh){
		this.updateIcons(aPath);
		
		this.path = aPath;
		if(!isNotCountRefresh){
			this.history.push(aPath);
			this.historyCount++;
		}
		this.setTitle(joFileManager.getFolderNameFromPath(aPath));
		$C('finder-path', this.display.window).innerHTML = aPath;
	},
	
	updateIcons: function(aPath){
		var path = aPath || this.path;
	
		while(this.display.content.childNodes.length > 0){
			joCore.Node.remove(this.display.content.firstChild);
		}
		
		this.icons = [];
	
		var files = joFileManager.getFile(path).childNodes;

		for(var i=0,l=files.length;i<l;i++){
			var aItem = files[i];
			this.icons.push(new _self_.Icon(
				aItem.getAttribute('name'),
				{
					oncommand: aItem.getAttribute('oncommand'),
					isFolder: aItem.nodeName == 'folder',
					absolutePath: aItem.getAttribute('for'),
				},
				this, path
			));
		};
		
		this.updateIconsPosition();
	},

	/**
	 * アイコンを整列させる
	 */
	updateIconsPosition: function(){
		this.initIconMap();

		var rowMax = this.iconRowMax;
		var colMax = this.iconColMax;

//		joCore.logger.log('Max:','(',rowMax,',',colMax,')');

		this.icons.sort(function(a, b){ return a.path > b.path ? 1 : -1; });
		
		for(var i=0,l=this.icons.length;i<l;i++){
			//横置き
			var row=0,col=0,breakFrag=false;
			for(col=0;;col++){
				if(!this.iconMap[col]){ this.iconMap[col] = []; row=0; break; }
			
				for(row=0;row<=rowMax;row++){
					if(!this.iconMap[col][row]){ breakFrag = true; break; }
				}
				if(breakFrag) break;
			}
			
//			joCore.logger.log('Move Icon #',i,'(',row, ',',col,')');
			this.iconMap[col][row] = 1;
			
			joCore.Node.addStyle(this.icons[i].display.icon, {
				'top': joPrefManager.getValue('application.Finder.cel.height') * col + joPrefManager.getValue('application.Finder.cel.height') / 2 + 'px',
				left: joPrefManager.getValue('application.Finder.cel.width') * row + joPrefManager.getValue('application.Finder.cel.width') / 2 + 'px',
			});
		}
		
//		joCore.logger.log('------------');
	},
	
	/**
	 * ウィンドウ内の選択状態をクリアする
	 */
	clearIconSelection: function(){
		var icons = uuQuery.className('selected', this.display.content);
		icons.forEach(function(icon){
			joCore.Node.removeClass(icon, 'selected');
		});
	},
	
	onDrop: function(icon, x, y){
		//移動先が妥当なものかどうか調べる
		if(icon.path === this.path || joFileManager.isContain(icon.path, this.path, true)){
			//自分自身が含むところへ移動しようとした -> エラー
			joUI.dialog({
				width: '250',
				height: '100',
				application: _id_,
				message: '予期しないエラーが起きたため、操作を完了できませんでした。（エラー -1）',
				title: 'Finder',
			});
			
			return;
		}
	
		//ファイルをシステム的に移動
		var result = joFileManager.move(icon.path, this.path);
		
		if(!result) {
			joUI.alert({
				message: '移動しようとしているファイルと同名のファイルが既に存在します。'
			});
			
			return;
		
		}
		
		
		//パスの更新
		//ファイルシステムの更新に古いパスが必要なので保存しておく
		var oldPath = icon.path;
		icon.path = icon.path.replace(joFileManager.getParentFolderFromPath(icon.path), this.path);
		
		//デスクトップへアイコンのノードを移動させる
		var crect = joCore.Node.getNodeRect(this.display.content);  //content rect
		var centerX = (x - crect.left) + joPrefManager.getValue('application.Finder.icon.width') / 2;
		var centerY = (y - crect.top) + joPrefManager.getValue('application.Finder.icon.height') / 2;
		var row = Math.round(centerX / joPrefManager.getValue('application.Finder.cel.width')) - 1;
		var col = Math.round(centerY / joPrefManager.getValue('application.Finder.cel.height')) - 1;
		
		//端補正
		if(row < 0) row = 0;
		if(col < 0) col = 0;
		if(row > this.iconRowMax) row = this.iconRowMax;
		if(col > this.iconColMax) col = this.iconColMax;
		
		this.setIconMap(row, col, 1);
		
		joCore.Node.addStyle(icon.display.icon, {
			'top': joPrefManager.getValue('application.Finder.cel.height') * col + joPrefManager.getValue('application.Finder.cel.height') / 2 + 'px',
			left: joPrefManager.getValue('application.Finder.cel.width') * row + joPrefManager.getValue('application.Finder.cel.width') / 2 + 'px'
		});
		
		joCore.Node.moveNode(icon.display.icon, this.display.content);
	},
	
	goBack: function(){
		if(this.historyCount === 0) return;
		
		this.historyCount--;
		this.openFolder(this.history[this.historyCount], true);
	},
	
	goForward: function(){
		if(this.historyCount === (this.history.length - 1)) return;
		
		this.historyCount++;
		this.openFolder(this.history[this.historyCount], true);
	},
	
	goUp: function(){
		var parentPath = joFileManager.getParentFolderFromPath(this.path);
		this.openFolder(parentPath);
	}
};
joCore.utils.inherit(_self_.Window, joWindow);




/** Finder Icon 
 * @param {String} aName アイコンの名前
 * @param {Object} option オプション
 * @param {joWindow|joDesktop} aParent 親ウィンドウ または Desktopオブジェクト
 * @param {String/DinosPath} aPath 親ディレクトリのパス
 */
_self_.Icon = function(aName, option, aParent, aPath){
	this.name = aName;
	this.display = {};
	this.parent = aParent;
	this.path = aPath + aName + (option.isFolder ? '/' : '');
	this.aPath = option.absolutePath; //absolute path
	this.option = option;

	this.init();
};
_self_.Icon.prototype = {

	init: function(){
		this.display.icon = joCore.Node.createNode('div', { 'class': 'finder-icon', name: this.name }, this.parent.display.content);
		if(this.option.isFolder) this.display.icon.setAttribute('folder', 'true');
		this.display.iconImage = joCore.Node.createNode('div', { 'class': 'finder-icon-image' }, this.display.icon);
		this.display.name = joCore.Node.createNode('div', { 'class': 'finder-icon-name', ':context': this.name }, this.display.icon);
		this.display.icon.owner = this;

		//ダブルクリックしたときの挙動を指定
		joEvent.addEvent(this.display.icon, 'dblclick-mod', this.open, false, this);
		
		//コンテキストメニューを設定
		this.contextmenu = new joContextMenu(this);
		this.contextmenu.set(this.display.icon, {
			'開く': function(){
				var selectedIcons = uuQuery.className('selected', this.parent.display.content);			
			
				for(var i=0,l=selectedIcons.length;i<l;i++){
					selectedIcons[i].owner.open();
				}
			},
			'このアプリケーションで開く': (function(that){
				var popup = {};
				
				for(var i=0;i<joAppManager.apps.length;i++){
					var appName = joAppManager.apps[i].name;
					var appID = joAppManager.apps[i].id;
				
					popup[appName] = (function(aSelf, aAppID){
						return function(){
							joAppManager.launch(aAppID, { file: aSelf });
						};
					})(that, appID);
				}
				
				return popup;
			})(this),
			
			'情報を見る': function(){ _self_.viewInfo(this) },
			'エイリアスを作る': function(){
				var selectedIcons = uuQuery.className('selected', this.parent.display.content);			
			
				for(var i=0,l=selectedIcons.length;i<l;i++){
					_self_.createAlias(selectedIcons[i].owner);
				}
			},
			'削除': function(){
				var selectedIcons = uuQuery.className('selected', this.parent.display.content);			
			
				for(var i=0,l=selectedIcons.length;i<l;i++){
					_self_.deleteFile(selectedIcons[i].owner);
				}
			},
			'名前の変更': function(){ this.changeName(); },
		});
		
		//ドラッグ可能にする
		joEvent.addEvent(this.display.icon, 'joDragStart', this.onMoveStart, false, this);
		joEvent.addEvent(this.display.icon, 'mousedown', this.onSelect, false, this);
		joEvent.addEvent(this.display.icon, 'joDrag', this.onMove, false, this);
		joEvent.addEvent(this.display.icon, 'joDragEnd', this.onMoveEnd, false, this);
		joEvent.setDraggable(this.display.icon, null, $('display'));
		
		//大きさを設定する
		joCore.Node.addStyle(this.display.icon, {
			width: joPrefManager.getValue('application.Finder.icon.width') + 'px',
			height: joPrefManager.getValue('application.Finder.icon.height') + 'px',
		});
		
		//名称の変更
		joEvent.addEvent(this.display.name, 'lmousedown', this.changeName, false, this, true);
	},
	
	
	open: function(event){
		//ドラッグを強制終了
		try{ joEvent._onDragEnd(event); }catch(e){}
	
		//フォルダの場合
		if(this.option.isFolder)
			return this.parent.openFolder(this.aPath || this.path);
		
		//ファイルの場合

		//アプリケーションファイルの場合はアプリケーションを実行する
		if(/\.app$/.test(this.name)){

			for(var i=0, l=joAppManager.apps.length; i<l; i++){
				if(joAppManager.apps[i].app === (this.aPath || this.path) ){
				
					joAppManager.launch(joAppManager.apps[i].id);
				
				}			
			}
	
			return;
		}
			
		//oncommandが設定されている場合はそれを実行する
		if(this.option.oncommand)
			return eval(this.option.oncommand);
	
		//それ以外の場合は既定アプリケーションを調べる
		var program = joFileManager.getDefaultProgram(this.name);
		
		if(program){
		
			return joAppManager.launch(program, {file: this});
			
		}else{
			//規定アプリケーションが不明な場合はユーザーに尋ねる
			var self = this;
			var listTree;
			
			var dialog = joUI.dialog({
				title: 'アプリケーションの選択',
				message: self.name + ' を開くためのアプリケーションが関連付けられていません。<br />以下からこのファイルを開くためのアプリケーションを選択してください。',
				application: _id_,
			});
			
			joEvent.addEvent($C('button-ok', dialog.display.statusbar), 'click', function(){
			
				joAppManager.launch(listTree.selected[0], {file: self});
				
			}, false, this);
			
			//アプリケーションの一覧を作成
			var appsData = (function(){
				var data = [];
				
				joAppManager.apps.forEach(function(app){
					data.push({
						data: app.name,
						value: app.id
					});
				});
			
				return data;
			})();
			
			listTree = joUI.listTree(appsData, dialog.display.content, false);
			
			joCore.Node.addStyle($C('listtree', dialog.display.content), {
				border: '1px darkblue solid',
				width: '80%',
				margin: '0 auto'
			});
			
			
			dialog.setAppropriateSize();
		}
	},
	
	changeName: function(){
		if(!joCore.Node.hasClass(this.display.icon, 'selected')) return;
		
		var input = joCore.Node.createNode('input', { 'value': this.name, 'class': 'finder-icon-name' });
		this.display.name.parentNode.insertBefore(input, this.display.name);
		this.display.name.style.display = 'none';
		joEvent.addEvent(input, 'mousedown', function(){}, false, this);
		joEvent.addEvent(input, 'change blur', function(event){
			//表示の更新
			joCore.Node.remove(input);
			this.display.name.style.display = 'block';
		
			this.setName(event.target.value);
		}, false, this);
	},
	
	setName: function(name){
		var result = joFileManager.rename(this.path, name);
		
		//同名ファイルが存在していた時
		if(!result){
		
			joUI.alert({
				message: '同じ名前のファイルが既に存在します。別のファイル名にしてください。'
			});
			
			return this.changeName();
		}
		
		this.display.name.innerHTML = name;
		this.name = name;
		this.path = this.path.replace(/[^\/]+(\/?)$/, name + '$1');
	},
	
	setCommand: function(command){
		var file = joFileManager.getFile(this.path);
		this.option.oncommand = command;
		file.setAttribute('oncommand', command);
	},
	
	/**
	 * アイコンがクリックされた時呼び出される
	 */
	onSelect: function(event){
		//Ctrlが押されていないときはほかのアイコンの選択を解除し
		//アイコンを選択状態にする		
		if(!event.ctrlKey)
			if(event.button === 0)
				this.parent.clearIconSelection();
			
		joCore.Node.addClass(this.display.icon, 'selected');
		joCore.Node.addStyle(this.display.icon, {
			'z-index': this.parent.display.window.style.zIndex,
		});
	},
	
	/**
	 * ドロップされた時呼び出される
	 */
	onDrop: function(icon, x, y){
		//フォルダの時：ドロップされたアイコンをフォルダ内に移動する
		if(this.option.isFolder){
		
			//ファイルの移動先のパス
			var moveToPath = this.aPath || this.path;
		
			//移動先が妥当なものかどうか調べる
			if(icon.path === moveToPath || joFileManager.isContain(icon.path, moveToPath, true)){
				//自分自身が含むところへ移動しようとした
				//エラーを出す
				joUI.dialog({
					width: '250',
					height: '100',
					application: _id_,
					message: '予期しないエラーが起きたため、操作を完了できませんでした。（エラー -1）',
					title: 'Finder',
				});
				
				return;
			}
		
			//ファイルをシステム的に移動
			var result = joFileManager.move(icon.path, moveToPath);
		
			if(!result) {
				joUI.alert({
				
					message: '移動しようとしているファイルと同名のファイルが既に存在します。'
				
				});
				
				return;
			
			}
		
			//パスの更新
			//ファイルシステムの更新に古いパスが必要なので保存しておく
			var oldPath = icon.path;
			icon.path = icon.path.replace(joFileManager.getParentFolderFromPath(icon.path), moveToPath);
			
			//アイコンのノードを削除
			joCore.Node.remove(icon.display.icon);
		}
	
	},


	onMoveStart: function(event){
		//Map更新処理
		var bounds = joCore.Node.getNodeRect(this.display.icon, this.parent.display.window);
		var centerX = bounds.left + joPrefManager.getValue('application.Finder.icon.width') / 2;
		var centerY = bounds.top + joPrefManager.getValue('application.Finder.icon.height') / 2;
		var row = Math.round(centerX / joPrefManager.getValue('application.Finder.cel.width')) - 1;
		var col = Math.round(centerY / joPrefManager.getValue('application.Finder.cel.height')) - 1;
		
		//右端・下端補正
		if(row < 0) row = 0;
		if(col < 0) col = 0;
		if(row > this.parent.iconRowMax) row = this.parent.iconRowMax;
		if(col > this.parent.iconColMax) col = this.parent.iconColMax;
		
		this.parent.setIconMap(row, col, 0);
		
		//ドラッグ後に元の位置へ戻すために、動かす前の座標を記憶しておく
		this._oldX = bounds.left;
		this._oldY = bounds.top;
	
		//引っ張り出す前に位置補正
		var rect = this.display.icon.getBoundingClientRect();
		joCore.Node.addStyle(this.display.icon, {
			top: rect.top + 'px',
			left: rect.left + 'px'
		});

		//ウィンドウの外にもドラッグできるようにするために
		//アイコンをルートに引っ張り出す
		joCore.Node.moveNode(this.display.icon, $('display'));
	},
	
	onMove: function(){
		joCore.Node.addClass(this.display.icon, 'dragging');
	},

	onMoveEnd: function(event){
		//アイコンの着地先を調べる
		var rect = this.display.icon.getBoundingClientRect();
		var x = rect.left + joPrefManager.getValue('application.Finder.icon.width') / 2;
		var y = rect.top + joPrefManager.getValue('application.Finder.icon.height') / 2;
		var dropTo;   //移動先のノード

		var nodeCandidates = joCore.Node.getNodesByPosition(x, y);

		//一番上にある、ドロップ可能な要素を探す
		for(var i=0,l=nodeCandidates.length;i<l;i++){
			var node = nodeCandidates[i];
			if(node.owner && node.owner.onDrop && joCore.Node.getUniqueID(node) !== joCore.Node.getUniqueID(this.display.icon)){
				dropTo = node;
				break;
			}
		}

		//アイコンを元に戻し、処理をドロップ先の要素に投げる
		joCore.Node.removeClass(this.display.icon, 'dragging');
		if(this._oldX && this._oldY){
			joCore.Node.addStyle(this.display.icon, {
				'top': this._oldY + 'px',
				'left': this._oldX + 'px',
			});
		}
		joCore.Node.moveNode(this.display.icon, this.parent.display.content);

		if(dropTo) node.owner.onDrop(this, x, y);
	},


};