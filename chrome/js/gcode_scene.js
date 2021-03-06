var gcodeScene = new GCodeScene();
$(document).on('ready', function() {
  $('#rightbody').append(gcodeScene.createScene());
  gcodeScene.renderScene();
});

function GCodeScene() {
  this.scene = null;
  this.renderer = null;
  this.camera = null;
  this.controls = null;

  this.sceneWidth = 600;
  this.sceneHeight = 400;

  this.objectBounds = {'minX': BigNumber(0), 'maxX': BigNumber(0), 'minY': BigNumber(0), 'maxY': BigNumber(0), 'minZ': BigNumber(0), 'maxZ': BigNumber(0)};
  this.objectLength = BigNumber(0);
  this.objectWidth = BigNumber(0);
  this.objectHeight = BigNumber(0);

  this.objectMidpoint = {'x': BigNumber(0), 'y': BigNumber(0), 'z': BigNumber(0)};
}

GCodeScene.prototype.setSceneSize = function() {
  var newWidth = Math.round($(window).width()*0.65);
  var heightRatio;
  if ($(window).height() <= 450) {
    heightRatio = 0.65;
  } else if ($(window).height() <= 500) {
    heightRatio = 0.675;
  } else if ($(window).height() <= 550) {
    heightRatio = 0.68;
  } else if ($(window).height() > 810) {
    heightRatio = 0.73;
  } else if ($(window).height() > 700) {
    heightRatio = 0.72;
  } else if ($(window).height() > 650) {
    heightRatio = 0.71;
  } else if ($(window).height() > 600) {
    heightRatio = 0.695;
  } else {
    heightRatio = 0.70;
  }
  var newHeight = Math.round($(window).height()*heightRatio);

  if (newHeight !== this.sceneHeight || newWidth !== this.sceneWidth) {
    this.sceneHeight = newHeight;
    this.sceneWidth = newWidth;
    this.renderer.setSize(this.sceneWidth, this.sceneHeight);
    this.camera.aspect = this.sceneWidth / this.sceneHeight;
    this.camera.updateProjectionMatrix();
    console.log($(window).width(), newWidth, $(window).height(), heightRatio, newHeight);
  }
};

GCodeScene.prototype.setObjectProperties = function(bounds) {
  this.objectBounds = bounds;

  this.objectLength = bounds.maxX.minus(bounds.minX);
  this.objectWidth = bounds.maxY.minus(bounds.minY);
  this.objectHeight = bounds.maxZ.minus(bounds.minZ);

  this.objectMidpoint.x = bounds.minX.plus(this.objectLength.dividedBy(2));
  this.objectMidpoint.y = bounds.minY.plus(this.objectWidth.dividedBy(2));
  this.objectMidpoint.z = bounds.minZ.plus(this.objectHeight.dividedBy(2));
};

GCodeScene.prototype.createScene = function() {
  var VIEW_ANGLE = 45, ASPECT = this.sceneWidth / this.sceneHeight, NEAR = 0.1, FAR = 20000;

  // create a WebGL renderer, camera and a scene
  this.renderer = new THREE.WebGLRenderer({ antialias: true });
  //camera = new THREE.OrthographicCamera(SCENE_WIDTH/-2, SCENE_WIDTH/2, SCENE_HEIGHT/2, SCENE_HEIGHT/-2, NEAR, FAR);
  this.camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
  this.scene = new THREE.Scene();
  this.scene.add(this.camera);
  
  // Set Z axis to be up
  this.camera.up.set(0, 0, 1);

  // start the camera with orbital controls
  this.controls = new THREE.OrbitControls(this.camera, $('#rightbody')[0]);

  // Initially look top down with the x and y axis in the corner
  this.setTopDownView();

  // start the renderer
  this.setSceneSize();

  // attach the render-supplied DOM element
  return this.renderer.domElement;
};

GCodeScene.prototype.refreshScene = function() {
  this.setTopDownView();
  this.render();
}

