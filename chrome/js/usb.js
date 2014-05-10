var VENDOR_ID = 0x03EB; // integer = 1003
var PRODUCT_ID = 0x214F; // integer = 8527

var HIDConnectionId = null;
var HIDReady = false;

var PACKET_SIZE = 64;

chrome.runtime.onSuspend.addListener(disconnectDevice);

$(window).load(function() {
	$('#connectionIndicator').on('click', connectOrDisconnectDevice);
	$('#send_test_data').on('click', sendTestDataToDevice);
	$('#receive_data').on('click', receiveAndPrintData);
});

var sendTestDataToDevice = (function() {
	if (HIDReady !== true) {
		_log("Device not connected. Please connect first.");
		return 0;
	}

	_log("Sending packet to device.");
	var data = [0x81, 0x81, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02];
	sendData(data, function() {
		_log("Packet has been sent.");
	});

	receiveAndPrintData();
});

function sendData(data, callback) {
	var dataBuffer = new ArrayBuffer(PACKET_SIZE);
	var dataArray = new Uint8Array(dataBuffer);
	var dataLength = data.length;
	for (var i=0; i< dataLength; i++) {
		dataArray[i] = data[i];
	}
	_log(data);
	_log(dataArray);
	_log(readFromArrayBuffer(dataBuffer));

	chrome.hid.send(HIDConnectionId, 0, dataBuffer, callback);
}

function readFromArrayBuffer(arrayBuffer) {
	return new Uint8Array(arrayBuffer);
}

var receiveAndPrintData = (function() {
	receiveData(function(data) {
		_log(data);
	});
});

function _log() {
	for (var i=0; i < arguments.length; i++) {
		console.log(arguments[i]);
		//document.getElementById('debug').value += arguments[i]+"\n";
	}
}

function receiveData(dataCallback) {
	if (HIDReady !== true) {
		_log("Device not connected. Please connect first.");
		return 0;
	}

	_log("Receiving data...");
	chrome.hid.receive(HIDConnectionId, PACKET_SIZE, function(dataBuffer) {
		_log("Data received.");
		dataCallback(new Uint8Array(dataBuffer));
	});
}

function findHIDDevice() {
	chrome.hid.getDevices({"vendorId": VENDOR_ID, "productId": PRODUCT_ID}, function(devices) {
		_log(devices);
		if (devices.size === 0) {
			_log("No connected RYGY CNC devices were found");
			$('#connectionIndicator').attr('class', 'activity disconnected');
		} else {
			connectToHIDDevice(devices[0].deviceId);
		}
	});
}

function connectToHIDDevice(deviceId) {
	chrome.hid.connect(deviceId, function(connection) {
		HIDConnectionId = connection.connectionId;
		HIDReady = true;
		_log("Device connected with connection id "+HIDConnectionId);
		$('#connectionIndicator').attr('class', 'activity connected');
	});
}

var connectOrDisconnectDevice = (function() {
	 if (HIDConnectionId !== null) {
	 	disconnectDevice();
	 } else {
	 	connectDevice();
	 }
});

var connectDevice = (function() {
	$('#connectionIndicator').attr('class', 'activity connecting');
	chrome.permissions.request({
		'permissions': [{
			'usbDevices': [{
				'vendorId': VENDOR_ID,
				'productId': PRODUCT_ID
			}]
		}]
	}, permissionsCallback);
});

var permissionsCallback = (function(result) {
	if (result) {
		_log('App was granted the "usbDevices" permission.');
		findHIDDevice();
	} else {
		$('#connectionIndicator').attr('class', 'activity disconnected');
		_log('App was NOT granted the "usbDevices" permission.');
	}
});

var disconnectDevice = (function() {
	$('#connectionIndicator').attr('class', 'activity disconnecting');
	if (HIDConnectionId !== null) {
		chrome.hid.disconnect(HIDConnectionId, disconnectedCallback);
	} else {
		disconnectedCallback();
	}
});

var disconnectedCallback = (function() {
	_log("Device with connection id "+HIDConnectionId+" is disconnected.");
	HIDConnectionId = null;
	HIDReady = false;

	$('#connectionIndicator').attr('class', 'activity disconnected');
});

var logCallback = (function(data) {
	_log(data);
});