import { ColorYTalle } from "./ColorYTalle";
import { StockProducto } from "./StockProducto";
import { TipoDePrenda } from "./TipoDePrenda";

export interface Product {
    id : string;
    nombre : string;
    precio : number; 
    colorYTalle : ColorYTalle[];
    codigo? : string;
    tipoDePrenda : TipoDePrenda;
    stockProductos? : StockProducto[]; 
}