GCodeScene.prototype.setTopDownView = function() {
  var cameraZ = this.calculateCameraZAutoZoom().times(1.7); // Bias multiplier because for some reason three.js doesn't follow the rules of geometry...
  var position = {'x': this.objectMidpoint.x.toNumber(), 'y': this.objectMidpoint.y.toNumber(), 'z': 0.0};
  this.controls.target = new THREE.Vector3(position.x, position.y, position.z);
  this.controls.object.position.set(position.x, position.y, cameraZ.plus(position.z).toNumber());
  this.controls.update();
};

GCodeScene.prototype.setIsometricView = function() {
  var position = {'x': this.objectMidpoint.x, 'y': this.objectMidpoint.y, 'z': BigNumber(0.0)};
  var cameraZ = this.calculateCameraZAutoZoom();
  this.controls.target = new THREE.Vector3(position.x.toNumber(), position.y.toNumber(), position.z.toNumber());
  this.controls.object.position.set(cameraZ.plus(position.x).toNumber(), cameraZ.plus(position.y).times(-1).toNumber(), cameraZ.plus(position.z).toNumber());
  this.controls.update();
};

GCodeScene.prototype.calculateCameraZAutoZoom = function() {
  /* z axis we use for the camera is based on the fact that our field of view is 45 degrees on either side (set in createScene)
   * So our view port is a simple 45-45-90 triangle and opposite = adjacent*tan(45 deg),
   * where opposite is the z length and adjacent is 1/2 of the length of the object
   * tan(45 deg) is just 1 so opposite = adjacent or z = 1/2*(length of object)
   * But we also need to consider the width of the object in the view port
   * Whichever one maximizes, is the one we need to use to fit the object into the view port
   */
  var cameraZ;
  var cameraZLength = this.objectLength.dividedBy(2);
  var cameraZWidth = this.objectWidth.dividedBy(2);
  if (cameraZLength.greaterThan(cameraZWidth)) {
    cameraZ = cameraZLength;
  } else {
    cameraZ = cameraZWidth;
  }
  if (cameraZ.equals(0)) {
    cameraZ = BigNumber(100);
  }

  return cameraZ;
}

GCodeScene.prototype.renderScene = function() {

  $(window).resize(this.setSceneSize.bind(this));

  // lights
  light = new THREE.DirectionalLight(0xffffff);
  light.position.set(1, 1, 1);
  this.scene.add(light);

  light = new THREE.DirectionalLight(0x002288);
  light.position.set(-1, -1, -1);
  this.scene.add(light);

  light = new THREE.AmbientLight(0x222222);
  this.scene.add(light);

  this.addAxes(10000);

  this.render();
};

GCodeScene.prototype.drawLine = function(point1, point2, type) {
  if (typeof type !== 'undefined' && type === 'dashed') {
    var lineMaterial = new THREE.LineDashedMaterial({ color: 0xFFFFFF, dashSize: 1, gapSize: 1 });
  } else {
    var lineMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFF });
  }

  var geometry = new THREE.Geometry();
  geometry.vertices.push(new THREE.Vector3(point1[0], point1[1], point1[2]));
  geometry.vertices.push(new THREE.Vector3(point2[0], point2[1], point2[2]));
  geometry.computeLineDistances();

  var line = new THREE.Line(geometry, lineMaterial);

  this.scene.add(line);
};

GCodeScene.prototype.render = function() {
  requestAnimationFrame(function() { this.render(); }.bind(this));
  this.renderer.render(this.scene, this.camera);
};

GCodeScene.prototype.addAxes = function(length) {
  var axes = new THREE.Object3D();

  axes.add(this.buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(length, 0, 0), 0xFF0000, false)); // +X
  axes.add(this.buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(-length, 0, 0), 0xFF0000, true)); // -X
  axes.add(this.buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, length, 0), 0x00FF00, false)); // +Y
  axes.add(this.buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -length, 0), 0x00FF00, true)); // -Y
  axes.add(this.buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, length), 0x0000FF, false)); // +Z
  axes.add(this.buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -length), 0x0000FF, true)); // -Z

  this.scene.add(axes);
};

