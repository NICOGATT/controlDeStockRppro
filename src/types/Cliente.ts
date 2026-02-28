import { Direccion } from "./Direccion";

export interface Cliente {
    id : number; 
    nombre : string; 
    telefono? : string; 
    direccion? : Direccion;
}