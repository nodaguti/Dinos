/**
 * document.getElementById のシンタックスシュガー
 * @param {String} aID
 * @return {Node}
 */
function $(aID){
	return document.getElementById(aID);
}

/**
 * uidからノードを取得する
 * @param {String} uid
 */
function $U(uid){
	return uuQuery('[uid="' + uid + '"]')[0];
}

/**
 * document.getElementsByClassName のシンタックスシュガー<br>
 * 該当ノードが1つしかない場合はノードそのものを返す
 *
 * @param {String} aClass クラス名
 * @param {Node} [aTarget=":root"] 捜索範囲
 * @param {Boolean} [notRevealArray=false] falseを指定すると結果が１つの時も配列を返す
 * @return {Node|ElementArray}
 */
function $C(aClass, aTarget, notRevealArray){
	var result = uuQuery.className(aClass, aTarget);
	return !notRevealArray && result.length === 1 ? result[0] : result;
}

/**
 * XPathで要素を得る
 *
 * @param {String} aExpression XPath式
 * @param {Node} [aParent=":root"] 捜索範囲
 * @return {ElementArray}
 */
function $X(aExpression, aParent) {
	var r = [];
	var x = document.evaluate(aExpression, aParent || document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	for (var i=0,l=x.snapshotLength;i<l;i++) {
		r.push(x.snapshotItem(i));
	}
	return r;
}


/** @ignore */
window.xconfig = { storage: 1 * 1000 * 1000 }; // 1MB

/** @ignore */
window.xstorage = function(uu, storage){
	joCore.init();
}

/** @ignore */
window.onbeforeunload = function(){
	alert('本当にDinosを終了しますか？\n' + 
		   'PCの状態を保存しないまま終了した場合、すべての変更が失われます。\n' + 
		   'Dinosの終了をキャンセルする場合は次に表示されるダイアログでキャンセルしてください。\n' + 
		   '（保存するには、メニューバーより「Save Computer...」を選択してください。）');
	return '';
};

/**
 * 基本的な機能を提供する <br>
 * 直下には起動/終了関連の関数がある
 * @class
 */
var joCore = {

	/**
	 * 起動時に表示するウィンドウ
	 * @type joWindow
	 */
	_bootingWindow: null,

	
	/**
	 * Dinos booting settings
	 * @type Object
	 */
	settings: {
		NO_WAIT: false,  // 起動時のウェイトを入れるかどうか true: いれない [false]: いれる
		BOOT_MODE: 'FullScreen',  // 起動モード [FullScreen]: フルスクリーン（#displayな要素が固定幅でない場合） Window: ウィンドウ（#displayな要素が固定幅の場合）
	},
	
	
	/**
	 * 起動時に実行され, 各オブジェクトの初期化を行う
	 * @private
	 */
	init: function(){
		//基本構造の構築
		joCore.Node.createNode('div', { id: 'menubar' }, $('display'));
		joCore.Node.createNode('div', { id: 'windows' }, $('display'));
	
	
		//起動画面の構築
		var bootingBG = joCore.Node.createNode('img', { 'id': 'dinos-booting-background', 'src': 'imgs/bg.gif' }, $('display'));
		this._bootingWin = joCore.Node.createNode('div', { 'id' : 'dinos-booting-window' }, $('display'));
		joCore.Node.addStyle(this._bootingWin, {
			'top': '100px',
			'left': joDisplay.displayWidth/2 - 200 + 'px',
			'max-height': joDisplay.displayHeight * 0.9 + 'px',
			'max-width': joDisplay.displayWidth * 0.9 + 'px',
		});
		this._bootingWin.innerHTML = [
			'<h2>Dinos is now booting...</h2>',
			'Status: <div id="dinos-booting-message"></div>',
		].join('');
		this._bootingMes = $('dinos-booting-message');
	
		//起動処理ここから
		Deferred.next(function(){
			joCore._bootingMes.innerHTML = 'Loading OS...';
			return joCore._load().wait(0.5);
		}).
		next(function(){
			joCore._bootingMes.innerHTML = 'Loading Disk...';
			return joFileManager.init().wait(0.5);
		}).
		next(function(){
			joCore._bootingMes.innerHTML = 'Loading Personal Preferences...';
			return joPrefManager.init();
		}).
		next(function(){
			return joEvent.init();
		}).
		next(function(){
			joCore._bootingMes.innerHTML = 'Loading Applications...';
			return joAppManager.init();
		}).
		next(function(){
			joCore._bootingMes.innerHTML = 'Applying System Skin...';
			return joCore.IO.Network.load('js', 'Libraries/xcss.js');
		}).
		next(function(){
			/* 起動時にすることをここに書く */
			
			//起動画面を非表示にする
			joCore.Node.remove(joCore._bootingWin);
			joCore.Node.remove(bootingBG);
		
			//welcomeを表示する
			joCore.welcome();
			
			//tableTree test
			var dialog = joUI.dialog({
				height: 200,
				width: 200,
				application: 'dinos.finder',
				title: 'test',
				resizable: true
			});
			
			var table = new joTableTree([
				[ 'A', 'B', 'C' ],
				[ 'data a-1', 'data b-1', 'data c-1' ],
				[ 'data a-2', 'data b-2', 'data c-2' ],
				[ 'data a-3', 'data b-3', 'data c-3' ],
				[ 'data a-4', 'data b-4', 'data c-4' ],
				[ 'data a-5', 'data b-5', 'data c-5' ],
				[ { noneditable: true, value: 'Test' }, 12, 25 ],
			], dialog.display.content, null);
			
			//起動を通知
			joEvent.fireEvent('joBooted', window.document);
		}).
		error(function(e){
			joCore.logger.error('Booting Error!', e);

			var mes = '<h1>A Booting Error has occurred.</h1><p>起動中に深刻なエラーが発生したため、起動できませんでした。</p> ' + 
					  '<h2>詳細情報</h2><div style="text-align:left;margin: 0 1em;">';

			var erObj = joCore.logger._errorToObject(e);  //error object
			for(var i in erObj){
				mes += '<b>' + i + '</b> : ' + joCore.utils.sanitizeHTML(erObj[i], true) + '<br />';
			}

			mes += '</div>';
			
			joCore._bootingWin.innerHTML += mes;
			joCore._bootingWin.style.left = 
			joCore._bootingWin.style.top = '10px';
		});
	},

	/**
	 * 終了時に実行され, 各オブジェクトの終了処理を行う
	 * @private
	 */
	uninit: function(){
		joAppManager.uninit();
		joPrefManager.uninit();
	},
	
	/**
	 * OSを構成するファイルを読み込む<br>
	 * 起動時に一度だけ実行される
	 */
	_load: function(){
	
		//Libraries
		return Deferred.parallel([
			joCore.IO.Network.load('js', 'Libraries/json2.js'),
//			joCore.IO.Network.load('js', 'Libraries/uki.js'),
//			joCore.IO.Network.load('js', 'Libraries/uki-more.js'),

		]).next(function(){
			//part of core.js
			return Deferred.parallel([
//				joCore.IO.Network.load('js', 'node.js'),
//				joCore.IO.Network.load('js', 'display.js'),
				
			]).next(function(){
				//Other files
				return Deferred.parallel([
					joCore.IO.Network.load('js', 'filesystem.js'),
					joCore.IO.Network.load('js', 'contextmenu.js'),
					joCore.IO.Network.load('js', 'ui.js'),
					joCore.IO.Network.load('js', 'window.js'),
					joCore.IO.Network.load('js', 'event.js'),
					joCore.IO.Network.load('js', 'application.js'),
					joCore.IO.Network.load('js', 'prefs.js'),
				]);
			});
		});
	},


	/**
	 * 起動時に表示するダイアログ
	 */
	welcome:function(){
		joUI.dialog({
			application: 'dinos.finder',
			title: 'Welcome to Dinos',
			message: [
				'<h2 class="headline-with-underline">Welcome to Dinos!</h2>',
				'<p>Dinos is pure JavaScript OS.<br />You can anything at anywhere only if you have a browser.</p>',
				'<h2 class="headline-with-underline">What do you do next?</h2>',
				'<ul class="hasmarker">',
				'<li><a href="javascript:joCore.showChangeLog();">See "Change Log"</a></li>',
				'<li><a href="javascript:joCore.showThanks();">See "Thanks"</a></li>',
				'</ul>',
			].join(''),
		});
	},
	 
	/**
	 * OSについての情報を表示する
	 */
	aboutOS: function(){
		var message = [
			'Dinos ver 0.0.1',
			'Created by nodaguti',
			'',
			'Dinos stands for "Dinos Is Not OS."',
			'It\'s written in JavaScript.',
			'',
			'<a href="javascript:joCore.showChangeLog();">Change Log</a>',
			'<a href="javascript:joCore.showThanks();">Thanks</a>',
		].join('<br />');

		joUI.dialog({
			message: message,
			application: 'dinos.finder',
			title: 'About This OS'
		});
	},

	/**
	 * ChangeLog.txt を表示する
	 */
	showChangeLog: function(){
		this.IO.Network.read('ChangeLog.txt', 'text/plain').next(function(req){
			joUI.dialog({
				width: 500,
				height: 300,
				message: joCore.utils.sanitizeHTML(req.responseText),
				application: 'dinos.finder',
				title: 'Change Log',
				resizable: true
			});
		});
	},

	/**
	 * Thanks.txt を表示する
	 */
	showThanks: function(){
		this.IO.Network.read('Thanks.txt', 'text/plain').next(function(req){
			joUI.dialog({
				width: 500,
				height: 300,
				message: joCore.utils.sanitizeHTML(req.responseText),
				application: 'dinos.finder',
				title: 'Thanks',
				resizable: true
			});
		});
	},
	
	/**
	 * コンピューターを保存する
	 */
	savePC: function(){
		joPrefManager.uninit();
		joFileManager.uninit();
	},
	
};



/**
 * Useful methods for Build-in Objects
 * @class
 */
joCore.utils = {

	/**
	 * sanitize HTML tags and escape some special characters <br>
	 * innerHTMLでテキストをそのまま流し込むときにどうぞ
	 * @param {String} text
	 * @param {Boolean} [strict=false] 厳格モードにするかどうか <br>trueにするとタグを無効化(実体参照変換)する
	 * @param {Number} [tablen=3] タブ幅
	 * @return {String}
	 */
	sanitizeHTML: function(text, strict, tablen){
		if(!text || typeof text !== 'string' || typeof text.replace !== 'function') return '';
	
		var tab = '', tablen = tablen ? tablen : 3;
		for(var i=1;i<tablen;i++) tab += '&nbsp;';
		
		text = text.replace(/&/g, '&amp;')
		           .replace(/ /g, '&nbsp;')
		           .replace(/\t/g, tab);
				   
		if(strict){
			text = text.replace(/</g, '&lt;')
			           .replace(/>/g, '&gt;');
		}
		
		text = text.replace(/\n/g, '<br />');
		
		return text;
	},
	
	/**
	 * convert Array-like Object into Array
	 * @param {Object} fake
	 * @return {Array}
	 */
	toArray: function(fake){
		try{
			return Array.prototype.slice.call(object);
		}catch(e){
			var rv = [], ri = -1, i = 0, iz = fake.length;
			for (; i < iz; ++i) {
				rv[++ri] = fake[i];
			}
			return rv;
		}
	},
	
	/**
	 * generate UUID(version 4)
	 * @return {String}
	 */
	getUniqueID: function(){
		return UUID.genV4().toString();
	},

	/**
	 * byteで表された大きさを解析する
	 * @param {Number} byte
	 */
	analyzeByteSize: function(byte){
		var r,  //余り
			level = 1,
			prefix = ['b', 'kb', 'mb', 'gb', 'tb', 'pb'],
			_byte = byte;
	
		do{
			r = byte % Math.pow(1024, level);
			level++;
		}while(r < byte);
	
		var result = {};
		for(var i=level-2;i>=0;i--){
			var t = Math.floor(byte / Math.pow(1024, i));
			result[prefix[i]] = t;
			byte -= t * Math.pow(1024, i);
		}

		//summary
		var sizeStr = '',
			unit,
			counter = 0;
			
		for(var i in result){
			if(counter === 0){ sizeStr += result[i]; unit = i.toUpperCase(); }
			if(counter === 1){ sizeStr += '.' + ((result[i] / 1024) + '')[2]; break; }
			counter++;
		}
		result.summary = sizeStr + unit;
		
		//元の大きさ
		result.byte = _byte;

		return result;
	},
	
	/**
	 * 0を補完して桁を揃える
	 * @param {Number} num
	 * @param {Number} length 桁数
	 */
	fixDegit: function(num, length){
		var naturalLength = (num + '').length;
	
		for(var i = length - naturalLength; i > 0; i--){
			num = '0' + num;
		}

		return num;
	},
	
	/**
	 * オブジェクトの継承をする
	 * @param {Object} child 子オブジェクト
	 * @param {Object} super_ 親オブジェクト
	 */
	inherit: function(child, super_){
//		if(Object.getPrototypeOf)
//			Object.getPrototypeOf(child) = super_;
//		else

//		if(child.prototype.__proto__)
//			child.prototype.__proto__ = super_.prototype;
//		else
/*			for(var i in super_.prototype){
				if(!child.prototype[i])
					if(typeof super_.prototype[i] === 'object')
						child.prototype[i] = Object.create(super_.prototype[i]);
					else if(typeof super_.prototype[i] === 'function')
						eval('var dammy = ' + super_.prototype[i].toString());
						child.prototype[i] = dammy;
					else
						child.prototype[i] = super_.prototype[i];
			}*/
			var dummy = function(){};
			dummy.prototype = super_.prototype;
			var dummyIns = new dummy();
			
			for(var i in dummyIns){
				if(!child.prototype[i])
					child.prototype[i] = dummyIns[i];
			}
	},
	
	

};



/**
 * Useful methods for Element
 * @class
 */
joCore.Node = {

	/**
	 * 要素を作成する
	 *
	 * @param {String} aTagName 作成する要素の名前
	 * @param {Object} [attributes] 要素に追加する属性 <br>{ attributeName: attributeValue, ... }
	 * @param {Node} [aOwner] 要素の親
	 * @param {String} [aNameSpace] 要素の名前空間 <br>省略時は document.craeteElement と等価
	 */
	createNode: function(aTagName, attributes, aOwner, aNameSpace){
		var tag = (aNameSpace === undefined) ? document.createElement(aTagName) :
		                                       document.createElementNS(aNameSpace, aTagName);

		if(attributes) this.setAttributes(tag, attributes);
		if(aOwner) aOwner.appendChild(tag);
		
		this.getUniqueID(tag);

		return tag;
	},
	
	/**
	 * 各要素に固有のID(UUID)を返す
	 * @param {Node} aElement
	 * @return {String} id
	 */
	getUniqueID: function(aElement){
		if(typeof aElement.hasAttribute === 'undefined') return;
		if(aElement.hasAttribute('uid')){
			return aElement.getAttribute('uid');
		}else{
			var id = joCore.utils.getUniqueID();
			aElement.setAttribute('uid', id);
			return id;
		}
	},
	
	/**
	 * 指定した座標にあるノードをすべて取得する
	 *
	 * @param {Number} x x座標
	 * @param {Number} y y座標
	 * @return {ElementArray} 一番上 -> 一番下の順でソート済み
	 */
	getNodesByPosition: function(x, y){
		var result = [];  //該当する要素の配列
		var element;
		
		do{
			element = document.elementFromPoint(x, y);
			result.push(element);
			joCore.Node.addStyle(element, { display: 'none' });
		}while(element.tagName.toLowerCase() !== 'html');
		
		result.forEach(function(el){ joCore.Node.removeStyle(el, { 'display': 'none' }); });
		
		return result;
	},
	
	/**
	 * 要素を移動する
	 *
	 * @param {Node} aElement 対象の要素
	 * @param {Node} moveTo 移動先の親要素
	 */
	moveNode: function(aElement, moveTo){
		aElement.parentNode.removeChild(aElement);
		moveTo.appendChild(aElement);
	},

	/**
	 * 指定した要素を削除する
	 *
	 * @param {Node}
	 */
	remove: function(aElement){
		aElement.parentNode.removeChild(aElement);
	},
	
	/**
	 * 指定したCSS Selectorに合致する要素を削除する
	 *
	 * @param {String} aSelector CSS Selector
	 */
	deleteNodes: function(aSelector){
		var elements = uuQuery(aSelector);

		for(var i=0,l=elements.length;i<l;i++){
			elements[i].parentNode.removeChild(elements[i]);
		}

		elements = null;
	},

	/**
	 * 要素に属性を追加する
	 *
	 * @param {Node} aElement 対象の要素
	 * @param {Object} attributes 追加する属性 <br>{ attributeName: attributeValue, ... } <br>
	 *                            属性名を :context にすると、要素にテキストノードを追加する
	 */
	setAttributes: function(aElement, attributes){
		for(var i in attributes){
			if(i === ':context'){
				//テキストノードの場合
				aElement.appendChild( document.createTextNode(attributes[i]) );
				
			}else if(i === ':child'){
				//innerHTML
				var dom = typeof attributes[i] === 'string' ? this.textToDOM(attributes[i], 'text/html') : attributes[i];
				if(dom) aElement.appendChild(dom);
				else aElement.innerHTML = attributes[i];
				
			}else{
				aElement.setAttribute(i, attributes[i]);
			}
		}
	},

	/**
	 * 要素にスタイルを追加する<br>
	 * style属性に追加されるので優先順位に注意すること
	 *
	 * @param {Node} aElement 対象の要素
	 * @param {Object} aSelectors 追加するスタイル <br>{ Property: Value, ... }
	 */
	addStyle: function(aElement, aSelectors){
		var selectorStr = '',
		    properties = [];
		
		//CSS文字列を作成
		for(var i in aSelectors){
			selectorStr += i + ':' + aSelectors[i] + ';';
			properties.push(i);
		}
		
		//掃除
		this.removeStyle(aElement, properties);
		
		var style = aElement.getAttribute('style');
		
		//行末にセミコロンがない場合は補う
		if(style && !(/;\s*$/.test(style))) style = style + ';';
		
		//スタイルを追加して、適用する
		if(style) selectorStr = style + selectorStr;
		aElement.setAttribute('style', selectorStr);
	},
	
	/**
	 * 要素のスタイルを削除する
	 * @param {Node} aElement 対象の要素
	 * @param {Object|Array} aSelectors 削除するスタイル
	 *                        Object { Property: Value, ...} の場合： 指定された値を持つプロパティを削除
	 *                        Array の場合： 指定されたプロパティをすべて削除
	 */
	removeStyle: function(aElement, aSelectors){
		var style = aElement.getAttribute('style');
		if(!style) return;

		if(typeof aSelectors.concat === 'function'){  //Array
			for(var i=0,l=aSelectors.length,r; i<l; i++){
				r = new RegExp(aSelectors[i] + '[^;]*?;\\s*', 'g');
				style = style.replace(r, '');
			}
		}else{
			for(var i in aSelectors){
				r = new RegExp(i + '\\s*:\\s*' + aSelectors[i] + '\\s*;\\s*', 'g');
				style = style.replace(r, '');
			}
		}
		
		aElement.setAttribute('style', style);
	},

	/**
	 * 指定したクラス名を追加する
	 *
	 * @param {Node} aElement 対象の要素
	 * @param {String|Array} aClassNames 追加するクラス名<br>
	 *                                   複数一括追加をする場合は配列か半角スペース区切りの文字列を渡す<br>
	 *                                   すでにクラス名が存在していた場合は何も行わない
	 */
	addClass: function(aElement, aClassNames){
		var classes = typeof aClassNames === 'object' ? aClassNames : aClassNames.split(' ');
		
		for(var i=0,l=classes.length;i<l;i++){
			if(this.hasClass(aElement, classes[i])) continue;
		
			aElement.className += ' ' + classes[i];
		}
	},

	/**
	 * 指定したクラス名を削除する
	 *
	 * @param {Node} aElement 対象の要素
	 * @param {String|Array} aClassNames 削除するクラス名<br>
	 *                                   複数一括削除をする場合は配列か半角スペース区切りの文字列を渡す
	 */
	removeClass: function(aElement, aClassNames){
		var classes = typeof aClassNames === 'object' ? aClassNames : aClassNames.split(' ');
		
		for(var i=0,l=classes.length;i<l;i++){
			if(!this.hasClass(aElement, classes[i])) continue;
		
			aElement.className = aElement.className.replace(classes[i], '');
		};
	},

	/**
	 * 指定したクラス名を持っているかどうか調べる
	 *
	 * @param {Node} aElement 対象の要素
	 * @param {String} aClassName クラス名
	 * @return {Boolean}
	 */
	hasClass: function(aElement, aClassName){
		var c = aElement.getAttribute('class');
		return c && c.indexOf(aClassName) !== -1;
	},
	
	/**
	 * Toggle Class
	 * @param {Node} aElement
	 * @param {aClassName} aClassName
	 */
	toggleClass: function(aElement, aClassName){
		if(this.hasClass(aElement, aClassName))
			this.removeClass(aElement, aClassName);
		else
			this.addClass(aElement, aClassName);
	},
	

	/**
	 * String -> DOM
	 *
	 * @param {String} aString DOMへ変換する文字列
	 * @param {String} [aMimeType="text/xml"] MimeType
	 * @return {Node}
	 */
	textToDOM: function(aString, aMimeType){
		if(!aMimeType) joCore.logger.warning('[textToDOM] aMimeType is not set. "text/xml" is used instead.');
	
		try{
			var parser = new DOMParser();
			var dom = parser.parseFromString(aString, aMimeType || 'text/xml');
			
			//エラー処理
			if(!dom) throw new Error('Cannot convert by DOM Parser');
			if(dom.documentDocument.tagName === 'parseError' ||
			   dom.documentDocument.namespaceURI === 'http://www.mozilla.org/newlayout/xml/parsererror.xml')
					throw new Error('DOM Parser: parse error');
					
			return dom;
		}catch(e){
			try{
				var range = document.createRange();
				range.selectNodeContents(document.body);  //Hack for Safari, Opera
				return range.createContextualFragment(aString);
			}catch(ex){
				//IE?
				try{
/*					if(aMimeType === 'text/html'){
						var div = document.createElement('div');
						var fragment = document.createDocumentFragment();
						div.innerHTML = aString;
						
						for(var i=0, l=div.childNodes; i<l; i++){
							fragment.appendChild(div.childNodes[i]);
						}
						
						return fragment;
					
					}else{
						var xmlDOM = new ActiveXObject('Microsoft.XMLDOM');
						xmlDOM.async = 'false';
						xmlDOM.loadXML(aString);
						return xmlDOM;
					}*/
					
//					var req = new xmlHttpRequest();
//					req.

					throw new Error('IE has no way to convert text to HTML :(');
					
				}catch(exx){
					joCore.logger.error('[textToDOM]', e);
					joCore.logger.error('[textToDOM]', ex);
					joCore.logger.error('[textToDOM]', exx);
					
					return null;
				}
			}
		}
		
		return null;
	},

	/**
	 * DOM -> String
	 *
	 * @param {Node} aDOM
	 * @return {String}
	 */
	DOMToText: function(aDOM){
		try{
			var serializer = new XMLSerializer();
			return serializer.serializeToString(aDOM); //Firefox, Safari, Opera, Chrome, IE9
		}catch(e){
			//IE?
			if(aDOM.outerHTML) return aDOM.outerHTML;
			if(aDOM.xml) return aDOM.xml;
			
			//Error
			joCore.logger.error(new Error('Cannot convert DOM into Text'));
			return null;
		}
	},

	/**
	 * ノードの位置情報を得る
	 *
	 * @param {Node} aElement 情報を取得する要素
	 * @param {Node} [aParent] 位置の基準となる要素<br>
     *                         省略時は Element.getBoundingClientRect() と同義になる
	 * @return {Object} ノードの位置情報を持つオブジェクト
	 * @return {Number} .left 左端からの距離 [px]
	 * @return {Number} .right 右端からの距離 [px]
	 * @return {Number} .top 上端からの距離 [px]
	 * @return {Number} .bottom 下端からの距離 [px]
	 * @return {Number} .width 横幅 [px]
	 * @return {Number} .height 高さ [px]
	 */
	getNodeRect: function(aElement, aParent){
		var elementRect = aElement.getBoundingClientRect();
		
		if(aParent){
			var parentRect = aParent.getBoundingClientRect();
		
			return {
				left: elementRect.left - parentRect.left,
				right: elementRect.right - parentRect.right,
				top: elementRect.top - parentRect.top,
				bottom: elementRect.bottom - parentRect.bottom,
				width: elementRect.right - elementRect.left,
				height: elementRect.bottom - elementRect.top
			};
		}else{
			return {
				left: elementRect.left,
				right: elementRect.right,
				top: elementRect.top,
				bottom: elementRect.bottom,
				width: elementRect.right - elementRect.left,
				height: elementRect.bottom - elementRect.top
			};
		}
	},
	
	/**
	 * フォーム関連要素の値を得る
	 * @param {Node} aElement input, textarea, select, or radiogroup(element[class=radiogroup] which has a group of input[type=radio])
	 * @param {Boolean} [getValue=false] whether returns aElement.value or not(returns aElement.checked(radio) or aElement.firstChild(select))
	 * @return {String|Array} select[multiple=true] might return Array.
	 */
	getFormValue: function(aElement, getValue){
		switch(aElement.tagName.toLowerCase()){
			case 'input':
				switch(aElement.type){
					case 'checkbox':
					case 'radio':
						return getValue ? (aElement.checked ? aElement.value : null) : aElement.checked;
					
					default:
						return aElement.value;						
				}
			
			case 'textarea':
				return aElement.value;
			
			case 'select':
				var options = joCore.utils.toArray(aElement.options);
				var values = [];
				options.forEach(function(option){
					if(option.selected)
						getValue ? this.push(option.value) : this.push(option.firstChild);
				}, values);
				
				return values.length ? values : null;
			
			default:  //may be radiogroup
				var radios = uuQuery('input[type=radio]', aElement);
				var values = [];
				radios.forEach(function(radio){
					var v = joCore.getFormValue(radio);
					if(v !== null) this.push(v);				
				}, values);
				
				return values.length ? values : null;
		}
	},
	
	/**
	 * フォーム関連要素の値をセットする
	 * @param {Node} aElement input, textarea, select, or radiogroup(element[class=radiogroup] which has a group of input[type=radio])
	 * @param {String|Array} value the value(s) to set
	 */
	setFormValue: function(aElement, value){
		switch(aElement.tagName.toLowerCase()){
			case 'input':
				switch(aElement.type){
					case 'checkbox':
					case 'radio':
						aElement.checked = value;

					default:
						aElement.value = value;					
				}
			
			case 'textarea':
				aElement.value = value;
/*
			//not implemented yet
			
			case 'select':
				var options = joCore.utils.toArray(aElement.options);
				var values = [];
				options.forEach(function(option){
					if(option.selected)
						this.push(option.value);			
				}, values);
				
				return values.length ? values : null;
			
			default:  //may be radiogroup
				var radios = uuQuery('input[type=radio]', aElement);
				var values = [];
				radios.forEach(function(radio){
					var v = joCore.getFormValue(radio);
					if(v !== null) this.push(v);				
				}, values);
				
				return values.length ? values : null;*/
		}
	},
};


 
/**
 * IO service of Dinos File System and Local Files
 * @class
 */
joCore.IO = {

	/**
	 * ネットワーク上にあるファイルを扱うクラス
	 * @class
	 */
	Network: {
	
		/**
		 * ファイルを読み込む（DOM0）
		 *
		 * @param {String} aFileType js,css,無指定 のどれか
		 * @param {String} aFilePath core.js からみた相対パス or 絶対パス
		 * @return {Deferred|Node} js: script要素 <br>
		 *                         css: link要素 <br>
		 *                         その他: iframe要素
		 */
		load: function(aFileType, aFilePath){
			var deferred = new Deferred();
			var tag;
			
			switch(aFileType){
			
				case 'js':
					tag = 
						joCore.Node.createNode('script', {
							type : 'text/javascript',
							src : aFilePath
						}, document.body);
					
					break;
					
				case 'css':
					tag =
						joCore.Node.createNode('link', {
							type: 'text/css',
							rel: 'stylesheet',
							href: aFilePath
						}, document.body);
					
					break;
					
				default:
					tag =
						joCore.Node.createNode('iframe', {
							src: aFilePath,
						}, document.body);
						
					joCore.Node.addStyle(tag, {
						width: 0,
						height: 0,
						visibility: 'hidden',
						position: 'absolute',
						top: '10000px',
						left: '10000px',
					});
						
					break;
			}

			tag.addEventListener('load', function(){ deferred.call(tag); }, false);
			return deferred;
		},
		
		/**
		 * ファイルを読み込む（Ajax）
		 * 
		 * @param {String/DinosPath} aFilePath 読み込むファイル
		 * @param {String} [aMimeType="text/xml"] ファイルのMimeType
		 * @return {Deferred|XMLHttpRequest}
		 */
		read: function(aFilePath, aMimeType){
			try{
				var deferred = new Deferred();
				
				var req;
				try{
					req = new XMLHttpRequest();
				}catch(e){
					req = new ActiveXObject('Microsoft.XMLHTTP');
				}
				
				req.onerror = function(){ deferred.fail(req); };
				req.onreadystatechange = function(){
					if(req.readyState === 4){
						if(req.status === 0 || req.status === 200)
							deferred.call(req);
						else
							deferred.fail(req);
					}
				};
			
				req.open('GET', aFilePath, true);
				
				if(req.overrideMimeType)
					req.overrideMimeType(aMimeType || 'text/xml');
					
				req.send(null);
				
			}catch(e){
				joCore.logger.error('[joCore.IO.Network.read]', e);
				setTimeout(function(){ deferred.fail(e); }, 0);
				return deferred;
			}
			
			return deferred;
		},
		
		/**
		 * クロスドメインで通信をする（postMessageを使用）
		 * @param {String} url
		 * @param {Window} targetWindow
		 * @return {Deferred|Any} messageイベントのevent.dataプロパティが返る
		 * @note ターゲットウィンドウ側でmessageイベントを実装している必要あり
		 */
		readCrossDomain: function(url, targetWindow){
		
			var deferred = new Deferred();
			
			window.addEventListener('message', function(event){
			
				//Unlisten the message event
				window.removeEventListener('message', arguments.callee, false);
			
				deferred.call(event.data);

			}, false);
		
		
			targetWindow.postMessage(url, '*');
			
			return deferred;
		},
		
	},
	
	
	/**
	 * Dinosディスク内のファイルを扱うクラス
	 * @class
	 */
	Dinos: {
		/**
		 * ファイルに書き込む <br>
		 * もし当該ファイルが存在していなかった場合には自動で作成する
		 *
		 * @param {String} aString 書き込むデータ
		 * @param {String/DinosPath} aFilePath 書き込み先のファイル
		 * @param {Boolean} [notCheckDuplicate=false] 重複を警告するかどうか
		 * @return {Node} 書き込み先のファイルのノード
		 */
		write: function(aString, aFilePath, notCheckDuplicate){
			var fileName = joFileManager.getFileNameFromPath(aFilePath);
			var folderPath = joFileManager.getParentFolderFromPath(aFilePath);

			joCore.logger.log('write a file:', {file: fileName, folder: folderPath});

			if(joFileManager.exist(aFilePath)){
				if(!notCheckDuplicate){
					joUI.confirm({
						message: fileName + 'という名前のファイルがすでにこの場所に存在しています。上書きしますか？'
					}).next(function(overwriteFlag){
						if(overwriteFlag) joFileManager.write(aString, aFilePath);
					});
				}else{
					joFileManager.write(aString, aFilePath);
				}
			}else{
				joFileManager.createFile(fileName, folderPath);
				joFileManager.write(aString, aFilePath);
			}
		},
		
		/**
		 * ファイルを読み込む <br>
		 * data属性にデータが入っているファイルと、CDATAセクションなどで格納されているファイル共に読み込めるので
		 * ファイルの内容読み込みにはjoFileManager.getFileではなくこちらを推奨
		 *
		 * @param {String/DinosPath} path 読み込むファイルのパス
		 * @return {String} ファイルのデータ
		 */
		read: function(path){
			var file = joFileManager.getFile(path);
			
			if(!file) return '';

//			if(file.hasAttribute('data')){
//				return file.getAttribute('data');
//			}else{
				//innerText: Firefox, IE以外
				//textContent: Firefox
				//正規表現: IE
				
//				joCore.logger.log(file.innerHTML);
				
				return file.innerText || file.textContent || file.text || '';  //Other || Firefox || IE
//			}
		},
	
	},
	
	
	/**
	 * ローカルファイルを扱うクラス
	 * @class
	 */
	Local: {
	
		/**
		 * ファイルを書き出す
		 * @param {String} aString 書き出す文字列
		 * @param {String} aFileName ファイルネーム
		 */
		write: function(aString, aFileName){
			Deferred.next(function(){
				return joUI.prompt({
					width: 300,
					height: 100,
					title: 'Save as...',
					message: 'Enter the file name.',
					defaultStr: aFileName,
				});		
			}).next(function(name){
				return joUI.dialog({
					width: 300,
					height: 100,
					message: '<p>Click the below link <b>with alt-key</b> to save file.</p>' + 
							 '<a class="local-write-link" href="data:application/octet-stream,' + 
							 encodeURIComponent(aString) + '">' + name + '</a>',
					title: 'Save as...',
				});
			}).error(function(e){ joCore.logger.error(e); });
		},
	
		/**
		 * ファイルを読み込む
		 * @param {String} aFileName 読み込むファイル名
		 * @return {Deferred|String}
		 */
		read: function(aFileName, notCheckFileName){
			return Deferred.next(function(){   //ダイアログを表示して、ユーザーがファイルを指定するのを待機する
				var deferred = new Deferred();
				var that = this;
				
				//ダイアログ表示
				var dialog = joUI.dialog({
					width: 300,
					height: 140,
					message: '<p>Dinos want to access a local file. <br /> \
							  Please select or drop "<b>' + aFileName + '</b>".</p><br /> \
							  <input type="file" class="local-read-input" /><br /><br /> \
							  * If you cannot select or drop a file, <a class="local-read-prompt-link">click here</a>.',
					title: 'Open as...',
				});
				
				joEvent.addEvent($C('local-read-prompt-link', dialog.display.content), 'click', loadWithPrompt, false, this);
				
				//dropbox化
				joUI.dropbox(dialog.display.content, {
					self: that,
					input: $C('local-read-input', dialog.display.content),
					callback: function(dataArray, files){
						for(var i=0;i<dataArray.length;i++){
							if(!dataArray[i]) return;
							
							if(notCheckFileName || checkValidFile(files[i])){
								dialog.close();
								deferred.call(dataArray[i]);	
							}
						}
					},
					onerror: loadWithPrompt,
				});

				
				//要求されたファイルが指定されたのかどうかを調べる
				function checkValidFile(file){
					if(!file.name || !file.fileName) return false;
					return (file.name && file.name.indexOf(aFileName) > -1) || (file.fileName && file.fileName.indexOf(aFileName) > -1);
				}
				
				//Drag and Drop APIに失敗した場合
				function loadWithPrompt(){
					joUI.prompt({
						width: 500,
						height: 500,
						message: 'Your browser does not support Drag and Drop API. Please copy and paste the content of "<b>' + aFileName + '</b>".',
						title: 'Open as...',
						multiline: true,
					}).next(function(data){
						dialog.close();
						deferred.call(data);
					});
				
				}
			
				return deferred;
			});
		},
	
	},
};


/**
 * Logger
 * @class
 */
joCore.logger = {

	/**
	 * 出力レベル：デバッグ
	 * @type Number
	 */
	DEBUG: 0,
	
	/**
	 * 出力レベル：ログ
	 * @type Number
	 */
	LOG: 1,
	
	/**
	 * 出力レベル：情報
	 * @type Number
	 */
	INFO: 2,
	
	/**
	 * 出力レベル：警告
	 * @type Number
	 */
	WARNING: 3,
	
	/**
	 * 出力レベル：エラー
	 * @type Number
	 */
	ERROR: 4,
	
	/**
	 * コンソールにメッセージを出力
	 * @param {Number} [lebel=LOG] 出力レベル
	 */
	message: function(level){
		var method = '';
	
		switch(level){
			case this.DEBUG:	level = '[DEBUG]';		method = 'debug'; break;
			case this.LOG:		level = '';				method = 'log';   break;
			case this.INFO:		level = '[INFO]';		method = 'info';  break;
			case this.WARNING:	level = '[WARNING]';	method = 'warn';  break;
			case this.ERROR:	level = '[ERROR]';		method = 'error'; break;
			default:			level = '';				method = 'log';   break;
		}
	
		if(window.console){
			try{
				if(typeof console[method] === 'function')
					console[method].apply(console, arguments);
				else
					console.log.apply(console, arguments);
			}catch(e){
				//maybe IE
			
				var argStr = joCore.utils.toArray(arguments).join('\n');
			
				if(typeof console[method] === 'function')
					console[method](argStr);
				else
					console.log(argStr);
			}
		}else if(window.dump){
			window.dump((joCore.utils.toArray(arguments)).join(' ') + '\n');
			
		}else{
//			alert((joCore.utils.toArray(arguments)).join('\n'));
		}
	},
	
	/**
	 * ログメッセージ
	 *
	 * @notes 複数の引数を指定した場合は半角スペースで区切って出力する。ほかのメソッドも同様。
	 * @example
	 *    joCore.logger.log('hoge');  //hoge
	 *	  joCore.logger.log('hoge', 'fuga', 'foo', 'bar'); //hoge fuga foo bar
	 */
	log: function(){
		var args = joCore.utils.toArray(arguments);
		this.message.apply(this, [this.LOG].concat(args));
	},

	/**
	 * デバッグメッセージ
	 */
	debug: function(){
		var args = joCore.utils.toArray(arguments);
		this.message.apply(this, [this.DEBUG].concat(args));
	},
	
	/**
	 * 情報メッセージ
	 */
	info: function(){
		var args = joCore.utils.toArray(arguments);
		this.message.apply(this, [this.INFO].concat(args));
	},
	
	/**
	 * 警告メッセージ
	 */
	warning: function(){
		var args = joCore.utils.toArray(arguments);
		this.message.apply(this, [this.WARNING].concat(args));
	},
	
	/**
	 * エラーメッセージ<br>
	 * Errorオブジェクトを渡した場合は, Errorオブジェクトが持つ全てのプロパティを出力する
	 */
	error: function(){
		var args = joCore.utils.toArray(arguments);
		var args_ = args.concat();
		
		//エラーオブジェクトを展開する
		for(var i=0, l=args.length; i<l; i++){
			if(! (args[i] instanceof Error)) continue;
			
			args_.splice(i, 1);
			
			var e = this._errorToObject(args[i]);
			args_.push('\n[ERROR] ', e.name);
			for(var j in e) args_.push('\n' + j + ' : ' + e[j]);
		}
	
		this.message.apply(this, [this.ERROR].concat(args_));
	},
	
	/**
	 * エラーオブジェクトを普通のオブジェクトに変換して各プロパティを列挙可能にする
	 * @param {Error} er エラーオブジェクト
	 * @return {Object} Errorオブジェクトの各プロパティ
	 */
	_errorToObject: function(er){
		//stackの解析を試みる
		var stack, stacktrace;
		
		if(er.stack){
			stack = er.stack.replace(/(\(.*?\)[^\(]+)/ig, '$1\n').replace(/\n\n/g, '\n');
		}
		if(er.stacktrace){
			stacktrace = er.stacktrace.replace(/:\s/g, ':\n').replace(/\n\n/g, '\n');
		}
	
		return {
			'name': er.name,
			'description': er.description,
			'message': er.message,
			'constructor': er.constructor,
			'fileName': er.fileName,
			'number': er.number,
			'lineNumber': er.lineNumber,
			'stack': stack || er.stack,
			'stacktrace': stacktrace || er.stacktrace,
		};
	},
	
	/**
	 * タイマーオブジェクト
	 * @class
	 */
	timer: {
	
		/**
		 * タイマーをスタートさせる
		 * @return {Number} タイマーID
		 */
		start: function(){
			return (new Date()).getTime();
		},
		
		/**
		 * タイマーを終了させる <br> 結果はjoCore.logger.logで出力される
		 * @param {Number} aID タイマーID
		 */
		end: function(aID){
			var end = (new Date()).getTime();
			joCore.logger.log('[joCore timer]', end - aID, 'ms');
		},
		
	},
};



/**
 * joDisplay
 * @class
 */
var joDisplay = {

	_offsetX: 0,
	_offsetY: 0,

	init: function(){
		this.setOffset(0, 0/*joCore.Node.getNodeRect($C('menupopup', $('menubar'))).height*/);

		joEvent.addEvent(window, 'resize', this.onResize, false, this);
		this.onResize();
	},

	/** @function */
	get displayWidth(){
		if(joCore.settings.BOOT_MODE === 'FullScreen')
			return document.documentElement.clientWidth - this._offsetX;
		else
			return joCore.Node.getNodeRect($('display')).width - this._offsetX;       
	},

	/** @function */
	get displayHeight(){
		if(joCore.settings.BOOT_MODE === 'FullScreen')
			return document.documentElement.clientHeight - this._offsetY;
		else
			return joCore.Node.getNodeRect($('display')).height - this._offsetY;  
	},

	/**
	 * ディスプレイのオフセットを設定する
	 * @param {Number} x 上端
	 * @param {Number} y 左端
	 */
	setOffset: function(x, y){
		this._offsetX = x;
		this._offsetY = y;
	},

	/**
	 * ウィンドウがリサイズされたときに呼び出される 
	 */
	onResize: function(){
		joCore.Node.addStyle($('windows'), {
			top: this._offsetY + 'px',
			left: this._offsetX + 'px',
			width: this.displayWidth + 'px',
			height: this.displayHeight + 'px'
		});
	}

};
