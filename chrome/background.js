chrome.app.runtime.onLaunched.addListener(openMainWindow);

var openMainWindow = (function() {
	chrome.app.window.create('window.html', {
		'state': 'normal',
		minWidth: 600,
		minHeight: 400,
		bounds: {
			width: 800,
			height: 500
		}
	});
})();