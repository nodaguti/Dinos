/* インストールされるアプリケーションのデータを書く */

var installApplicationInfo = {
	name: 'WebViewer',
	id: 'dinos.webviewer',
	
	/* インストール先ディレクトリ */
	install_directory: 'dinos://Applications/WebViewer/',
	
	/* それぞれの役割を持つファイルがどれなのか指定する */
	app: 'WebViewer.app',
	skin: 'WebViewer.app.css',
	pref: 'Pref.html',
	
	/* インストールするファイルを指定する
	 * インストール先のファイル名 : install.jsからみた相対パス or 絶対パス */
	files: {
		'WebViewer.app': 'WebViewer.app.js',
		'WebViewer.app.css': 'WebViewer.app.css',
	},
	
	version: '0.0.1',
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