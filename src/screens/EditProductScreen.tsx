import {useEffect, useMemo, useState} from "react" ; 
import {View, TextInput,  Pressable, Text, StyleSheet, Alert, ActivityIndicator} from "react-native";
import { apiFetch } from "../api/apiClient";

export default function EditProductScreen ({route, navigation, onUpdateProduct} : any) {
    const {product} = route.params;

    const [loading, setLoading] = useState(true)
    const [nombre, setNombre] = useState(product.nombre);
    const [stock, setStock]= useState(String(product.cantidadInicial));
    const [precio, setPrecio] = useState(String(product.precio));

    const nombreValido = nombre.trim().length > 0;
    const stockNumber = Number(stock); 
    const precioNumber = Number(precio); 

    const stockValido = !isNaN(stockNumber) && stockNumber > 0;
    const precioValido = !isNaN(precioNumber) && precioNumber > 0;

    const formValido = nombreValido && stockValido && precioValido;

    useEffect(() => {
        (async () => {
            try {
                setLoading(true)
                const data = await apiFetch<{nombre : string, precio : number}>(`/api/productos/${product.productoId}`)
                setNombre(data.nombre ?? "");
                setPrecio(String(data.precio ?? ""));
            } catch (error) {
                console.log('Error cargando producto ', error); 
                Alert.alert('Error', 'No se pudo cargar el producto'); 
                navigation.goBack()
            } finally{
                setLoading(false)
            }
        })();
    }, [product.productoId])

    async function handleSave() {
        if(!formValido) return;
        try {
            await apiFetch(`/api/productos/${product.productoId}`, {
                method : "PUT", 
                body : {
                    nombre : nombre.trim(), 
                    precio : Number(precio)
                },
            }); 
            navigation.goBack()
        } catch (error) {
            console.log('Error actualizado producto', error)
            Alert.alert('Error', 'No se pudo actualizar producto')
        }
    }
    if (loading) return <ActivityIndicator style ={{marginTop : 20}}/>

    return (
        <View style = {styles.container}>
            <TextInput
                value = {nombre} 
                onChangeText={setNombre} 
                placeholder="Nombre"
                style = {styles.input}
            />
            <TextInput
                value = {stock} 
                onChangeText={setStock} 
                placeholder="Stock"
                keyboardType="numeric"
                style = {styles.input}
            />
            <TextInput
                value = {precio} 
                onChangeText={setPrecio} 
                placeholder="Precio"
                keyboardType="numeric"
                style = {styles.input}
            />

            <Pressable onPress = {handleSave} disabled = {!formValido} style = {[styles.buttonSave, {backgroundColor : formValido ? "#4CAF50" : "#999"}]}>
                <Text style = {styles.buttonSaveText}>Guardar Cambios</Text>
            </Pressable>
        </View>
    )
}


const styles = StyleSheet.create({
    container : {
        padding: 16, 
        gap : 10
    }, 
    input : {
        borderWidth : 1,
        padding : 10, 
        borderRadius : 6, 
        backgroundColor : "white"
    }, 
    buttonSave : {
        padding : 12, 
        borderRadius : 6, 
        alignItems : "center",
    }, 
    buttonSaveText : {
        color : "white", 
        fontWeight : "bold"
    }
})