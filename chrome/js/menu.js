addOnloadEvent(function() {
	document.getElementById('main_nav_exit').addEventListener('click', function() { window.close(); });

	var aboutModal = document.getElementById('modal_about');
	var versionModal = document.getElementById('modal_version');
	document.getElementById('main_nav_about').addEventListener('click', function() {
		aboutModal.className = 'modal show';
		aboutModal.getElementsByTagName('footer')[0].addEventListener('click', function() {
			aboutModal.className = 'modal';
		});
	});
	document.getElementById('main_nav_version').addEventListener('click', function() {
		versionModal.className = 'modal show';
		versionModal.getElementsByTagName('footer')[0].addEventListener('click', function() {
			versionModal.className = 'modal';
		});
	});
});