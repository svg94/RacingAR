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
  AxesHelper, Vector3
} from "three";

import {
  OrbitControls
} from "three/examples/jsm/controls/OrbitControls.js";
import nipplejs from 'nipplejs';

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
  );

  // vars
  let fwdValue = 0;
  let bkdValue = 0;
  let rgtValue = 0;
  let lftValue = 0;
  let tempVector = new Vector3();
  let upVector = new Vector3(0, 1, 0);
  let joyManager;

  // Add OrbitControls so that we can pan around with the mouse.
  var controls = new OrbitControls(camera, renderer.domElement);
  controls.maxDistance = 100;
  controls.minDistance = 100;
  //controls.maxPolarAngle = (Math.PI / 4) * 3;
  controls.maxPolarAngle = Math.PI/2 ;
  controls.minPolarAngle = 0;
  controls.autoRotate = false;
  controls.autoRotateSpeed = 0;
  controls.rotateSpeed = 0.4;
  controls.enableDamping = false;
  controls.dampingFactor = 0.1;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.minAzimuthAngle = - Math.PI/2; // radians
  controls.maxAzimuthAngle = Math.PI/4 // radians




  const planeMarker = createPlaneMarker();

  scene.add(planeMarker);

  // const UIButton = <HTMLButtonElement>document.getElementById('UIButton');
  // UIButton.onclick = () => {
  //   if (player.position.x + 0.025 < board.position.x + 0.5) { // 0.5 = (length of model/2 ) , 0.025 = length of Player/2 (because x-Coordinate is in the middle of the Object)
  //     player.position.set(player.position.x + speed, player.position.y, player.position.z)
  //   } else {
  //   }
  // };



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
      updatePlayer();
      renderer.render(scene, camera);
      controls.update();
    }
  }

  renderer.setAnimationLoop(renderLoop);


  const controller = renderer.xr.getController(0);
  scene.add(controller);

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

      setInterval(moveObstacles,1000);
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


    }
  }

  const ambientLight = new AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);

  //animate();
  addJoystick();

  function moveObstacles(){
    //ObjectPoolLogic
    if (isGameStarted) {
      let inactiveObjects = objectPool.filter(obj => !obj.visible);
      let activeObjects = objectPool.filter(obj => obj.visible);

      if (inactiveObjects.length > 0) {
        let randomElementNumber = randomIntFromInterval(0, inactiveObjects.length-1);

        let randomFactor = randomIntFromInterval(1, 20) * 5 / 100;
        // let ganzlinks = board.position.x - board.geometry.parameters.width / 2;
        // let ganzrechts = board.position.x + board.geometry.parameters.width / 2;
        // let fuenferStep = inactiveObjects[randomElementNumber].geometry.parameters.width / board.position.x + board.geometry.parameters.width / 2;
        // let spalten = [];
        // for(let i = ganzlinks; i < ganzrechts; i+fuenferStep){
        //   spalten.push(i);
        // }
        // let randomZahl = randomIntFromInterval(0, spalten.length-1);
        // let randomX = spalten[randomZahl];
        let randomX = (board.position.x-board.geometry.parameters.width/2) + ((board.position.x+board.geometry.parameters.width/2)*randomFactor)*2;
        // //let firstX = board.position.x + board.geometry.parameters.width / 2;
        // let firstY = board.position.y + board.geometry.parameters.height / 2;
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

  function updatePlayer(){
    // move the player
    const speed = 0.05;
    if (fwdValue > 0) {
      if (player.position.z - 0.025 > board.position.z - 0.5) {
        tempVector
            .set(0, 0, -fwdValue*speed)
            // .applyAxisAngle(upVector, angle)
        player.position.addScaledVector(
            tempVector,
            1
        )
      }
    }

    if (bkdValue > 0) {
      if (player.position.z + 0.025 < board.position.z + 0.5) {
        tempVector
            .set(0, 0, bkdValue*speed)
            // .applyAxisAngle(upVector, angle)
        player.position.addScaledVector(
            tempVector,
            1
        )
      }
    }

    if (lftValue > 0) {
      if(player.position.x - 0.025 > board.position.x - 0.5){
        tempVector
            .set(-lftValue*speed, 0, 0)
            // .applyAxisAngle(upVector, angle)
        player.position.addScaledVector(
            tempVector,
            1
        )
      }
    }

    if (rgtValue > 0) {
      console.log(rgtValue);
      if(player.position.x + 0.025 < board.position.x + 0.5){
        tempVector
            .set(rgtValue*speed, 0, 0)
            // .applyAxisAngle(upVector, angle)
        player.position.addScaledVector(
            tempVector,
            1
        )
      }
    }

    player.updateMatrixWorld()

    //controls.target.set( mesh.position.x, mesh.position.y, mesh.position.z );
    // reposition camera
    camera.position.sub(controls.target)
    controls.target.copy(player.position)
    camera.position.add(player.position)


  };

  //Renders the scene
  function animate() {

    updatePlayer();
    renderer.render( scene, camera );
    controls.update();

    requestAnimationFrame( animate );
  }

  function addJoystick(){
    const options = {
      zone: document.getElementById('joystickWrapper1'),
      size: 120,
      multitouch: true,
      maxNumberOfNipples: 2,
      mode: 'static',
      restJoystick: true,
      shape: 'circle',
      // position: { top: 20, left: 20 },
      position: { top: '120px', left: '60px' },
      dynamicPage: true,
    }


    // @ts-ignore
    joyManager = nipplejs.create(options);

    // @ts-ignore
    joyManager['0'].on('move', function (evt: any, data: { vector: { y: any; x: any; }; }) {
      const forward = data.vector.y
      const turn = data.vector.x

      if (forward > 0) {
        fwdValue = Math.abs(forward)
        bkdValue = 0
      } else if (forward < 0) {
        fwdValue = 0
        bkdValue = Math.abs(forward)
      }

      if (turn > 0) {
        lftValue = 0
        rgtValue = Math.abs(turn)
      } else if (turn < 0) {
        lftValue = Math.abs(turn)
        rgtValue = 0
      }
    })

    // @ts-ignore
    joyManager['0'].on('end', function (evt:any) {
      bkdValue = 0
      fwdValue = 0
      lftValue = 0
      rgtValue = 0
    })

  }
};
function randomIntFromInterval(min: number, max: number) { // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min)
}

