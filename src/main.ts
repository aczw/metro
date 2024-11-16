import GUI from "lil-gui";
import * as THREE from "three";
import "./style.css";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const gui = new GUI();
gui.add(document, "title");

const obj = {
  color: 0xff00ff,
};
const color = gui.addColor(obj, "color");

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshLambertMaterial({ color: color.getValue() });
const cube = new THREE.Mesh(geometry, material);

scene.add(cube);
camera.position.z = 5;

const light = new THREE.PointLight(0xffffff, 100);
light.position.set(5, 0, 5);
scene.add(light);

renderer.setAnimationLoop(() => {
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  cube.material.setValues({ color: color.getValue() });

  renderer.render(scene, camera);
});
