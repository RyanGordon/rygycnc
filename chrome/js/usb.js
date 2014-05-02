var VENDOR_ID = 0x03EB; // integer = 1003
var PRODUCT_ID = 0x214F; // integer = 8527

var HIDConnectionId = null;
var HIDReady = false;

function findHIDDevice() {
	chrome.hid.getDevices({"vendorId": VENDOR_ID, "productId": PRODUCT_ID}, function(devices) {
		connectToHIDDevice(devices[0].deviceId);
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

window.onload = function() {
	document.getElementById('connect').addEventListener('click', connectDevice);
	document.getElementById('disconnect').addEventListener('click', disconnectDevice);
}

var connectDevice = (function() {
	if (HIDConnectionId != null) {
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
	document.getElementById('disconnect').style.display = "none";
	document.getElementById('disconnect').text = 'Disconnecting';
	if (HIDConnectionId != null) {
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