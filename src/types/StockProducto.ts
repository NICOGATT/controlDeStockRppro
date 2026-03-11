import { Color } from "./Color";
import { Product } from "./Product";
import { Talle } from "./Talle";

export interface StockProducto {
    productoId : number; 
    talleId : number; 
    colorId: number; 
    stock : number;
    precio : number; 

    //Opcional para UI
    producto? : Product; 
    talle? : Talle; 
    color? : Color; 
}