GCodeScene.prototype.buildAxis = function(src, dst, colorHex, dashed) {
  var geometry = new THREE.Geometry(), material; 

  if (dashed) {
    material = new THREE.LineDashedMaterial({ linewidth: 3, color: colorHex, dashSize: 2, gapSize: 2 });
  } else {
    material = new THREE.LineBasicMaterial({ linewidth: 3, color: colorHex });
  }

  geometry.vertices.push(src.clone());
  geometry.vertices.push(dst.clone());
  geometry.computeLineDistances(); // This one is SUPER important, otherwise dashed lines will appear as simple plain lines

  var axis = new THREE.Line(geometry, material, THREE.LinePieces);

  return axis;
};

GCodeScene.prototype.reset = function() {
  var obj, i;
  for (i = this.scene.children.length - 1; i >= 0 ; i --) {
      obj = this.scene.children[i];
      if (obj !== this.camera) {
          this.scene.remove(obj);

          if (obj.dispose) obj.dispose();
      }
  }

  this.renderScene();
};

/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 */
/*global THREE, console */

// This set of controls performs orbiting, dollying (zooming), and panning. It maintains
// the "up" direction as +Y, unlike the TrackballControls. Touch on tablet and phones is
// supported.
//
//    Orbit - left mouse / touch: one finger move
//    Zoom - middle mouse, or mousewheel / touch: two finger spread or squish
//    Pan - right mouse, or arrow keys / touch: three finter swipe
//
// This is a drop-in replacement for (most) TrackballControls used in examples.
// That is, include this js file and wherever you see:
//      controls = new THREE.TrackballControls( camera );
//      controls.target.z = 150;
// Simple substitute "OrbitControls" and the control should work as-is.

