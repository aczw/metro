import GUI from "lil-gui";
import Stats from "stats.js";
import * as THREE from "three";

import { Timer } from "three/addons/misc/Timer.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import "@/src/style.css";

// Globals
const canvas = document.querySelector<HTMLCanvasElement>("#c")!;
const camera = new THREE.PerspectiveCamera(50, 2, 0.1, 100);
const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.NeutralToneMapping;

let platform: THREE.Object3D;
const platformWidth = 10;

const activePlatforms: THREE.Object3D[] = [];
let offset = 0;

function setupGUI() {
  const controls = {
    speed: 0.04,
  };

  const gui = new GUI();
  const speed = gui.add(controls, "speed", 0.001, 0.1, 0.001);

  return { speed };
}

function setupStats() {
  const stats = new Stats();
  stats.showPanel(0);
  document.body.appendChild(stats.dom);

  return stats;
}

function printRendererInfo() {
  console.log("Renderer memory:", renderer.info.memory);
  console.log("Renderer render:", renderer.info.render);
  console.log("Scene count:", scene.children.length);
}

function main() {
  const { speed } = setupGUI();
  const stats = setupStats();
  const timer = new Timer();

  function loadPlatform() {
    const loader = new GLTFLoader();

    loader.load(
      "/_models/platform_v2.glb",

      ({ scene: wrappers }) => {
        // Initial scene has a lot of wrappers for some reason
        platform = wrappers.children[0].children[0];

        // Fix some initial import transforms
        platform.scale.set(1, 1, 1);
        platform.rotation.y = Math.PI;

        // Traverse the scene to turn on shadows for all objects
        platform.traverse((obj) => {
          if (obj.castShadow !== undefined) {
            obj.castShadow = true;
            obj.receiveShadow = true;
          }
        });

        console.log("Loaded platform:", platform);
        initScene();
      },

      undefined,

      (error) => {
        console.error("Error loading platform:", error);
      },
    );
  }

  function initScene() {
    let platformCopy: THREE.Object3D;

    for (let i = -2; i <= 2; ++i) {
      platformCopy = platform.clone();
      platformCopy.position.z = i * 10;

      activePlatforms.push(platformCopy);
      scene.add(platformCopy);
    }

    // Manually update offset this time
    offset = 30;
    console.log("Active platforms after initScene():", activePlatforms);
  }

  function resizeRendererToDisplaySize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;

    if (needResize) {
      renderer.setSize(width, height, false);
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }
  }

  let addElapsed = 0;
  let rmElapsed = 0;

  function render(time: number) {
    timer.update(time);
    addElapsed += timer.getDelta();
    rmElapsed += timer.getDelta();

    if (addElapsed >= 1.5 && platform) {
      const newPlatform = platform.clone();
      newPlatform.position.z = offset;

      activePlatforms.push(newPlatform);
      scene.add(newPlatform);

      offset += platformWidth;
      addElapsed = 0;
    }

    if (rmElapsed >= 3) {
      const oldPlatform = activePlatforms.shift()!;
      scene.remove(oldPlatform);
      rmElapsed = 0;
    }

    camera.position.z += speed.getValue();
    light.position.z = camera.position.z;
    light.target.position.z = camera.position.z;

    resizeRendererToDisplaySize();
    renderer.render(scene, camera);
  }

  loadPlatform();

  // const controls = new OrbitControls(camera, renderer.domElement);
  camera.position.y = 6.5;
  camera.rotation.y = -Math.PI / 2;
  camera.position.x = -18;
  // controls.update();

  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.copy(camera.position);
  light.target.position.set(0, camera.position.y, camera.position.z);
  light.castShadow = true;

  const lightCam = light.shadow.camera;
  lightCam.left = -25;
  lightCam.right = 25;
  lightCam.bottom = -10;
  lightCam.top = 10;

  scene.add(light);
  scene.add(light.target);

  renderer.setAnimationLoop((time) => {
    stats.begin();
    render(time);
    stats.end();
  });
}

main();
