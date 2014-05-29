function Gcode(lines) {
	var INCH_TO_PIXEL = 1.0; // TODO: Need to change
	var MILLIMETER_TO_PIXEL = 1.0; // TODO: Need to change
	this.lines = lines.replace("\r\n", "\n").replace("\r", "\n").split("\n");
	this.measurementMode = 'inches';
	this.distanceMode = 'absolute';
	this.currentPosition = {'x': BigNumber(0), 'y': BigNumber(0), 'z': BigNumber(0)};
	this.coordinateSytem = 'xyz';
	this.feedRate = null;
	this.intermediate = [];
	this.intermediateRelative = [];
	this.processed = [];
	this.currentTool = null;
	this.nextTool = null;
	this.currentLine = 0;
	this.inComment = false;
	this.spindleSpeed = null; // RPM
	this.spindleDirection = 'CW';
	this.spindleOn = false;
	this.bounds = {'minX': BigNumber(0), 'maxX': BigNumber(0), 'minY': BigNumber(0), 'maxY': BigNumber(0), 'minZ': BigNumber(0), 'maxZ': BigNumber(0)};
	this.midpoint = {'x': BigNumber(0), 'y': BigNumber(0), 'z': BigNumber(0)};
	this.objectLength = BigNumber(0);
	this.objectWidth = BigNumber(0);
	this.objectHeight = BigNumber(0);
	this.lastCommand = null;
}

Gcode.prototype.process = function() {
	gcodeScene.reset();

	$.each(this.lines, function(lineNumber, fullLine) {
		this.processCommand(fullLine, lineNumber);
	}.bind(this));

	gcodeScene.setObjectProperties(this.bounds);

	this.intermediateRelative.push({'begin': true, line: 0});
	var lastParsedLine = {'x': BigNumber(0), 'y': BigNumber(0), 'z': BigNumber(0)};
	$.each(this.intermediate, function(index, parsedLine) {
		// Is this a coordinate?
		if (parsedLine.x !== undefined) {
			var xRel = parsedLine.x.minus(lastParsedLine.x);
			var yRel = parsedLine.y.minus(lastParsedLine.y);
			var zRel = parsedLine.z.minus(lastParsedLine.z);
			this.intermediateRelative.push({'x': xRel, 'y': yRel, 'z': zRel, 'lineType': parsedLine.lineType, 'line': parsedLine.line});

			lastParsedLine = parsedLine;
		} else {
			// Otherwise its something else, just push through
			this.intermediateRelative.push(parsedLine);
		}
	}.bind(this));

	// Draw the lines on the gcode scene
	this.currentPosition = {'x': BigNumber(0), 'y': BigNumber(0), 'z': BigNumber(0)};
	$.each(this.intermediateRelative, function(index, parsedLineRelative) {
		if (parsedLineRelative.x === undefined) return;

		var x1 = this.currentPosition.x.toPrecision(15);
		var y1 = this.currentPosition.y.toPrecision(15);
		var z1 = this.currentPosition.z.toPrecision(15);

		var x2 = this.currentPosition.x.plus(parsedLineRelative.x).toPrecision(15);
		var y2 = this.currentPosition.y.plus(parsedLineRelative.y).toPrecision(15);
		var z2 = this.currentPosition.z.plus(parsedLineRelative.z).toPrecision(15);

		// Draw the line for simulation
		gcodeScene.drawLine([x1, y1, z1], [x2, y2, z2], parsedLineRelative.lineType);

		this.currentPosition = {'x': BigNumber(x2), 'y': BigNumber(y2), 'z': BigNumber(z2)};
	}.bind(this));

	gcodeScene.refreshScene();
};

