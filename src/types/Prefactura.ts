export type PedidoEstado = "BORRADOR" | "CONFIRMADO" | "CANCELADO"; 

export type Prefactura = {
    pedido : {
        id : string; 
        estado : PedidoEstado;
        creadoEn : string; 
        nota? : string | null;
    }; 
    cliente : {
        id : string; 
        nombre : string; 
        telefono ? : string | null; 
    }; 
    items : Array<{
        id : string; 
        productoId : string; 
        nombre : string; 
        precioUnitario : number; 
        cantidad : number; 
        subtotal : number
    }>; 
    totales : {total : number};
}