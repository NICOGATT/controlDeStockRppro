import React, {useEffect, useMemo, useState} from "react"; 
import {Alert, FlatList, Text, TextInput, TouchableOpacity,View} from "react-native"; 
import { productos } from "../types/mockData";

type Item = { 
    id: string; 
    productoId: number; 
    nombre: string;
    stock: number; 
    precio: number
};

const formatMoney = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);

export default function ArmarPedidoScreen({route, navigation} : any) {
    const {pedidoId, preselectProductoId} = route.params as {pedidoId:string, preselectProductoId ? : number};

    const [query, setQuery] = useState(""); 
    const [cantidad, setCantidad] = useState("1"); 
    const [items, setItems] = useState<Item[]>([]); 

    const resultados = useMemo(() => {
        const q = query.trim().toLowerCase(); 
        if(!q) return; 
        return productos.filter((p) => p.nombre.toLowerCase().includes(q))
    }, [query]); 

    function  agregarProducto(productoId:number, cant:number) {
        const prod = productos.find((p) => p.id === productoId)
        if(!prod) return; 

        setItems(prev => {
            const existente = prev.find( it => it.productoId === productoId)
            if(existente) {
                return prev.map((it) => 
                    it.productoId === productoId ? {...it,stock : it.stock + cant} : it
                )
            }
            return [...prev, { id: `it-${Date.now()}`, productoId, nombre: prod.nombre, stock : cant, precio : prod.precio}];
        })
    }

    useEffect(() => {
        if (preselectProductoId) {
            {/*Si viene del scanner agregamos uno automaticamente */}
            agregarProducto(preselectProductoId, 1)
        }
    }, [preselectProductoId]);

    const total = useMemo(() => items.reduce((acc, it) => acc + it.precio * it.stock, 0), [items]); 

    const onAgregarBusqueda = (productId:number) => {
        const cant = Number(cantidad);
        if (!Number.isFinite(cant) || cant <= 0) {
            Alert.alert("Cantidad invalida", "Pone una cantidad mayor a 0."); 
            return; 
        }
        agregarProducto(productId, cant); 
        setQuery(""); 
        setCantidad("1"); 
    }

    return ( 
        <View style = {{flex : 1, padding : 16}}>
            <Text style = {{fontSize : 18, fontWeight : "800"}}>Armar pedido</Text>
            <Text style = {{color : "#555", fontWeight : "700", marginTop: 4}}>Peodop : {pedidoId}</Text>

            {/*Buscar */}
            <View style = {{marginTop: 14}}>
                <Text style = {{fontWeight : "700"}}>Buscar producto</Text>
                <TextInput
                    value = {query}
                    onChangeText={setQuery}
                    placeholder="Ej: Delantal..."
                    style = {{borderWidth : 1, borderColor : "#ddd", borderRadius : 10, padding : 12, marginTop : 8 }}
                />
                <View style = {{flexDirection : "row", gap : 10, marginTop: 10}}>
                    <TextInput
                        value = {cantidad}
                        onChangeText={setCantidad}
                        keyboardType="numeric"
                        placeholder="Cant."
                        style = {{flex : 0.3, borderWidth : 1, borderColor : "#ddd", borderRadius : 10, padding : 12}}
                    />
                    <TouchableOpacity
                        onPress={() => navigation.navigate("BarcodeScanScreen", {pedidoId})}
                        style = {{flex : 0.7, backgroundColor : "#111", padding : 12, borderRadius: 10, alignItems: "center"}}
                    >
                        <Text style = {{color : "white", fontWeight : "800"}}> Escanear codigo</Text>
                    </TouchableOpacity>
                </View>
            </View>
            {/*Resultados */}
            {resultados?.length && (
                <View style = {{marginTop : 12, padding: 12, borderWidth : 1, borderColor : "#eee", borderRadius: 12}}>
                    <Text style = {{fontWeight :"800", marginBottom : 8}}>Resultados</Text>
                    {resultados?.map((p) => (
                        <TouchableOpacity style = {{paddingVertical: 10}} key={p.id} onPress={() => onAgregarBusqueda(p.id)}>
                            <Text style = {{fontWeight : "800"}}>{p.nombre}</Text>
                            <Text>{formatMoney(p.precio)} · Stock : {p.stock}</Text>
                            <Text style = {{color : "#333", marginTop : 2}}>Toca para agregar</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/*Items */}

            <View style = {{marginTop : 16, flex: 1}}>  
                <Text style = {{fontWeight : "800", marginBottom: 8}}>Prodctos del pedido</Text>
                <FlatList
                    data = {items}
                    keyExtractor={(it) => it.id}
                    renderItem= {({item}) => (
                        <View style = {{paddingVertical : 10, borderBottomWidth : 2, borderColor : "#eee"}}>
                            <Text style = {{fontWeight : "700"}}>{item.nombre}</Text>
                            <Text>{formatMoney(item.precio)} x {item.stock} = {formatMoney(item.precio * item.stock)}</Text>
                        </View>
                    )}
                    ListEmptyComponent={<Text style = {{color : "#666"}}>Todavia no agregaste ningun producto</Text>}
                />
            </View>

            {/*Footer */}
            <View style = {{marginTop: 10}}>
                <Text style = {{fontSize : 18, fontWeight : "800"}}>Total : {formatMoney(total)}</Text>
                <TouchableOpacity 
                    onPress={() => navigation.navigate("Prefactura", {pedidoId})}
                    style = {{marginTop : 10, backgroundColor : "#111", padding : 14, borderRadius : 12, alignItems : "center"}}
                >
                    <Text style = {{color : "white", fontWeight : "800"}}>Ver prefactura</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}  