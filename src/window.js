/**
 * Create a window
 * @constructor
 * @param {Object} param
 * @param {Number} param.width 横幅
 * @param {Number} param.height 縦幅
 * @param {Number} [param.x] x座標
 * @param {Number} [param.y] y座標
 * @param {String} param.application 作成元のアプリケーションid
 * @param {String} [param.title] タイトル
 * @param {Node|joWindow} [param.related] 基準になるノードまたはjoWindowオブジェクト
 */
function joWindow(param){
	this.param = param;

	this.init();
}
joWindow.prototype = {

	/**
	 * ウィンドウの構造（XHTML）
	 * @type String
	 */
	constract: [
		'<div class="menubar">',
		'	<button class="button-close">x</button>',
		'	<button class="button-minimize">-</button>',
		'	<button class="button-maximize">+</button>',
		'	<div class="title">Untitled</div>',
		'</div>',
		'<div class="content"></div>',
		'<div class="statusbar">',
		'	<div class="resizer"></div>',
		'</div>',
		'<div class="dammy-wrapper"></div>', //non-activeなwindowにかぶせ、clickを効率よく処理するためのwrapper
	].join(''),
	
	/**
	 * 各要素のDOMの参照
	 * @type Object
	 */
	display: {},
	
	/**
	 * param.titleが設定されていないときに表示するタイトル
	 * @type String
	 */
	defaultTitle: 'Untitled',

	/**
	 * ウィンドウを初期化する<br>
	 * 処理項目が多いのでjoWindowを継承するときには、独自の初期化処理は init_self とすることを推奨
	 * @private
	 */
	init: function(){
		//this.display の初期化
		this.display = null;
		this.display = {};
	
		if(!this.param.application || this.param.application === 'System')
			joCore.logger.warning('[joWindow] param.application is not set.');
	
		this._setRelatedPosition();
	
		this.display.window = joCore.Node.createNode('div', { 'class': 'window ' + this.param.application, ':child': this.constract }, $('windows'));
		this.display.window.owner = this;

		this.display.title = $C('title', this.display.window);
		this.display.content = $C('content', this.display.window);
		this.display.statusbar = $C('statusbar', this.display.window);
		this.display.menubar = $C('menubar', this.display.window);
		
		if(this.param.x && this.param.y)
			this.moveTo(this.param.x, this.param.y);
			
		if(this.param.width && this.param.height)
			this.resizeTo(this.param.width, this.param.height);

		if(typeof this.param.title === 'string')
			this.setTitle(this.param.title);
		else
			this.setTitle(this.defaultTitle);

		this.onFocus();
		this._setEvents();
		
		//コンテキストメニューの設定
		this.contextmenu = new joContextMenu(this);
		this.contextmenu.set(this.display.window, null);
	},


	/**
	 * 各イベントを設定する
	 */
	_setEvents: function(){
		joEvent.addEvent($C('button-close', this.display.window), 'lclick', this.close, false, this);
		joEvent.addEvent($C('button-minimize', this.display.window), 'lclick', this.toggleMinimize, false, this);
		joEvent.addEvent($C('button-maximize', this.display.window), 'lclick', this.toggleMaximize, false, this);
		joEvent.addEvent($C('dammy-wrapper', this.display.window), 'mousedown', this.onFocus, false, this);
		joEvent.addEvent(this.display.window, 'joResize', this.onResize, false, this);
		joEvent.addEvent(this.display.window, 'joResizeEnd', this.onResize, false, this);
		
		joEvent.setDraggable(this.display.menubar, this.display.window, $('display'));
		joEvent.setResizable($C('resizer', this.display.window), this.display.window);
		joEvent.stopPropagation(this.display.window, 'mousedown');
		joEvent.stopPropagation(this.display.window, 'click');
	},
	
	/**
	 * ウィンドウの位置を、ほかのウィンドウを元にして自動で決定する
	 */
	_setRelatedPosition: function(){
		if(typeof this.param.related === 'object' || (!this.param.x && !this.param.y) ){
			if(this.param.related){
				var node = this.param.related.display ? this.param.related.display.content : this.param.related;
			}else{
				var node = joAppManager.getFrontWindow();
			}
			
			if(!node) return;
			
			var rect = joCore.Node.getNodeRect(node);
			this.param.x = rect.left + 10;
			this.param.y = rect.top + 10;
		}
	},
	
	/**
	 * ウィンドウの大きさを内容に応じて適切な大きさに変更することを試みる
	 */
	setAppropriateSize: function(){
	
		//測定用要素の作成
		var div = joCore.Node.createNode('div', {
			'class': 'jowindow-size-judgement',
			':child': this.display.content.innerHTML,
		}, document.body);
		
		//測定用CSSの追加
		joCore.Node.addStyle(div, {
			'visibility': 'hidden',
			'position': 'absolute',
			'top': 0,  //joDisplay.displayHeight + 99 + 'px',
			'left': 0, //joDisplay.displayWidth + 99 + 'px',
			'width': 'auto',
			'height': 'auto',
			'line-height': '1.8',
		});
		
		uuQuery('input, button', div).forEach(function(form){
			joCore.Node.addStyle(form, { display: 'block' });
		});
		
		
		//大きさ測定
		var rect = joCore.Node.getNodeRect(div);
		joCore.Node.remove(div);
		
		//補正
		var width = rect.width + 50;
		var height = rect.height + 20;
		
		if(width > joDisplay.displayWidth) width = joDisplay.displayWidth;
		if(width < 200) width = 200;
		
		if(height > joDisplay.displayheight) height = joDisplay.displayheight;
		if(height < 100) height = 100;
		
		//実際にウィンドウのサイズを変更する
		this.resizeTo(width, height);
	},
	
	/**
	 * 指定したサイズにウィンドウをリサイズする
	 * @param {Number} width 横幅
	 * @param {Number} height 縦幅
	 */
	resizeTo: function(width, height){
		joCore.Node.addStyle(this.display.window, {
			width: width + 'px',
			height: height + 'px',
		});
		
		this.onResize();
		
		this.width = width;
		this.height = height;
	},
	
	/**
	 * 指定した座標に移動する
	 * @param {Number} x
	 * @param {Number} y
	 */
	moveTo: function(x, y){
		joCore.Node.addStyle(this.display.window, {
			'top': y + 'px',
			'left': x + 'px'
		});
		
		this.x = x;
		this.y = y;
	},
	

	/**
	 * ウィンドウがリサイズされたときに呼び出される
	 */
	onResize: function(){
		this.display.content.style.height = ( this.display.statusbar.getBoundingClientRect().top - 
		                                      this.display.menubar.getBoundingClientRect().bottom  ) + 'px';
	},

	/**
	 * ウィンドウがフォーカスされたときに呼び出される
	 * @param {Event} [e]
	 */
	onFocus: function(e){
		this.updateZIndex(e ? e.target.parentNode : this.display.window);  //e.target => .dammy-wrapper
		
		joAppManager.changeActiveApp(this.param.application || 'System');
	},

	/**
	 * ウィンドウを閉じる<br>
	 * 閉じたときに同じアプリケーションのウィンドウをアクティブにする
	 */
	close: function(){
		joCore.Node.remove(this.display.window);
		
		var shouldFront = ( this.param.application && joAppManager.getFrontWindow(this.param.application) ) || joAppManager.getFrontWindow();
		
		if(shouldFront) shouldFront.owner.onFocus();
	},

	/**
	 * 最小化/通常を切り替える
	 */
	toggleMinimize: function(){
		joCore.Node.toggleClass(this.display.window, 'minimized');
	},

	/**
	 * 最大化/通常を切り替える
	 */
	toggleMaximize: function(){
		joCore.Node.toggleClass(this.display.window, 'maximized');
	},

	/**
	 * ウィンドウをアクティブにする
	 */
	updateZIndex: function(win){
//		if(!joCore.Node.hasClass(aActiveWindow, 'window')) return;
		
		var oldActiveWindow = joAppManager.getFrontWindow(),
			maxZ;
		
		if(oldActiveWindow){
			joCore.Node.removeClass(oldActiveWindow, 'active');
			maxZ = oldActiveWindow.style.zIndex;
		}else{
			maxZ = 0;
		}
		
		joCore.Node.addClass(win, 'active');
		win.style.zIndex = Number(maxZ) + 1;
	},

	/**
	 * ウィンドウタイトルを設定する
	 * @param {String} aTitle タイトル
	 */
	setTitle: function(aTitle){
		this.title = 
		this.display.title.innerHTML = aTitle;
	},
	
	/**
	 * ウィンドウの内容を設定する
	 * @param {DOM|Object} aContent 内容
	 */
	setContent: function(aContent){
		while(this.display.content.childNodes.length > 0)
			this.display.content.removeChild(this.display.content.firstChild);
		
		this.addContent(aContent);
	},
	
	/**
	 * ウィンドウの内容を設定する
	 * @param {DOM|Object} aContent 内容
	 */
	setStatusbar: function(aContent){
		while(this.display.statusbar.childNodes.length > 0)
			this.display.statusbar.removeChild(this.display.statusbar.firstChild);
		
		this.addStatusbar(aContent);
	},
	
	/**
	 * ウィンドウの内容を設定する
	 * @param {DOM|Object} aMenubar 内容
	 */
	setMenubar: function(aMenubar){
		while(this.display.menubar.childNodes.length > 0)
			this.display.menubar.removeChild(this.display.menubar.firstChild);
		
		this.addMenubar(aMenubar);
	},

	/**
	 * ウィンドウの内容を追加する
	 * @param {Node|String} aContent 内容
	 */
	addContent: function(aContent){
		var content = typeof aContent === 'string' ? joCore.Node.textToDOM(aContent, 'text/html') : aContent;
		
		if(content) this.display.content.appendChild(content);
		else this.display.content.innerHTML += aContent;
	},

	/**
	 * ステータスバーの内容を追加する
	 * @param {Node|String} aContent 内容
	 */
	addStatusbar: function(aContent){
		var content = typeof aContent === 'string' ? joCore.Node.textToDOM(aContent, 'text/html') : aContent;
		
		if(content) this.display.statusbar.appendChild(content);
		else this.display.statusbar.innerHTML += aContent;
	},
	
	/**
	 * メニューバーの内容を追加する
	 * @param {Node|String} aContent 内容
	 */
	addMenubar: function(aContent){
		var content = typeof aContent === 'string' ? joCore.Node.textToDOM(aContent, 'text/html') : aContent;
		
		if(content) this.display.menubar.appendChild(content);
		else this.display.menubar.innerHTML += aContent;
	},

};

