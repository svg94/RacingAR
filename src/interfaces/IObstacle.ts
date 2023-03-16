import {Box3, Mesh} from "three";

interface Obstacle{
    obstacleMesh: Mesh;
    obstacleBB: Box3;
    id: number;
}
export {Obstacle};