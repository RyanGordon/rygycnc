var VENDOR_ID = 0x03EB; // integer = 1003
var PRODUCT_ID = 0x214F; // integer = 8527

var HIDConnectionId = null;
var HIDReady = false;

var PACKET_SIZE = 64;

chrome.runtime.onSuspend.addListener(disconnectDevice);

window.onload = function() {
	document.getElementById('connectionIndicator').addEventListener('click', connectOrDisconnectDevice);
	document.getElementById('send_test_data').addEventListener('click', sendTestDataToDevice);
	document.getElementById('receive_data').addEventListener('click', receiveAndPrintData);
}

var sendTestDataToDevice = (function() {
	if (HIDReady !== true) {
		console.log("Device not connected. Please connect first.");
		return 0;
	}

	console.log("Sending packet to device.");
	var data = [0x81, 0x81, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02];
	sendData(data, function() {
		console.log("Packet has been sent.");
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
	console.log(data);
	console.log(dataArray);
	console.log(readFromArrayBuffer(dataBuffer));

	chrome.hid.send(HIDConnectionId, 0, dataBuffer, callback);
}

function readFromArrayBuffer(arrayBuffer) {
	return new Uint8Array(arrayBuffer);
}

var receiveAndPrintData = (function() {
	receiveData(function(data) {
		console.log(data);
	});
});

function receiveData(dataCallback) {
	if (HIDReady !== true) {
		console.log("Device not connected. Please connect first.");
		return 0;
	}
	
	console.log("Receiving data...");
	chrome.hid.receive(HIDConnectionId, PACKET_SIZE, function(dataBuffer) {
		console.log("Data received.");
		dataCallback(new Uint8Array(dataBuffer));
	});
}

function findHIDDevice() {
	chrome.hid.getDevices({"vendorId": VENDOR_ID, "productId": PRODUCT_ID}, function(devices) {
		console.log(devices);
		if (devices.size === 0) {
			console.log("No connected RYGY CNC devices were found");
			document.getElementById('connectionIndicator').className = 'activity disconnected';
		} else {
			connectToHIDDevice(devices[0].deviceId);
		}
	});
}

function connectToHIDDevice(deviceId) {
	chrome.hid.connect(deviceId, function(connection) {
		HIDConnectionId = connection.connectionId;
		HIDReady = true;
		console.log("Device connected with connection id "+HIDConnectionId);
		document.getElementById('connectionIndicator').className = 'activity connected';
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
	document.getElementById('connectionIndicator').className = 'activity connecting';
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
		console.log('App was granted the "usbDevices" permission.');
		findHIDDevice();
	} else {
		document.getElementById('connectionIndicator').className = 'activity disconnected';
		console.log('App was NOT granted the "usbDevices" permission.');
	}
});

var disconnectDevice = (function() {
	document.getElementById('connectionIndicator').className = 'activity disconnecting';
	if (HIDConnectionId !== null) {
		chrome.hid.disconnect(HIDConnectionId, disconnectedCallback);
	} else {
		disconnectedCallback();
	}
});

var disconnectedCallback = (function() {
	console.log("Device with connection id "+HIDConnectionId+" is disconnected.");
	HIDConnectionId = null;
	HIDReady = false;

	document.getElementById('connectionIndicator').className = 'activity disconnected';
});

var logCallback = (function(data) {
	console.log(data);
});