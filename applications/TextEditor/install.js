/* インストールされるアプリケーションのデータを書く */

var installApplicationInfo = {
	name: 'TextEditor',
	id: 'dinos.texteditor',
	
	/* インストール先ディレクトリ */
	install_directory: 'dinos://Applications/TextEditor/',
	
	/* それぞれの役割を持つファイルがどれなのか指定する */
	app: 'TextEditor.app',
	skin: 'TextEditor.app.css',
	pref: 'Pref.html',
	
	/* インストールするファイルを指定する
	 * インストール先のファイル名 : install.jsからみた相対パス or 絶対パス */
	files: {
		'TextEditor.app': 'TextEditor.app.js',
		'TextEditor.app.css': 'TextEditor.app.css',
		'Pref.html': 'Pref.html',
	},
	
	version: '0.0.2',
	information: 'This update fixes some serious bugs. Update to this version is strongly recommended.',
};



function getFileContent(event){
	var url = event.data;
	var fileData = _get(url);
	
	event.source.postMessage(fileData, event.origin || '*');
}
function _get(url){
	var req = new XMLHttpRequest();
	req.open('GET', url, false);
	req.overrideMimeType('text/plain');
	req.send(null);
	return req.responseText;
}
window.addEventListener('message', getFileContent, false);