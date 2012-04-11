/**
 * UI
 * @class 
 */
var joUI = {

	/**
	 * syntax sugar of joWindow
	 * @param {Object} param joWindowを参照
	 * @return {joWindow}
	 * @see joWindow
	 */
	window: function(param){
		return new joWindow(param);	
	},
	
	/**
	 * syntax sugar of joDialog
	 * @param {Object} param joDialogを参照
	 * @return {joDialog}
	 * @see joDialog
	 */
	dialog: function(param){
		return new joDialog(param);
	},
	
	/**
	 * alert
	 * @param {Object} param joDialogを参照
	 * @return {Deferred|Boolean} OKボタンがクリックされたときにtrueが渡される
	 * @see joDialog
	 */
	alert: function(param){
		var deferred = new Deferred();
		
		var dialog = new joDialog(param);
		joEvent.addEvent($C('button-ok', dialog.display.statusbar), 'click', function(){ deferred.call(true); }, false, this);
	
		return deferred;
	},
	
	/**
	 * yes or no dialog
	 * @param {Object} param joDialogを参照
	 * @return {Deferred|Boolean}
	 * @see joDialog
	 */
	confirm: function(param){
		var deferred = new Deferred();

		var dialog = new joDialog(param);
		dialog.addStatusbar('<button class="button-cancel">Cancel</button>');
		joEvent.addEvent($C('button-cancel', dialog.display.statusbar), 'click', function(){
			deferred.call(false);
			this.close();
		}, false, dialog, true);
		joEvent.addEvent($C('button-ok', dialog.display.statusbar), 'click', function(){ deferred.call(true); }, false, this);
	
		return deferred;
	},
	
	/**
	 * dialog with input box
	 * @param {Object} param joDialogを参照
	 * @param {String} [param.defaultStr=''] デフォルトの文字列
	 * @param {Boolean} [param.multiline=false] 複数行入力可能にするかどうか
	 * @return {Deferred|String}
	 * @see joDialog
	 */
	prompt: function(param){
		var deferred = new Deferred();
		
		var dialog = new joDialog(param);
		if(param.multiline){
			dialog.addContent('<textarea class="input-prompt"></textarea>');
			var textarea = $C('input-prompt', dialog.display.content);
			textarea.value = param.defaultStr || '';
			joCore.Node.addStyle(textarea, {
				width: param.width * 0.8 + 'px',
				height: param.height * 0.8 + 'px',
			});
		}else{
			dialog.addContent('<input type="text" class="input-prompt" value="' + (param.defaultStr || '') + '" />');
		}
		joEvent.addEvent($C('button-ok', dialog.display.statusbar), 'mousedown', function(){
			var inputStr = $C('input-prompt', this.display.content).value;
			deferred.call(inputStr);
			this.close();
		}, false, dialog);
		
		return deferred;
	},
	
	/**
	 * dialog with select box
	 * @param {Object} param joDialogを参照
	 * @param {Array} [param.selects] 選択肢
	 * @param {Array} [param.selectValues] 選択肢のvalue
	 * @return {Deferred|String}
	 * @see joDialog
	 */
	select: function(param){
		var deferred = new Deferred();
		
		var dialog = new joDialog(param);
		
		if(!param.selectValues) param.selectValues = param.selects;
		
		//オプションを作成
		var option = joCore.Node.createNode('select', { 'class': 'input-prompt' }, dialog.display.content);
		param.selects.forEach(function(select, index){
			joCore.Node.createNode('option', { ':child': select, 'value': param.selectValues[index] }, option);
		});
		
		joEvent.addEvent($C('button-ok', dialog.display.statusbar), 'mousedown', function(){
			var inputStr = joCore.Node.getFormValue($C('input-prompt', this.display.content), !!param.selectValues)[0];
			deferred.call(inputStr);
			this.close();
		}, false, dialog);
		
		return deferred;
	},

	/**
	 * syntax sugar of joTab
	 * @param {HTMLULElement} ul
	 * @return {joTab}
	 * @see joTab
	 */
	tab: function(ul){
		return new joTab(ul);
	},
	
	
	/**
	 * menupopup
	 * @param {Object} menuObj { menuitem_name: menuitem_oncommand, ... } <br>
	 *            {String} menuitem_name メニュー項目名 <br>
	 *            {String|Function} menuitem_oncommand メニュー項目が実行したときに呼ばれる関数 
	 * @param {Object} [thisObj=window] oncommandの中のthisが指すオブジェクト
	 * @return {Node}
	 * @example
	 *   joUI.menupopup({
	 *      'Menu1': 'alert("Select the menu1");',
	 *      'Menu2': function(){
	 *          alert('Select the menu2');
	 *       },
	 *   }, this);
	 */
	menupopup: function(menuObj, thisObj){
		if(!thisObj) thisObj = window;
		var fragment = document.createDocumentFragment();
	
		for(menuname in menuObj){
			if(typeof menuObj[menuname] === 'object'){
				//submenuがある場合: menupopupを作成
				
				//submenuの親
				var li = joCore.Node.createNode('li', null, fragment);
				joCore.Node.createNode('a', { ':context': menuname, 'class': 'hasChild' }, li);
				
				//submenu本体
				var ul = joCore.Node.createNode('ul', null, li);
				ul.appendChild(arguments.callee.call(this, menuObj[menuname]));
				
				joEvent.addEvent(li, 'mouseover', function(e){ onOpenSubmenu(e, ul); }, false, this);
			}else{
				//menuitemを作成
				var li = joCore.Node.createNode('li', null, fragment);
				if(menuObj[menuname]){
					var menuitem = joCore.Node.createNode('a', { ':context': menuname }, li);
				
					switch(typeof menuObj[menuname]){
						case 'function':
							joEvent.addEvent(menuitem, 'lclick', menuObj[menuname], false, thisObj, true);
							break;
							
						case 'string':
							menuitem.setAttribute('onclick', menuObj[menuname]);
							break;
					}
				}else{
					joCore.Node.createNode('a', { ':context': menuname }, li);
				}
			}
		}
		
		
		function onOpenSubmenu(event, submenu){
			//contextmenu が隠れないように補正する
			var crect = joCore.Node.getNodeRect(submenu); //submenu rect
			var drect = joCore.Node.getNodeRect($('display')); //display rect
			
			//right
			if(crect.right > drect.right)
				joCore.Node.addStyle(ul, {
					left: '-98%'
				});
			
			//bottom
			if(crect.bottom > drect.bottom)
				joCore.Node.addStyle(ul, {
					top: 'auto',
					bottom: '0px',
				});
		}
		
		
		return fragment;
	},
	
	/**
	 * Drag and Drop API によってドロップ可能な領域を作成する
	 *
	 * @param {Node} aElement ドロップを受け付けるノード
	 * @param {Object} option オプションパラメータ
	 * @param {Function} .callback 読み込み終わった時に呼び出される関数。以下の引数が渡される。<br />
	 *                            第1引数： {DataArray} データの配列 <br />
	 *                            第2引数： {FileList}
	 * @param {Object} [.self] callback, dragenter, dragover, dragleave, drop内でthisが指すべきもの
	 * @param {Function} [.dragenter] デフォルトのdragenter処理に代わって呼び出される関数
	 * @param {Function} [.dragover] デフォルトのdragover処理に代わって呼び出される関数
	 * @param {Function} [.dragleave] デフォルトのdragleave処理に代わって呼び出される関数
	 * @param {Function} [.drop] デフォルトのdrop処理に代わって呼び出される関数
	 * @param {Node} [.input] input[type=file] でもファイルを受け取りたいとき、input要素を指定する
	 * @param {Function} [.change] option.inputが指定されているとき、デフォルトのchange処理に代わって呼び出される関数
	 */
	dropbox: function(aElement, option){
		//クラス設定
		joCore.Node.addClass(aElement, 'dropbox');
		
		//イベント設定	
		joEvent.addEvent(aElement, 'dragenter', option.dragenter || function(e){
			joCore.Node.addClass(aElement, 'dropbox-dragover');
			e.preventDefault();
		}, false, option.self);
		
		joEvent.addEvent(aElement, 'dragover', option.dragover || function(e){
			e.preventDefault();
		}, false, option.self);
		
		joEvent.addEvent(aElement, 'dragend dragleave', option.dragleave || function(e){
			joCore.Node.removeClass(aElement, 'dropbox-dragover');
		}, false, option.self);
		
		if(option.input){
			joEvent.addEvent(option.input, 'change', option.change || function(e){
				joCore.Node.removeClass(aElement, 'dropbox-dragover');
				
				_loadfile(this.files);
			}, false);
		}
	
		joEvent.addEvent(aElement, 'drop', option.drop || function(e){

			e.preventDefault();
			joCore.Node.removeClass(aElement, 'dropbox-dragover');

			_loadfile(e.dataTransfer.files);

		}, false, option.self);
		
		
		//ファイルを読み込む関数
		function _loadfile(files){
			var dataArray = [];  //読み込んだデータを格納しておく配列
		
			joCore.logger.log('Load File:', files)
		
			Deferred.loop(files.length, function(i){
				var reader = new FileReader();
			
				return joUI.select({
					message: 'Choose the type of loading file.',
					selects: [ 'Text', 'Binary', 'DataURL' ],
					width: 200,
					height: 100,
					title: 'File Importer',
					application: 'dinos.finder',
				}).next(function(type){
				
					var deferred = new Deferred();
	
					reader.onload = (function(def){ return function(ev){ def.call(ev.target.result); } })(deferred);
					
					reader.onerror = (function(def){ return function(ev){
						if(option.onerror){
							option.onerror.call(option.self, ev.target.error);
						}
						joCore.logger.error(ev.target.error); def.fail('');
					} })(deferred);
				
					//読み込み
					switch(type){
						case 'Text':
							reader.readAsText(files[i], 'utf-8');
							break;
							
						case 'Binary':
							reader.readAsBinaryString(files[i]);
							break;
							
						case 'DataURL':
							reader.readAsDataURL(files[i]);
							break;
							
						default:
							throw new Error('Invalid type of loading file.');
					}
					
					return deferred;
					
				}).next(function(data){
				
					dataArray[i] = data;
					
				}).error(function(ex){ joCore.logger.error(ex); });
				
			}).next(function(){
			
				option.callback.call(option.self, dataArray, files);
				
			}).error(function(ex){
				joCore.logger.error(ex);
				if(option.onerror) option.onerror.call(option.self, ex);
			});
		}
		
	},
	
	
	/**
	 * Progress Bar
	 * @return {joProgress}
	 * @see joProgress
	 */
	progress: function(width){
		return new joProgress(width);
	},
	
	
	/**
	 * @return {joListTree}
	 * @see joListTree
	 */
	listTree: function(tree, attachTo, multiple){
		return new joListTree(tree, attachTo, multiple);
	},

};


