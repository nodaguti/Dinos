/**
 * イベントを取り扱うクラス
 * @class
 */
var joEvent = {

	/**
	 * ノードに結び付けられているイベントを管理するマップ
	 */
	_eventMap: {},

	/**
	 * 起動時に一度だけ実行される
	 * @private
	 */
	init: function(){
		window.addEventListener('mousemove', function(e){
			if(joEvent._moveTarget) joEvent._onDrag(e);
			else if(joEvent._resizeTarget) joEvent._onResize(e);
		}, false);
	},

	/**
	 * イベントを登録する
	 *
	 * @param {Node} aElement 対象の要素
	 * @param {String} aType イベントのタイプ <br> 空白で区切ることで複数イベントをリッスン可能 <br> 特殊イベント: (r|l|middle)click, (r|l|middle)mouse(down|up|move), key**(実装予定)
	 * @param {Function} aCallback コールバック関数 第一引数:eventオブジェクト, 第二引数: triggerdData（fireEventでデータが渡された場合）
	 * @param {Boolean} [isUseCapture=false] キャプチャフェーズにするかどうか
	 * @param {Object} [aThisObj=Event] コールバック関数内でthisが指すオブジェクト
	 * @param {Boolean} [notStopPropagation=false] 自動でstopPropagationするかどうか
	 */
	addEvent: function(aElement, aType, aCallback, isUseCapture, aThisObj, notStopPropagation){
		var types = aType.split(' ');
		var uid = joCore.Node.getUniqueID(aElement);	
	
		types.forEach(function(type){
			var rtype = this._getRegularType(type);
			
			//イベントマップに登録する
			var eid = joCore.utils.getUniqueID();  //event id
			this._eventMap[eid] = {
				element: uid,
				type: type,
				self: aThisObj,
				callback: aCallback,
				propagation: notStopPropagation
			};
			
			this._runClosure[eid] = (function(eid){
				return function(event){
					joEvent._eventFired(event, eid);
				};
			})(eid);
			
			aElement.addEventListener(rtype, this._runClosure[eid], isUseCapture===undefined ? false : isUseCapture);
		}, this);
	},
	
	/**
	 * 独自イベント名をDOM Eventsのイベント名に変換する
	 * @param {String} type
	 * @return {String}
	 */
	_getRegularType: function(type){
		switch(type){
			case 'lclick':
			case 'middleclick':
				return 'click';
	
			case 'rclick':
				return 'contextmenu';
				
			case 'rmousedown':
			case 'lmousedown':
			case 'middlemousedown':
				return 'mousedown';
				
			case 'rmouseup':
			case 'lmouseup':
			case 'middlemouseup':
				return 'mouseup';
			
			case 'rmousemove':
			case 'lmousemove':
			case 'middlemove':
				return 'mousemove';
				
			case 'dblclick-mod':
				return 'mouseup';
			
			default:
				return type;
		}
	},
	
	/**
	 * イベントを解除する
	 * @param {Node} aElement 対象の要素
	 * @param {String} aType イベントタイプ
	 * @param {Function} aCallback コールバック関数
	 * @param {Boolean} isUseCapture キャプチャーフェーズするかどうか
	 */
	removeEvent: function(aElement, aType, aCallback, isUseCapture){
		var uid = joCore.Node.getUniqueID(aElement);
		var rtype = this._getRegularType(aType);
	
		for(var i in this._eventMap){
			var map = this._eventMap[i];
			
			if(map.element === uid &&
			   map.type === aType &&
			   map.callback === aCallback){
			     aElement.removeEventListener(rtype, this._runClosure[i], isUseCapture);
				 delete this._eventMap[i];
			}
		}
	},
	
	_runClosure: {},

	/**
	 * イベントが発火したときに、コールバックを呼び出すための関数
	 * @param {Event} event
	 * @param {String} eid Event ID
	 */
	_eventFired: function(event, eid){	
		var map = joEvent._eventMap[eid];
	
		//特殊イベントの判定
		switch(map.type){
			case 'rmousedown':
			case 'rmousemove':
			case 'rmouseup':
				if(event.button !== 2) return;
				break;
		
			case 'lclick':
			case 'lmousedown':
			case 'lmousemove':
			case 'lmouseup':
				if(event.button !== 0) return;
				break;

			case 'middleclick':
			case 'middlemousedown':
			case 'middlemousemove':
			case 'middlemouseup':
				if(event.button !== 1) return;
				break;
				
			case 'dblclick-mod':	
				if(this._dblc_phase !== this._dblc_PHASE_ONECLICK ||
				   ((new Date()).getTime() - this._dblc_TIME) > this._dblc_CLICK_LIMIT ||
				   this._dblc_last_event_id !== eid){
						this._dblc_phase = this._dblc_PHASE_ONECLICK;
						this._dblc_last_event_id = eid;
						this._dblc_TIME = (new Date()).getTime();
						return;
				}
				
				this._dblc_phase = this._dblc_PHASE_NONE;
				this._dblc_TIME = (new Date()).getTime();
				break;
		}
	
		//自動stopPropagation
		if(!map.propagation) event.stopPropagation();
		
		//callbackを呼び出す
		map.callback.call(map.self || event.target, event, event._data);
	},
	_dblc_phase: 0,
	_dblc_last_event_id: null,
	_dblc_PHASE_NONE: 0,
	_dblc_PHASE_ONECLICK: 1,
	_dblc_TIME: 0,
	_dblc_CLICK_LIMIT: 250,

	/**
	 * Mutation Event を発火させる
	 *
	 * @param {String} aName イベントの名前
	 * @param {Node} aTarget イベントを発生させる要素
	 * @param {Object} data イベントcallbackに渡すデータ
	 */
	fireEvent: function(aName, aTarget, data){
		var evt = document.createEvent('MutationEvent');
		evt.initMutationEvent(aName, true, false, aTarget, null, null, null, null);
		
		if(data) evt._data = data;
		aTarget.dispatchEvent(evt);
	},
	
	stopPropagation: function(aElement, eventType){
		this.addEvent(aElement, eventType, function(){}, false);
	},


	/**
	 * 要素をドラッグ可能にする
	 *
	 * @param {Node} eventTarget イベントを受け付けるノード
	 * @param {Node} [moveTarget=] 実際に移動させるノード <br>省略時は eventTarget と同じになる
	 * @param {Node} aParentNode position: absolute の基準となるノード
	 */
	setDraggable: function(eventTarget, moveTarget, aParentNode){
		var eventTarget = eventTarget;
		var moveTarget = moveTarget || eventTarget;
		var parent = aParentNode;
		joEvent.addEvent(eventTarget, 'lmousedown', function(e){ joEvent._onDragStart(e, eventTarget, moveTarget, parent); }, false);
	},

	_onDragStart: function(event, eventTarget, moveTarget, parent){
		var self = joEvent;

		self._moveTarget = moveTarget;
		self._eventTarget = eventTarget;
		
		event.stopPropagation();
		event.preventDefault();
		
		joEvent.addEvent(eventTarget, 'lmousemove', self._onDrag, false);
		joEvent.addEvent(eventTarget, 'lmouseup', self._onDragEnd, false);

		var moveTargetRect = joCore.Node.getNodeRect(moveTarget, parent);
		self.offsetX = moveTargetRect.left - event.clientX;
		self.offsetY = moveTargetRect.top - event.clientY;
		
		self.fireEvent('joDragStart', moveTarget);
	},

	_onDrag: function(event){
		var self = joEvent;

		event.stopPropagation();
		event.preventDefault();

		joCore.Node.addStyle(self._moveTarget, {
			'left': event.clientX + self.offsetX + 'px',
			'top': event.clientY + self.offsetY + 'px'
		});
		
		try{
			self._moveTarget.owner.x = event.clientX + self.offsetX;
			self._moveTarget.owner.y = event.clientY + self.offsetY;
		}catch(e){}
		
		joEvent.fireEvent('joDrag', joEvent._moveTarget);
	},

	_onDragEnd: function(event){
		var target = joEvent._moveTarget;
		joEvent._moveTarget = null;

		event.stopPropagation();
		event.preventDefault();

		joEvent.removeEvent(joEvent._eventTarget, 'lmousemove', joEvent._onDrag, false);
		joEvent.removeEvent(joEvent._eventTarget, 'lmouseup', joEvent._onDragEnd, false);
		
		joEvent.fireEvent('joDragEnd', target);
	},


	/**
	 * 要素をリサイズ可能にする
	 *
	 * @param {Node} eventTarget イベントを受け付けるノード
	 * @param {Node} [resizeTarget] 実際にリサイズさせるノード <br>省略時は eventTarget と同じになる
	 */
	setResizable: function(eventTarget, resizeTarget){
		var eventTarget = eventTarget;
		var resizeTarget = resizeTarget || eventTarget;
		joEvent.addEvent(eventTarget, 'lmousedown', function(e){ joEvent._onResizeStart(e, eventTarget, resizeTarget); }, false);
	},

	_onResizeStart: function(event, eventTarget, resizeTarget){
		var self = joEvent;

		self._resizeTarget = resizeTarget;
		self._eventTarget = eventTarget;

		event.stopPropagation();
		event.preventDefault();

		var bounds = self._resizeTarget.getBoundingClientRect();
		self.left = bounds.left;
		self.top = bounds.top;
		self.offsetX = bounds.right - event.clientX;
		self.offsetY = bounds.bottom - event.clientY;

		joEvent.addEvent(eventTarget, 'lmousemove', self._onResize, false);
		joEvent.addEvent(eventTarget, 'lmouseup', self._onResizeEnd, false);
		
		self.fireEvent('joResizeStart', resizeTarget);
	},

	_onResize: function(event){
		var self = joEvent;

		event.stopPropagation();
		event.preventDefault();

		joCore.Node.addStyle(self._resizeTarget, {
			width: (event.clientX + self.offsetX - self.left) + 'px',
			height: (event.clientY + self.offsetY - self.top) + 'px'
		});
		
		try{
			self._resizeTarget.owner.width = (event.clientX + self.offsetX - self.left);
			self._resizeTarget.owner.height = (event.clientY + self.offsetY - self.top);
		}catch(e){}
		
		joEvent.fireEvent('joResize', joEvent._resizeTarget);
	},

	_onResizeEnd: function(event){
		var target = joEvent._resizeTarget;
		joEvent._resizeTarget = null;

		event.stopPropagation();
		event.preventDefault();

		joEvent.removeEvent(joEvent._eventTarget, 'lmousemove', joEvent._onResize, false);
		joEvent.removeEvent(joEvent._eventTarget, 'lmouseup', joEvent._onResizeEnd, false);
		
		joEvent.fireEvent('joResizeEnd', target);
	},

};