/**
 * Create a dialog
 * @constructor
 * @extends joWindow
 * @param {String} param.message ダイアログに表示するメッセージ
 * @param {Function} [param.callback] OKボタンが押されたときに呼び出される関数
 * @note param.width / param.height も省略可能 <br>
 *       param.x / param.y がともに未指定の場合は画面中央に表示する
 */
function joDialog(param){
	this.param = param;
	this.display = {};
	
	this.init();
	this.init_self();
	
	//大きさが設定されていない場合は内容に合わせたサイズにする
	if(!this.param.width || !this.param.height) this.setAppropriateSize();
	
	//位置が設定されていない場合は中央に表示する
	if(!this.param.x && !this.param.y) this.moveTo( ( joDisplay.displayWidth  - this.width  )/2,
													( joDisplay.displayHeight - this.height )/2  );
}

joDialog.prototype = {

	constract: [
		'<div class="menubar">',
		'	<button class="button-close">x</button>',
		'	<div class="title"></div>',
		'</div>',
		'<div class="content"></div>',
		'<div class="statusbar"></div>',
		'<div class="dammy-wrapper"></div>',
	].join(''),

	defaultTitle: '',
	
	/**
	 * joDialog独自の初期化処理
	 * @private
	 */
	init_self: function(){
		joCore.Node.addClass(this.display.window, 'dialog');
		joCore.Node.createNode('div', { 'class': 'message', ':child': this.param.message || '' }, this.display.content);
		joCore.Node.createNode('button', { 'class': 'button-ok', ':context': 'OK' }, this.display.statusbar);
		
		if(typeof this.param.callback === 'function')
			joEvent.addEvent($C('button-ok', this.display.window), 'mousedown', this.param.callback, false, this, true);
		joEvent.addEvent($C('button-ok', this.display.window), 'lclick', this.close, false, this, true);
		
		//resizerを追加
		if(this.param.resizable){
			joCore.Node.createNode('div', { 'class': 'resizer' }, this.display.statusbar);
			joCore.Node.addClass(this.display.window, 'resizable-dialog');
			joEvent.addEvent(this.display.window, 'joResize', this.onResize, false, this);
			joEvent.addEvent(this.display.window, 'joResizeEnd', this.onResize, false, this);
			joEvent.setResizable($C('resizer', this.display.window), this.display.window);
		}
	},

	_setEvents: function(){
		joEvent.addEvent($C('button-close', this.display.window), 'lclick', this.close, false, this);
		joEvent.addEvent($C('dammy-wrapper', this.display.window), 'mousedown', this.onFocus, false, this);
		
		joEvent.setDraggable(this.display.menubar, this.display.window, $('display'));
		joEvent.stopPropagation(this.display.window, 'mousedown');
		joEvent.stopPropagation(this.display.window, 'click');
	},
};
joCore.utils.inherit(joDialog, joWindow);