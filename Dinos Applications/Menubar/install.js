/* インストールされるアプリケーションのデータを書く */

var installApplicationInfo = {
	name: 'Menubar',
	id: 'dinos.menubar',
	
	/* インストール先ディレクトリ */
	install_directory: 'dinos://Applications/Menubar/',
	
	/* それぞれの役割を持つファイルがどれなのか指定する */
	app: 'Menubar.app',
	skin: 'Menubar.app.css',
	
	/* インストールするファイルを指定する
	 * インストール先のファイル名 : install.jsからみた相対パス or 絶対パス */
	files: {
		'Menubar.app': 'Menubar.app.js',
		'Menubar.app.css': 'Menubar.app.css',
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