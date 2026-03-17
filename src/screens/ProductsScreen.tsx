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
import AgregarVariante from "../components/AgregarVariante";
import { Color } from "../types/Color";
import { Talle } from "../types/Talle";

export default function ProductsScreen({
    navigation,
    route,
}: any) {
    const [showQR, setShowQR] = useState(false);
    const [productos, setProductos] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true); 
    const [selectedStockProduct, setSelectStockProduct] = useState<StockProducto | null>(null); 
    const qrRef = useRef<any>(null);
    const [producto, setProducto] = useState<Product | null>(null);
    const [showAgregarVariante, setShowAgregarVariante] = useState(false); 
    const [productoSeleccionado, setProductoSeleccionado] = useState<Product | null>(null);
    const [colores, setColores] = useState<Color[]>([]); 
    const [talles, setTalles] = useState<Talle[]>([]); 

    const abrirAgregarVariante = (producto: Product) => {
            setProductoSeleccionado(producto);
            setShowAgregarVariante(true);
        }
    
        const cerrarAgregarVariante = () => {
            setProductoSeleccionado(null);
            setShowAgregarVariante(false);
        }

    async function cargarProductos() {
        setLoading(true); 
        try {
            const data = await apiFetch<Product[]>('/api/productos')
            setProductos(data)
        } finally{
            setLoading(false)
        }
    }

    const cargarColores = async() => {
        try {
            const data = await apiFetch<Color[]>('/api/colores')
            setColores(data)
        } catch (error) {
            console.log('Error cargando colores', error)
        }
    }

    const cargarTalles = async() => {
        try {
            const data = await apiFetch<Talle[]>('/api/talles')
            setTalles(data)
        } catch (error) {
            console.log('Error cargando talles', error)
        }
    }

    useFocusEffect(
        useCallback(() => {
            cargarProductos();
            cargarColores();
            cargarTalles();
        }, [])
    );

    useEffect(() => {
        const qrData = (route.params as { scannedQrData?: string })?.scannedQrData;
        if (!qrData || productos.length === 0) return;
        const resultado = leerCodigoQr(qrData);
        if (resultado) {
            setSelectStockProduct(resultado.stockProducto);
            setShowQR(true);
            setProducto(resultado.producto);
        }
        navigation.setParams({ scannedQrData: undefined });
    }, [productos, route.params]);

    function onGenerarQr(producto : Product, productoStock : StockProducto) {
        setProducto(producto);
        setSelectStockProduct(productoStock); 
        setShowQR(true);
    }

    /**
     * Lee un código QR con formato rppro:stock:productoId:talleId:colorId
     * y devuelve el Producto y el StockProducto relacionados, o null si no existe.
     */
    function leerCodigoQr(
        data: string
      ): { producto: Product; stockProducto: StockProducto } | null {
        const parts = data.trim().split(":");
        if (parts.length < 5 || parts[0] !== "rppro" || parts[1] !== "stock") return null;
      
        const productoId = parts[2];
        const talleId = Number(parts[3]);
        const colorId = Number(parts[4]);
      
        if (productoId === undefined || [talleId, colorId].some(Number.isNaN)) return null;
      
        const producto = productos.find((p) => p.id === productoId);
        if (!producto?.stockProductos) return null;
      
        const stockProducto = producto.stockProductos.find(
          (sp) => sp.talleId === talleId && sp.colorId === colorId
        );
        if (!stockProducto) return null;
      
        return { producto, stockProducto };
      }

    async function moverStock(variante : StockProducto, productoId : string, delta: number) {
        try {
            await apiFetch<StockProducto>('/api/stockProductos', {
                method : "PUT", 
                body : {
                    productoId : productoId, 
                    coloresYTalles : [
                        {
                            color : variante.color?.nombre, 
                            talle : variante.talle?.nombre,
                            cantidad : variante.stock + delta
                        }
                    ]
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
                        <Pressable onPress={() => navigation.navigate("Prefacturas")}>
                            <Text>Prefacturas</Text>
                        </Pressable>
                    </View>
                </View>

                <Text style = {styles.subtitle}>Cantidad total: {productos.length}</Text>

                {productos.length === 0 && (
                    <Text>No hay productos agregados</Text>
                )}
                
                <View>
                    {productos.map((producto) => (
                        <View key = {producto.id} style = {styles.productContainer}>
                                <ProductItem
                                    key={producto.id}
                                    producto={producto}
                                    onAgregar={(variante) => moverStock(variante, producto.id, +1)}
                                    onQuitar={(variante) => moverStock(variante, producto.id, -1)}
                                    onDelete={() => eliminarProducto(producto)}
                                    onAgregarVariante={abrirAgregarVariante}
                                />
                                <View>
                                    <Pressable onPress={() => navigation.navigate("EditProduct", {producto : producto})}>
                                        <Text>✏️ Editar</Text>
                                    </Pressable>
                                    {producto.stockProductos?.map((sp) => (
                                        <Pressable key={`${sp.productoId}-${sp.talleId}-${sp.colorId}`} onPress={() => onGenerarQr(producto, sp)}>
                                            <Text>📲 Generar QR</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>
                        )
                    )}
                </View>
                {/* 🔹 Modal (también fuera del map) */}
                <AgregarVariante
                    visible={showAgregarVariante}
                    producto={productoSeleccionado}
                    colores={colores}
                    talles={talles}
                    onClose={cerrarAgregarVariante} 
                    onCreated={cargarProductos}           
                />
                <GenerarCodigoButton 
                    visible = {showQR}
                    stockItem={selectedStockProduct}
                    producto={producto}
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
        flexDirection : Platform.OS === "web" ? "row" : "column",
        justifyContent : Platform.OS === "web" ? "space-between" : "flex-start",
        alignItems : Platform.OS === "web" ? "center" : "flex-start",
        padding : 8,
        borderRadius : 8,
        marginBottom : 10,
    }
})