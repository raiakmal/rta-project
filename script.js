// Setup Scene, Camera, and Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 10);
scene.add(directionalLight);

// Camera Position and Controls
camera.position.set(5, 5, 10);
camera.lookAt(0, 0, 0);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 2;
controls.maxDistance = 20;

// Drag Controls
let dragControls;
const draggableObjects = [];

// Load Asset Function
function loadAsset(assetName) {
  const loader = new THREE.GLTFLoader();
  const assetPath = `./assets/${assetName}.glb`; // Path based on asset name

  loader.load(
    assetPath,
    function (gltf) {
      const model = gltf.scene;
      model.scale.set(1, 1, 1); // Adjust scale as needed
      model.position.set(Math.random() * 4 - 2, 0, Math.random() * 4 - 2); // Set random position

      // Add draggable property
      model.userData.draggable = true;
      scene.add(model);
      draggableObjects.push(model);

      // Reinitialize drag controls with updated objects
      if (dragControls) {
        dragControls.dispose(); // Clean up previous controls
      }
      dragControls = new THREE.DragControls(draggableObjects, camera, renderer.domElement);

      dragControls.addEventListener('dragstart', function (event) {
        controls.enabled = false; // Disable OrbitControls while dragging
      });
      dragControls.addEventListener('dragend', function (event) {
        controls.enabled = true; // Re-enable OrbitControls
      });
    },
    undefined,
    function (error) {
      console.error('Error loading model:', error);
    }
  );
}

// Attach Event Listeners for Asset Buttons
document.getElementById('addWall').addEventListener('click', () => loadAsset('wall'));
document.getElementById('addFloor').addEventListener('click', () => loadAsset('floor'));
document.getElementById('addRoof').addEventListener('click', () => loadAsset('roof'));

// Fitur hapus asset
document.getElementById('removeSelected').addEventListener('click', () => {
  const selectedObjects = dragControls.getObjects(); // Mendapatkan objek yang dipilih
  if (selectedObjects.length > 0) {
    selectedObjects.forEach((object) => {
      scene.remove(object); // Hapus dari scene
      const index = draggableObjects.indexOf(object);
      if (index > -1) {
        draggableObjects.splice(index, 1); // Hapus dari daftar draggableObjects
      }
    });
    // Reinitialize drag controls after removing objects
    dragControls.dispose();
    dragControls = new THREE.DragControls(draggableObjects, camera, renderer.domElement);
  }
});

// Render Loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Resize Handler
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
