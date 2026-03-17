import { Color } from "./Color";
import { Talle } from "./Talle";

export type PedidoItem = {
    productoId : string;
    talleId : number; 
    colorId : number; 
    //UI
    nombreProducto : string; 
    talleNombre? : string;
    colorNombre? : string; 

    precioUnitario : number; 
    cantidad : number ; 
    subtotal: number ; 

    //Stock disponible de esa variante
    stockDisponible? : number;

}