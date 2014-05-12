$(document).on('ready', function() {
  updateStatus('Disconnected');
});

function _log() {
  for (var i=0; i < arguments.length; i++) {
    console.log(arguments[i]);
    //document.getElementById('debug').value += arguments[i]+"\n";
  }
}

var logCallback = (function(data) {
  _log(data);
});

function updateStatus(status) {
  console.log('Status: '+status);
  $('#status').text('Status: '+status);
}