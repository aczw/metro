import GUI from "lil-gui";
import Stats from "stats.js";
import * as THREE from "three";

import "@/src/style.css";
import { Timer } from "three/addons/misc/Timer.js";

// Globals
const canvas = document.querySelector<HTMLCanvasElement>("#c")!;
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
const camera = new THREE.PerspectiveCamera(50, 2, 0.1, 100);
const scene = new THREE.Scene();

const platforms: THREE.Mesh[] = [];
const platformWidth = 2;
let offset = 0;
let elapsed = 0;

function setupGUI() {
  const controls = {
    color: 0xff00ff,
    speed: 0.01,
  };

  const gui = new GUI();
  const color = gui.addColor(controls, "color");
  const speed = gui.add(controls, "speed", 0.001, 0.1, 0.001);

  return { color, speed };
}

function setupStats() {
  const stats = new Stats();
  stats.showPanel(0);
  document.body.appendChild(stats.dom);

  return stats;
}

function main() {
  const stats = setupStats();
  const timer = new Timer();

  const geometry = new THREE.BoxGeometry(platformWidth, 1, 1);

  function initScene() {
    camera.position.z = 8;
    camera.position.y = 2;

    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(-1, 2, 4);
    scene.add(light);

    // Positioned at origin, offset remains 0
    const mat1 = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    const cube1 = new THREE.Mesh(geometry, mat1);
    scene.add(cube1);

    // Offset by geometry width
    offset += platformWidth;

    // Second platform, so begin using offset to translate
    const mat2 = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    const cube2 = new THREE.Mesh(geometry, mat2);
    cube2.translateX(offset);
    scene.add(cube2);

    offset += platformWidth;

    platforms.push(cube1, cube2);
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

    if (elapsed > 3) {
      const newMat = new THREE.MeshLambertMaterial({
        color: new THREE.Color(Math.random(), Math.random(), Math.random()),
      });
      const newCube = new THREE.Mesh(geometry, newMat);
      newCube.translateX(offset);

      platforms.push(newCube);
      scene.add(newCube);
      offset += platformWidth;

      console.log("added new cube, reset at", timer.getElapsed());
      elapsed = 0;
    }

    camera.position.x += 0.005;

    resizeRendererToDisplaySize();

    renderer.render(scene, camera);
  }

  initScene();

  renderer.setAnimationLoop((time) => {
    stats.begin();
    render(time);
    stats.end();
  });
}

main();
