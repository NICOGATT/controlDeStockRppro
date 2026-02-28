//utils/pedido.ts
export function generarCodigoPedido() : string {
    //Ej: PED-20260225-184455 (fecha y hora)
    const d = new Date(); 

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `PED-${yyyy}${mm}${dd}-${hh}${min}${ss}`;
}

export function calcularSubtTotal(precio : number, cantidad : number) : number {
    return Math.round((precio * cantidad) * 100) / 100;
}

export function calcTotal(items : {subtotal: number}[]): number {
    return Math.round(items.reduce((acc, it) => acc + it.subtotal, 0) * 100) / 100;
}

export function formatMoney(n : number) {
    //ARS friendly 
    return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
}