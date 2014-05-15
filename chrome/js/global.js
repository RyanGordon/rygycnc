$(window).load(function() {
});

$(document).on('ready', function() {
  updateStatus('Disconnected');
  setupPowerButton();
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

function enablePower() {
  console.log("Enabling power");
  if (HIDReady === false) {
    connectDevice();
  }
}

function disablePower() {
  if (HIDReady === false) {
    return;
  }
  console.log("Disabling power");
}

function setupPowerButton() {
  $("#powerButton").switchButton({
    width: 40,
    height: 15,
    button_width: 20,
    on_callback: (function() { powerButtonClick(true) }),
    off_callback: (function() { powerButtonClick(false) })
  });
}

function powerButtonClick(checked) {
  console.log("Power switch pressed");
  if (checked === true) {
    enablePower();
  } else {
    disablePower();
  }
}