$(window).load(function() {
	$('#main_nav_exit').on('click', function() { window.close(); });

	var aboutModal = $('#modal_about');
	var versionModal = $('#modal_version');
	$('#main_nav_about').on('click', function() {
		aboutModal.attr('class', 'modal show');
		aboutModal.on('click', 'footer', function() {
			aboutModal.attr('class', 'modal');
		});
	});
	$('#main_nav_version').on('click', function() {
		versionModal.attr('class', 'modal show');
		versionModal.on('click', 'footer', function() {
			versionModal.attr('class', 'modal');
		});
	});
});