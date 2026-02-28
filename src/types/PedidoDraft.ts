import { Cliente } from "./Cliente";
import { Direccion } from "./Direccion";
import { PedidoItem } from "./PedidoItem";

export type PedidoDraft = {
    codigo : string; 
    fechaISO: string; 
    cliente? : Cliente; 
    direccion?: string; 
    items : PedidoItem[]; 
    total: number ;
    notas?: string; 
}