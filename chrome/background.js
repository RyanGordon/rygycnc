chrome.app.runtime.onLaunched.addListener(openMainWindow);

var openMainWindow = (function() {
	chrome.app.window.create('window.html', {
		'state': 'normal',
		minWidth: 700,
		minHeight: 400,
		bounds: {
			width: 1000,
			height: 500
		}
	});
})();