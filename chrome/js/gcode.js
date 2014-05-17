function Gcode(lines) {
	this.lines = lines.replace("\r\n", "\n").replace("\r", "\n").split("\n");
	this.measurementMode = 'inches';
	this.distanceMode = 'absolute';
}

Gcode.prototype.process = function() {
	$.each(this.lines, function(index, value) {
		value = value.trim().split(' ');

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
				case "G0":
				case "G00":
					console.log("Rapid Motion");
					break;
				case "G1":
				case "G01":
					console.log("Coordinated Motion");
					break;
				case "":
					console.log("Ignoring a blank line");
					break;
				default:
					if (command.indexOf('(') !== -1) {
						console.log("Ignoring a comment");
						// A comment
					} else {
						console.log("Unknown command");
					}
			}
		}
		console.log(value);
	});
};