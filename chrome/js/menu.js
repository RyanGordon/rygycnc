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

	$("#file_nav_open_gcode").on('click', function() {
		openFileDialogAndRead(['ngc', 'gcode', 'g'], function(fileText) {
			$('#gcodes').val(fileText);
		});
	});
});

function openFileDialogAndRead(extensions, callback) {
	var accepts = [{
		extensions: extensions
	}];

	chrome.fileSystem.chooseEntry({type: 'openFile', accepts: accepts}, function(fileObject) {
		if (!fileObject) {
			console.log("no file object");
			return;
		}

		// Use local storage to retain access to this file
		chrome.storage.local.set({'chosenFile': chrome.fileSystem.retainEntry(fileObject)});
		readFile(fileObject, callback);
	});
}

function readFile(_fileObject, callback) {
	console.log("Reading file object");
	var fileObject = _fileObject;
	fileObject.file(function(file) {
		console.log("Opening file reader");
		var reader = new FileReader();

		reader.onerror = function(e) { console.log(e); };
		reader.onload = function(e) {
			callback(e.target.result);
		};

		console.log("Reading file");
		reader.readAsText(file);
	});
}