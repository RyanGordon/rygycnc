var typeOfDevice = '/dev/tty.usbmodem1421';
var connectionInfo = null;
var serialReady = false;
var stringReceived = '';

var lineReceivedCallbacks = {};

$(window).load(function() {
	$('#connectionIndicator').on('click', connectOrDisconnectDevice);
});

var onLineReceived = (function(str) {
	_log("Line Received: "+str);
	Object.keys(lineReceivedCallbacks).forEach(function (key) {
		var callback = lineReceivedCallbacks[key];
		callback(str);
	});
});

var receiveData = (function(info) {
	if (info.connectionId != connectionInfo.connectionId || !info.data) return;

	var str = convertArrayBufferToString(info.data);
	if (str.charAt(str.length-1) === '\n') {
		stringReceived += str.substring(0, str.length-1);
		onLineReceived(stringReceived);
		stringReceived = '';
	} else {
		stringReceived += str;
	}
});

function writeSerial(str, callback) {
	if (serialReady === false) return;
	_log("Writing to Serial: "+str);
	str += "\n";
	chrome.serial.send(connectionInfo.connectionId, convertStringToArrayBuffer(str), function(sendInfo) {
		_log(sendInfo);
		if (callback !== undefined) callback(sendInfo);
	});
}

var noDevicesFound = (function() {
	if (connectionInfo !== null) {
		return;
	}
	_log("No connected RYGY CNC devices were found");
	$('#connectionIndicator').attr('class', 'activity disconnected');
	$('#powerButton').prop('checked', false);
	$("#powerButton").switchButton("redraw");
	updateStatus('No devices found');
});

function connectToSerialDevice(devicePath, callback) {
	lineReceivedCallbacks['initialization'] = function(str) {
		if (str.indexOf('Grbl') > -1 && str.indexOf('[\'$\' for help]') > -1) {
			delete lineReceivedCallbacks['initialization'];
			serialReady = true;
			$('#connectionIndicator').attr('class', 'activity connected');
			updateStatus('Connected');
			if (callback !== undefined) callback();
		}
	};

	_log("Connecting with device path: "+devicePath);
	chrome.serial.connect(devicePath, {bitrate: 115200}, function(_connectionInfo) {
		connectionInfo = _connectionInfo;
		_log("Device connected with device id: "+connectionInfo.connectionId);
	});
}

var connectOrDisconnectDevice = (function() {
	 if (connectionInfo !== null) {
	 	disconnectDevice();
	 } else {
	 	connectDevice();
	 }
});

var connectDevice = (function(callback) {
	$('#connectionIndicator').attr('class', 'activity connecting');
	updateStatus('Connecting');

	chrome.serial.getDevices(function(ports) {
		_log(ports);
		if (ports.size === 0) {
			noDevicesFound();
		} else {
			for (var i=0; i < ports.length; i++) {
				if (ports[i].path.indexOf(typeOfDevice) > -1) {
					connectToSerialDevice(ports[i].path, callback);
					break;
				}
			}
		}
	});

	// This might cause possible contention with the above function
	setTimeout(noDevicesFound, 500);
});

var disconnectDevice = (function() {
	$('#connectionIndicator').attr('class', 'activity disconnecting');
	updateStatus('Disconnecting');
	$('#powerButton').prop('checked', false);
	$("#powerButton").switchButton("redraw");

	if (connectionInfo !== null) {
		chrome.serial.disconnect(connectionInfo.connectionId, disconnectedCallback);
	} else {
		disconnectedCallback(true);
	}
});

var disconnectedCallback = (function(result) {
	if (result) {
		_log("Device with connection id "+connectionInfo.connectionId+" is disconnected.");
		connectionInfo = null;
		serialReady = false;

		$('#connectionIndicator').attr('class', 'activity disconnected');
		$('#powerButton').prop('checked', false);
		$("#powerButton").switchButton("redraw");
		updateStatus('Disconnected');
	} else {
		_log("Device with connection id "+connectionInfo.connectionId+" failed to disconnect.");
		$('#connectionIndicator').attr('class', 'activity connected');
		updateStatus('Connected');
	}
});

// Convert string to ArrayBuffer
var convertStringToArrayBuffer = function(str) {
  var buf = new ArrayBuffer(str.length);
  var bufView = new Uint8Array(buf);
  for (var i=0; i < str.length; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

var convertArrayBufferToString = function(buf) {
	return String.fromCharCode.apply(null, new Uint8Array(buf));
}

chrome.serial.onReceive.addListener(receiveData);