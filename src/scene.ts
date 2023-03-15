import { createPlaneMarker } from "./objects/PlaneMarker";
import { handleXRHitTest } from "./utils/hitTest";
import {mysocket} from './utils/socket';


import {
  AmbientLight,
  BoxBufferGeometry,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  XRFrame,
  AxesHelper, Vector3, Box3
} from "three";
import {
  OrbitControls
} from "three/examples/jsm/controls/OrbitControls.js";
import nipplejs from 'nipplejs';

import {Obstacle} from "./interfaces/IObstacle";
import {
  addGameOverScreenLoser,
  addGameOverScreenWinner,
  displayHomescreenUI,
  removeHomescreenUI
} from "./utils/domUtils";
//import {removeHomescreenUI} from "./utils/domUtils";
//export let UILever = "Homescreen";

export function createScene(renderer: WebGLRenderer) {

  //UILever = "Game";
  const scene = new Scene()
  let isGameStarted = false;
  let LostGame = false;

  //object pool for obstaclesMesh
  const NUMBERS_OF_OBSTACLES = 40;
  let objectPool: Obstacle[] = [];
  //let objectBBPool: any[] = [];
  for(let i=0; i < NUMBERS_OF_OBSTACLES; i++){
    const obstacleGeometry = new BoxBufferGeometry(0.05, 0.05, 0.05);
    const obstacleMaterial = new MeshBasicMaterial({ color: 0xff0000 });
    const obstacleMesh = new Mesh(obstacleGeometry, obstacleMaterial);
    const obstacleBB = new Box3(new Vector3(), new Vector3());
    obstacleBB.setFromObject(obstacleMesh);
    //const obstacle = new ObstacleClass(obstacleMesh,obstacleBB);

    obstacleMesh.rotation.y = 0;

    obstacleMesh.visible = false;
    scene.add(obstacleMesh);
    //console.log(obstacleMesh);
    //console.log(obstacleBB);
    objectPool.push({
      obstacleMesh: obstacleMesh,
      obstacleBB: obstacleBB
    })
    //objectBBPool.push(obstacleBB)
  }

  //Variabel für Mögliche X Positions der Hindernisse
  let possibleObstacleXPosition :any = [];

  //Board
  const boardGeometry = new BoxBufferGeometry(1, 0.1, 1);
  const boardMaterial = new MeshBasicMaterial({ color: 0xffffff });
  const board = new Mesh(boardGeometry, boardMaterial);

  //Player
  const playerGeometry = new BoxBufferGeometry(0.05, 0.05, 0.05);
  const playerMaterial = new MeshBasicMaterial({ color: 0x00ff00 });
  const player = new Mesh(playerGeometry, playerMaterial);
  // @ts-ignore
  let playerName: string;
  // @ts-ignore
  let lobbyName;

  console.log("Hallo Test");
  //BoundingBox of player
  const playerBB = new Box3(new Vector3(), new Vector3()); //ein Vector for min and one for max
  playerBB.setFromObject(player);
  //console.log(playerBB);

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


  let enemyPlayers: any[] = [];
  //Socket Connection
  //@ts-ignore
  //let socket = io("https://192.168.178.49:3001/",{ // Bojan IP

  // @ts-ignore
  document.getElementById('NewGamecodeButton').addEventListener('click',initiateSocketConnection);
  let connectedSocket = false;
  function initiateSocketConnection(){
    connectedSocket = true;

    // // @ts-ignore
    // playerName = document.getElementById('playerName').innerText;
    // // @ts-ignore
    // lobbyName = document.getElementById('lobbyName').innerText;
    playerName = "Player"+Math.floor(Math.random() * 100);
    lobbyName = "Lobby123"
    // Frag nach allen Spielern, die schon da sind
    mysocket.emit("joined");

    // Sag, dass ich joine
    mysocket.emit("join",{"name":playerName,"lobbyID":lobbyName});

    // Gib alle, die schon in der Lobby sind
    mysocket.on("joined",(enemies: any[])=>{
      console.log("EVENT JOINED", enemies);
      enemies.forEach((enemy: any)=>{
        if(enemy.name === playerName){
          console.log("Eigener Player");
          return;
        }
        //Create Enemy
        const enemyGeometry = new BoxBufferGeometry(0.05, 0.05, 0.05);
        const enemyMaterial = new MeshBasicMaterial({ color: 0xffa500 });
        const enemyObject = new Mesh(enemyGeometry, enemyMaterial);

        enemyObject.rotation.y = 0;
        enemyObject.visible = true;
        scene.add(enemyObject);

        const pos= board.position;
        enemyObject.position.set(pos.x,pos.y+(board.geometry.parameters.height/2),pos.z);

        enemy.enemyObject = enemyObject
        enemyPlayers.push(enemy);
      })
    });

    // Gib jeden, der grad joined
    mysocket.on("join",(enemy: any)=>{
      if(enemy.name === playerName){
        return;
      }
      console.log("EVENT JOIN", enemy);
      //Create Enemy
      const enemyGeometry = new BoxBufferGeometry(0.05, 0.05, 0.05);
      const enemyMaterial = new MeshBasicMaterial({ color: 0xffa500 });
      const enemyObject = new Mesh(enemyGeometry, enemyMaterial);

      enemyObject.rotation.y = 0;
      enemyObject.visible = true;
      scene.add(enemyObject);

      const pos= board.position;
      enemyObject.position.set(pos.x,pos.y+(board.geometry.parameters.height/2),pos.z);

      enemy.enemyObject = enemyObject
      enemyPlayers.push(enemy);
    });
    // Lösch jeden, der grad disconnected
    mysocket.on("disconnectedPlayer",(enemyData: any )=>{
      enemyPlayers = enemyPlayers.filter(enemy => enemy.socketId !== enemyData.id);
    });

    mysocket.on("updatedPlayers",(enemyData: any)=>{
      enemyPlayers = enemyPlayers.filter(enemy => enemy.socketId !== enemyData.id);
    });

    // socket.on('init', handleInit);
    // socket.on('gameState', handleGameState);
    // socket.on('gameOver', handleGameOver);
    // socket.on('gameCode', handleGameCode);
    // socket.on('unknownCode', handleUnknownCode);
    // socket.on('tooManyPlayers', handleTooManyPlayers);
  }



  const planeMarker = createPlaneMarker();

  scene.add(planeMarker);

  const renderLoop = (timestamp: number, frame?: XRFrame) => {
    if (renderer.xr.isPresenting) {
      removeHomescreenUI();
      //console.log('AR-Modus');
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
      checkCollision();
      renderer.render(scene, camera);
      controls.update();
    }else{

    }
  }

  renderer.setAnimationLoop(renderLoop);

  /*/End AR-Mode
  let session = renderer.xr.getSession();

  async function shutdownXR(session: { end: () => any; }) {
    if (session) {
      await session.end();

      // At this point, WebXR is fully shut down
    }
  }*/



  const controller = renderer.xr.getController(0);
  scene.add(controller);

  var axes = new AxesHelper(50);
  scene.add( axes );


  let isBoardDisplayed = false;
  controller.addEventListener("select", onSelect);


  let speed = 0.01;

  async function onSelect() {
    if (planeMarker.visible && !isBoardDisplayed) {

      board.position.setFromMatrixPosition(planeMarker.matrix);
      const pos= board.position;
      player.position.set(pos.x,pos.y+(board.geometry.parameters.height/2),pos.z);

      // model.position.setFromMatrixPosition(planeMarker.matrix);
      // player.position.set(model.position.x,model.position.y,0.5);

      //console.log(board.position);
      //console.log(player.position);

      board.rotation.y = 0;
      player.rotation.y = 0;

      board.visible = true;
      player.visible = true;
      planeMarker.visible = false;
      isBoardDisplayed = true;
      if(isBoardDisplayed == true) {
        scene.remove(planeMarker);
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

      //Bestimmt die möglichen X-Koordinaten für die Hindernisse

      let loopX = (board.position.x-board.geometry.parameters.width/2);
      while (loopX < (board.position.x-board.geometry.parameters.width/2)+1){ //1 für die Länge des Spielbretts
        possibleObstacleXPosition.push(loopX);
        loopX = loopX + 0.05; // 0.05 für die Breite der Hindernisse
      }

      isBoardDisplayed = true;
      isGameStarted = true;

      setInterval(moveObstacles,1000);
    }

      /*    if (crouchButton == true){
              player.position.set(player.position.x,player.position.y - speed/2,player.position.z)
            }
       */

  }

  const ambientLight = new AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);

  //animate();
  addJoystick();


  function moveObstacles(){
    //ObjectPoolLogic
    if (isGameStarted) {
      let inactiveObjects = objectPool.filter(obj => !obj.obstacleMesh.visible);
      let activeObjects = objectPool.filter(obj => obj.obstacleMesh.visible);


      if (inactiveObjects.length > 0) {
        let randomElementNumber = randomIntFromInterval(0, inactiveObjects.length-1);
        let firstZ = board.position.z - board.geometry.parameters.depth / 2;

        inactiveObjects[randomElementNumber].obstacleMesh.position.set(possibleObstacleXPosition[Math.floor(Math.random()*possibleObstacleXPosition.length)], board.position.y + (board.geometry.parameters.height / 2), firstZ);

        inactiveObjects[randomElementNumber].obstacleMesh.visible = true;

      }
      if (activeObjects.length > 0) {
        //let i = 0;
        activeObjects.forEach(obj => {
          let pos = obj.obstacleMesh.position;
          obj.obstacleMesh.position.set(pos.x, pos.y, pos.z + (speed * 10));

          //Update BoundingBox of Obstacle
          //console.log(obj);

          //objectBBPool.at(i).copy( obj.geometry.boundingBox).applyMatrix4(obj.matrixWorld);
          //console.log(objectBBPool.at(i));

          //Check for Collision

          /*if(objectBBPool.at(i).intersectsBox(playerBB)){ //obstacle.obstacleBB
            console.log(obj);
          }else{}
          i++;*/


          if (!(pos.z + 0.025 < board.position.z + 0.5)) {
            obj.obstacleMesh.visible = false;
          }
        });
      }

    }
  }

  function updatePlayer(){
    // move the player
    const speed = 0.05;
    if ((fwdValue > 0) && (player.position.z - 0.025 > board.position.z - 0.5)) {
      tempVector
          .set(0, 0, -fwdValue*speed)
      player.position.addScaledVector(
          tempVector,
          1
      )
    }

    if ((bkdValue > 0) && (player.position.z + 0.025 < board.position.z + 0.5)) {
      tempVector
          .set(0, 0, bkdValue * speed)
      player.position.addScaledVector(
          tempVector,
          1
      )
    }

    if ((lftValue > 0) && (player.position.x - 0.025 > board.position.x - 0.5)) {
      tempVector
          .set(-lftValue * speed, 0, 0)
      player.position.addScaledVector(
          tempVector,
          1
      )
    }

    if ((rgtValue > 0) && (player.position.x + 0.025 < board.position.x + 0.5)) {
      tempVector
          .set(rgtValue * speed, 0, 0)
      player.position.addScaledVector(
          tempVector,
          1
      )
    }

    player.updateMatrixWorld()
    mysocket.emit('updatedPlayers')

    //Update BoundingBox of Player
    if (player.geometry.boundingBox instanceof Box3) {
      playerBB.copy(player.geometry.boundingBox).applyMatrix4(player.matrixWorld);
    }

    //controls.target.set( mesh.position.x, mesh.position.y, mesh.position.z );
    // reposition camera
    camera.position.sub(controls.target)
    controls.target.copy(player.position)
    camera.position.add(player.position)


  };

  function checkCollision(){
    //Check for Collision
    let activeObjects = objectPool.filter(obj => obj.obstacleMesh.visible);
    // let i = 0;
    activeObjects.forEach(obj => {
      //Update BoundingBox of Obstacle
      if (obj.obstacleMesh.geometry.boundingBox instanceof Box3) {
        obj.obstacleBB.copy(obj.obstacleMesh.geometry.boundingBox).applyMatrix4(obj.obstacleMesh.matrixWorld);
      }
      // objectBBPool.at(i).copy( obj.geometry.boundingBox).applyMatrix4(obj.matrixWorld);

      //Check for Collision
      if(obj.obstacleBB.intersectsBox(playerBB)){ //obstacle.obstacleBB
        isGameStarted = false;
        LostGame = true;
        //addGameOverScreenLoser();
        addGameOverScreenWinner();
      }else{
        if(isGameStarted == false){
          if(LostGame == true){
            //addGameOverScreenLoser();
            addGameOverScreenWinner();
          }else{
            addGameOverScreenWinner();
          }
        }
      }
      // i++;
    });
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

