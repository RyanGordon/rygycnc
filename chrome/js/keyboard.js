$(document).keydown(function(e) {
	// 37 - left
	// 38 - up
	// 39 - right
	// 40 - down
	// 189 - minus
	// 187 - plus
	if (e.keyCode === 38) {
		yAxisUpGo();
		return false;
	} else if (e.keyCode === 40) { 
		yAxisDownGo();
       return false;
    } else if(e.keyCode === 37) {
    	xAxisDownGo();
    	return false;
    } else if(e.keyCode === 39) {
    	xAxisUpGo();
    	return false;
    } else if (e.keyCode === 189) {
    	zAxisDownGo();
    	return false;
    } else if (e.keyCode === 187) {
    	zAxisUpGo();
    	return false;
    }
});

$(document).keyup(function(e) {
	// 37 - left
	// 38 - up
	// 39 - right
	// 40 - down
	// 189 - minus
	// 187 - plus
	if (e.keyCode === 38) {
		yAxisUpStop();
		return false;
	} else if (e.keyCode === 40) { 
		yAxisDownStop();
       return false;
    } else if(e.keyCode === 37) {
    	xAxisDownStop();
    	return false;
    } else if(e.keyCode === 39) {
    	xAxisUpStop();
    	return false;
    } else if (e.keyCode === 189) {
    	zAxisDownStop();
    	return false;
    } else if (e.keyCode === 187) {
    	zAxisUpStop();
    	return false;
    }
});