/**
 * タブ
 * @constructor
 * @param {HTMLULElement} ul タブ化するUL要素の参照 <br>
 *                           所定の構造をしている必要がある <br>
 *                           詳細はサンプルを参照
 *
 * @example
 *   <ul id="tab-example">                 
 *     <li><a class="tab-name">Tab1</a>   <!-- tab-name というクラスのノードがタブになる -->
 *        <div class="tab-contents"></div>  <!-- tab-contents というクラスのノードがタブの中身になる -->
 *     </li>                               
 *                                         
 *     <li><a class="tab-name">Tab2</a>    
 *        <div class="tab-contents"></div> 
 *     </li>
 *   </ul>
 *                                         
 *   new joTab($('tab-example'));          
 */
function joTab(ul){
	this.init(ul);
}
joTab.prototype = {
	
	/**
	 * 初期化処理
	 * @param {HTMLULElement} ul
	 * @private
	 */
	init: function(ul){
		joCore.Node.addClass(ul, 'tabs');
		this.tabs = ul;
		this.tablist = joCore.utils.toArray(ul.childNodes).filter(function(node){ return node.tagName && node.tagName.toLowerCase() === 'li'; });

		//クリックした時にタブを切り替えるためのイベントを設定
		this.tablist.forEach(function(tab, index){
			var tabname = joCore.utils.toArray(tab.childNodes).filter(function(node){ return node.tagName && joCore.Node.hasClass(node, 'tab-name'); });
			joEvent.addEvent(tabname[0], 'lclick', this._onClickTab, false, this);
		}, this);
		
		//最初のタブを選択する
		this.select(this.tablist[0]);
	},

	/**
	 * タブをクリックしたときに呼び出される
	 * @param {Event} event
	 */
	_onClickTab: function(event){
		var tab = event.target.tagName === 'li' ? event.target : event.target.parentNode;
	
		this.select(tab);
	},

	/**
	 * タブを変更する
	 * @param {Tab} tab
	 */
	select: function(tab){
		this.tablist.forEach(function(tab){
			if(tab.hasAttribute('selected'))
				tab.removeAttribute('selected');
		});
	
		tab.setAttribute('selected', 'true');
	},

};


