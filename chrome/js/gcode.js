function Gcode(lines) {
	this.lines = lines.replace("\r\n", "\n").replace("\r", "\n").split("\n");
	this.measurementMode = 'inches';
	this.distanceMode = 'absolute';
	this.currentPosition = {'x': 0, 'y': 0, 'z': 0};
	this.coordinateSytem = 'xyz';
	this.feedRate = null;
	this.intermediate = [];
	this.currentTool = null;
	this.nextTool = null;
	this.currentLine = 0;
	this.inComment = false;
	this.spindleSpeed = null; // RPM
	this.spindleDirection = 'CW';
	this.spindleOn = false;
}

Gcode.prototype.process = function() {
	$.each(this.lines, function(lineNumber, fullLine) {
		value = fullLine.trim().split(' ');

		// This loop allows multiple gcodes to be on a single line
		for (var i=0; i < value.length; i++) {
			command = value[i];
			switch (command) {
				case "G20":
					console.log("Measurement Mode: Inches");
					this.measurementMode = 'inches';
					break;
				case "G21":
					console.log("Measurement Mode: Millimeters");
					this.measurementMode = 'millimeters';
					break;
				case "G90":
					console.log("Distance Mode: Absolute");
					this.distanceMode = 'absolute';
					break;
				case "G91":
					console.log("Distance Mode: Relative");
					this.distanceMode = 'relative';
					break;
				case "G54":
					console.log("Coordinate System: xyz");
					this.coordinateSytem = 'xyz';
					break;
				case "G0":
				case "G00":
					console.log("Rapid Motion");
					allowedParams = ['X', 'Y', 'Z'];
					params = {'x': this.currentPosition.x, 'y': this.currentPosition.y, 'z': this.currentPosition.z, 'line': lineNumber};
					while (i < value.length) {
						nextCommand = value[i];

						if ($.inArray(nextCommand.charAt(0), allowedParams) !== -1) {
							if (this.distanceMode === 'relative') {
								params[nextCommand.charAt(0).toLowerCase()] += nextCommand.substr(1);
							} else {
								params[nextCommand.charAt(0).toLowerCase()] = nextCommand.substr(1);
							}
						}
						i++;
					}

					this.currentPosition.x = params.x;
					this.currentPosition.y = params.y;
					this.currentPosition.z = params.z;

					this.intermediate.push(params);
					break;
				case "G1":
				case "G01":
					console.log("Coordinated Motion");
					allowedParams = ['X', 'Y', 'Z'];
					params = {'x': this.currentPosition.x, 'y': this.currentPosition.y, 'z': this.currentPosition.z, 'line': lineNumber};
					while (++i < value.length) {
						nextCommand = value[i];

						if ($.inArray(nextCommand.charAt(0), allowedParams) !== -1) {
							if (this.distanceMode === 'relative') {
								params[nextCommand.charAt(0).toLowerCase()] += nextCommand.substr(1);
							} else {
								params[nextCommand.charAt(0).toLowerCase()] = nextCommand.substr(1);
							}
						}
					}

					this.currentPosition.x = params.x;
					this.currentPosition.y = params.y;
					this.currentPosition.z = params.z;

					this.intermediate.push(params);
					break;
				case "M2":
				case "M02":
				case "M30":
					console.log("End of Program");
					this.intermediate.push({'end': true, 'line': lineNumber});
					break;
				case "M6":
				case "M06":
					console.log("Changing tool. This will pause the program to allow for the person to change the tool");
					this.currentTool = this.nextTool;
					this.intermediate.push({'TOOL': this.currentTool, 'line': lineNumber});
					break;
				case "M3":
				case "M03":
					console.log("Changing spindle to clockwise direction");
					this.spindleDirection = 'CW';
					if (this.spindleOn === true) {
						this.intermediate.push({'spindle': this.spindleSpeed});
					}
					break;
				case "M4":
				case "M04":
					console.log("Changing spindle to couterclockwise direction");
					this.spindleDirection = 'CCW';
					if (this.spindleOn === true) {
						this.intermediate.push({'spindle': -1*this.spindleSpeed});
					}
					break;
				case "M5":
				case "M05":
					console.log("Stopping spindle");
					if (this.spindleOn === true) {
						this.spindleOn = false;
						this.intermediate.push({'spindle': 0});
					}
					break;
				case "":
					console.log("Ignoring a blank line");
					break;
				default:
					// A comment
					if (command.indexOf('(') === 0) {
						while (++i < value.length) {
							if (value[i].indexOf(')') !== -1) {
								break;
							}
						}
						console.log("Comment: "+fullLine);
					} else if(command.indexOf('F') === 0) {
						console.log("Changing feed rate speed");
						this.feedRate = command.substr(1);
						this.intermediate.push({'feed': this.feedRate, 'line': lineNumber});
					} else if(command.indexOf('S') === 0) {
						console.log("Changing spindle speed");
						this.spindleSpeed = command.substr(1);
						if (this.spindleOn === true) {
							if (this.spindleDirection === 'CW') {
								this.intermediate.push({'spindle': this.spindleSpeed});
							} else {
								this.intermediate.push({'spindle': -1*this.spindleSpeed});
							}
						}
					} else if(command.indexOf('T') === 0) {
						console.log("Preparing next tool for tool change");
						this.nextTool = command.substr(1);
					} else {
						console.log("Unknown command: "+command+" ("+fullLine+")");
					}
			}
		}
	}.bind(this));

	//console.log(this.intermediate);
};