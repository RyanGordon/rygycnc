chrome.app.runtime.onLaunched.addListener(openMainWindow);

var openMainWindow = (function() {
	chrome.app.window.create('window.html', {
		'state': 'normal'
	});
})();