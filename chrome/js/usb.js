var VENDOR_ID = 0x03EB; // integer = 1003
var PRODUCT_ID = 0x214F; // integer = 8527

window.onload = function() {
	document.getElementById('openConnection').addEventListener('click', requestPermissions);
}

var requestPermissions = (function() {
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
		document.getElementById('openConnection').text = 'Connected';
		document.getElementById('openConnection').disabled = true;
		console.log('App was granted the "usbDevices" permission.');
		chrome.hid.getDevices({"vendorId": VENDOR_ID, "productId": PRODUCT_ID}, logCallback);
	} else {
		console.log('App was NOT granted the "usbDevices" permission.');
	}
});

var logCallback = (function(data) {
	console.log(data);
});