function joProgress(width){
	this.width = width;
	
	this.init();
}

joProgress.prototype = {

	percentage: 0,
	
	init: function(){
	
	},
	
	setPercentage: function(percentage){
	
	},

};



/**
 * リストツリー
 * @constructor
 * @param {Array} tree ツリーのデータ 各要素は以下のようなオブジェクトからなっている必要がある
 *                   {   <br>
 *	                     {String} data 表示名   <br>
 *		                 {String} [value] 項目の値（表示名と実際の値が異なる場合に用いる）   <br>
 *                       {Array} [children] 子データがある場合、ここに子データのツリーオブジェクトが入る <br>
 * 	　               　}
 * @param {Node} attachTo 追加先
 * @param {Boolean} [multiple] 複数選択できるようにするかどうか
 */
function joListTree(tree, attachTo, multiple){
	this.treeObj = tree;
	this.attachTo = attachTo;
	this.multiple = multiple;
	
	this.init();
}
joListTree.prototype = {

	/**
	 * ツリーオブジェクト
	 * @type Arraｙ
	 */
	treeObj: null,
	
	/**
	 * 追加先（ツリーの親要素）
	 * @type Node
	 */
	attachTo: null,
	
	/**
	 * 複数選択できるかどうか
	 * @type {Boolean}
	 */
	multiple: false,
	 

	/**
	 * 選択されている項目の値の配列
	 * @type {Array}
	 */
	get selected(){
		return uuQuery.className('selected', this.attachTo).map(function(item){ return item.getAttribute('value') });
	},

	/**
	 * 初期化処理
	 * @private
	 */
	init: function(){
		var parent = joCore.Node.createNode('ul', { 'class': 'listtree' }, this.attachTo);
		parent.appendChild(this._createTree(this.treeObj));
		
		joEvent.addEvent(this.attachTo, 'click', this.clearSelection, false, this);
	},

	/**
	 * 実際にノードを作成する
	 * @param {Array} treeObj
	 * @return {DocumentFragment}
	 */
	_createTree: function(treeObj){
		var fragment = document.createDocumentFragment();
	
		for(var i=0, l=treeObj.length; i<l; i++){
		
			if(treeObj[i].children){
				//childrenがある場合

				//childrenの親を作成
				var li = joCore.Node.createNode('li', { 'class': 'hasChild', value: treeObj[i].value }, fragment);
				var a = joCore.Node.createNode('a', { ':context': treeObj[i].data, title: treeObj[i].data }, li);
				
				//開閉処理と選択処理の登録
				joEvent.addEvent(a, 'click', function(e){ this.toggleOpen(e.target.parentNode); }, false, this);
				joEvent.addEvent(a, 'click', this._onSelect, false, this);
				
				//children本体を再帰で作成して追加する
				var ul = joCore.Node.createNode('ul', null, li);
				ul.appendChild(arguments.callee.call(this, treeObj[i].children));
				
			}else{
			
				//listitemを作成
				var li = joCore.Node.createNode('li', { value: treeObj[i].value }, fragment);
				var a = joCore.Node.createNode('a', { ':context': treeObj[i].data, title: treeObj[i].data }, li);
				
				//選択処理の登録
				joEvent.addEvent(a, 'click', this._onSelect, false, this);
			}
		}

		return fragment;
	},
	
	/**
	 * 項目の開閉
	 * @param {Node} item
	 */
	toggleOpen: function(item){
		joCore.Node.toggleClass(item, 'opened');
	},
	
	
	/**
	 * 項目がクリックされた時に呼び出される
	 * @param {Event} event
	 */
	_onSelect: function(event){
		var itemNode = event.target.parentNode;
		
		//複数選択が有効でないときには選択を全解除
		if(!(this.multiple && event.ctrlKey))
			this.clearSelection();
			
		this.selectItem(itemNode);
	},
	
	
	/**
	 * 指定した項目を選択する
	 * @param {Node} item
	 */
	selectItem: function(item){
	
		if(!this.multiple){
			uuQuery.className('selected', this.attachTo).forEach(function(node){
				joCore.Node.removeClass(node, 'selected');
			});
		}
		
		joCore.Node.addClass(item, 'selected');
	},
	
	/**
	 * すべての選択を解除する
	 */
	clearSelection: function(){
		uuQuery.className('selected', this.attachTo).forEach(function(node){
			joCore.Node.removeClass(node, 'selected');
		});
	},

};



