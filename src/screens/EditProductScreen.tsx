import {useEffect, useMemo, useState} from "react" ; 
import {View, TextInput,  Pressable, Text, StyleSheet, Alert, ActivityIndicator} from "react-native";
import { apiFetch } from "../api/apiClient";

export default function EditProductScreen ({route, navigation} : any) {
    const {producto} = route.params;

    const [loading, setLoading] = useState(true)
    const [nombre, setNombre] = useState(producto?.nombre ?? "");
    const [tipoDePrenda, setTipoDePrenda] = useState(producto?.tipoDePrenda?.nombre ?? "");
    const [precio, setPrecio] = useState(String(producto?.precio ?? 0));

    const nombreValido = nombre.length > 0;
    const tipoDePrendaValido = tipoDePrenda.trim().length > 0;
    const precioNumber = Number(precio); 


    const precioValido = !isNaN(precioNumber) && precioNumber > 0;

    const formValido = nombreValido && precioValido && tipoDePrendaValido;
    useEffect(() => {
        if (!producto) {
            console.log('Producto no encontrado');
            Alert.alert('Error', 'Producto no encontrado'); 
            navigation.goBack(); 
            return; 
        }
        (async () => {
            try {
                setLoading(true)
                const data = await apiFetch<{id : number, nombre : string, precio : number}>(`/api/productos/${producto.id}`)
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
    }, [producto])

    async function handleSave() {
        if(!formValido) return;
        try {
            await apiFetch<{id : number, nombre : string, precio : number}>(`/api/productos/${producto.id}`, {
                method : "PUT", 
                body : {
                    nombre : nombre.trim(), 
                    tipoDePrenda : tipoDePrenda,
                    precio : Number(precio), 
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
                value = {precio} 
                onChangeText={setPrecio} 
                placeholder="Precio"
                keyboardType="numeric"
                style = {styles.input}
            />

            <TextInput 
                value = {tipoDePrenda}
                onChangeText={setTipoDePrenda}
                placeholder="Tipo de Prenda"
                style = {styles.input}
            />

            <Pressable onPress = {handleSave}  style = {styles.buttonSave}>
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
        backgroundColor : "green"
    }, 
    buttonSaveText : {
        color : "white", 
        fontWeight : "bold"
    }
})