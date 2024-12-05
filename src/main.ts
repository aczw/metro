import GUI from "lil-gui";
import Stats from "stats.js";
import * as THREE from "three";

import "@/src/style.css";
import { Timer } from "three/addons/misc/Timer.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// Globals
const canvas = document.querySelector<HTMLCanvasElement>("#c")!;
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
const camera = new THREE.PerspectiveCamera(50, 2, 0.1, 100);
const scene = new THREE.Scene();

let platform: THREE.Object3D;
const platformWidth = 10;

const activePlatforms: THREE.Object3D[] = [];
let offset = 0;
let elapsed = 0;

function setupGUI() {
  const controls = {
    speed: 0.02,
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

function main() {
  const { speed } = setupGUI();
  const stats = setupStats();
  const timer = new Timer();

  function loadPlatform() {
    const loader = new GLTFLoader();

    loader.load(
      "/_models/platform_v1.glb",

      ({ scene: wrappers }) => {
        // Initial scene has a lot of wrappers for some reason
        platform = wrappers.children[0].children[0];

        // Fix some initial import transforms
        platform.scale.set(1, 1, 1);
        platform.rotation.y = Math.PI;

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
    // Add two platform to the left, translate manually
    let platformCopy = platform.clone();
    platformCopy.position.z = -20;
    scene.add(platformCopy);
    activePlatforms.push(platformCopy);

    platformCopy = platform.clone();
    platformCopy.position.z = -10;
    scene.add(platformCopy);
    activePlatforms.push(platformCopy);

    // Positioned at origin, don't offset
    scene.add(platform);
    activePlatforms.push(platform);

    // Offset by geometry width, offset is 10 now
    offset += platformWidth;

    // Add a platform to the left by offset amount
    platformCopy = platform.clone();
    platformCopy.position.setZ(offset);
    scene.add(platformCopy);
    activePlatforms.push(platformCopy);

    // Offset by geometry width, offset is 20 now
    offset += platformWidth;

    platformCopy = platform.clone();
    platformCopy.position.setZ(offset);
    scene.add(platformCopy);
    activePlatforms.push(platformCopy);

    // Setup offset for next platform
    offset += platformWidth;

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

  function render(time: number) {
    timer.update(time);
    elapsed += timer.getDelta();

    if (elapsed >= 3) {
      const newPlatform = platform.clone();
      newPlatform.position.z = offset;

      activePlatforms.push(newPlatform);
      scene.add(newPlatform);

      offset += platformWidth;
      elapsed = 0;

      // console.log("Added new platform at time:", timer.getElapsed());
      // console.log("Renderer memory:", renderer.info.memory);
      // console.log("Renderer render:", renderer.info.render);
    }

    camera.position.z += speed.getValue();

    resizeRendererToDisplaySize();
    renderer.render(scene, camera);
  }

  loadPlatform();

  camera.position.y = 6.5;
  camera.rotation.y = -Math.PI / 2;
  camera.position.x = -18;

  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(-10, 5, 0);
  scene.add(light);

  renderer.setAnimationLoop((time) => {
    stats.begin();
    render(time);
    stats.end();
  });
}

main();
