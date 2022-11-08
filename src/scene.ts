import { createPlaneMarker } from "./objects/PlaneMarker";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { handleXRHitTest } from "./utils/hitTest";

import {
  AmbientLight,
  BoxBufferGeometry,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  XRFrame,
} from "three";

export function createScene(renderer: WebGLRenderer) {
  const scene = new Scene()

  const camera = new PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.02,
      20,
  )

  const planeMarker = createPlaneMarker();

  scene.add(planeMarker);

  const renderLoop = (timestamp: number, frame?: XRFrame) => {
    if (renderer.xr.isPresenting) {

      if (frame) {
        handleXRHitTest(renderer, frame, (hitPoseTransformed: Float32Array) => {
          if (hitPoseTransformed) {
            planeMarker.visible = true;
            planeMarker.matrix.fromArray(hitPoseTransformed);
          }
        }, () => {
          planeMarker.visible = false;
        })
      }
      renderer.render(scene, camera);
    }
  }

  renderer.setAnimationLoop(renderLoop);
  let koalaModel: Object3D;

  const gltfLoader = new GLTFLoader();

  gltfLoader.load("../assets/models/koala.glb", (gltf: GLTF) => {
    koalaModel = gltf.scene.children[0];
  });

  const controller = renderer.xr.getController(0);
  scene.add(controller);

  const boxGeometry = new BoxBufferGeometry(1, 0.1, 1);
  const boxMaterial = new MeshBasicMaterial({ color: 0xffffff });
  const box = new Mesh(boxGeometry, boxMaterial);

  const box2Geometry = new BoxBufferGeometry(0.2, 0.05, 0.2);
  const box2Material = new MeshBasicMaterial({ color: 0x00ff00 });
  const box2 = new Mesh(boxGeometry, boxMaterial);

  box.position.z = 0;

  let isBoardDisplayed = false;
  controller.addEventListener("select", onSelect);

  function onSelect() {
    if (planeMarker.visible && !isBoardDisplayed) {
      const model = box.clone();
      const player = box2.clone();

      model.position.setFromMatrixPosition(planeMarker.matrix);
      player.position.set(model.position.x,model.position.y,0.5);

      model.rotation.y = 0;
      model.visible = true;
      player.visible = true;

      scene.add(model);
      scene.add(player);
      isBoardDisplayed = true;
    }
  }
  const ambientLight = new AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);
};
