import {useEffect, useMemo, useState} from "react" ; 
import {View, TextInput, Text, StyleSheet, Alert, ActivityIndicator, Pressable} from "react-native";
import { apiFetch } from "../api/apiClient";
import { TipoDePrenda } from "../types/TipoDePrenda";
import { colors } from "../theme/colors";

export default function EditProductScreen ({route, navigation} : any) {
    const {producto} = route.params;

    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState({
        nombre : producto?.nombre ?? "", 
        precio : String(producto?.precio ?? ""), 
        tipoDePrenda : producto?.tipoDePrenda ?? null as TipoDePrenda | null, 
    })

    const nombreValido = form.nombre.length > 0;
    const tipoDePrendaValido = form.tipoDePrenda?.nombre.trim().length > 0;
    const precioNumber = Number(form.precio); 


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
                const data = await apiFetch<{id : number, nombre : string, precio : number, tipoDePrenda : TipoDePrenda}>(`/api/productos/${producto.id}`)
                setForm(prev => ({
                    ...prev,
                    nombre: data.nombre ?? "",
                    precio: String(data.precio ?? ""),
                    tipoDePrenda: data.tipoDePrenda ?? null,
                }));
            } catch (error) {
                console.log('Error cargando producto ', error); 
                Alert.alert('Error', 'No se pudo cargar el producto'); 
                navigation.goBack()
            } finally{
                setLoading(false)
            }
        })();
    }, [producto])

    const handleChange = (campo : string, valor : string) => {
        setForm(prev => ({
            ...prev, 
            [campo] : valor
        }))
    }
    async function handleSave() {
        if(!formValido) return;
        try {
            await apiFetch<{id : string, nombre : string, precio : number, tipoDePrenda : TipoDePrenda}>(`/api/productos/${producto.id}`, {
                method : "PUT", 
                body : {
                    // nombre : form.nombre.trim(), 
                    tipoDePrenda : form.tipoDePrenda?.nombre,
                    precio : Number(form.precio)
                },
            }); 
            navigation.goBack()
        } catch (error) {
            console.log('Error actualizado producto', error)
            Alert.alert('Error', 'No se pudo actualizar producto')
        }
    }
    if (loading) return <ActivityIndicator style={{marginTop : 20}}/>

    return (
        <View style={styles.container}>
            <TextInput
                value = {form.nombre} 
                onChangeText={(text) => handleChange("nombre", text)} 
                placeholder="Nombre"
                style = {styles.input}
            />
            <TextInput
                value = {form.precio} 
                onChangeText={(text) => handleChange('precio', text)} 
                placeholder="Precio"
                keyboardType="numeric"
                style = {styles.input}
            />

            <TextInput 
                value = {form.tipoDePrenda?.nombre ?? ""}
                onChangeText={(text) => {
                    setForm(prev => ({
                        ...prev, 
                        tipoDePrenda : {
                            ...prev.tipoDePrenda!, 
                            nombre : text
                        }
                    }))
                }}
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
        gap : 10,
        backgroundColor: colors.backgroundDark
    }, 
    input : {
        borderWidth : 1,
        padding : 10, 
        borderRadius : 6, 
        backgroundColor : colors.surface
    }, 

    buttonSave : {
        padding : 12, 
        borderRadius : 6, 
        alignItems : "center",
        backgroundColor : colors.success
    }, 
    buttonSaveText : {
        color : colors.textInverse, 
        fontWeight : "bold"
    }
})