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
  AxesHelper, Vector3, Box3, Event, Object3D
} from "three";
import {
  OrbitControls
} from "three/examples/jsm/controls/OrbitControls.js";
import nipplejs from 'nipplejs';

import {Obstacle} from "./interfaces/IObstacle";
import {
  addGameOverScreenLoser,
  addGameOverScreenWinner,
  displayHomescreenUI, displayWaitingScreenUIP1, displayWaitingScreenUIP2,
  removeHomescreenUI
} from "./utils/domUtils";
//import {removeHomescreenUI} from "./utils/domUtils";
//export let UILever = "Homescreen";

export function createScene(renderer: WebGLRenderer) {

  const scene = new Scene()
  let isGameStarted = false;
  let LostGame = false;

  //object pool for obstaclesMesh
  const NUMBERS_OF_OBSTACLES = 40;
  let objectPool: Obstacle[] = [];

  for (let i = 0; i < NUMBERS_OF_OBSTACLES; i++) {
    const obstacleGeometry = new BoxBufferGeometry(0.05, 0.05, 0.05);
    const obstacleMaterial = new MeshBasicMaterial({color: 0xff0000});
    const obstacleMesh = new Mesh(obstacleGeometry, obstacleMaterial);
    obstacleMesh.position.set(-100,-100,-100);
    const obstacleBB = new Box3(new Vector3(), new Vector3());
    obstacleBB.setFromObject(obstacleMesh);

    obstacleMesh.rotation.y = 0;

    obstacleMesh.visible = false;
    scene.add(obstacleMesh);

    objectPool.push({
      obstacleMesh: obstacleMesh,
      obstacleBB: obstacleBB,
      id: i
    })
  }

  //Variabel für Mögliche X Positions der Hindernisse
  let possibleObstacleXPosition: any = [];
  let possibleObstacleZPosition: any = [];

  //Board
  const boardGeometry = new BoxBufferGeometry(1, 0.1, 1);
  const boardMaterial = new MeshBasicMaterial({color: 0xffffff});
  const board = new Mesh(boardGeometry, boardMaterial);

  //Player
  const playerGeometry = new BoxBufferGeometry(0.05, 0.05, 0.05);
  const playerMaterial = new MeshBasicMaterial({color: 0x00ff00});
  const player = new Mesh(playerGeometry, playerMaterial);
  player.position.set(100,100,100);
  let playerNumber = 0;

  //Enemy
  const enemyGeometry = new BoxBufferGeometry(0.05, 0.05, 0.05);
  const enemyMaterial = new MeshBasicMaterial({color: 0xff8200});
  const enemy = new Mesh(enemyGeometry, enemyMaterial);
  enemy.position.set(100,100,100);

  // @ts-ignore
  let playerName: string;
  // @ts-ignore
  let lobbyName;

  //BoundingBox of player
  const playerBB = new Box3(new Vector3(), new Vector3()); //ein Vector for min and one for max
  playerBB.setFromObject(player);
  if(playerNumber === 2){
    //BoundingBox of player
    playerBB.setFromObject(enemy);
  }

  //console.log(playerBB);

  board.visible = false;
  player.visible = false;
  enemy.visible = false;
  scene.add(board);
  scene.add(player);
  scene.add(enemy);

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
  controls.maxPolarAngle = Math.PI / 2;
  controls.minPolarAngle = 0;
  controls.autoRotate = false;
  controls.autoRotateSpeed = 0;
  controls.rotateSpeed = 0.4;
  controls.enableDamping = false;
  controls.dampingFactor = 0.1;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.minAzimuthAngle = -Math.PI / 2; // radians
  controls.maxAzimuthAngle = Math.PI / 4 // radians


  //Ganzes Connection Zeug mit Socket.io

  mysocket.on("gameCode", handleGameCode);
  mysocket.on("unkownGame", handleUnknownGame);
  mysocket.on("tooManyPlayers", handleTooManyPlayers);
  mysocket.on("TestNachricht", sendTestToAllPlayersInRoom);
  mysocket.on("TestBox", showTestBox);
  mysocket.on("moveObstacles", moveObstaclesMP);
  mysocket.on("DisplayPlayers", displayPlayers);
  mysocket.on("playerNumber", handlePlayerNumber);
  mysocket.on('gameState', handleGameState);
  // @ts-ignore
  document.getElementById('NewGamecodeButton').addEventListener('click', newGame);
  // @ts-ignore
  document.getElementById('JoinRoomButton').addEventListener('click', joinGame);
  // @ts-ignore
  document.getElementById('StartGameMultiplayer').addEventListener('click', startGame);

  let connectedSocket = false;

  function newGame() {
    connectedSocket = true;
    mysocket.emit("newGame");
    displayWaitingScreenUIP1();
  }

  let gameCode: any;

  function joinGame() {
    //@ts-ignore
    gameCode = document.getElementById("Entergamecode").value;
    // @ts-ignore
    if (gameCode) {
      mysocket.emit("joinGame", gameCode);
      displayWaitingScreenUIP2();
    } else {
      alert("Name must be filled out");
    }
  }

  function handleGameCode(roomName: string) {
    // @ts-ignore
    document.getElementById("Gamecode").innerText = roomName;
  }

  function handleUnknownGame() {
    // @ts-ignore
    document.getElementById("BackHome").click();
    alert("Unknown Game Code");
  }

  function handleTooManyPlayers() {
    alert("Game is already full!");
  }
  function handlePlayerNumber(pPlayerNumber: number) {
    playerNumber = pPlayerNumber;
  }
  function handleGameState(gameState: any){
    let playersCoords = gameState.players;
    let playerCoords = playersCoords.filter((player: any)=>player.number===1);

    let boardX_obenLinks = (board.position.x-board.geometry.parameters.width/2);
    let xCordBrettPlayer =  boardX_obenLinks + playerCoords[0].pos.x;

    let boardZ_obenLinks = (board.position.z-board.geometry.parameters.depth/2);
    let zCordBrettPlayer = boardZ_obenLinks + playerCoords[0].pos.z;

    let playerX = xCordBrettPlayer //possibleObstacleXPosition[x];
    let playerY = board.position.y + (board.geometry.parameters.height / 2);
    let playerZ = zCordBrettPlayer; //possibleObstacleZPosition[playerCoords[0].pos.z];
    player.position.set(playerX,playerY,playerZ);
    player.visible = true;
    // player.updateMatrixWorld()

    let enemyCoords = playersCoords.filter((player: any)=>player.number===2);

    let xCordBrettEnemy =  boardX_obenLinks + enemyCoords[0].pos.x;
    let zCordBrettEnemy = boardZ_obenLinks + enemyCoords[0].pos.z;

    let enemyX = xCordBrettEnemy;
    let enemyY = board.position.y + (board.geometry.parameters.height / 2);
    let enemyZ = zCordBrettEnemy;
    enemy.position.set(enemyX,enemyY,enemyZ);
    enemy.visible = true;
    // enemy.updateMatrixWorld()
  }
  function sendTestToAllPlayersInRoom(testNachricht: any) {
    // @ts-ignore
    document.getElementById("Texts").innerText = testNachricht;
  }
  function startGame(){
    //Test to show the same Block to all Players
    console.log("Start Game Click");
    console.log(possibleObstacleXPosition);
    console.log(possibleObstacleZPosition);
    mysocket.emit("startAR", gameCode);
  }

  function showTestBox(coords: any){
    // console.log("SHOW TEST BOX")
    // let boxX = possibleObstacleXPosition[coords.x];
    // let boxY = board.position.y + (board.geometry.parameters.height / 2);
    // let boxZ = possibleObstacleZPosition[coords.z];
    // console.log(coords);
    // objectPool[0].obstacleMesh.position.set(boxX,boxY,boxZ);
    // objectPool[0].obstacleMesh.visible = true;
    // console.log(objectPool[0].obstacleMesh);
  }

  function displayPlayers(playersCoords: any){
    console.log("Display Player")
    let playerCoords = playersCoords.filter((player: any)=>player.number===1);
    console.log(playersCoords);
    console.log(playerCoords);
    console.log(playerCoords[0].pos.x);
    let x = playerCoords[0].pos.x
    let playerX = possibleObstacleXPosition[x];
    let playerY = board.position.y + (board.geometry.parameters.height / 2);
    let playerZ = possibleObstacleZPosition[playerCoords[0].pos.z];
    console.log(playerX, playerY, playerZ);
    player.position.set(playerX,playerY,playerZ);
    player.visible = true;

    let enemyCoords = playersCoords.filter((player: any)=>player.number===2);
    let enemyX = possibleObstacleXPosition[enemyCoords[0].pos.x];
    let enemyY = board.position.y + (board.geometry.parameters.height / 2);
    let enemyZ = possibleObstacleZPosition[enemyCoords[0].pos.z];
    enemy.position.set(enemyX,enemyY,enemyZ);
    enemy.visible = true;

    console.log("Spieler1");
    console.log(player);
    console.log("Spieler2/Enemy");
    console.log(enemy);
  }




  let i =0;
  function moveObstaclesMP(obstacles: any[]){

    console.log("MOVE OBSTACLES", i);
    i+=1;

    //ObjectPoolLogic
    if (isGameStarted) {
      let inactiveObjectsBackend = obstacles.filter(obj => !obj.active);
      let activeObjectsBackend = obstacles.filter(obj => obj.active);

      inactiveObjectsBackend.forEach(obj=>{
        objectPool[obj.id].obstacleMesh.visible = false;
      });

      if (activeObjectsBackend.length > 0) {
        //let i = 0;
        activeObjectsBackend.forEach(obj => {
          let pos = obj.pos;
          let posX = possibleObstacleXPosition[pos.x];;
          let posY = board.position.y + (board.geometry.parameters.height / 2);
          let posZ = possibleObstacleZPosition[pos.z];

          objectPool[obj.id].obstacleMesh.position.set(posX, posY, posZ);
          objectPool[obj.id].obstacleMesh.visible = true;
        });
      }

    }
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

      }

      //Bestimmt die möglichen X-Koordinaten für die Hindernisse

      let loopX = (board.position.x-board.geometry.parameters.width/2);
      while (loopX < (board.position.x-board.geometry.parameters.width/2)+1){ //1 für die Länge des Spielbretts
        possibleObstacleXPosition.push(loopX);
        loopX = loopX + 0.05; // 0.05 für die Breite der Hindernisse
      }
      let loopZ = (board.position.z-board.geometry.parameters.depth/2);
      while (loopZ < (board.position.z-board.geometry.parameters.depth/2)+1){ //1 für die Länge des Spielbretts
        possibleObstacleZPosition.push(loopZ);
        loopZ = loopZ + 0.05; // 0.05 für die Breite der Hindernisse
        console.log(loopZ);
      }

      isBoardDisplayed = true;
      isGameStarted = true;
    }
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
        //BB setzen TODO
        inactiveObjects[randomElementNumber].obstacleBB.copy(<Box3>inactiveObjects[randomElementNumber].obstacleMesh.geometry.boundingBox).applyMatrix4(inactiveObjects[randomElementNumber].obstacleMesh.matrixWorld);
        inactiveObjects[randomElementNumber].obstacleMesh.visible = true;

      }
      if (activeObjects.length > 0) {
        //let i = 0;
        activeObjects.forEach(obj => {
          let pos = obj.obstacleMesh.position;
          obj.obstacleMesh.position.set(pos.x, pos.y, pos.z + (speed * 10));
          //BB setzen TODO
          obj.obstacleBB.copy(<Box3>obj.obstacleMesh.geometry.boundingBox).applyMatrix4(obj.obstacleMesh.matrixWorld);

          if (!(pos.z + 0.025 < board.position.z + 0.5)) {
            obj.obstacleMesh.visible = false;
            //BB -100 setzen TODO
            obj.obstacleMesh.position.set(-100,-100,-100);
            obj.obstacleBB.copy(<Box3>obj.obstacleMesh.geometry.boundingBox).applyMatrix4(obj.obstacleMesh.matrixWorld);
          }
        });
      }

    }
  }

  function updatePlayer(){
    let position = player.position;
    if(playerNumber === 2){
      position = enemy.position;
    }
    // move the player
    const speed = 0.0625;
    let sensitivity = 0.3;
    if ((fwdValue > sensitivity) && (position.z - 0.025 > board.position.z - 0.5)) {
      tempVector
          .set(0, 0, -fwdValue*speed)
      tempVector.add(position);
      let difference = normalisePosition(tempVector);
      let playerCoords = {"pos":difference, "number":playerNumber};
      mysocket.emit("keydown", playerCoords);
    }

    if ((bkdValue > sensitivity) && (position.z + 0.025 < board.position.z + 0.5)) {
      tempVector
          .set(0, 0, bkdValue * speed)
      tempVector.add(position)
      let difference = normalisePosition(tempVector);
      let playerCoords = {"pos":difference, "number":playerNumber};
      mysocket.emit("keydown", playerCoords);
    }

    if ((lftValue > sensitivity) && (position.x - 0.025 > board.position.x - 0.5)) {
      tempVector
          .set(-lftValue * speed, 0, 0)
      tempVector.add(position)
      let difference = normalisePosition(tempVector);
      let playerCoords = {"pos":difference, "number":playerNumber};
      mysocket.emit("keydown", playerCoords);
    }

    if ((rgtValue > sensitivity) && (position.x + 0.025 < board.position.x + 0.5)) {
      tempVector
          .set(rgtValue * speed, 0, 0)
      tempVector.add(position)
      let difference = normalisePosition(tempVector);
      let playerCoords = {"pos":difference, "number":playerNumber};
      mysocket.emit("keydown", playerCoords);
    }

    //braucht man bei keydown listener event
    player.updateMatrixWorld()

    //controls.target.set( mesh.position.x, mesh.position.y, mesh.position.z );
    // reposition camera
    camera.position.sub(controls.target)
    controls.target.copy(player.position)
    camera.position.add(player.position)


  };
  function normalisePosition(tempVector: Vector3){
    let brettObenLinksX_raumDim = (board.position.x-board.geometry.parameters.width/2)
    let diffPosX_raumDim = tempVector.x - brettObenLinksX_raumDim;

    let brettObenLinksZ_raumDim = (board.position.z-board.geometry.parameters.depth/2)
    let diffPosZ_raumDim = tempVector.z - brettObenLinksZ_raumDim;
    return {
      x: diffPosX_raumDim,
      z: diffPosZ_raumDim
    }
  }
  function checkCollision(){

    //Update BoundingBox of Player
    //Müssen wir nachher rüber nehmen
    const playerBB = new Box3(new Vector3(), new Vector3()); //ein Vector for min and one for max
    playerBB.setFromObject(player);
    if(playerNumber === 2){
       //BoundingBox of player
       playerBB.setFromObject(enemy);
    }

    if (player.geometry.boundingBox instanceof Box3) { //&& (enemy.geometry.boundingBox instanceof Box3)
      if(playerNumber === 1){
      console.log("BB auf Spieler 1")

      playerBB.copy(player.geometry.boundingBox).applyMatrix4(player.matrixWorld);
      }else{
       console.log("BB auf Spieler 2")
        if (enemy.geometry.boundingBox instanceof Box3) {
          playerBB.copy(enemy.geometry.boundingBox).applyMatrix4(enemy.matrixWorld);
        }
      }
    }


    //Check for Collision
    let activeObjects = objectPool.filter(obj => obj.obstacleMesh.visible);
    let i = 0;
    activeObjects.forEach(obj => {
      //Update BoundingBox of Obstacle
      if (obj.obstacleMesh.geometry.boundingBox instanceof Box3) {
        obj.obstacleBB.copy(obj.obstacleMesh.geometry.boundingBox).applyMatrix4(obj.obstacleMesh.matrixWorld);
      }

      //Check for Collision
      if(obj.obstacleBB.intersectsBox(playerBB)){ //obstacle.obstacleBB
        console.log("----PlayerBB------")
        console.log(playerBB)
        console.log("-------Player-----")
        console.log(player)
        console.log("-------Enemy-----")
        console.log(enemy)
        console.log("--------Obj----")
        console.log(obj)
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
      i++;
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

