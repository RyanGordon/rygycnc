var VENDOR_ID = 0x03EB; // integer = 1003
var PRODUCT_ID = 0x214F; // integer = 8527

var connectionHandle = null;
var deviceReady = false;

var PACKET_SIZE = 64;

chrome.runtime.onSuspend.addListener(disconnectDevice);

window.onload = function() {
	document.getElementById('connect').addEventListener('click', connectDevice);
	document.getElementById('disconnect').addEventListener('click', disconnectDevice);
	document.getElementById('send_test_data').addEventListener('click', sendTestDataToDevice);
}

var sendTestDataToDevice = (function() {
	if (deviceReady !== true) {
		console.log("Device not connected. Please connect first.");
		return 0;
	}

	console.log("Sending packet to device.");
	var data = [0x81, 0x81, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02];
	sendData(data, function(info) {
		console.log("Packet has been sent.");
		console.log(info);
	});

	//receiveData(function(data) {
	//	console.log("Data received.");
	//	console.log(data);
	//});
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

	var transferInfo = {
		direction: 'out',
		endpoint: 1,
		data: dataBuffer
	}

	chrome.usb.interruptTransfer(connectionHandle, transferInfo, callback);
}

function readFromArrayBuffer(arrayBuffer) {
	return new Uint8Array(arrayBuffer);
}

function receiveData(dataCallback) {
	console.log("Receiving data...");

	var transferInfo = {
		direction: 'in',
		endpoint: 2,
		length: PACKET_SIZE
	}

	chrome.usb.interruptTransfer(connectionHandle, transferInfo, function(dataBuffer) {
		dataCallback(new Uint8Array(dataBuffer));
	});
}

function findDevice() {
	console.log("Finding devices");
	chrome.usb.getDevices({"vendorId": VENDOR_ID, "productId": PRODUCT_ID}, function(devices) {
		console.log("Device found");
		console.log(devices);
		if (devices.size === 0) {
			console.log("No connected RYGY CNC devices were found");
			document.getElementById('connect').text = 'Connect';
		} else {
			connectToDevice(devices[0]);
		}
	});
}

function connectToDevice(device) {
	console.log ("Opening Device "+device.device);
	chrome.usb.openDevice(device, function(connection) {
		connectionHandle = connection;

		console.log("Device opened with connection id "+connectionHandle.handle);
		console.log("Claiming interface");
		chrome.usb.claimInterface(connection, 0, function() {
			console.log("Interface claimed.");
			deviceReady = true;

			document.getElementById('connect').style.display = "none";
			document.getElementById('connect').text = 'Connect';

			document.getElementById('disconnect').style.display = "block";
		});
	});
}

var connectDevice = (function() {
	if (connectionHandle !== null) {
		console.log("Already connected to device with connection id "+connectionHandle.handle+". Disconnect first.");
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
		findDevice();
	} else {
		document.getElementById('connect').text = 'Connect';
		console.log('App was NOT granted the "usbDevices" permission.');
	}
});

var disconnectDevice = (function() {
	document.getElementById('disconnect').text = 'Disconnecting';
	if (connectionHandle !== null) {
		chrome.usb.closeDevice(connectionHandle, disconnectedCallback);
	} else {
		disconnectedCallback();
	}
});

var disconnectedCallback = (function() {
	console.log("Device with connection id "+connectionHandle.handle+" is disconnected.");
	connectionHandle = null;
	deviceReady = false;

	document.getElementById('disconnect').style.display = "none";
	document.getElementById('disconnect').text = 'Disconnect';

	document.getElementById('connect').style.display = "block";
	document.getElementById('connect').text = 'Connect';
});

var logCallback = (function(data) {
	console.log(data);
});