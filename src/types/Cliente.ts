import { Direccion } from "./Direccion";

export interface Cliente {
    id : number; 
    nombre? : string; 
    telefono? : string;
    cuit? : string; 
    email? : string; 
    nombreEmpresa? : string ; 
    condicionTributaria : string; 
    direccion? : Direccion;
}