_self_ = {

	menubar: {
		'SoftwareInstaller': {
			'About SoftwareInstaller': function(){ _self_.about(); },
			'Check Updates': function(){ _self_.checkUpdates(); },
			'Quit': function(){ joAppManager.quit(_id_); },
		},
		
		'File': {
			'Open File...': function(){ _self_.openFile(); },
		},
	},
	
	onload: function(){
//		this.checkUpdates();
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
	
	checkUpdates: function(){
		joCore.logger.log('Start to check updates...');
		
		var self = this;
		
		var apps = joAppManager.apps.concat();
		
		Deferred.loop(apps.length, function(i){
		
			var appInfo = apps[i];
			
			//更新URIが設定されていない場合は終了
//			if(!appInfo.updateURI) return;
			
//			return joCore.IO.Network.read(appInfo.updateURI, 'text/plain').next(function(req){
			
//				if(!req.responseText) return;
				
//				var updateInfo = JSON.parse(req.responseText);
			
				//更新があったとき
//				if(updateInfo.update === true && updateInfo.installHTML){
				
					joCore.logger.log('Start to update: ', appInfo.id);
				
					var installer = new self.Installer();
					
					var installHTML = 'http://127.0.0.1/Dinos/apps/' + appInfo.name + '/install.html';
					
					return installer.init(installHTML).next(function(){
					
						return installer.install().next(function(){
							joCore.logger.log('Finish Update: ' + appInfo.id);
						});
					
					});
				
//				}
			
//			});		
		
		});

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

	defaultTitle: 'Software Installer',

	init_self: function(){
		this.setContent('<p>インストールしたいアプリケーションのinstall.htmlのパスを入力してください。</p>' +
						'<input type="text" class="softwareinstaller-install-html-path" /><button class="softwareinstaller-start-install">Install</button>'
		);
	
		//Install button
		joEvent.addEvent($C('softwareinstaller-start-install', this.display.content), 'mousedown', function(){
		
			var self = this;
			var path = $C('softwareinstaller-install-html-path', this.display.content).value;
			
			this.installer = new _self_.Installer();
			this.installer.init(path).next(function(){
			
				self.checkBeforeInstall();
		
			});
		
		}, false, this);
	
	},
	
	
	appInfoLocalizeTable: {
		name: '名称',
		id: 'アプリケーションID',
		version: 'バージョン',
		app: '実行ファイルURI',
		skin: 'スキンURI',
		icon: 'アイコンURI',
		pref: '設定ファイル',
		install_directory: 'インストール先',
		afterInstall: 'インストール後バッチファイル',
		updateURI: '更新確認先',
	},
	
	
	checkBeforeInstall: function(){
		var appInfo = this.installer._appInfo;
	
		this.setTitle(appInfo.name + ' のインストール');
	
		this.setContent('<p>次のアプリケーションをインストールします。よろしいですか？</p>' + 
						'<p class="softwareinstaller-button-ok"><button class="button-ok">OK</button></p>'
		);
		
		//OK button
		joEvent.addEvent($C('button-ok', this.display.content), 'mousedown', this.install, false, this);
		
		
		//summary
		this.addContent('<h2 class="headline-with-underline">概要</h2>');
		
		this.addContent('<table class="softwareinstaller-app-info-table">' + 
							'<tr><td>名称</td><td>' + appInfo.name + '</td></tr>' + 
							'<tr><td>インストール先</td><td>' + appInfo.install_directory + '</td></tr>' + 
						'</table>'
		);
		
		
		//詳細
		this.addContent('<h2 class="headline-with-underline">詳細</h2>');
		
		var infoTable = '<table class="softwareinstaller-app-info-table">';
		
			for(var i in appInfo){
			
				//filesは無視
				if(i === 'files') continue;
			
				infoTable += '<tr>' + 
								'<td>' + (this.appInfoLocalizeTable[i] || i) + '</td>' + 
								'<td><input type="text" class="softwareinstaller-appInfo-' + i + '" /></td>' + 
							'</tr>';		
			}
		
		infoTable += '</table>';
		
		this.addContent(infoTable);
		
		
		//詳細テーブルに値を挿入 / 変更イベント追加
		var inputs = uuQuery('.softwareinstaller-app-info-table input[class^="softwareinstaller-appInfo-"]');
		
		inputs.forEach(function(input){
		
			//appInfoのプロパティ名を取得
			var prop = input.className.replace('softwareinstaller-appInfo-', '');

			//値代入
			input.value = appInfo[prop];
			
			//変更イベント
			joEvent.addEvent(input, 'change', function(event){
			
				this.installer._appInfo[prop] = event.target.value;
			
			}, false, this);
		
		
		}, this);
		
	},
	
	
	install: function(){
		this.setContent('<p>アプリケーションをインストール中... </p><p>状態： <span class="softwareinstaller-install-progress"></span></p>');
	
		var self = this;
		var progress = $C('softwareinstaller-install-progress', this.display.content);
		
		this.installer.install(function(data){
		
			progress.innerHTML = Math.floor( (data.index*100) / data.length ) + '% 完了';
			
		}).next(function(){
			self.finishInstall();
		});
	
	},
	
	finishInstall: function(){
		this.setContent('<p>インストールが正常に完了しました。</p>');
	},
	
	openFile: function(path){
		var data = joCore.IO.Dinos.read(path);
		
		if(!data) return;
		
		var appInfo = _self_.getAppInfo(data, path);
		
		if(!appInfo) return;
		
		this.checkBeforeInstall(appInfo);
	},
	
	onDrop: function(icon, x, y){
		this.openFile(icon.path);
	},

};
joCore.utils.inherit(_self_.window, joWindow);



_self_.Installer = function(install_html_path){
//	this.init(install_html_path);
}

_self_.Installer.prototype = {

	init: function(path){
	
		var self = this;
		
		return joCore.IO.Network.load('html', path).next(function(iframe){
		
			self._iframe = iframe;
			self._window = iframe.contentWindow;
			self._appInfo = self._window.installApplicationInfo;
			
		});
	
	},

	install: function(onProgress){
	
		//読み込むファイル
		var queue = [];
		
		//読み込むファイルがDinos上ではどの位置に当たるのか
		var urls = [];
		
		for(var i in this._appInfo.files){	
			queue.push(this._appInfo.files[i]);
			urls.push(i);
		}
		
		
		var self = this;
				
		return Deferred.loop(queue.length, function(i){
		
			if(onProgress)
				onProgress.call(null, {
					index: i,
					length: queue.length,
					loading: queue[i],
				});
		
			//ファイルを読み込んでディスクに書き込む
			return joCore.IO.Network.readCrossDomain(queue[i], self._window).next(function(data){
				
				var fileURI = self._appInfo.install_directory + urls[i];
				
				joCore.IO.Dinos.write(data, fileURI, true);
			
			});
		
		}).error(function(ex){ joCore.logger.error(ex); }).next(function(){
		
			//register appData to joAppManager
			
			//modify URIs
			                       self._appInfo.app  = self._appInfo.install_directory + self._appInfo.app;
			if(self._appInfo.skin) self._appInfo.skin = self._appInfo.install_directory + self._appInfo.skin;
			if(self._appInfo.pref) self._appInfo.pref = self._appInfo.install_directory + self._appInfo.pref;
			if(self._appInfo.icon) self._appInfo.icon = self._appInfo.install_directory + self._appInfo.icon;
			
			//register
			joAppManager.register(self._appInfo);
					
			//destory iframe
			joCore.Node.remove(self._iframe);

		});

	},

};