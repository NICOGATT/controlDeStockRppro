import {View, Text, Pressable, StyleSheet, ScrollView, Platform} from "react-native"; 
import { ProductItem } from "../components/ProductItem"; 
import { useNavigation } from "@react-navigation/native";
import { Product } from "../types/Product";
import { useState } from "react";
import GenerarCodigoButton from "../components/BarcodeScanScreen";

export default function ProductsScreen({
    navigation, 
    products, 
    agregarStock, 
    quitarStock, 
    borrarProducto
} : any) {
    const [showQR, setShowQR] = useState(false);
    const [selectedProduct, setSelectProduct] = useState<Product | null>(null); 
    function onGenerarQr(producto : Product) {
        setSelectProduct(producto); 
        setShowQR(true);
    }
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
                        <Pressable onPress = {() => navigation.navigate("PedidosScreen", {pedidoId : "pedido - 123"})}> 
                            <Text>Armar pedido</Text>
                        </Pressable>
                        <Pressable onPress={() => navigation.navigate("BarcodeScanScreen", {products})}>
                            <Text>Escanear QR</Text>
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
                            <View>
                                <Pressable onPress={() => navigation.navigate("EditProduct", {product: p})}>
                                    <Text>✏️ Editar</Text>
                                </Pressable>
                                <Pressable onPress ={() => onGenerarQr(p)}>
                                    <Text>Generar codigo de barra</Text>
                                </Pressable>

                            </View>
                        </View>
                    )
                )}
                <GenerarCodigoButton 
                    visible = {showQR}
                    producto={selectedProduct}
                    onClose={() => setShowQR(false)}
                />
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
        flexDirection : Platform.OS === "web" ? "row" : "column",
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