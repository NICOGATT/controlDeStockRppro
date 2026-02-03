import AsyncStorage from "@react-native-async-storage/async-storage";
import { Movement } from "../types/Movement";

const MOVEMENTS_KEY = "movements"; 

export async function saveMovements(movements : Movement[]) {
    try {
        await AsyncStorage.setItem(MOVEMENTS_KEY, JSON.stringify(movements))
    } catch (error) {
        console.error("Error guardando movimientos", error)
    }
}

export async function loadMovements() : Promise<Movement[] | null> {
    try {
        const data = await AsyncStorage.getItem(MOVEMENTS_KEY);
        return data ? JSON.parse(data) : null; 
    } catch (error) {
        console.error("Error cargando los movimentos", error)
        return null; 
    }
}

export async function deleteMovement() : Promise<boolean> {
    try {
        await AsyncStorage.removeItem(MOVEMENTS_KEY); 
        console.log("Movimientos eliminados correctamente")
        return true;
    } catch (error) {
        console.error("Error eliminando los movimientos", error)
        return false; 
    }
}