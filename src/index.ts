import { WebGLRenderer } from "three/src/renderers/WebGLRenderer";
import { ARButton } from "three/examples/jsm/webxr/ARButton";
import { createScene } from "./scene";
import {
  browserHasImmersiveArCompatibility,
  displayIntroductionMessage,
  displayUnsupportedBrowserMessage,
} from "./utils/domUtils";

import "./styles.css";
import {isTouchDevice} from "./utils/isTouchDevice";
import joystick from 'nipplejs';


function initializeXRApp() {
  const { devicePixelRatio, innerHeight, innerWidth } = window;

  // Create a new WebGL renderer and set the size + pixel ratio.
  const renderer = new WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(devicePixelRatio);

  // Enable XR functionality on the renderer.
  renderer.xr.enabled = true;

  // Add it to the DOM.
  document.body.appendChild( renderer.domElement );

  // Create the AR button element, configure our XR session, and append it to the DOM.
  document.body.appendChild(ARButton.createButton(
      renderer,
      { requiredFeatures: ["hit-test"] },
  ));
  var arButton = ARButton.createButton(renderer, { requiredFeatures: ['hit-test'], optionalFeatures: [ 'dom-overlay', 'dom-overlay-for-handheld-ar' ], domOverlay: { root: document.body } });
  document.body.appendChild(ARButton.createButton(
      renderer,
      { requiredFeatures: ["hit-test"] },
  ));
  // let joystickManager;
  // // Can be viewed here
  // if (isTouchDevice()) {
  //   // Get the area within the UI to use as our joystick
  //   let touchZone = document.getElementById('joystick-zone');
  //
  //   if (touchZone != null) {
  //     // Create a Joystick Manager
  //     joystickManager = joystick.create({zone: document.getElementById('joystick-zone')!,})
  //     // Register what to do when the joystick moves
  //     joystickManager.on("move", (event, data) => {
  //       console.log("move",data.vector.x)
  //       // positionOffset = data.vector.x;
  //     })
  //     // When the joystick isn't being interacted with anymore, stop moving the rocket
  //     joystickManager.on('end', (event, data) => {
  //       // positionOffset = 0.0;
  //       console.log("end");
  //     })
  //   }
  // }

  // Pass the renderer to the createScene-funtion.
  createScene(renderer);

  // Display a welcome message to the user.
  displayIntroductionMessage();
};

async function start() {
  // Check if browser supports WebXR with "immersive-ar".
  const immersiveArSupported = await browserHasImmersiveArCompatibility();

  // Initialize app if supported.
  immersiveArSupported ?
      initializeXRApp() :
      displayUnsupportedBrowserMessage();
};

start();
