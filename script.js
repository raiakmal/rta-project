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
let selectedObject = null;

// Raycaster and Mouse
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Load Asset Function
function loadAsset(assetName) {
  const loader = new THREE.GLTFLoader();
  const assetPath = `./assets/${assetName}.glb`;

  loader.load(
    assetPath,
    function (gltf) {
      const model = gltf.scene;
      model.scale.set(1, 1, 1);
      model.position.set(Math.random() * 4 - 2, 0, Math.random() * 4 - 2); // Set random position
      scene.add(model);

      // Add the model to the draggableObjects array
      draggableObjects.push(model);
      console.log('Model added to draggableObjects:', model);

      // Reinitialize drag controls with updated objects
      if (dragControls) {
        dragControls.dispose();
      }
      dragControls = new THREE.DragControls(draggableObjects, camera, renderer.domElement);

      // Disable OrbitControls when dragging
      dragControls.addEventListener('dragstart', function () {
        controls.enabled = false;
      });

      // Re-enable OrbitControls after dragging
      dragControls.addEventListener('dragend', function () {
        controls.enabled = true;
      });
    },
    undefined,
    function (error) {
      console.error('Error loading model:', error);
    }
  );
}

// Function to dispose of an object and its children completely
function disposeObject(object) {
  if (!object) return;

  // Traverse all children and dispose of geometry and material
  object.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose();
      console.log('Geometry disposed for:', child);
    }
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((material) => material.dispose());
      } else {
        child.material.dispose();
      }
      console.log('Material disposed for:', child);
    }
  });

  // Remove the object from the scene
  scene.remove(object);
  console.log('Object fully removed from the scene.');
}

// Event listener for selecting objects
window.addEventListener('click', (event) => {
  event.preventDefault();

  // Update mouse position
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Raycast to find intersected objects
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(draggableObjects, true);

  // Reset color of previously selected object if it exists
  if (selectedObject) {
    selectedObject.traverse((child) => {
      if (child.material && child.material.emissive) {
        child.material.emissive.setHex(child.currentHex);
      }
    });
    selectedObject = null;
  }

  // Check if any object was clicked
  if (intersects.length > 0) {
    // Select root object to ensure we're selecting the entire model
    selectedObject = intersects[0].object;
    while (selectedObject.parent && selectedObject.parent !== scene) {
      selectedObject = selectedObject.parent;
    }

    // Store and set highlight color for selected object
    selectedObject.traverse((child) => {
      if (child.material && child.material.emissive) {
        child.currentHex = child.material.emissive.getHex();
        child.material.emissive.setHex(0xff0000);
      }
    });
  }
});

// Event listener for removing the selected object
document.getElementById('removeSelected').addEventListener('click', () => {
  if (selectedObject) {
    console.log('Removing object:', selectedObject);

    // Reset color back to original if emissive exists
    if (selectedObject.material && selectedObject.material.emissive) {
      selectedObject.material.emissive.setHex(selectedObject.currentHex);
    }

    // Remove from draggable objects array
    const index = draggableObjects.indexOf(selectedObject);
    if (index > -1) {
      draggableObjects.splice(index, 1);
      console.log('Object removed from draggableObjects array.');
    } else {
      console.warn('Object not found in draggableObjects array:', selectedObject);
    }

    // Fully dispose of object and remove from scene
    disposeObject(selectedObject);

    // Clear selection
    selectedObject = null;

    // Update DragControls to reflect the removed object
    if (dragControls) {
      dragControls.dispose();
    }
    dragControls = new THREE.DragControls(draggableObjects, camera, renderer.domElement);
    console.log('DragControls updated.');
  } else {
    console.warn('No object selected for removal.');
  }
});

// Attach Event Listeners for Asset Buttons
document.getElementById('addWall').addEventListener('click', () => loadAsset('wall'));
document.getElementById('addWall2').addEventListener('click', () => loadAsset('wall2'));
document.getElementById('addWall3').addEventListener('click', () => loadAsset('wall3'));
document.getElementById('addFloor').addEventListener('click', () => loadAsset('floor'));
document.getElementById('addRoof').addEventListener('click', () => loadAsset('roof'));

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
