export type MovementType = "ENTRADA" | "SALIDA"; 

export type Movement = {
    id : string; //id simple 
    productId: number; 
    productName : string; 
    type : MovementType; 
    cantidad : number; 
    createAt : string //ISO date
}
