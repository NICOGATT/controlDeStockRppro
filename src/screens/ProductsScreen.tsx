import {View, Text, Pressable, StyleSheet} from "react-native"; 
import { ProductItem } from "../components/ProductItem"; 

export default function ProductsScreen({
    navigation, 
    products, 
    agregarStock, 
    quitarStock, 
    borrarProducto
} : any) {
    return (
        <View style = {styles.container}>
            <Pressable onPress = {() => navigation.navigate("AddProduct")}>
                <Text>➕ Agregar Producto</Text>
            </Pressable>

            <Pressable onPress = {() => navigation.navigate("Movements")}>
                <Text>📜 Ver Movimientos</Text>
            </Pressable>

            <Text>Cantidad total: {products.length}</Text>

            {products.length === 0 && (
                <Text>No hay productos agregados</Text>
            )}

            {products.map((p : any) => (
                <ProductItem
                    key = {p.id}
                    {...p}
                    onAgregar = {() => agregarStock (p.id)}
                    onQuitar = {() => quitarStock (p.id)}
                    onDelete = {() => borrarProducto (p.id)}
                />
            ))}

        </View>
    )
} 



const styles = StyleSheet.create({
    container : {
        padding : 16
    }
})