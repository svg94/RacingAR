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
    AxesHelper
} from "three";

export function createScene(renderer: WebGLRenderer) {
  const scene = new Scene()

  let isGameStarted = false;

  //object pool for obstacles
  const NUMBERS_OF_OBSTACLES = 40;
  let objectPool: any[] = [];
  for(let i=0; i < NUMBERS_OF_OBSTACLES; i++){
    const obstacleGeometry = new BoxBufferGeometry(0.05, 0.05, 0.05);
    const obstacleMaterial = new MeshBasicMaterial({ color: 0xff0000 });
    const obstacle = new Mesh(obstacleGeometry, obstacleMaterial);

    obstacle.rotation.y = 0;

    obstacle.visible = false;
    scene.add(obstacle);
    objectPool.push(obstacle)
  }

  //Board
  const boardGeometry = new BoxBufferGeometry(1, 0.1, 1);
  const boardMaterial = new MeshBasicMaterial({ color: 0xffffff });
  const board = new Mesh(boardGeometry, boardMaterial);

  //Player
  const playerGeometry = new BoxBufferGeometry(0.05, 0.05, 0.05);
  const playerMaterial = new MeshBasicMaterial({ color: 0x00ff00 });
  const player = new Mesh(playerGeometry, playerMaterial);

  board.visible = false;
  player.visible = false;
  scene.add(board);
  scene.add(player);

  const camera = new PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.02,
      20,
  )

  const planeMarker = createPlaneMarker();

  scene.add(planeMarker);

  //UIButtons + Move-Functions
  //Right Button + Move
  const UIButtonright = <HTMLButtonElement>document.getElementById('UIButtonright');
  UIButtonright.onclick = () => {
    if (player.position.x + 0.025 < board.position.x + 0.5) { // 0.5 = (length of model/2 ) , 0.025 = length of Player/2 (because x-Coordinate is in the middle of the Object)
      player.position.set(player.position.x + speed, player.position.y, player.position.z)
    } else {
    }
  };
  //Left Button + Move
  const UIButtonleft = <HTMLButtonElement>document.getElementById('UIButtonleft');
  UIButtonleft.onclick = () => {
    if (player.position.x - 0.025 > board.position.x - 0.5) {
      player.position.set(player.position.x - speed, player.position.y, player.position.z)
    } else {
    }
  };
  //Up Button + Move
  const UIButtonup = <HTMLButtonElement>document.getElementById('UIButtonup');
  UIButtonup.onclick = () => {
    if (player.position.z - 0.025 > board.position.z - 0.5) {
      player.position.set(player.position.x, player.position.y, player.position.z - speed)
    } else {
    }
  };
  //Down Button + Move
  const UIButtondown = <HTMLButtonElement>document.getElementById('UIButtondown');
  UIButtondown.onclick = () => {
    if (player.position.z + 0.025 < board.position.z + 0.5) { // 0.5 = (length of model/2 ) , 0.025 = length of Player/2 (because z-Coordinate is in the middle of the Object)
      player.position.set(player.position.x, player.position.y, player.position.z + speed)
    } else {
    }
  };

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


// Add axes TODO check if that works
  var axes = new AxesHelper(50);
  scene.add( axes );


  let isBoardDisplayed = false;
  controller.addEventListener("select", onSelect);

  //Move Player Funktion

  let rightButton = false;
  let leftButton = false;
  let downButton = false;
  let upButton = false;
  let jumpButton = false;
  let crouchButton = false;

  let speed = 0.01;

  async function onSelect() {
    if (planeMarker.visible && !isBoardDisplayed) {

      board.position.setFromMatrixPosition(planeMarker.matrix);
      const pos= board.position;
      player.position.set(pos.x,pos.y+(board.geometry.parameters.height/2),pos.z);

      // model.position.setFromMatrixPosition(planeMarker.matrix);
      // player.position.set(model.position.x,model.position.y,0.5);

      console.log(board.position);
      console.log(player.position);

      board.rotation.y = 0;
      player.rotation.y = 0;

      board.visible = true;
      player.visible = true;
      planeMarker.visible = false;


      isBoardDisplayed = true;
      isGameStarted = true;
    }
    if(isBoardDisplayed) {
      planeMarker.visible = false;

      if (rightButton == true) {
        if (player.position.x + 0.025 < board.position.x + 0.5) { // 0.5 = (length of model/2 ) , 0.025 = length of Player/2 (because x-Coordinate is in the middle of the Object)
          player.position.set(player.position.x + speed, player.position.y, player.position.z)
        } else {
        }
      }
      if (leftButton == true) {
        if (player.position.x - 0.025 > board.position.x - 0.5) {
          player.position.set(player.position.x - speed, player.position.y, player.position.z)
        } else {
        }
      }
      if (downButton == true) {
        if (player.position.z + 0.025 < board.position.z + 0.5) { // 0.5 = (length of model/2 ) , 0.025 = length of Player/2 (because z-Coordinate is in the middle of the Object)
          player.position.set(player.position.x, player.position.y, player.position.z + speed)
        } else {
        }
      }
      if (upButton == true) {
        if (player.position.z - 0.025 > board.position.z - 0.5) {
          player.position.set(player.position.x, player.position.y, player.position.z - speed)
        } else {
        }
      }
      if (jumpButton == true) {
        player.position.set(player.position.x, player.position.y + 0.2, player.position.z)
        await new Promise(resolve => setTimeout(resolve, 2000));
        player.position.set(player.position.x, player.position.y - 0.2, player.position.z)

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

      //ObjectPoolLogic
      if (isGameStarted) {
        let inactiveObjects = objectPool.filter(obj => !obj.visible);
        let activeObjects = objectPool.filter(obj => obj.visible);

        if (inactiveObjects.length > 0) {
          let randomElementNumber = randomIntFromInterval(0, inactiveObjects.length);

          let randomFactor = randomIntFromInterval(1, 20) * 5 / 100;
          let randomX = (board.position.x - board.geometry.parameters.width / 2) + ((board.position.x + board.geometry.parameters.width / 2) * randomFactor) * 2;
          let firstX = board.position.x + board.geometry.parameters.width / 2;
          let firstY = board.position.y + board.geometry.parameters.height / 2;
          let firstZ = board.position.z - board.geometry.parameters.depth / 2;
          inactiveObjects[randomElementNumber].position.set(randomX, board.position.y + (board.geometry.parameters.height / 2), firstZ);

          inactiveObjects[randomElementNumber].visible = true;

          // inactiveObjects.forEach(obj=>{
          //   let randomFactor = randomIntFromInterval(1,20) * 5 / 100;
          //   let randomX = (board.position.x-board.geometry.parameters.width/2) + ((board.position.x+board.geometry.parameters.width/2)*randomFactor)*2;
          //   let firstX = board.position.x+board.geometry.parameters.width/2;
          //   let firstY = board.position.y+board.geometry.parameters.height/2;
          //   let firstZ = board.position.z-board.geometry.parameters.depth/2;
          //   obj.position.set(randomX,board.position.y+(board.geometry.parameters.height/2),firstZ);
          //
          //   obj.visible = true;
          // });
        }
        if (activeObjects.length > 0) {
          activeObjects.forEach(obj => {
            let pos = obj.position;
            obj.position.set(pos.x, pos.y, pos.z + (speed * 10));
            if (!(pos.z + 0.025 < board.position.z + 0.5)) {
              obj.visible = false;
            }
          });
        }
      }
    }
  }

  const ambientLight = new AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);
};
function randomIntFromInterval(min: number, max: number) { // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min)
}