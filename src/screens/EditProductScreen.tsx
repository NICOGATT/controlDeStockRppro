import {useMemo, useState} from "react" ; 
import {View, TextInput,  Pressable, Text, StyleSheet} from "react-native";

export default function EditProductScreen ({route, navigation, onUpdateProduct} : any) {
    const {product} = route.params;

    const [nombre, setNombre] = useState(product.nombre);
    const [stock, setStock]= useState(String(product.cantidadInicial));
    const [precio, setPrecio] = useState(String(product.precio));

    const nombreValido = nombre.trim().length > 0;
    const stockNumber = Number(stock); 
    const precioNumber = Number(precio); 

    const stockValido = !isNaN(stockNumber) && stockNumber > 0;
    const precioValido = !isNaN(precioNumber) && precioNumber > 0;

    const formValido = nombreValido && stockValido && precioValido;

    function handleSave() {
        if(!formValido) return;
        const ok = onUpdateProduct(product.id, {
            nombre : nombre.trim(),
            cantidadInicial : stockNumber,
            precio : precioNumber
        });
        if(ok) navigation.goBack();
    }

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