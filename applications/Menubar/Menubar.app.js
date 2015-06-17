_self_ = {

	//System Menu
	systemMenu: {
		'\u25c6': {
			'About This OS': 'joCore.aboutOS();',
			'Preferences...': function(){ joAppManager.launch('dinos.prefmanager'); },
			'Save Computer...': 'joCore.savePC();',
		},
	},

	onload: function(){
		var menubar = joCore.Node.createNode('ul', { 'class': 'menupopup unselectable' }, $('menubar'));
		this.menubar = menubar;

		joEvent.addEvent($('menubar'), 'mousedown', function(){}, false);

		joDisplay.init();
	},
	
	start: function(){},

	quit: function(){},

	update: function(aList){
		if(!aList) return;
	
		uuQuery('#menubar > ul > *:not([class*="menubar-rightmenu"])').forEach(function(menuitem){
			joCore.Node.remove(menuitem);
		});

		this.menubar.appendChild(joUI.menupopup(this.systemMenu));
		this.menubar.appendChild(joUI.menupopup(aList));
	},

};