var VENDOR_ID = 0x03EB; // integer = 1003
var PRODUCT_ID = 0x214F; // integer = 8527

var HIDConnectionId = null;
var HIDReady = false;

chrome.runtime.onSuspend.addListener(disconnectDevice);

window.onload = function() {
	document.getElementById('connect').addEventListener('click', connectDevice);
	document.getElementById('disconnect').addEventListener('click', disconnectDevice);
	document.getElementById('send_test_data').addEventListener('click', sendTestDataToDevice);
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
	
});

function sendData(data, callback) {
	var dataBuffer = new ArrayBuffer(64);
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
	var dataArrayTest = new Uint8Array(arrayBuffer);
	console.log(dataArrayTest);
}

function recieveData(size, dataCallback) {
	chrome.hid.recieve(HIDConnectionId, size, dataCallback);
}

function findHIDDevice() {
	chrome.hid.getDevices({"vendorId": VENDOR_ID, "productId": PRODUCT_ID}, function(devices) {
		console.log(devices);
		if (devices.size === 0) {
			console.log("No connected RYGY CNC devices were found");
			document.getElementById('connect').text = 'Connect';
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
		document.getElementById('connect').style.display = "none";
		document.getElementById('connect').text = 'Connect';

		document.getElementById('disconnect').style.display = "block";
	});
}

var connectDevice = (function() {
	if (HIDConnectionId !== null) {
		console.log("Already connected to device with connection id "+HIDConnectionId+". Disconnect first.");
		return 0;
	}

	document.getElementById('connect').text = 'Connecting';
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
		document.getElementById('connect').text = 'Connect';
		console.log('App was NOT granted the "usbDevices" permission.');
	}
});

var disconnectDevice = (function() {
	document.getElementById('disconnect').text = 'Disconnecting';
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

	document.getElementById('disconnect').style.display = "none";
	document.getElementById('disconnect').text = 'Disconnect';

	document.getElementById('connect').style.display = "block";
	document.getElementById('connect').text = 'Connect';
});

var logCallback = (function(data) {
	console.log(data);
});