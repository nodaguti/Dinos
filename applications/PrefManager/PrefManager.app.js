_self_ = {
	
	menubar: {
		'PrefManager': {
			'About PrefManager': function(){ _self_.about() },
			'Export Preferences': function(){ joPrefManager.uninit() },
			'Quit': function(){ joAppManager.quit(_id_); },
		},
	},

	win: null,

	onload: function(){
	},
	
	SYSTEM_PREF_URI: 'dinos://Applications/PrefManager/system-pref.html',
	
	start: function(){
		this.win = joUI.window({
			width: 500,
			height: 500,
			application: _id_,
			title: 'PrefManager',
		});
		
		//大枠を描画
		var tabbox = joCore.Node.createNode('ul', null, this.win.display.content);
		var appTabbox, appTab;
		this.win.addStatusbar('<button class="button-apply">適用</button>');
		joEvent.addEvent($C('button-apply', this.win.display.statusbar), 'click', this.apply, false, this, true);
		
		//System Preferenceタブを追加
		var sysprefdata = joCore.IO.Dinos.read(this.SYSTEM_PREF_URI);
		this.win.display.content.appendChild(tabbox);		
	
		var li = joCore.Node.createNode('li', null, tabbox);
		joCore.Node.createNode('a', { 'class': 'tab-name', ':context': 'System' }, li);
		joCore.Node.createNode('div', { 'class': 'tab-content', ':child': sysprefdata }, li);
			
		//アプリケーションタブ作成
		var li = joCore.Node.createNode('li', null, tabbox);
		joCore.Node.createNode('a', { 'class': 'tab-name', ':context': 'Applications' }, li);
		appTab = joCore.Node.createNode('div', { 'class': 'tab-content' }, li);
		appTabbox = joCore.Node.createNode('ul', null, appTab);
		
		//アプリケーションタブの中身作成
		for(var i=0;i<joAppManager.apps.length;i++){
			//読み込み
			var app = joAppManager.apps[i];
		
			//アプリケーションのpref.htmlを読み込んでタブを作成する
			var appPrefData = joCore.IO.Dinos.read('dinos://Applications/' + app.name + '/Pref.html');
			if(!appPrefData) continue;
			
			var li = joCore.Node.createNode('li', null, appTabbox);
			joCore.Node.createNode('a', { 'class': 'tab-name', ':context': app.name }, li);
			joCore.Node.createNode('div', { 'class': 'tab-content', ':child': appPrefData }, li);
		}
		
		//インターフェース構築
		joUI.tab(tabbox); 
		joUI.tab(appTabbox);
		
		//その他のインターフェースを構築する
		console.log(li);
		var hasInterfaces = uuQuery('[class*="preference-"]', this.win.display.content);
		hasInterfaces.forEach(function(hasInterface){
			var instanceName = hasInterface.className.match(/preference-([^\s]+)/)[1];
			var prefName = hasInterface.getAttribute('preference');
			
			
			joCore.logger.log(instanceName);
//				if(!joUI[instanceName] || !window[instanceName]) return;
			
			var instance;
			
			switch(instanceName){
			
				case 'tab':
					joCore.logger.log(hasInterface);
					instance = joUI.tab(hasInterface);
					break;
					
				case 'tableTree':
					instance = new joTableTree([[]], hasInterface);
					break;
			}
		});
		
		
		//値変更時の挙動とデフォルト値を設定する
		var prefboxes = uuQuery('[preference])', this.win.display.content);
		prefboxes.forEach(function(prefbox){
			joEvent.addEvent(prefbox, 'change', this.onPrefChange, false, this);
			joCore.Node.setFormValue(prefbox, joPrefManager.getValue(prefbox.getAttribute('preference')) || '');
		});
	},
	
	
	onPrefChange: function(event){
		var prefbox = event.target;
		joPrefManager.setValue(prefbox.getAttribute('preference'), joCore.Node.getFormValue(prefbox));
	},
	
	getValue: function(node){
		var value = joCore.Node.getFormValue(prefbox);
	},
	
	setValue: function(node){
	
	}.
	
	
	apply: function(event){
		joEvent.fireEvent('joPrefApply', window.document);
	},

};