/*

[
	[ 'A', 'B', 'C' ],
	[ 'data a-1', 'data b-1', 'data c-1' ],
	[ { noneditable: true, value: 'Test' }, 12, 25 ],
]

*/
function joTableTree(tree, attachTo, option){
	this._data = tree;
	this.attachTo = attachTo;
	this.option = option || {};
	
	this.init();
}

joTableTree.prototype = {

	init: function(){
		this._table = joCore.Node.createNode('table', { 'class': 'tableTree' }, this.attachTo);
		this._table.appendChild(this._createTree());
	},
	
	build: function(data){
		this._data = data;
		
		var range = document.createRange();
		range.selectNodeContents(this._table);
		range.deleteContents();
		
		this._table.appendChild(this._createTree());
	},
	
	
	_createTree: function(){
	
		var fragment = document.createDocumentFragment();
		var self = this;
	
		this._data.forEach(function(row, rowIndex){
		
			//0番目の要素：ヘッダー
			if(rowIndex === 0){
				var tr = joCore.Node.createNode('tr', { 'class': 'tableTree-header unselectable' }, fragment);
				
				row.forEach(function(cel, colIndex){
					var td;
					
					if(typeof cel === 'object')
						td = joCore.Node.createNode('td', { ':context': cel.value, 
															'class': 'tableTree-header-col-' + colIndex + ' ' + 
																	 (cel.noneditable ? 'non-editable' : '')
														  }, tr);
					else
						td = joCore.Node.createNode('td', { ':context': cel, 'class': 'tableTree-header-col-' + colIndex }, tr);
					
					joEvent.addEvent(td, 'click', function(){ this.sort(colIndex); }, false, self);
					
					var context = new joContextMenu(self);
					context.set(td, { '列の自動サイズ調整': function(){ this.adjustSize(colIndex); } });
				});
				
			}else{
				var tr = joCore.Node.createNode('tr', { 'class': 'tableTree-row-' + rowIndex }, fragment);
				
				row.forEach(function(cel, colIndex){
					var td;
					
					if(typeof cel === 'object')
						td = joCore.Node.createNode('td', { ':context': cel.value, 
															'class': 'tableTree-cel-' + rowIndex + '-' + colIndex + ' ' + 
																	 (cel.noneditable ? 'non-editable' : '')
														  }, tr);
					else
						td = joCore.Node.createNode('td', { ':context': cel,
													'class': 'tableTree-cel-' + rowIndex + '-' + colIndex }, tr);
					
					joEvent.addEvent(tr, 'click', function(){ this.select(rowIndex); }, false, self);
					joEvent.addEvent(td, 'dblclick', function(){ this.edit(rowIndex, colIndex); }, false, self);
				});

			}
		});
		
		return fragment;
	},
	
	edit: function(row, col){
		var cel = $C('tableTree-cel-' + row + '-' + col, this.attachTo);
		var header = $C('tableTree-header-col-' + col, this.attachTo);
		var celValue = cel.innerHTML;
		var rect = joCore.Node.getNodeRect(cel, this.attachTo);
		
		//non-editableのときは終了
		joCore.logger.log(cel,header);
		if(joCore.Node.hasClass(cel, 'non-editable')  ||
		   joCore.Node.hasClass(header, 'non-editable')  ) return;

		var input = joCore.Node.createNode('input', { 'class': 'tableTree-edit-input', value: celValue }, this.attachTo);

		joCore.Node.addStyle(input, {
			width: rect.width + 'px',
			height: rect.height + 'px',
			top: rect.top + 'px',
			left: rect.left + 'px',
		});
		
		joEvent.addEvent(input, 'keydown blur', function(event){
			//Enterじゃなければ終了
			if(event.type === 'keydown' && event.keyCode !== 13) return;

			//表示に反映
			cel.innerHTML = input.value;
			
			//データにも反映
			this._data[row][col] = input.value;
			
			//inputを削除
			joCore.Node.remove(input);
		}, false, this);
	},
	
	select: function(row){
		if(this.option.nonSelectable) return;
		
		var row = $C('tableTree-row-' + row, this.attachTo);
		var selectedItems = $C('selected', this.attachTo, true);
		
		selectedItems.forEach(function(item){ joCore.Node.removeClass(item, 'selected') });
		joCore.Node.addClass(row, 'selected');
	},
	
	sort: function(col){
		var cels = uuQuery('[class^="tableTree-cel-"][class$="-' + col + '"]', this.attachTo);
		var colHeader = $C('tableTree-header-col-' + col, this.attachTo);
		
		//初期化
		if(colHeader.className.indexOf('-sorted') === -1){
			//すでにソート済みでない列の場合は、他の列もすべて初期化する
			uuQuery('[class^="tableTree-header-col-"]', this.attachTo).forEach(function(header){
				joCore.Node.removeClass(header, 'tableTree-up-sorted tableTree-down-sorted');
			});
			
			//STATEの初期化
			this._SORT_STATE = this.STATE_NON_SORT;
		
		}else{
			joCore.Node.removeClass(colHeader, 'tableTree-up-sorted tableTree-down-sorted');
		}
		
		//ソートする
		switch(this._SORT_STATE){
			case this.STATE_NON_SORT:  //なし -> 昇順にする
				cels.sort(function(a, b){ return a.innerHTML > b.innerHTML ? 1 : -1; });
				
				joCore.Node.addClass(colHeader, 'tableTree-up-sorted');
				this._SORT_STATE = this.STATE_SORT_UP;
				break;
			
			case this.STATE_SORT_UP:  //昇順 -> 降順にする
				cels.sort(function(a, b){ return a.innerHTML < b.innerHTML ? 1 : -1; });
				
				joCore.Node.addClass(colHeader, 'tableTree-down-sorted');
				this._SORT_STATE = this.STATE_SORT_DOWN;
				break;
			
			case this.STATE_SORT_DOWN:
				cels.sort(function(a, b){ return a.className.match(/tableTree-cel-(\d+)/)[1] > b.className.match(/tableTree-cel-(\d+)/)[1] ? 1 : -1; });
				this._SORT_STATE = this.STATE_NON_SORT;
				break;		
		}
		
		//ソート済みのインデックス番号
		var sortedIndexs = cels.concat().map(function(cel){ return cel.className.match(/tableTree-cel-(\d+)/)[1]; });
		
		var self = this;
		sortedIndexs.forEach(function(index){
			var row = $C('tableTree-row-' + index, self.attachTo);
			self._table.appendChild(row);
		});
	
	},
	
	_SORT_STATE: 0,
	STATE_NON_SORT: 0,
	STATE_SORT_UP: 1,
	STATE_SORT_DOWN: 2,
	
	adjustSize: function(col){
	
		//ほかの列をすべて初期化
		uuQuery('[class^="tableTree-header-col-"]', this.attachTo).forEach(function(header){
			joCore.Node.removeStyle(header, [ 'width' ]);
		});
		
		//指定された列中で最大の幅
		var maxWidth = (function(self){
			var max = 0;
			var cels = uuQuery('[class^="tableTree-cel-"][class$="-' + col + '"]', self.attachTo);
			
			for(var i=0, l=cels.length; i<l; i++){
			
				var width = uuStyle.toPixel(cels[i].innerHTML.length + 'em', cels[i]);		
				if(max < width) max = width;
			}
		
			return max;
		})(this);
		
		var colHeader = $C('tableTree-header-col-' + col, this.attachTo);
		
		joCore.Node.addStyle(colHeader, { width: maxWidth + 'px' });
	},



};