THREE.OrbitControls = function ( object, domElement ) {

  this.object = object;
  this.domElement = ( domElement !== undefined ) ? domElement : document;

  // API

  // Set to false to disable this control
  this.enabled = true;

  // "target" sets the location of focus, where the control orbits around
  // and where it pans with respect to.
  this.target = new THREE.Vector3();

  // center is old, deprecated; use "target" instead
  this.center = this.target;

  // This option actually enables dollying in and out; left as "zoom" for
  // backwards compatibility
  this.noZoom = false;
  this.zoomSpeed = 1.0;

  // Limits to how far you can dolly in and out
  this.minDistance = 0;
  this.maxDistance = Infinity;

  // Set to true to disable this control
  this.noRotate = false;
  this.rotateSpeed = 1.0;

  // Set to true to disable this control
  this.noPan = false;
  this.keyPanSpeed = 7.0; // pixels moved per arrow key push

  // Set to true to automatically rotate around the target
  this.autoRotate = false;
  this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

  // How far you can orbit vertically, upper and lower limits.
  // Range is 0 to Math.PI radians.
  this.minPolarAngle = 0; // radians
  this.maxPolarAngle = Math.PI; // radians

  // Set to true to disable use of the keys
  this.noKeys = true;

  // The four arrow keys
  this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };

  ////////////
  // internals

  var scope = this;

  var EPS = 0.000001;

  var rotateStart = new THREE.Vector2();
  var rotateEnd = new THREE.Vector2();
  var rotateDelta = new THREE.Vector2();

  var panStart = new THREE.Vector2();
  var panEnd = new THREE.Vector2();
  var panDelta = new THREE.Vector2();
  var panOffset = new THREE.Vector3();

  var offset = new THREE.Vector3();

  var dollyStart = new THREE.Vector2();
  var dollyEnd = new THREE.Vector2();
  var dollyDelta = new THREE.Vector2();

  var phiDelta = 0;
  var thetaDelta = 0;
  var scale = 1;
  var pan = new THREE.Vector3();

  var lastPosition = new THREE.Vector3();

  var STATE = { NONE : -1, ROTATE : 0, DOLLY : 1, PAN : 2, TOUCH_ROTATE : 3, TOUCH_DOLLY : 4, TOUCH_PAN : 5 };

  var state = STATE.NONE;

  // for reset

  this.target0 = this.target.clone();
  this.position0 = this.object.position.clone();

  // so camera.up is the orbit axis

  var quat = new THREE.Quaternion().setFromUnitVectors( object.up, new THREE.Vector3( 0, 1, 0 ) );
  var quatInverse = quat.clone().inverse();

  // events

  var changeEvent = { type: 'change' };
  var startEvent = { type: 'start'};
  var endEvent = { type: 'end'};

  this.rotateLeft = function ( angle ) {

    if ( angle === undefined ) {

      angle = getAutoRotationAngle();

    }

    thetaDelta -= angle;

  };

  this.rotateUp = function ( angle ) {

    if ( angle === undefined ) {

      angle = getAutoRotationAngle();

    }

    phiDelta -= angle;

  };

  // pass in distance in world space to move left
  this.panLeft = function ( distance ) {

    var te = this.object.matrix.elements;

    // get X column of matrix
    panOffset.set( te[ 0 ], te[ 1 ], te[ 2 ] );
    panOffset.multiplyScalar( - distance );
    
    pan.add( panOffset );

  };

  // pass in distance in world space to move up
  this.panUp = function ( distance ) {

    var te = this.object.matrix.elements;

    // get Y column of matrix
    panOffset.set( te[ 4 ], te[ 5 ], te[ 6 ] );
    panOffset.multiplyScalar( distance );
    
    pan.add( panOffset );

  };
  
  // pass in x,y of change desired in pixel space,
  // right and down are positive
  this.pan = function ( deltaX, deltaY ) {

    var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

    if ( scope.object.fov !== undefined ) {

      // perspective
      var position = scope.object.position;
      var offset = position.clone().sub( scope.target );
      var targetDistance = offset.length();

      // half of the fov is center to top of screen
      targetDistance *= Math.tan( ( scope.object.fov / 2 ) * Math.PI / 180.0 );

      // we actually don't use screenWidth, since perspective camera is fixed to screen height
      scope.panLeft( 2 * deltaX * targetDistance / element.clientHeight );
      scope.panUp( 2 * deltaY * targetDistance / element.clientHeight );

    } else if ( scope.object.top !== undefined ) {

      // orthographic
      scope.panLeft( deltaX * (scope.object.right - scope.object.left) / element.clientWidth );
      scope.panUp( deltaY * (scope.object.top - scope.object.bottom) / element.clientHeight );

    } else {

      // camera neither orthographic or perspective
      console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.' );

    }

  };

  this.dollyIn = function ( dollyScale ) {

    if ( dollyScale === undefined ) {

      dollyScale = getZoomScale();

    }

    scale /= dollyScale;

  };

  this.dollyOut = function ( dollyScale ) {

    if ( dollyScale === undefined ) {

      dollyScale = getZoomScale();

    }

    scale *= dollyScale;

  };

  this.update = function () {

    var position = this.object.position;

    offset.copy( position ).sub( this.target );

    // rotate offset to "y-axis-is-up" space
    offset.applyQuaternion( quat );

    // angle from z-axis around y-axis

    var theta = Math.atan2( offset.x, offset.z );

    // angle from y-axis

    var phi = Math.atan2( Math.sqrt( offset.x * offset.x + offset.z * offset.z ), offset.y );

    if ( this.autoRotate ) {

      this.rotateLeft( getAutoRotationAngle() );

    }

    theta += thetaDelta;
    phi += phiDelta;

    // restrict phi to be between desired limits
    phi = Math.max( this.minPolarAngle, Math.min( this.maxPolarAngle, phi ) );

    // restrict phi to be betwee EPS and PI-EPS
    phi = Math.max( EPS, Math.min( Math.PI - EPS, phi ) );

    var radius = offset.length() * scale;

    // restrict radius to be between desired limits
    radius = Math.max( this.minDistance, Math.min( this.maxDistance, radius ) );
    
    // move target to panned location
    this.target.add( pan );

    offset.x = radius * Math.sin( phi ) * Math.sin( theta );
    offset.y = radius * Math.cos( phi );
    offset.z = radius * Math.sin( phi ) * Math.cos( theta );

    // rotate offset back to "camera-up-vector-is-up" space
    offset.applyQuaternion( quatInverse );

    position.copy( this.target ).add( offset );

    this.object.lookAt( this.target );

    thetaDelta = 0;
    phiDelta = 0;
    scale = 1;
    pan.set( 0, 0, 0 );

    if ( lastPosition.distanceToSquared( this.object.position ) > EPS ) {

      this.dispatchEvent( changeEvent );

      lastPosition.copy( this.object.position );

    }

  };


  this.reset = function () {

    state = STATE.NONE;

    this.target.copy( this.target0 );
    this.object.position.copy( this.position0 );

    this.update();

  };

  function getAutoRotationAngle() {

    return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;

  }

  function getZoomScale() {

    return Math.pow( 0.95, scope.zoomSpeed );

  }

  function onMouseDown( event ) {

    if ( scope.enabled === false ) return;
    event.preventDefault();

    if ( event.button === 0 ) {
      if ( scope.noRotate === true ) return;

      state = STATE.ROTATE;

      rotateStart.set( event.clientX, event.clientY );

    } else if ( event.button === 1 ) {
      if ( scope.noZoom === true ) return;

      state = STATE.DOLLY;

      dollyStart.set( event.clientX, event.clientY );

    } else if ( event.button === 2 ) {
      if ( scope.noPan === true ) return;

      state = STATE.PAN;

      panStart.set( event.clientX, event.clientY );

    }

    scope.domElement.addEventListener( 'mousemove', onMouseMove, false );
    scope.domElement.addEventListener( 'mouseup', onMouseUp, false );
    scope.dispatchEvent( startEvent );

  }

  function onMouseMove( event ) {

    if ( scope.enabled === false ) return;

    event.preventDefault();

    var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

    if ( state === STATE.ROTATE ) {

      if ( scope.noRotate === true ) return;

      rotateEnd.set( event.clientX, event.clientY );
      rotateDelta.subVectors( rotateEnd, rotateStart );

      // rotating across whole screen goes 360 degrees around
      scope.rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );

      // rotating up and down along whole screen attempts to go 360, but limited to 180
      scope.rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed );

      rotateStart.copy( rotateEnd );

    } else if ( state === STATE.DOLLY ) {

      if ( scope.noZoom === true ) return;

      dollyEnd.set( event.clientX, event.clientY );
      dollyDelta.subVectors( dollyEnd, dollyStart );

      if ( dollyDelta.y > 0 ) {

        scope.dollyIn();

      } else {

        scope.dollyOut();

      }

      dollyStart.copy( dollyEnd );

    } else if ( state === STATE.PAN ) {

      if ( scope.noPan === true ) return;

      panEnd.set( event.clientX, event.clientY );
      panDelta.subVectors( panEnd, panStart );
      
      scope.pan( panDelta.x, panDelta.y );

      panStart.copy( panEnd );

    }

    scope.update();

  }

  function onMouseUp( /* event */ ) {

    if ( scope.enabled === false ) return;

    scope.domElement.removeEventListener( 'mousemove', onMouseMove, false );
    scope.domElement.removeEventListener( 'mouseup', onMouseUp, false );
    scope.dispatchEvent( endEvent );
    state = STATE.NONE;

  }

  function onMouseWheel( event ) {

    if ( scope.enabled === false || scope.noZoom === true ) return;

    event.preventDefault();
    event.stopPropagation();

    var delta = 0;

    if ( event.wheelDelta !== undefined ) { // WebKit / Opera / Explorer 9

      delta = event.wheelDelta;

    } else if ( event.detail !== undefined ) { // Firefox

      delta = - event.detail;

    }

    if ( delta > 0 ) {

      scope.dollyOut();

    } else {

      scope.dollyIn();

    }

    scope.update();
    scope.dispatchEvent( startEvent );
    scope.dispatchEvent( endEvent );

  }

  function onKeyDown( event ) {

    if ( scope.enabled === false || scope.noKeys === true || scope.noPan === true ) return;
    
    switch ( event.keyCode ) {

      case scope.keys.UP:
        scope.pan( 0, scope.keyPanSpeed );
        scope.update();
        break;

      case scope.keys.BOTTOM:
        scope.pan( 0, - scope.keyPanSpeed );
        scope.update();
        break;

      case scope.keys.LEFT:
        scope.pan( scope.keyPanSpeed, 0 );
        scope.update();
        break;

      case scope.keys.RIGHT:
        scope.pan( - scope.keyPanSpeed, 0 );
        scope.update();
        break;

    }

  }

  function touchstart( event ) {

    if ( scope.enabled === false ) return;

    switch ( event.touches.length ) {

      case 1: // one-fingered touch: rotate

        if ( scope.noRotate === true ) return;

        state = STATE.TOUCH_ROTATE;

        rotateStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
        break;

      case 2: // two-fingered touch: dolly

        if ( scope.noZoom === true ) return;

        state = STATE.TOUCH_DOLLY;

        var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
        var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
        var distance = Math.sqrt( dx * dx + dy * dy );
        dollyStart.set( 0, distance );
        break;

      case 3: // three-fingered touch: pan

        if ( scope.noPan === true ) return;

        state = STATE.TOUCH_PAN;

        panStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
        break;

      default:

        state = STATE.NONE;

    }

    scope.dispatchEvent( startEvent );

  }

  function touchmove( event ) {

    if ( scope.enabled === false ) return;

    event.preventDefault();
    event.stopPropagation();

    var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

    switch ( event.touches.length ) {

      case 1: // one-fingered touch: rotate

        if ( scope.noRotate === true ) return;
        if ( state !== STATE.TOUCH_ROTATE ) return;

        rotateEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
        rotateDelta.subVectors( rotateEnd, rotateStart );

        // rotating across whole screen goes 360 degrees around
        scope.rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );
        // rotating up and down along whole screen attempts to go 360, but limited to 180
        scope.rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed );

        rotateStart.copy( rotateEnd );

        scope.update();
        break;

      case 2: // two-fingered touch: dolly

        if ( scope.noZoom === true ) return;
        if ( state !== STATE.TOUCH_DOLLY ) return;

        var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
        var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
        var distance = Math.sqrt( dx * dx + dy * dy );

        dollyEnd.set( 0, distance );
        dollyDelta.subVectors( dollyEnd, dollyStart );

        if ( dollyDelta.y > 0 ) {

          scope.dollyOut();

        } else {

          scope.dollyIn();

        }

        dollyStart.copy( dollyEnd );

        scope.update();
        break;

      case 3: // three-fingered touch: pan

        if ( scope.noPan === true ) return;
        if ( state !== STATE.TOUCH_PAN ) return;

        panEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
        panDelta.subVectors( panEnd, panStart );
        
        scope.pan( panDelta.x, panDelta.y );

        panStart.copy( panEnd );

        scope.update();
        break;

      default:

        state = STATE.NONE;

    }

  }

  function touchend( /* event */ ) {

    if ( scope.enabled === false ) return;

    scope.dispatchEvent( endEvent );
    state = STATE.NONE;

  }

  this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );
  this.domElement.addEventListener( 'mousedown', onMouseDown, false );
  this.domElement.addEventListener( 'mousewheel', onMouseWheel, false );
  this.domElement.addEventListener( 'DOMMouseScroll', onMouseWheel, false ); // firefox

  this.domElement.addEventListener( 'touchstart', touchstart, false );
  this.domElement.addEventListener( 'touchend', touchend, false );
  this.domElement.addEventListener( 'touchmove', touchmove, false );

  //window.addEventListener( 'keydown', onKeyDown, false );

  // force an update at start
  this.update();

};

THREE.OrbitControls.prototype = Object.create( THREE.EventDispatcher.prototype );