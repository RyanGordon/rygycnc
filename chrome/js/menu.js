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
			gcodeTextbox.setValue(fileText);
			var gcode = new Gcode(fileText);
			gcode.process();
		});
	});

	$("#file_nav_open_svg").on('click', function() {
		openFileDialogAndRead(['svg'], function(fileText) {
			console.log(fileText);
		});
	});

	$("#file_nav_open_biases").on('click', function() {
		openFileDialogAndRead(['bias'], function(fileText) {
			console.log(fileText);
		});
	});

	$("#camera_nav_top_down_view").on('click', function() {
		gcodeScene.setTopDownView();
	});

	$("#camera_nav_isometric_view").on('click', function() {
		gcodeScene.setIsometricView();
	});
});

// Read file
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

// Write file
function writeFileDialog(suggestedName, data) {
	var config = {type: 'saveFile', suggestedName: suggestedName};

	chrome.fileSystem.chooseEntry(config, function(writableEntry) {
		var blob = new Blob([data], {type: 'text/plain'});
		writeFileEntry(writableEntry, blob, function(e) {
			output.textContent = 'Write complete :)';
		});
	});
}


function writeFileEntry(writableEntry, blob, callback) {
  if (!writableEntry) {
    output.textContent = 'Nothing selected.';
    return;
  }

  writableEntry.createWriter(function(writer) {

    writer.onerror = errorHandler;
    writer.onwriteend = callback;

    // If we have data, write it to the file. Otherwise, just use the file we loaded.
	writer.truncate(blob.size);
	waitForIO(writer, function() {
	  writer.seek(0);
	  writer.write(blob);
	});
  }, errorHandler);
}

function waitForIO(writer, callback) {
  // set a watchdog to avoid eventual locking:
  var start = Date.now();
  // wait for a few seconds

  var reentrant = function() {
    if (writer.readyState === writer.WRITING && Date.now()-start<4000) {
      setTimeout(reentrant, 100);
      return;
    }

    if (writer.readyState === writer.WRITING) {
      console.error("Write operation taking too long, aborting! (current writer readyState is "+writer.readyState+")");
      writer.abort();
    } else {
      callback();
    }
  };
  setTimeout(reentrant, 100);
}