var gcodeTextbox;

$(window).load(function() {
});

$(document).on('ready', function() {
  updateStatus('Disconnected');
  setupPowerButton();
  setupAxisButtons();
  setupSlideButtons();
  setupSpindlePowerButton();
  setupSpindleDirectionButton();
  setupGcodeTextArea();
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

function setupGcodeTextArea() {
  gcodeTextbox = CodeMirror.fromTextArea($("#gcodes").get(0), {
    lineNumbers: true,
    readOnly: true,
    mode: "css"
  });

  gcodeTextbox.setSize("100%", "100%");

  $(".CodeMirror-lines").children().on('click', function() {
    setGcodeSelectionLine(gcodeTextbox.getCursor().line);
  });
}

function goToGcodeLine(line) {
  gcodeTextbox.setCursor(line, 0);
  setGcodeSelectionLine(line);
}

function setGcodeSelectionLine(line) {
  gcodeTextbox.setSelection({line: line, ch: 0}, {line: line+1, ch: 0});
  gcodeTextbox.focus();
}

function setupPowerButton() {
  $("#powerButton").switchButton({
    width: 40,
    height: 15,
    button_width: 20,
    on_callback: (function() { powerButtonClick(true); }),
    off_callback: (function() { powerButtonClick(false); })
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

function setupAxisButtons() {
  $("#x-down").on('mousedown', function() {
    xAxisDownGo();
  });

  $("#x-down").on('mouseup', function() {
    xAxisDownStop();
  });

  $("#x-up").on('mousedown', function() {
    xAxisUpGo();
  });

  $("#x-up").on('mouseup', function() {
    xAxisUpStop();
  });

  $("#y-down").on('mousedown', function() {
    yAxisDownGo();
  });

  $("#y-down").on('mouseup', function() {
    yAxisDownStop();
  });

  $("#y-up").on('mousedown', function() {
    yAxisUpGo();
  });

  $("#y-up").on('mouseup', function() {
    yAxisUpStop();
  });

  $("#z-down").on('mousedown', function() {
    zAxisDownGo();
  });

  $("#z-down").on('mouseup', function() {
    zAxisDownStop();
  });

  $("#z-up").on('mousedown', function() {
    zAxisUpGo();
  });

  $("#z-up").on('mouseup', function() {
    zAxisUpStop();
  });
}

function xAxisDownGo() {
  console.log("X axis down go");
}

function xAxisDownStop() {
  console.log("X axis down stop");
}

function xAxisUpGo() {
  console.log("X axis up go");
}

function xAxisUpStop() {
  console.log("X axis up stop");
}

function yAxisDownGo() {
  console.log("Y axis down go");
}

function yAxisDownStop() {
  console.log("Y axis down stop");
}

function yAxisUpGo() {
  console.log("Y axis up go");
}

function yAxisUpStop() {
  console.log("Y axis up stop");
}

function zAxisDownGo() {
  console.log("Z axis down go");
}

function zAxisDownStop() {
  console.log("Z axis down stop");
}

function zAxisUpGo() {
  console.log("Z axis up go");
}

function zAxisUpStop() {
  console.log("Z axis up stop");
}

function xSpeedChange(speed) {
  console.log("X-Direction Speed: "+speed+"%");
}

function ySpeedChange(speed) {
  console.log("Y-Direction Speed: "+speed+"%");
}

function zSpeedChange(speed) {
  console.log("Z-Direction Speed: "+speed+"%");
}

function spindleSpeedChange(speed) {
  console.log("Spindle Speed: "+speed+"%");
}

function setupSlideButtons() {
  $("#x-speed").slider({
    orientation: "horizontal",
    range: "min",
    min: 0,
    max: 100,
    value: 90,
    slide: function(event, ui) {
      xSpeedChange(ui.value);
      $("#x-speed-amount").val(ui.value+"%");
    }
  });
  $("#x-speed-amount").val($("#x-speed").slider("value")+"%");

  $("#y-speed").slider({
    orientation: "horizontal",
    range: "min",
    min: 0,
    max: 100,
    value: 90,
    slide: function(event, ui) {
      ySpeedChange(ui.value);
      $("#y-speed-amount").val(ui.value+"%");
    }
  });
  $("#y-speed-amount").val($("#y-speed").slider("value")+"%");

  $("#z-speed").slider({
    orientation: "horizontal",
    range: "min",
    min: 0,
    max: 100,
    value: 90,
    slide: function(event, ui) {
      zSpeedChange(ui.value);
      $("#z-speed-amount").val(ui.value+"%");
    }
  });
  $("#z-speed-amount").val($("#z-speed").slider("value")+"%");

  $("#spindle-speed").slider({
    orientation: "horizontal",
    range: "min",
    min: 0,
    max: 100,
    value: 90,
    slide: function(event, ui) {
      spindleSpeedChange(ui.value);
      $("#spindle-speed-amount").val(ui.value+"%");
    }
  });
  $("#spindle-speed-amount").val($("#spindle-speed").slider("value")+"%");
}

function setupSpindlePowerButton() {
  $("#spindlePowerButton").switchButton({
    width: 40,
    height: 15,
    button_width: 20,
    on_callback: (function() { spindlePowerButtonClick(true) }),
    off_callback: (function() { spindlePowerButtonClick(false) })
  });
}

function spindlePowerButtonClick(checked) {
  console.log("Spindle Power switch pressed");
  if (checked === true) {
    enableSpindlePower();
  } else {
    disableSpindlePower();
  }
}

function enableSpindlePower() {
  console.log("Enabling spindle power");
}

function disableSpindlePower() {
  console.log("Disabling spindle power");
}

function setupSpindleDirectionButton() {
  $("#spindleDirectionButton").switchButton({
    width: 40,
    height: 15,
    button_width: 20,
    on_label: "Right",
    off_label: "Left",
    on_callback: (function() { spindleDirectionButtonClick(true) }),
    off_callback: (function() { spindleDirectionButtonClick(false) })
  });
}

function spindleDirectionButtonClick(checked) {
  console.log("Spindle direction switch pressed");
  if (checked === true) {
    setSpindleDirection('right');
  } else {
    setSpindleDirection('left');
  }
}

function setSpindleDirection(direction) {
  console.log("Switching spindle direction to "+direction);

  if (direction === 'right') {

  } else {

  }
}