Gcode.prototype.processCommand = function(fullLine, lineNumber) {
	value = fullLine.trim().split(' ');

	// This loop allows multiple gcodes to be on a single line
	for (var i=0; i < value.length; i++) {
		command = value[i];
		switch (command) {
			case "G20":
				_log(command+": Measurement Mode: Inches");
				this.measurementMode = 'inches';
				break;
			case "G21":
				_log(command+": Measurement Mode: Millimeters");
				this.measurementMode = 'millimeters';
				break;
			case "G90":
				_log(command+": Distance Mode: Absolute");
				this.distanceMode = 'absolute';
				break;
			case "G91":
				_log(command+": Distance Mode: Relative");
				this.distanceMode = 'relative';
				break;
			case "G54":
				_log(command+": Coordinate System: xyz");
				this.coordinateSytem = 'xyz';
				break;
			case "G0":
			case "G00":
				_log(command+": Rapid Motion");
				allowedParams = ['X', 'Y', 'Z'];
				params = {'x': this.currentPosition.x, 'y': this.currentPosition.y, 'z': this.currentPosition.z, 'lineType': 'dashed', 'line': lineNumber};
				while (++i < value.length) {
					nextCommand = value[i];

					if ($.inArray(nextCommand.charAt(0), allowedParams) !== -1) {
						if (this.distanceMode === 'relative') {
							params[nextCommand.charAt(0).toLowerCase()] += BigNumber(nextCommand.substr(1));
						} else {
							params[nextCommand.charAt(0).toLowerCase()] = BigNumber(nextCommand.substr(1));
						}
					}
				}

				this.currentPosition.x = BigNumber(params.x);
				this.currentPosition.y = BigNumber(params.y);
				this.currentPosition.z = BigNumber(params.z);

				if (this.currentPosition.x.lessThan(this.bounds.minX)) {
					this.bounds.minX = this.currentPosition.x;
				}

				if (this.currentPosition.y.lessThan(this.bounds.minY)) {
					this.bounds.minY = this.currentPosition.y;
				}

				if (this.currentPosition.z.lessThan(this.bounds.minZ)) {
					this.bounds.minZ = this.currentPosition.z;
				}

				if (this.currentPosition.x.greaterThan(this.bounds.maxX)) {
					this.bounds.maxX = this.currentPosition.x;
				}

				if (this.currentPosition.y.greaterThan(this.bounds.maxY)) {
					this.bounds.maxY = this.currentPosition.y;
				}

				if (this.currentPosition.z.greaterThan(this.bounds.maxZ)) {
					this.bounds.maxZ = this.currentPosition.z;
				}

				this.intermediate.push(params);
				break;
			case "G1":
			case "G01":
				_log(command+": Coordinated Motion");
				allowedParams = ['X', 'Y', 'Z'];
				params = {'x': this.currentPosition.x, 'y': this.currentPosition.y, 'z': this.currentPosition.z, 'lineType': 'regular', 'line': lineNumber};
				while (++i < value.length) {
					nextCommand = value[i];

					if ($.inArray(nextCommand.charAt(0), allowedParams) !== -1) {
						if (this.distanceMode === 'relative') {
							params[nextCommand.charAt(0).toLowerCase()] += BigNumber(nextCommand.substr(1));
						} else {
							params[nextCommand.charAt(0).toLowerCase()] = BigNumber(nextCommand.substr(1));
						}
					}
				}

				this.currentPosition.x = BigNumber(params.x);
				this.currentPosition.y = BigNumber(params.y);
				this.currentPosition.z = BigNumber(params.z);

				if (this.currentPosition.x.lessThan(this.bounds.minX)) {
					this.bounds.minX = this.currentPosition.x;
				}

				if (this.currentPosition.y.lessThan(this.bounds.minY)) {
					this.bounds.minY = this.currentPosition.y;
				}

				if (this.currentPosition.z.lessThan(this.bounds.minZ)) {
					this.bounds.minZ = this.currentPosition.z;
				}

				if (this.currentPosition.x.greaterThan(this.bounds.maxX)) {
					this.bounds.maxX = this.currentPosition.x;
				}

				if (this.currentPosition.y.greaterThan(this.bounds.maxY)) {
					this.bounds.maxY = this.currentPosition.y;
				}

				if (this.currentPosition.z.greaterThan(this.bounds.maxZ)) {
					this.bounds.maxZ = this.currentPosition.z;
				}

				this.intermediate.push(params);
				break;
			case "M2":
			case "M02":
			case "M30":
				_log(command+": End of Program");
				this.intermediate.push({'end': true, 'line': lineNumber});
				break;
			case "M6":
			case "M06":
				_log(command+": Changing tool. This will pause the program to allow for the person to change the tool");
				this.currentTool = this.nextTool;
				this.intermediate.push({'tool': this.currentTool, 'line': lineNumber});
				break;
			case "M3":
			case "M03":
				_log(command+": Changing spindle to clockwise direction");
				this.spindleDirection = 'CW';
				if (this.spindleOn === true) {
					this.intermediate.push({'spindle': this.spindleSpeed, 'line': lineNumber});
				}
				break;
			case "M4":
			case "M04":
				_log(command+": Changing spindle to couterclockwise direction");
				this.spindleDirection = 'CCW';
				if (this.spindleOn === true) {
					this.intermediate.push({'spindle': -1*this.spindleSpeed, 'line': lineNumber});
				}
				break;
			case "M5":
			case "M05":
				_log(command+": Stopping spindle");
				if (this.spindleOn === true) {
					this.spindleOn = false;
					this.intermediate.push({'spindle': 0, 'line': lineNumber});
				}
				break;
			case "M64":
			case "M65":
				_log(command+": Explicitly ignoring "+command+": ("+fullLine+")");
				while (++i <= value.length) {
					if (value[i].indexOf('P') !== -1) {
						break;
					}
				}
				break;
			case "":
				_log("Ignoring a blank line");
				break;
			default:
				// A comment
				if (command.indexOf('(') === 0) {
					while (++i < value.length) {
						if (value[i].indexOf(')') !== -1) {
							break;
						}
					}
					_log("Comment: "+fullLine);
				} else if(command.indexOf('F') === 0) {
					_log(command+": Changing feed rate speed");
					this.feedRate = command.substr(1);
					this.intermediate.push({'feed': this.feedRate, 'line': lineNumber});
				} else if(command.indexOf('S') === 0) {
					_log(command+": Changing spindle speed");
					this.spindleSpeed = command.substr(1);
					if (this.spindleOn === true) {
						if (this.spindleDirection === 'CW') {
							this.intermediate.push({'spindle': this.spindleSpeed, 'line': lineNumber});
						} else {
							this.intermediate.push({'spindle': -1*this.spindleSpeed, 'line': lineNumber});
						}
					}
				} else if(command.indexOf('T') === 0) {
					_log(command+": Preparing next tool for tool change");
					this.nextTool = command.substr(1);
				} else if($.inArray(command.charAt(0), ['X', 'Y', 'Z', 'I', 'J']) !== -1) {
					// Reapply the rest of the line with last command
					var newLine = this.lastCommand+" "+command;
					while (++i < value.length) {
						newLine += " "+value[i];
					}

					if (this.lastCommand === null) {
						_log(command+": Ignoring reprocessing (no valid last command): "+newLine);
					} else {
						_log(command+": Reprocessing: "+newLine);
						//this.processCommand(this.lastCommand+" "+fullLine, lineNumber);
					}
				} else {
					_log(command+": Unknown command: "+command+" ("+fullLine+")");

					// Don't set an unknown command to lastCommand, otherwise would cause infinite recursion in the above code block
					command = null;
				}
		}
		this.lastCommand = command;
	}
};