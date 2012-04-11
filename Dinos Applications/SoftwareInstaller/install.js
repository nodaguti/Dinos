/* インストールされるアプリケーションのデータを書く */

var installApplicationInfo = {
	name: 'SoftwareInstaller',
	id: 'dinos.softwareinstaller',
	
	/* インストール先ディレクトリ */
	install_directory: 'dinos://Applications/SoftwareInstaller/',
	
	/* それぞれの役割を持つファイルがどれなのか指定する */
	app: 'SoftwareInstaller.app',
	skin: 'SoftwareInstaller.app.css',
	
	/* インストールするファイルを指定する
	 * インストール先のファイル名 : install.jsからみた相対パス or 絶対パス */
	files: {
		'SoftwareInstaller.app': 'SoftwareInstaller.app.js',
		'SoftwareInstaller.app.css': 'SoftwareInstaller.app.css',
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