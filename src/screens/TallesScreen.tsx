import {useState, useEffect} from 'react'; 
import { View, Text, Pressable, FlatList, StyleSheet, TextInput } from 'react-native';
import { apiFetch } from '../api/apiClient';
import { Talle } from '../types/Talle';

export default function TallesScreen({navigation} : any) {
    const [talles, setTalles] = useState<Talle[]>([]); 
    const [nombre , setNombre] = useState("");

    useEffect(() => {
        cargarTalles();
    }, []); 

    async function cargarTalles() {
        try {
            const data = await apiFetch<Talle[]>('/api/talles'); 
            setTalles(data)
        } catch (error) {
            console.log('Error cargando talles', error)
        }
    }

    async function agregarTalle() {
        if (!nombre.trim()) return ; 
        try {
            await apiFetch('/api/talles', {
                method : "POST",
                body : {nombre}
            })

            setNombre(''); 
            await cargarTalles()
        } catch (error) {
            console.log('Error cargando talle: ' , error)
        }
    }

    async function eliminarTalle(id : number) {
        try {
            await apiFetch(`/api/talles/${id}`,{method : "DELETE"});
            await cargarTalles(); 
        } catch (error) {
            console.log('Error eliminando talle: ', error)
        }
    }

    return(
        <View style = {styles.container}>
            <Text style = {styles.titulo}>Talles</Text>
            {/* Input para agregar */}
            <View style = {styles.fila}>
                <TextInput
                    style = {styles.input}
                    placeholder='Ej : L, XL....'
                    value={nombre}
                    onChangeText={setNombre}
                />
                <Pressable
                    style = {[styles.boton, !nombre.trim() && {opacity : 0.4}]}
                    onPress={agregarTalle}
                    disabled = {!nombre.trim()}
                >
                    <Text style = {styles.botonTexto}> Agregar</Text>
                </Pressable>
            </View>
            {/* Lista de colores */}
            <FlatList
                data = {talles}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({item}) => (
                    <View style = {styles.item}>
                        <Text style = {styles.itemTexto}>{item.nombre}</Text>
                        <Pressable onPress={() => eliminarTalle(item.id)}>
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