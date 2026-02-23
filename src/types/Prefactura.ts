export type PedidoEstado = "BORRADOR" | "CONFIRMADO" | "CANCELADO"; 

export interface Prefactura {
    id : number ; 
    fecha : Date; 
    clienteId : number
}