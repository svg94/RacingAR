/*  
 * Returns true if navigator has xr with 'immersive-ar' capabilities
 * Returns false otherwise.
 */
import {ARButton} from "three/examples/jsm/webxr/ARButton";

//import { UILever } from "../scene";

export async function browserHasImmersiveArCompatibility(): Promise<boolean> {
  if (window.navigator.xr) {
    const isSupported: boolean = await navigator.xr.isSessionSupported(
      "immersive-ar",
    );
    console.info(
      `[DEBUG] ${
        isSupported
          ? "Browser supports immersive-ar"
          : "Browser does not support immersive-ar"
      }`,
    );
    return isSupported;
  }
  return false;
}

/*
 * Create and display message when no XR capabilities are found.
 */
export function displayUnsupportedBrowserMessage(): void {
  const appRoot: HTMLElement | null = document.getElementById("app-root");
  const bigMessage: HTMLParagraphElement = document.createElement("p");

  bigMessage.innerText = "😢 Oh no!";
  if (appRoot) {
    appRoot.appendChild(bigMessage);
  }

  const middleMessage: HTMLParagraphElement = document.createElement("p");
  middleMessage.innerText =
    "Your browser does not seem to support augmented reality with WebXR.";

  if (appRoot) {
    appRoot.appendChild(middleMessage);
  }

  const helpMessage: HTMLParagraphElement = document.createElement("p");

  helpMessage.innerText =
    "Try opening the page using a recent version of Chrome on Android.";

  if (appRoot) {
    appRoot.appendChild(helpMessage);
  }
}

let Gameover = false;
export function addGameOverScreenWinner(){
  Gameover = true;
  // @ts-ignore
  document.getElementById("HomescreenUI").style.visibility = 'hidden';
  // @ts-ignore
  document.getElementById("mobileInterface").style.visibility = 'hidden';
  // @ts-ignore
  document.getElementById("BackHome").style.visibility = 'hidden';
  // @ts-ignore
  document.getElementById("GameOverScreenUI").style.display = 'block';
  // @ts-ignore
  document.getElementById("LoseButton").style.visibility = 'hidden';

  const Text: HTMLElement | null = document.getElementById("Winner_Loser_Text");
  if (Text){
    Text.innerText = "You Won!";
  }

  //Submit Button Onclick --> Send Data to DB + Go to Homescreen + Check that Name is not empty
  // @ts-ignore
  document.getElementById('SubmitWinnerName').onclick = function() {
    // @ts-ignore
    let myInput = document.getElementById("UsernameWinner");
    // @ts-ignore
    if (myInput && myInput.value) {
      //TODO Send Data to DB
      //@ts-ignore
      document.getElementById("BackHome").click();
    }else{
      const Error: HTMLElement | null = document.getElementById("NameEmptyError");
      // @ts-ignore
      Error.innerText = "Name must be filled out!";
    }
  }
}

export function addGameOverScreenLoser(){
  Gameover = true;
  // @ts-ignore
  document.getElementById("HomescreenUI").style.visibility = 'hidden';
  // @ts-ignore
  document.getElementById("mobileInterface").style.visibility = 'hidden';
  // @ts-ignore
  document.getElementById("BackHome").style.visibility = 'hidden';
  // @ts-ignore
  document.getElementById("GameOverScreenUI").style.display = 'block';
  // @ts-ignore
  document.getElementById("WinnerForm").style.display = 'none';

  const Text: HTMLElement | null = document.getElementById("Winner_Loser_Text");
  if (Text){
    Text.innerText = "You Lost!";
  }
  // @ts-ignore
  document.getElementById('LoseButton').onclick = function() {
    //@ts-ignore
    document.getElementById("BackHome").click();
  }
}

export function removeHomescreenUI(){
  // @ts-ignore
  document.getElementById("HomescreenUI").style.display = 'none';
  if(Gameover == false){
    // @ts-ignore
    document.getElementById("BackHome").style.visibility = 'visible';
  }
}


export function displayHomescreenUI(){
  const Text: HTMLElement | null = document.getElementById("Texts");
  if (Text){
      Text.innerText = "RacingAR";
  }
  // @ts-ignore
  document.getElementById('NewGamecodeButton').onclick = function() {
    //TODO DO Stuff in Backend to Get Gamecode
    let CodeBackend = "Gamecode XY";
    const gameCode: HTMLElement | null = document.getElementById("Gamecode");
    if (gameCode){
      gameCode.innerText = CodeBackend;
    }
  }
  // @ts-ignore
  document.getElementById('JoinRoomButton').onclick = function() {
    // @ts-ignore
    let x = document.forms["JoinRoomForm"]["Entergamecode"].value;
    if (x == "" || x == null) {
      alert("Name must be filled out");
    }else{
      alert("Joining Session");
      //TODO DO Stuff in Backend to Join Game
    }
  }

  // @ts-ignore
  document.getElementById("BackHome").style.visibility = 'hidden';
  // @ts-ignore
  document.getElementById("GameOverScreenUI").style.display = 'none';
}


/**
 * Create and show a simple introduction message if the device supports
 * WebXR with immersive-ar mode.
 */
export function displayIntroductionMessage() {
  const appRoot: HTMLElement | null = document.getElementById("app-root");

  const bigMessage: HTMLParagraphElement = document.createElement("h1");
  bigMessage.innerText = "Welcome! 👋";
  bigMessage.innerText = "";

  const middleMessage: HTMLParagraphElement = document.createElement("p");
  middleMessage.innerText = "Press the button below to enter the AR experience.";
  middleMessage.innerText = "";

  const helpMessage: HTMLParagraphElement = document.createElement("p");
  helpMessage.innerText = "";
    // "Note: The app works best in a well lit environment, with enough space to move around.";

  helpMessage.style.fontSize = "16px";
  helpMessage.style.fontWeight = "bold";
  helpMessage.style.padding = "64px 64px 0px 64px";
  helpMessage.style.opacity = "0.8";

  if (appRoot) {
    appRoot.appendChild(bigMessage);
    appRoot.appendChild(middleMessage);
    appRoot.appendChild(helpMessage);
  }

  return () => {
    if (appRoot) {
      if (appRoot.contains(middleMessage)) {
        appRoot.removeChild(middleMessage);
      }
      if (appRoot.contains(bigMessage)) {
        appRoot.removeChild(bigMessage);
      }
      if (appRoot.contains(helpMessage)) {
        appRoot.removeChild(helpMessage);
      }
    }
  };
}

export default {
  browserHasImmersiveArCompatibility,
  displayIntroductionMessage,
  displayUnsupportedBrowserMessage,
};
