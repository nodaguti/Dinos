/**
 * 設定管理
 * @class
 */
var joPrefManager = {
	
	/**
	 * 設定値のハッシュテーブル
	 * @type Object
	 */
	_prefs: {},
	
	/**
	 * 初期化処理
	 * @private
	 */
	init: function(){
		//設定ファイルの読み込み
		var preffile = joCore.IO.Dinos.read('dinos://prefs.json');
		
		if(!preffile){
//			return joCore.IO.Network.read('prefs.json', 'text/plain').
//			next(function(req){
//				joPrefManager._prefs = JSON.parse(req.responseText);
//			}).error(function(){});
			return joCore.logger.error('[joPrefManager] Cannot read prefs.json');
		}
		
		try{
			joPrefManager._prefs = JSON.parse(preffile);
		}catch(e){
			joCore.logger.error('[joPrefManager] Cannot parse prefs.json', e);
		}
	},
	
	/**
	 * 終了処理
	 * @private
	 */
	uninit: function(){
//		joCore.IO.Local.write(JSON.stringify(this._prefs), 'prefs.json');
		joCore.IO.Dinos.write(JSON.stringify(this._prefs), 'dinos://prefs.json', true);
	},
	
	
	/**
	 * 値をセットする
	 *
	 * @param {String} key キー
	 * @param {All} value 値
	 */
	setValue: function(key, value){
		this._prefs[key] = value;
	},
	
	/**
	 * 値を得る
	 *
	 * @param {String} key キー
	 * @return {All} 値 <br>見つからないときはundefined
	 */
	getValue: function(key){
		return this._prefs[key];
	},

};