import {useState, useEffect} from 'react'; 
import { View, Text, Pressable, FlatList, StyleSheet, TextInput } from 'react-native';
import { apiFetch } from '../api/apiClient';
import { Color } from '../types/Color';

export default function ColoresScreen({navigation} : any) {
    const [colores, setColores] = useState<Color[]>([]); 
    const [nombre , setNombre] = useState("");

    useEffect(() => {
        cargarColores();
    }, []); 

    async function cargarColores() {
        try {
            const data = await apiFetch<Color[]>('/api/colores'); 
            setColores(data)
        } catch (error) {
            console.log('Error cargando colores', error)
        }
    }

    async function agregarColor() {
        if (!nombre.trim()) return ; 
        try {
            await apiFetch('/api/colores', {
                method : "POST",
                body : {nombre}
            })

            setNombre(''); 
            await cargarColores()
        } catch (error) {
            console.log('Error cargando color: ' , error)
        }
    }

    async function eliminarColor(id : number) {
        try {
            await apiFetch(`/api/colores/${id}`,{method : "DELETE"});
            await cargarColores(); 
        } catch (error) {
            console.log('Error eliminando color: ', error)
        }
    }

    return(
        <View style = {styles.container}>
            <Text style = {styles.titulo}>Colores</Text>
            {/* Input para agregar */}
            <View style = {styles.fila}>
                <TextInput
                    style = {styles.input}
                    placeholder='Ej : Rojo, Azul...'
                    value={nombre}
                    onChangeText={setNombre}
                />
                <Pressable
                    style = {[styles.boton, !nombre.trim() && {opacity : 0.4}]}
                    onPress={agregarColor}
                    disabled = {!nombre.trim()}
                >
                    <Text style = {styles.botonTexto}> Agregar</Text>
                </Pressable>
            </View>
            {/* Lista de colores */}
            <FlatList
                data = {colores}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({item}) => (
                    <View style = {styles.item}>
                        <Text style = {styles.itemTexto}>{item.nombre}</Text>
                        <Pressable onPress={() => eliminarColor(item.id)}>
                            <Text style = {styles.eliminar}>Eliminar</Text>
                        </Pressable>
                    </View>
                    
                )}
            />
        </View>
    )
}



const styles = StyleSheet.create({
    container : {
        flex : 1,
        padding : 16
    }, 
    titulo : {
        fontSize : 24,
        fontWeight : "700", 
        marginBottom : 16
    }, 
    fila : {
        flexDirection : "row",
        gap : 8, 
        marginBottom : 16
    }, 
    input : {
        flex : 1,
        borderWidth : 1, 
        borderColor : "#ccc", 
        borderRadius : 8, 
        padding : 10
    }, 
    boton : {
        backgroundColor : "#111",
        padding : 10, 
        borderRadius : 8, 
        justifyContent : "center"
    }, 
    botonTexto : {
        color : "white", 
        fontWeight : "700"
    }, 
    item : {
        flexDirection: "row", 
        justifyContent : 'space-between', 
        padding : 12, 
        borderBottomWidth : 1, 
        borderColor : "#eee"
    }, 
    itemTexto : {
        fontSize : 16
    }, 
    eliminar : {
        fontSize: 18
    }
})