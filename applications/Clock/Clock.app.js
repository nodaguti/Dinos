_self_ = {

	onload: function(){
		this.clock_short = joCore.Node.createNode('li', { 'class': 'menubar-rightmenu' }, $('menubar').firstChild);
		
		this.clock_short.innerHTML += '<a></a><ul><li class="clock-detail"><a></a></li></ul>';

		this.clock_detail = $C('clock-detail', this.clock_short)
		
		
		this.update();
	},
	
	start: function(){},

	quit: function(){},

	update: function(aList){
		var date = new Date();
	
		this.clock_short.firstChild.innerHTML = date.getHours() + ':' + joCore.utils.fixDegit(date.getMinutes(), 2) + ':' + joCore.utils.fixDegit(date.getSeconds(), 2);
		this.clock_detail.firstChild.innerHTML = date.toLocaleString();
		
		var self = this;
		setTimeout(function(){ self.update(); }, 1000);
	},

};