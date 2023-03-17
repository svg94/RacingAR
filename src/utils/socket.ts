import {io} from "socket.io-client";
export const mysocket = io("https://192.168.2.43:3001/",{ //Daniel IP
   transports: ["websocket"] //Damit unterbindet man die cors errors die durch socket ios initiale http requests entstehen. Cool oder :') . I'm crying.
});
/*export const mysocket = io("https://192.168.178.49:3001/",{ //Bojan IP
    transports: ["websocket"] //Damit unterbindet man die cors errors die durch socket ios initiale http requests entstehen. Cool oder :') . I'm crying.
});*/

