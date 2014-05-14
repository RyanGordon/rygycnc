$(document).on('ready', function() {
  $('#rightbody').append(createScene());
  renderScene();
});

var scene, renderer, camera;

var INITIAL_WIDTH = 400;
var INITIAL_HEIGHT = 340;

function createScene() {

  // set some camera attributes
  var VIEW_ANGLE = 45, ASPECT = INITIAL_WIDTH / INITIAL_HEIGHT, NEAR = 0.1, FAR = 10000;

  // create a WebGL renderer, camera and a scene
  renderer = new THREE.WebGLRenderer();
  camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
  scene = new THREE.Scene();
  scene.add(camera);

  // the camera starts at 0,0,0
  // so pull it back
  camera.position.z = 300;

  // start the renderer
  renderer.setSize(INITIAL_WIDTH, INITIAL_HEIGHT);

  // attach the render-supplied DOM element
  return renderer.domElement;
}

function renderScene() {

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
}