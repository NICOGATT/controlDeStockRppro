import { View, TextInput,  Pressable, Text, StyleSheet} from "react-native";
import { useState} from "react";


export default function AddProductsScreen ({navigation, onAddProduct} : any) {
    const [nombre, setNombre] = useState(""); 
    
    const [stock, setStock] = useState(""); 
    
    const [precio, setPrecio] = useState(""); 

    function handleSave() {
        onAddProduct(nombre, stock, precio);
        navigation.goBack()
    }

    return (
        <View style = {styles.container}>
            <TextInput 
                placeholder="Nombre"
                value={nombre}
                autoFocus
                onChangeText={(text) => setNombre(text)}
                style = {styles.input}
            />
            <TextInput
                placeholder="Stock"
                value={stock}
                keyboardType="numeric"
                onChangeText={setStock}
                style = {styles.input}
            />
            <TextInput
                placeholder="Precio"
                value={precio}
                keyboardType="numeric"
                onChangeText={setPrecio}
                style = {styles.input}
            />
            <Pressable onPress={handleSave}>
                <Text>Guardar</Text>
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({
    container : {
        padding : 16
    }, 
    input : {
        padding : 8
    }
})