/**
 * Application's Objects
 * @type Object
 */
var joApps = {};

/**
 * アプリケーションを管理する
 * @class
 */
var joAppManager = {

	/**
	 * Installed Applications
	 * @type Array
	 */
	apps: [],
	
	/**
	 * 起動時に開くアプリケーション
	 * @type Array
	 */
	startup: [],

	/**
	 * 起動時に一度だけ実行される
	 * @private
	 */
	init: function(){
		//設定読み込み
		this.apps = joPrefManager.getValue('applications.installed');
		this.startup = joPrefManager.getValue('applications.startup');
	
		//初期化
		joApps = null;
		joApps = {};
		joCore.Node.deleteNodes('head > .application-styles');
	
		//スキンをロード
		for(var i=0;i<this.apps.length;i++){
			this._loadSkin(this.apps[i].skin, this.apps[i].id);
		}
		
		//Startup appsを起動させる
		for(var i=0;i<this.startup.length;i++){
			this.launch(this.startup[i], null, true);
		}
	},

	/**
	 * shutdown
	 * @private
	 */
	uninit: function(){
		joPrefManager.setValue('applications.installed', this.apps);
		joPrefManager.setValue('applications.startup', this.startup);
	},
	
	
	/**
	 * スキンファイルを読み込む
	 * @param {String} path Skin File Path
	 * @param {String} id Application ID
	 */
	_loadSkin: function(path, id){
		var skinData = joCore.IO.Dinos.read(path);
		
		if(!skinData) return;
		
		try{
			//$APPID$を置換
			skinData = skinData.replace(/\$APPID\$/g, id);
		
			//スキンファイルをロード
			joCore.Node.createNode('style', { 'type': 'text/css', ':context': skinData, 'class': 'application-styles skin-' + id }, uuQuery.tag('head')[0]);
			
		}catch(e){
			joCore.logger.log('An Error has occurred when loading skin of "', this.apps[i].name, '" (', this.apps[i].skin, ')');
			joCore.logger.error(e);
		}
	},
	
	
	/**
	 * インストールしたアプリケーションを登録する
	 */
	register: function(appInfo){
		this.unregister(appInfo.id);
				
		if(appInfo.skin)
			this._loadSkin(appInfo.skin, appInfo.id);
			
		if(appInfo.files)
			delete appInfo.files;
			
		this.apps.push(appInfo);
	},
	
	/**
	 * アンインストール
	 */
	unregister: function(id){
		var skin = uuQuery('style[class*="skin-' + id + '"]');
		if(skin.length) joCore.Node.remove(skin[0]);
		
		xcss.run(true);
	
		for(var i=0, l=this.apps.length; i<l; i++){
			if(this.apps[i].id === id){
				this.apps.splice(i, 1);
				break;
			}
		}
	},
	
	/**
	 * スタートアップ項目として登録する
	 * @param {String} id アプリケーションID
	 */
	setStartup: function(id){
		this.startup.push(id);
	},
	
	
	/**
	 * アプリケーションを起動する
	 * @param {String} appID
	 * @param {All} param アプリケーションに渡すパラメータ
	 */
	launch: function(appID, param, isStartup){
		var appInfo = this.getAppInfoByID(appID);
		
		if(!appInfo) return;
		
		var appFile = joCore.IO.Dinos.read(appInfo.app);
		
		if(!appFile) return;
		
		if(!joApps[appID]){
			try{
				joApps[appID] = {};	
			
				//アプリケーションコードをロード
				eval(
					
					'(function(){' +
					
						'var _id_ = "' + appID + '";' + 
						'var _self_;' + 
				
						appFile +
						
						'joApps[_id_] = _self_;' + 
					
					'})();'
				);
				
				if(!joApps[appID]) throw new Error('Invalid type of application.');
				
			}catch(e){
				return joCore.logger.error('An Error has occurred when loading "', appInfo.name, '" (', appInfo.app, ')', e);
			}
		}
		
		try{
		
			if(isStartup)
				joApps[appID].onload();
			else
				joApps[appID].start(param);
				
		}catch(e){
			return joCore.logger.error('An Error has occurred when starting "', appInfo.name, '" (', appInfo.app, ')', e);
		}
	},
	
	quit: function(appID){
	
		if(joApps[appID]){
		
			Deferred.next(function(){
			
				if(typeof joApps[appID].quit === 'function')
					return joApps[appID].quit();
				
			}).next(function(){
//				var appWins = joAppManager.getWindows(appID);
			
//				if(appWins) appWins.forEach(function(win){ win.close(); });
				
				delete joApps[appID];
			
			});
		}
	},
	
	getAppInfoByID: function(appID){
		for(var i=0, l=this.apps.length; i<l; i++)
			if(this.apps[i].id === appID)
				return this.apps[i];
		
		return null;
	},
	

	/**
	 * アプリケーション切り替え時に呼び出される
	 * @param {String} appID 切り替え後のアプリケーションID
	 */
	changeActiveApp: function(appID){
		//すでにアクティブな場合は終了
		if(this.activeID === appID || appID === 'System') return;
		
		//起動していないアプリケーションの場合はエラーを出して終了
		if(!joApps[appID]) return;
		
		if(!joApps[appID].menubar) return;
		
		joApps['dinos.menubar'].update(joApps[appID].menubar);
		this.activeID = appID;
	},

	/**
	 * 最も前面にあるウィンドウを得る
	 *
	 * @param {String} [appID] 指定したアプリケーションのウィンドウに限定する
	 * @return {Node} ウィンドウのノード 見つからないときは null を返す
	 */
	getFrontWindow: function(appID){
		if(!appID) appID = '';

		var _active = uuQuery('.window.active');
		
		if(_active.length && joCore.Node.hasClass(_active[0], appID)) return _active[0];

		return (function(){
			//[active=true]なwindowがない時はより厳密に判定してみる
			var windows = appID ? $C(appID, $('windows')) : $C('window', $('windows'));
			var max = 0, frontWindow = null;

			if(!windows) return null;

			for(var i=0,l=windows.length;i<l;i++){
				if(max < windows[i].style.zIndex){
					max = windows[i].style.zIndex;
					frontWindow = windows[i];
				}
			}

			return frontWindow;
		})();
	},
	
	getWindows: function(appID){
		var wins = $C(appID, $('windows'), true);
		return wins.map(function(win){ return win.owner; });
	},
};