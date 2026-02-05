import {View, Text, Pressable, StyleSheet, Platform} from "react-native"; 


export default function MovementsScreens({movements, onClear}: any) {
    return (
        <View style={styles.container}>
            <Pressable onPress = {onClear} style = {styles.deleteButton}>
                <Text style = {styles.deleteButtonText}>🗑️ Borrar Movimientos</Text>
            </Pressable>

            <View style = {styles.movimientos}>
                {movements.length === 0 ? (
                    <Text style = {styles.movimientoEmpty}> No hay movimientos registrados</Text>
                ):(
                    movements.map((m : any) => (
                        <View key={m.id} style = {styles.movimientosItem}>
                            <Text style  = {[styles.movimientoType, {color : m.type === "ENTRADA" ? "green" : "red" }]}>{m.type}</Text>
                            <Text>{m.productName} - (x{m.cantidad})</Text>
                            <Text style = {styles.movimientoDate}>{new Date(m.createAt).toLocaleString()}</Text>
                        </View>
                    ))
                )}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor : "#20a4f3",
        padding : 16, 
        width: "100%", 
        height: "100%"
    }, 
    deleteButton : {
        backgroundColor : "#011627", 
        justifyContent : "center",
        alignItems : "center",
        padding : 10,
        borderRadius : 8,
        marginTop : 10,  
        width : Platform.OS === "web" ? "15%" : "50%"
    }, 
    deleteButtonText : {
        color : "white",
        fontWeight : "bold"
    }, 
    movimientos : {
        borderRadius : 8, 
        overflow : "hidden",
        width : "100%",
        marginTop : 10
    }, 
    movimientoEmpty : {
        padding : 10, 
        color : "#f6f7f8", 
        fontSize : 20
    }, 
    movimientosItem : {
        padding : 10, 
        borderBottomWidth : 1,
        borderColor : "#ddd", 
        backgroundColor : "#f6f7f8"
    }, 
    movimientoType : {
        fontWeight : "bold"
    },
    movimientoDate : {
        color : "gray",
        fontSize : 12
    }
})