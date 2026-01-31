import AsyncStorage from "@react-native-async-storage/async-storage";
import { Product } from "../types/Product";

const PRODUCTS_KEY = "products"; 

export async function saveProducts(products : Product[]) {
    try {
        await AsyncStorage.setItem(
            PRODUCTS_KEY, 
            JSON.stringify(products)
        );
    } catch (error) {
        console.error("Error guardando productos", error); 
    }
}

export async function loadProducts() : Promise<Product[] | null> {
    try {
        const data = await AsyncStorage.getItem(PRODUCTS_KEY); 
        return data ? JSON.parse(data) : null; 
    } catch (error) {
        console.error("Error cargando productos", error); 
        return null; 
    }
}