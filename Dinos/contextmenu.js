/**
 * コンテキストメニューを管理するクラス
 * @constructor
 */
function joContextMenu(thisObj){
	this._self = thisObj;
}
joContextMenu.prototype = {

	/**
	 * コンテキストメニューを開くときにクリックした要素
	 * @type Node
	 */
	target: null,
	
	/**
	 * コンテキストメニューを設定する
	 * @param {Node} aElement コンテキストメニューを表示させる要素
	 * @param {Object} context コンテキストメニュー: menupopup(joUI.menupopup)形式
	 */
	set: function(aElement, context){
//		if(!context || typeof context !== 'object') return joCore.logger.error(new Error('Invalid args'));
	
		this.target = aElement;
		this.menu = context;
		joEvent.removeEvent(aElement, 'rclick', this.show, false);
		joEvent.addEvent(aElement, 'rclick', this.show, false, this);
	},
	
	/**
	 * 独自のコンテキストメニューを表示しないようにする
	 * @param {Node} aElement 対象の要素
	 */
	unset: function(aElement){
		joEvent.removeEvent(aElement, 'rclick', this.show, false);
		joEvent.addEvent(aElement, 'rclick', function(){}, false);
	},

	/**
	 * コンテキストメニューを表示する
	 * @param {Event} e
	 */
	show: function(e){
		//ブラウザ固有のコンテキストメニューが表示されるのを防ぐ
		e.preventDefault();
		
		//本当に期待されている要素のコンテキストメニューを開こうとしているのかどうかを調べる
		//もし違っていたら表示しないで終了
//		if(joCore.Node.getUniqueID(joCore.Node.getNodesByPosition(e.clientX, e.clientY)[0]) !== uid) return joCore.logger.log('dont open contextmenu');

		//もしメニューが正しく設定されていなかったら終了
		if(!this.menu) return;
		
		//contextmenu
		var ul = joCore.Node.createNode('ul', { 'class': 'menupopup', id: 'contextmenu' }, document.body);
		joCore.Node.addStyle(ul, {
			position: 'absolute',
			top: e.clientY + 'px',
			left: e.clientX + 'px',
			'z-index': 1000000,
		});
		ul.appendChild(joUI.menupopup(this.menu, this._self));
		joEvent.addEvent(ul, 'click', this.close, false, this);
		joEvent.addEvent(ul, 'mousedown', function(){}, false, this);
		
		//contextmenu が隠れないように補正する
		var crect = joCore.Node.getNodeRect(ul); //contextmenu rect
		var drect = joCore.Node.getNodeRect($('display')); //display rect
		//right
		if(crect.right > drect.right)
			joCore.Node.addStyle(ul, {
				left: 'auto',
				right: '0'
			});
		
		//bottom
		if(crect.bottom > drect.bottom)
			joCore.Node.addStyle(ul, {
				top: 'auto',
				bottom: (drect.bottom - e.clientY) + 'px',
			});
		
		//contextmenu を閉じるためのダミーのカバー
		var dc = joCore.Node.createNode('div', { id: 'contextmenu-dammy-cover' }, document.body);  //dammy cover
		joCore.Node.addStyle(dc, {
			position: 'absolute',
			top: 0,
			left: 0,
			width: '100%',
			height: '100%',
			'z-index': '999999',
		});
		joEvent.addEvent(dc, 'lclick', this.close, false, this);
		joEvent.addEvent(dc, 'rclick', function(e){
			this.close(e);
		}, false, this);
		
		//onpopupshowing を呼び出す
		if(this.onpopupshowing) this.onpopupshowing(e, this);
	},
	
	/**
	 * コンテキストメニューを閉じる
	 * @param {Event} event
	 */
	close: function(event){
		joCore.Node.remove($('contextmenu-dammy-cover'));
		joCore.Node.remove($('contextmenu'));
	},
};