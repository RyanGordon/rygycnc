chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('window.html', {
      'state': 'fullscreen'
  });

  chrome.hid.getDevices({"vendorId": 0x03eb, "productId": 0x214f}, function(devices) { console.log(devices); });
});