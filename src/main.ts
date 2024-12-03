import GUI from "lil-gui";
import * as THREE from "three";

import "@/src/style.css";

// Globals
const canvas = document.querySelector<HTMLCanvasElement>("#c")!;
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
const camera = new THREE.PerspectiveCamera(50, 2, 0.1, 100);
const scene = new THREE.Scene();

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

function main() {
  const { color, speed } = setupGUI();

  camera.position.z = 5;

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshLambertMaterial({ color: color.getValue() });
  const cube = new THREE.Mesh(geometry, material);

  scene.add(cube);

  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(-1, 2, 4);

  scene.add(light);

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
    time *= 0.001;
    console.log("time:", time);

    cube.rotation.x += speed.getValue();
    cube.rotation.y += speed.getValue();
    cube.material.setValues({ color: color.getValue() });

    resizeRendererToDisplaySize();

    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(render);
}

main();
