import { View, TextInput,  Pressable, Text, StyleSheet} from "react-native";
import { useState} from "react";


export default function AddProductsScreen ({navigation, onAddProduct} : any) {
    const [nombre, setNombre] = useState(""); 
    
    const [stock, setStock] = useState(""); 
    
    const [precio, setPrecio] = useState(""); 

    const [stockDeseado, setStockDeseado] = useState("");

    const nombreValido = nombre.trim().length > 0;

    const stockValido = !isNaN(Number(stock)) && Number(stock) > 0; 
    
    const precioValido = !isNaN(Number(precio)) && Number(precio) > 0;

    const stockDeseadoValido = !isNaN(Number(stockDeseado)) && Number(stockDeseado) > 0;

    const formValido = nombreValido && stockValido && precioValido && stockDeseadoValido;

    function handleSave() {
        if(!formValido) return;
        onAddProduct(nombre, stock, stockDeseado, precio);
        navigation.goBack()
    }

    return (
        <View style = {styles.container}>
            <TextInput 
                placeholder="Nombre"
                value={nombre}
                autoFocus
                onChangeText={(text) => setNombre(text)}
                style = {[styles.input, !nombreValido && styles.inputError]}
            />
            <TextInput
                placeholder="Stock"
                value={stock}
                keyboardType="numeric"
                onChangeText={setStock}
                style = {[styles.input, !stockValido && styles.inputError]}
            />
            <TextInput
                placeholder="Stock deseado"
                value={stockDeseado}
                keyboardType="numeric"
                onChangeText={setStockDeseado}
                style = {[styles.input, !stockDeseadoValido && styles.inputError]}
            />
            <TextInput
                placeholder="Precio"
                value={precio}
                keyboardType="numeric"
                onChangeText={setPrecio}
                style = {[styles.input, !precioValido && styles.inputError]}
            />
            <Pressable onPress={handleSave} disabled = {!formValido} style = {[
                styles.button, 
                !formValido && styles.buttonDisabled
            ]}>
                <Text style={styles.buttonText}>Guardar</Text>
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({
    container : {
        padding : 16
    }, 
    input : {
        borderWidth : 1, 
        borderColor : "#ccc", 
        padding : 10, 
        marginBottom : 12,
        borderRadius : 6, 
        backgroundColor : "white"
    }, 
    inputError : {
        borderColor : "red"
    }, 
    button : {
        backgroundColor : "#4CAF50", 
        padding : 12,
        borderRadius : 6, 
        alignItems : "center"
    },
    buttonDisabled : {
        backgroundColor : "#999",
    },
    buttonText : {
        color : "white", 
        fontWeight : "bold"
    }
    
})