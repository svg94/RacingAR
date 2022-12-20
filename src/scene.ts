import { createPlaneMarker } from "./objects/PlaneMarker";
import { handleXRHitTest } from "./utils/hitTest";

import {
  AmbientLight,
  BoxBufferGeometry,
  Mesh,
  MeshBasicMaterial,
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

import { io } from "socket.io-client";
//TODO FIX fs cannot be found. Oder lies den scheiß einfach als string variable ein
import * as fs from 'fs';

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


  //Socker Connection
  // @ts-ignore
  const socket = io("https://192.168.178.26:3001/", {
    key: "-----BEGIN RSA PRIVATE KEY-----\n" +
        "MIIEowIBAAKCAQEAwtvc0aRYS0JfgANiujE92iYcwy+P0iAvLgJLOjwDnjLcqZiJ\n" +
        "AWGYi6ydRYT8+WgfCwjOejY6rXHOig9fa7MtPpbHOQg9nNnqv+e/h/07mDhKo9W1\n" +
        "ji/6IJSEmMpV2V9ZZ2zvzv8GBUx4+KZKBSaoVHqHvWAQ4ZAyoBWBgbmSXDt1Q7WZ\n" +
        "cMSR7E0n+8VudghFv6mEWgMBx1wAjQtdYL9KCQ+njZXaicBFFtRCxG9DF0IgP0Aj\n" +
        "y7a28qa+nKmch8nM8aqe7WcGv+ta9wrKnkki9Te/898BiBcTRtD8dWw5F8ajMFnG\n" +
        "0TB2IE4HjxuRNyLT+98L4OLoN1DQ54Fk7mNHJwIDAQABAoIBAFY+FTe8M0/r6nSw\n" +
        "Cuw5ixSYNba1wEPR9s+4OC9oDHniLQPq/Qhdd7SqC1mPiJ+iU8sAdNJmWgYWDsHQ\n" +
        "F/2E6gt/lGFLomlfkaSqH31CuTOgBnkIxzhNR7lPwngVZXW1284IywKkoLeLpyb2\n" +
        "AmDRQUNSj+1jLVWICsALhKwzw/GJoZ//UqXmkPS4X1Y3X025KQpONER+E4TUX8mV\n" +
        "/vgbrl3p9DyxCp/OFcuBh1vNIcpcY2iYjOcwPDn+H8AkY+IvdbPciel2gkfJapZN\n" +
        "mZYj6ghBh2CYtAiRX+BnRhdQwyPidTHbtZEDhNjN3UL9IOFGXeTiVi2/cUN96PPX\n" +
        "OHlncMECgYEA4ZDqp5XtjaA+Cna7j6nY2yfaIhw5JKRv5gk71mgoiuTHCGZSEW8+\n" +
        "oVi+kNCzyV8o8thyrJuHef4JRbu0P8LPAV+czq6pzDjguA92oSibCD52myFmlebX\n" +
        "yr76IUdisPl6LuAEIVjnWthPnsu18YDOjAVhyQGKXsPAS1r9G9Bt95cCgYEA3SZQ\n" +
        "R1SSXMpckdaHhJ+8DpSRojjTTqm6VqdqahedTw7jH8Y5HMgsZ2nJfGK4g3wicklp\n" +
        "xjLgCnhc7D8p0o2PR+Dmsx67tn3Ug3O67PhgWQ67x/BRgsuLo88AA+EIpSY+0V6t\n" +
        "YSbwEtLDhe8HMHyG8sP8e+dc7Fg6yMkl73oinvECgYBi+spdW4bwPL68rLlFI0zL\n" +
        "bkNj8GqKz7Vihe7B+NbBi/5iizO7/srG1kBZH5uk46L+XUiEwYLDX1wGQ4Wm7P8V\n" +
        "JTWT5EUSHmtNmUt/EGhnR7GYBSIU6UUL7J2p+L8v1WluJFLrpy1uSbk2f0GJhfIc\n" +
        "s0fjgk+Loe5Bot2qVN3MZQKBgDe374IJTNcUJT6ZToubs0X5KLg2mQa4vLoYdDdG\n" +
        "u9uvZIoc50bZKFbl0F4GgXafUA57cKr/JnN83+yl/WOPRwpVH8sBc0oHagO0pOQP\n" +
        "sDa//4/gfKj3n7cl8FsJ16PEfw9BS22u4c3cTGbyUl1lApsnxfVx1Xe2wxjTlTtB\n" +
        "CngBAoGBAMrrsN/cnskH+/berWAesxJM4Ry/VAYs+ZxIikaqgYBwHXTd9EZdogkM\n" +
        "M2R1dCLA8cIlH9OsTT2kMTMNsgmEdrnq45qnmoEcEG6LB8kSAaMNoODr7nTceNYg\n" +
        "pu1FLD+tRYVCKduBzCUMNBdPjSgmSriuCXbTdguEaCHtqPm53xsi\n" +
        "-----END RSA PRIVATE KEY-----",
    cert: "-----BEGIN CERTIFICATE-----\n" +
        "MIIDATCCAekCFC8m9+CKRBxGdrPOpV1A7ukFWaGWMA0GCSqGSIb3DQEBCwUAMD0x\n" +
        "CzAJBgNVBAYTAkRFMQwwCgYDVQQIDANOUlcxEDAOBgNVBAcMB0NvbG9nbmUxDjAM\n" +
        "BgNVBAMMBUJvamFuMB4XDTIxMDIyNjEwMTYzNloXDTIxMDMyODEwMTYzNlowPTEL\n" +
        "MAkGA1UEBhMCREUxDDAKBgNVBAgMA05SVzEQMA4GA1UEBwwHQ29sb2duZTEOMAwG\n" +
        "A1UEAwwFQm9qYW4wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDC29zR\n" +
        "pFhLQl+AA2K6MT3aJhzDL4/SIC8uAks6PAOeMtypmIkBYZiLrJ1FhPz5aB8LCM56\n" +
        "Njqtcc6KD19rsy0+lsc5CD2c2eq/57+H/TuYOEqj1bWOL/oglISYylXZX1lnbO/O\n" +
        "/wYFTHj4pkoFJqhUeoe9YBDhkDKgFYGBuZJcO3VDtZlwxJHsTSf7xW52CEW/qYRa\n" +
        "AwHHXACNC11gv0oJD6eNldqJwEUW1ELEb0MXQiA/QCPLtrbypr6cqZyHyczxqp7t\n" +
        "Zwa/61r3CsqeSSL1N7/z3wGIFxNG0Px1bDkXxqMwWcbRMHYgTgePG5E3ItP73wvg\n" +
        "4ug3UNDngWTuY0cnAgMBAAEwDQYJKoZIhvcNAQELBQADggEBAACsRby+DsdGqPfy\n" +
        "u+NTy0FSgc3DX6kIFAQTpwyg4W2FGMpnbqcvtWBagGaQSPqt5GbmFnYqnD/CPckb\n" +
        "ama6+MsjelAcA3XAvtL3kv33ySxoA2AWSL+JSvLcoP1YrLaWV7GnACTwgm3Md14L\n" +
        "11tKGwCBBl79HWAFTVNfiHkRXGx9p5Li5A/tLWD5gltAmP3JvS5VDQJWMd9Jbz4T\n" +
        "M1wmBsyULOmZjmDOCGgyiJxJrgJ5EOJOarcE7jdpM3rHIoDnZl+SWfk2UmFGG4iX\n" +
        "6fCgTad5DvWXE8asDGrFgQLupJcmrLTKxbgbs6lvJ3FNUL4THBUzGij1UTy5mibv\n" +
        "KAIfNAQ=\n" +
        "-----END CERTIFICATE-----",
    ca: [
      "-----BEGIN CERTIFICATE-----\n" +
      "MIIDATCCAekCFC8m9+CKRBxGdrPOpV1A7ukFWaGWMA0GCSqGSIb3DQEBCwUAMD0x\n" +
      "CzAJBgNVBAYTAkRFMQwwCgYDVQQIDANOUlcxEDAOBgNVBAcMB0NvbG9nbmUxDjAM\n" +
      "BgNVBAMMBUJvamFuMB4XDTIxMDIyNjEwMTYzNloXDTIxMDMyODEwMTYzNlowPTEL\n" +
      "MAkGA1UEBhMCREUxDDAKBgNVBAgMA05SVzEQMA4GA1UEBwwHQ29sb2duZTEOMAwG\n" +
      "A1UEAwwFQm9qYW4wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDC29zR\n" +
      "pFhLQl+AA2K6MT3aJhzDL4/SIC8uAks6PAOeMtypmIkBYZiLrJ1FhPz5aB8LCM56\n" +
      "Njqtcc6KD19rsy0+lsc5CD2c2eq/57+H/TuYOEqj1bWOL/oglISYylXZX1lnbO/O\n" +
      "/wYFTHj4pkoFJqhUeoe9YBDhkDKgFYGBuZJcO3VDtZlwxJHsTSf7xW52CEW/qYRa\n" +
      "AwHHXACNC11gv0oJD6eNldqJwEUW1ELEb0MXQiA/QCPLtrbypr6cqZyHyczxqp7t\n" +
      "Zwa/61r3CsqeSSL1N7/z3wGIFxNG0Px1bDkXxqMwWcbRMHYgTgePG5E3ItP73wvg\n" +
      "4ug3UNDngWTuY0cnAgMBAAEwDQYJKoZIhvcNAQELBQADggEBAACsRby+DsdGqPfy\n" +
      "u+NTy0FSgc3DX6kIFAQTpwyg4W2FGMpnbqcvtWBagGaQSPqt5GbmFnYqnD/CPckb\n" +
      "ama6+MsjelAcA3XAvtL3kv33ySxoA2AWSL+JSvLcoP1YrLaWV7GnACTwgm3Md14L\n" +
      "11tKGwCBBl79HWAFTVNfiHkRXGx9p5Li5A/tLWD5gltAmP3JvS5VDQJWMd9Jbz4T\n" +
      "M1wmBsyULOmZjmDOCGgyiJxJrgJ5EOJOarcE7jdpM3rHIoDnZl+SWfk2UmFGG4iX\n" +
      "6fCgTad5DvWXE8asDGrFgQLupJcmrLTKxbgbs6lvJ3FNUL4THBUzGij1UTy5mibv\n" +
      "KAIfNAQ=\n" +
      "-----END CERTIFICATE-----"
    ],
    secure:true,
    rejectUnauthorized : false
  });

  socket.emit("connection",{});

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

    //controls.target.set( mesh.position.x, mesh.position.y, mesh.position.z );
    // reposition camera
    camera.position.sub(controls.target)
    controls.target.copy(player.position)
    camera.position.add(player.position)


  };

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

