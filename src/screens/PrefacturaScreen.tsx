import React, {useEffect, useState} from "react"; 
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View } from "react-native";
import { confirmarPedido, getPrefactura } from "../types/api";
import { Prefactura } from "../types/Prefactura";

const formatMoney = (n: number) => 
    new Intl.NumberFormat("es-AR", {style : "currency", currency : "ARS"}).format(n); 

export function PrefacturaScreen({route, navigation}: any) {
    const {pedidoId} = route.params as {pedidoId: string}; 

    const [data, setData] = useState<Prefactura | null>(null); 
    const [loading, setLoading] = useState(true); 
    const [confirming, setConfirming] = useState(true); 

    async function load() {
        try {
            setLoading(true); 
            const res = await getPrefactura(pedidoId); 
            setData(res); 
        } catch (e : any) {
            Alert.alert("Error", e.message ?? "Error cargando prefactura")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load();
    }, [pedidoId]); 

    async function onConfirmar() { 
        if(!data) return ; 

        if(data.items.length === 0 ) {
            Alert.alert("Pedido vacio", "Agrega al menos un prducto"); 
            return ;
        }

        Alert.alert(
            "Confirmar pedido", 
            "¿Queres confirmar este pedido?",
            [
                {text : "Cancelar", style : "cancel"}, 
                {
                    text : "Confirmar", 
                    style : "default", 
                    onPress : async () => {
                        try {
                            setConfirming(true); 
                            await confirmarPedido(pedidoId); 
                            Alert.alert("Listo", "Pedido confirmado.");
                            navigation.goBack()
                        } catch (e : any) {
                            Alert.alert("Error", e.message ?? "No se pudo confirmar"); 
                        }finally {
                            setConfirming(false);
                        }
                    },
                },
            ]
        );
    }

    if(loading) {
        return (
            <View style = {{flex : 1, alignItems : "center", justifyContent : "center"}}>
                <ActivityIndicator/>
                <Text style = {{marginTop : 10}}>Cargando prefactura....</Text>
            </View>
        );
    }

    if(!data) {
        return (
            <View style = {{flex : 1, padding : 16}}>
                <Text>No se pudo cargar.</Text>
                <TouchableOpacity onPress={load} style = {{marginTop : 12}}>
                    <Text style = {{fontWeight : "700"}}>Reintentar</Text>
                </TouchableOpacity>
            </View>
        )
    }

    return (
        <View style = {{flex: 1, padding : 16}}>
            {/*Cliente */}
            <View style = {{marginBottom : 12}}>
                <Text style = {{fontSize : 18, fontWeight : "800"}}>Prefactura</Text>
                <Text style = {{marginTop : 8, fontWeight : "700"}}>{data.cliente.nombre}</Text>
                {!!data.cliente.telefono && <Text>Tel : {data.cliente.telefono}</Text>}
                <Text>Estado : {data.pedido.estado}</Text>
            </View>

            {/*Items */}
            <FlatList
                data = {data.items}
                keyExtractor={(it) => it.id}
                renderItem = {({item}) => (
                    <View style = {{paddingVertical : 10, borderBottomWidth: 1, borderColor: "#ddd"}}>
                        <Text style = {{fontWeight : "700"}}>{item.nombre}</Text>
                        <Text>{formatMoney(item.precioUnitario)} x {item.cantidad} = {formatMoney(item.subtotal)}</Text>
                    </View>
                )}
                ListEmptyComponent={<Text>Este pedido no tiene productos</Text>}
            />
            {/*Total de acciones */}
            
            <View style = {{marginTop : 12}}>
                <Text style = {{fontSize : 18, fontWeight : "700"}}>Total : {formatMoney(data.totales.total)}</Text>

                <TouchableOpacity
                    disabled = {confirming || data.pedido.estado !== "BORRADOR"}
                    onPress={onConfirmar}
                    style = {{
                        marginTop : 12, 
                        padding : 14, 
                        borderRadius : 10, 
                        alignItems : "center", 
                        opacity : confirming || data.pedido.estado !== "BORRADOR" ? 0.5 : 1, 
                        backgroundColor : "#111"
                    }}
                >
                    <Text style = {{color: "white", fontWeight : "800"}}>{confirming ? "Confimando..." : "Confirmar pedido"}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style = {{
                        marginTop : 10, 
                        padding : 14, 
                        borderRadius : 10, 
                        alignItems : "center"
                    }}
                >
                    <Text style = {{fontWeight : "800"}}>Volver a editar</Text>
                </TouchableOpacity>
            </View>

        </View>
    )
}