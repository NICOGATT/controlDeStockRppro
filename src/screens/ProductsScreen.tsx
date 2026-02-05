import {View, Text, Pressable, StyleSheet, ScrollView, Platform} from "react-native"; 
import { ProductItem } from "../components/ProductItem"; 

export default function ProductsScreen({
    navigation, 
    products, 
    agregarStock, 
    quitarStock, 
    borrarProducto
} : any) {
    return (
        <ScrollView style = {styles.container} contentContainerStyle = {styles.content}>
            <View style = {styles.container}>
                <View style = {styles.header}>
                    <Text style = {styles.title}>RPPRO</Text>
                    <View style = {styles. buttonsContainer}>
                        <Pressable onPress = {() => navigation.navigate("AddProduct")}>
                            <Text>➕ Agregar Producto</Text>
                        </Pressable>

                        <Pressable onPress = {() => navigation.navigate("Movements")}>
                            <Text>📜 Ver Movimientos</Text>
                        </Pressable>
                    </View>
                </View>

                <Text style = {styles.subtitle}>Cantidad total: {products.length}</Text>

                {products.length === 0 && (
                    <Text>No hay productos agregados</Text>
                )}

                {products.map((p : any) => (
                    <View key = {p.id} style = {styles.productContainer}>
                            <ProductItem
                                nombre = {p.nombre}
                                cantidadInicial = {p.cantidadInicial}
                                stockDeseado = {p.stockDeseado}
                                precio = {p.precio}
                                onAgregar = {() => agregarStock (p.id)}
                                onQuitar = {() => quitarStock (p.id)}
                                onDelete = {() => borrarProducto (p.id)}
                            />
                            <Pressable onPress={() => navigation.navigate("EditProduct", {product: p})}>
                                <Text>✏️ Editar</Text>
                            </Pressable>
                        </View>
                    )
                )}     
            </View>
        </ScrollView>
    )
} 



const styles = StyleSheet.create({
    container : {
        flex : 1,
        backgroundColor: "#20a4f3"
    }, 
    content : {
        padding : 20
    }, 
    title : {
        fontSize : 24,
        fontWeight : "bold",
        textDecorationLine: "underline"
    }, 
    header : {
        flex : 1,
        marginBottom : 16,
        padding : 8, 
        backgroundColor : "white",
        borderRadius : 8,
        flexDirection : Platform.OS === "web" ? "row" : "column",
        justifyContent : Platform.OS === "web" ? "space-around" : "flex-start",
        alignItems : Platform.OS === "web" ? "center" : "flex-start",
        marginTop : Platform.OS === "web" ? 0 : 30
    }, 
    buttonsContainer : {
        flexDirection : "row",
        gap : 12
    }, 
    subtitle : {
        fontSize : 18,
        marginBottom : 10,
        color : "#f6f7f8"
    }, 
    productContainer : {
        backgroundColor : "white",
        flexDirection : "row",
        justifyContent : "space-between",
        alignItems : "center",
        padding : 8,
        borderRadius : 8,
        marginBottom : 10, 
    }
})