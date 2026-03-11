import { Color } from "./Color";
import { Talle } from "./Talle";

export interface ColorYTalle {
    color : Color; 
    talle : Talle; 
    cantidad : number; 
    precio? : number | null
}