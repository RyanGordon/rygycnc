$(document).on('ready', function() {
  $('#rightbody').append(createScene());
  renderScene();
});

var scene, renderer, camera;

var SCENE_WIDTH = 500;
var SCENE_HEIGHT = 400;

var setSceneSize = (function() {
  var newwidth = Math.round($(window).width()*0.50);
  var heightratio;
  if ($(window).height() <= 450) {
    heightratio = 0.65;
  } else if ($(window).height() <= 500) {
    heightratio = 0.675;
  } else if ($(window).height() <= 550) {
    heightratio = 0.68;
  } else if ($(window).height() > 810) {
    heightratio = 0.73;
  } else if ($(window).height() > 700) {
    heightratio = 0.72;
  } else if ($(window).height() > 650) {
    heightratio = 0.71;
  } else if ($(window).height() > 600) {
    heightratio = 0.695;
  } else {
    heightratio = 0.70;
  }
  var newheight = Math.round($(window).height()*heightratio);

  if (newheight !== SCENE_HEIGHT || newwidth !== SCENE_WIDTH) {
    SCENE_HEIGHT = newheight;
    SCENE_WIDTH = newwidth;
    renderer.setSize(SCENE_WIDTH, SCENE_HEIGHT);
    camera.aspect = SCENE_WIDTH / SCENE_HEIGHT;
    camera.updateProjectionMatrix();
    console.log($(window).width(), newwidth, $(window).height(), heightratio, newheight);
  }
});

function createScene() {

  // set some camera attributes
  var VIEW_ANGLE = 45, ASPECT = SCENE_WIDTH / SCENE_HEIGHT, NEAR = 0.1, FAR = 10000;

  // create a WebGL renderer, camera and a scene
  renderer = new THREE.WebGLRenderer();
  camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
  scene = new THREE.Scene();
  scene.add(camera);

  // the camera starts at 0,0,0
  // so pull it back
  camera.position.z = 300;

  // start the renderer
  setSceneSize();

  // attach the render-supplied DOM element
  return renderer.domElement;
}

function renderScene() {

  $(window).resize(setSceneSize);

  // create a point light
  var pointLight = new THREE.PointLight(0xFFFFFF);

  // set its position
  pointLight.position.x = 10;
  pointLight.position.y = 50;
  pointLight.position.z = 130;

  // add to the scene
  scene.add(pointLight);

  // create the sphere's material
  var sphereMaterial = new THREE.MeshLambertMaterial({ color: 0xCC0000 });

  // set up the sphere vars
  var radius = 50, segments = 16, rings = 16;

  // create a new mesh with
  // sphere geometry - we will cover
  // the sphereMaterial next!
  var sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, segments, rings), sphereMaterial);

  // add the sphere to the scene
  scene.add(sphere);

  renderer.render(scene, camera);
  //render();
}

function render() {
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}