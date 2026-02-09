import { Prefactura } from "./Prefactura";

const API_URL = ""; 

export async function getPrefactura(pedidoId :string) : Promise<Prefactura> {
    const res = await fetch(`${API_URL}/pedidos/${pedidoId}`)
    if(!res.ok) throw new Error("No se pudo cargar la prefacura")
    return res.json();
}

export async function confirmarPedido(pedidoId : string) : Promise<void>{
    const res = await fetch(`${API_URL}/pedidos/${pedidoId}/confirmar`, {method : "POST"});
    if(!res.ok) throw new Error ("No se pudo confirmar el pedido");
}