import GUI from "lil-gui";
import Stats from "stats.js";
import * as THREE from "three";

import { Timer } from "three/addons/misc/Timer.js";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import "@fontsource-variable/inter";
import "@/src/style.css";

// Globals
const canvas = document.querySelector<HTMLCanvasElement>("#c")!;
const camera = new THREE.PerspectiveCamera(50, 2, 0.1, 100);
const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2;

let platformModel: THREE.Object3D;
let benchModel: THREE.Object3D;
let offset = 0;

const platformWidth = 10;
const activePlatforms: THREE.Object3D[] = [];

function setupGUI() {
  const controls = {
    speed: 0.04,
    intensity: 10,
    y: 6.5,
  };

  const gui = new GUI();
  const speed = gui.add(controls, "speed", 0.001, 0.1, 0.001);
  const intensity = gui.add(controls, "intensity", 1, 100);
  const y = gui.add(controls, "y", -50, 50, 1);

  return { speed, intensity, y };
}

function setupStats() {
  const stats = new Stats();
  stats.showPanel(0);
  document.body.appendChild(stats.dom);

  return stats;
}

// function printRendererInfo() {
//   console.log("Renderer memory:", renderer.info.memory);
//   console.log("Renderer render:", renderer.info.render);
//   console.log("Scene count:", scene.children.length);
// }

async function main() {
  const { speed, intensity, y } = setupGUI();
  const stats = setupStats();
  const timer = new Timer();

  const progressText = document.querySelector<HTMLParagraphElement>("#progress")!;
  const loadingScreen = document.querySelector<HTMLDivElement>("#loading")!;

  {
    const loader = new GLTFLoader();

    loader.manager.onProgress = (_, loaded, total) => {
      progressText.innerText = `${Math.round((loaded / total) * 100)}%`;
    };

    async function helper(url: string, callback: (data: GLTF) => void) {
      await loader
        .loadAsync(url)
        .then(callback)
        .catch((err) => console.error(`Error loading "${url}":`, err));
    }

    await helper("_models/platform_v2.glb", ({ scene: wrappers }) => {
      // Initial scene has a lot of wrappers for some reason
      platformModel = wrappers.children[0].children[0];

      // Fix some initial import transforms
      platformModel.rotation.y = Math.PI;

      // Traverse the scene to turn on shadows for all objects
      platformModel.traverse((obj) => {
        if (obj.castShadow !== undefined) {
          obj.receiveShadow = true;
          obj.castShadow = true;
        }
      });

      console.log("Platform:", platformModel);
    });

    await helper("_models/bench.glb", ({ scene: wrappers }) => {
      benchModel = wrappers.children[0].children[0];
      benchModel.position.set(-1.5, -1.75, 0);
      benchModel.rotation.y = Math.PI / 2;

      benchModel.traverse((obj) => {
        if (obj.castShadow !== undefined) {
          obj.receiveShadow = true;
          obj.castShadow = true;
        }
      });

      console.log("Bench:", benchModel);
    });
  }

  let benchCounter = 0;

  function addPlatform(z: number) {
    const platformCopy = platformModel.clone();
    platformCopy.position.z = z;

    if (benchCounter % 3 === 0) {
      let benchCopy = benchModel.clone();
      benchCopy.position.z = z;
      scene.add(benchCopy);

      if (Math.random() >= 0.3) {
        benchCopy = benchModel.clone();
        benchCopy.position.z = z + 5.25;
        scene.add(benchCopy);
      }
    }

    benchCounter += 1;
    scene.add(platformCopy);
    activePlatforms.push(platformCopy);
  }

  {
    // Initial scene has five platforms visible, offset -20 and +20 around origin
    for (let i = -2; i <= 2; ++i) addPlatform(i * 10);

    // Manually update offset this time
    offset = 30;
    console.log("Initialized scene with:", activePlatforms);
  }

  const controls = new OrbitControls(camera, renderer.domElement);
  camera.position.y = 7;
  camera.rotation.y = -Math.PI / 2;
  camera.position.x = -18;
  // controls.update();

  // Setup lights
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.15);
  dirLight.position.copy(camera.position);
  dirLight.target.position.set(0, camera.position.y, camera.position.z);
  dirLight.castShadow = true;
  scene.add(dirLight);
  scene.add(dirLight.target);

  const lightCam = dirLight.shadow.camera;
  lightCam.left = -25;
  lightCam.right = 25;
  lightCam.bottom = -10;
  lightCam.top = 10;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambientLight);

  let addElapsed = 0;
  let rmElapsed = 0;

  function render(time: number) {
    timer.update(time);
    addElapsed += timer.getDelta();
    rmElapsed += timer.getDelta();

    if (addElapsed >= 1.5 && platformModel) {
      addPlatform(offset);
      offset += platformWidth;
      addElapsed = 0;
    }

    if (rmElapsed >= 3) {
      const model = activePlatforms.shift()!;
      scene.remove(model);
      rmElapsed = 0;
    }

    camera.position.z += speed.getValue();
    dirLight.position.z = camera.position.z;
    dirLight.target.position.z = camera.position.z;

    // Check if we need to resize renderer to new display size
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;

    if (needResize) {
      renderer.setSize(width, height, false);
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop((time) => {
    stats.begin();
    render(time);
    stats.end();
  });

  progressText.innerText = "100%";
  loadingScreen.classList.add("fade");
  loadingScreen.addEventListener("transitionend", () => {
    loadingScreen.remove();
  });
}

main();
