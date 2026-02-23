import {View, Text, Pressable, StyleSheet, ScrollView, Platform} from "react-native"; 
import { ProductItem } from "../components/ProductItem"; 
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useState, useRef, useEffect, useCallback} from "react";
import GenerarCodigoButton from "../components/BarcodeScanScreen";
import { apiFetch } from "../api/apiClient";
import { getProductos } from "../api/Product";
import { Product } from "../types/Product";
import { StockProducto } from "../types/StockProducto";
import { ColorYTalle } from "../types/ColorYTalle";

export default function ProductsScreen({
    navigation
} : any) {
    const [showQR, setShowQR] = useState(false);
    const [productos, setProductos] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true); 
    const [selectedStockProduct, setSelectStockProduct] = useState<StockProducto | null>(null); 
    const qrRef = useRef<any>(null);

    async function cargarProductos() {
        setLoading(true); 
        try {
            const data = await apiFetch<Product[]>('/api/productos')
            setProductos(data)
        } finally{
            setLoading(false)
        }
    }

    useFocusEffect(
        useCallback (() => {
            cargarProductos();
        }, [])
    )

    // function onGenerarQr(producto : Product) {
    //     setSelectStockProduct(producto); 
    //     setShowQR(true);
    // }
    
    async function moverStock(variante : StockProducto, productoId : number, delta: number) {
        try {
            const data = await apiFetch<StockProducto>('/api/stockProductos', {
                method : "PUT", 
                body : {
                    productoId : productoId, 
                    talleId : variante.talleId,
                    colorId : variante.colorId, 
                    delta : delta
                }
            })
            await cargarProductos(); 
        } catch (error) {
            console.error('Error moviendo stock: ', error)
        }
    }

    async function eliminarProducto(producto : Product) {
        try {
            const data = await apiFetch(`/api/productos/${producto.id}`, {
                method : "DELETE",
            })
            await cargarProductos()
        } catch (error) {
            console.log('No se pudo borrar el producto', error)
        }
    }
    if(loading) return <Text>Cargando....</Text>
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
                        <Pressable onPress={() => navigation.navigate("BarcodeScanScreen", {productos})}>
                            <Text>Escanear QR</Text>
                        </Pressable>
                        <Pressable onPress={() => navigation.navigate("ColoresScreen")}>
                            <Text>Colores</Text>
                        </Pressable>
                        <Pressable onPress={() => navigation.navigate("TallesScreen")}>
                            <Text>Talles</Text>
                        </Pressable>
                    </View>
                </View>

                <Text style = {styles.subtitle}>Cantidad total: {productos.length}</Text>

                {productos.length === 0 && (
                    <Text>No hay productos agregados</Text>
                )}

                {productos.map((producto) => (
                    <View key = {producto.id} style = {styles.productContainer}>
                            <ProductItem
                                key={producto.id}
                                producto={producto}
                                onAgregar={(variante) => moverStock(variante, producto.id, +1)}
                                onQuitar={(variante) => moverStock(variante, producto.id, -1)}
                                onDelete={() => eliminarProducto(producto)}
                            />
                            <View>
                                <Pressable onPress={() => navigation.navigate("EditProduct", {product: producto.id})}>
                                    <Text>✏️ Editar</Text>
                                </Pressable>
                                {/* <Pressable onPress ={() => onGenerarQr(producto)}>
                                    <Text>Generar codigo de barra</Text>
                                </Pressable> */}
                            </View>
                        </View>
                    )
                )}
                <GenerarCodigoButton 
                    visible = {showQR}
                    stockItem={selectedStockProduct}
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