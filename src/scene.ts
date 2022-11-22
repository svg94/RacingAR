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
import {ARButton} from "three/examples/jsm/webxr/ARButton";
import * as Console from "console";

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

  const box2Geometry = new BoxBufferGeometry(0.05, 0.05, 0.05);
  const box2Material = new MeshBasicMaterial({ color: 0x00ff00 });
  const box2 = new Mesh(box2Geometry, box2Material);

  box.position.z = 0;

  let isBoardDisplayed = false;
  controller.addEventListener("select", onSelect);

  //Move Player Funktion

  let rightButton = true;
  let leftButton = false;
  let downButton = true;
  let upButton = false;
  let jumpButton = false;
  let crouchButton = false;

  let speed = 0.01;

  const model = box.clone();
  const player = box2.clone();

  async function onSelect() {
    if (planeMarker.visible && !isBoardDisplayed) {


      model.position.setFromMatrixPosition(planeMarker.matrix);
      player.position.set(model.position.x,model.position.y + 0.1, model.position.z);


      model.rotation.y = 0;
      model.visible = true;
      player.visible = true;

      scene.add(model);
      scene.add(player);
      isBoardDisplayed = true;
    }

    if (rightButton == true){
      if(player.position.x + 0.025 < model.position.x + 0.5){ // 0.5 = (length of model/2 ) , 0.025 = length of Player/2 (because x-Coordinate is in the middle of the Object)
        player.position.set(player.position.x + speed,player.position.y,player.position.z)
      }else{}
    }
    if (leftButton == true){
      if(player.position.x - 0.025 >  model.position.x - 0.5) {
        player.position.set(player.position.x - speed, player.position.y, player.position.z)
      }else{}
    }
    if (downButton == true){
      if(player.position.z + 0.025 < model.position.z + 0.5) { // 0.5 = (length of model/2 ) , 0.025 = length of Player/2 (because z-Coordinate is in the middle of the Object)
        player.position.set(player.position.x,player.position.y,player.position.z + speed)
      }else {}
    }
    if (upButton == true){
      if(player.position.z - 0.025 > model.position.z - 0.5) {
      player.position.set(player.position.x,player.position.y,player.position.z - speed)
      }else {}
    }
    if (jumpButton == true){
      player.position.set(player.position.x,player.position.y + 0.2,player.position.z)
      await new Promise(resolve => setTimeout(resolve, 2000));
      player.position.set(player.position.x,player.position.y - 0.2,player.position.z)

      /*let i = 0.01;
      let startPosition = player.position.y;
      while (player.position.y < player.position.y + 0.2){
        player.position.set(player.position.x,player.position.y + i,player.position.z)
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
      let d = 0.01;
      while (player.position.y > startPosition) {
        player.position.set(player.position.x, player.position.y - d, player.position.z)
      }*/
    }
    /*    if (crouchButton == true){
            player.position.set(player.position.x,player.position.y - speed/2,player.position.z)
          }
     */

  }

  const ambientLight = new AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);
};
