import {View, Text, Pressable, StyleSheet} from "react-native"; 


export default function MovementsScreens({movements, onClear}: any) {
    return (
        <View style={styles.container}>
            <Pressable onPress = {onClear}>
                <Text>🗑️ Borrar Movimientos</Text>
            </Pressable>

            {movements.map((m : any) => (
                <View key={m.id}>
                    <Text style = {{color : m.type === "ENTRADA" ? "green" : "red"}}>{m.productName} - {m.type} - {m.cantidad}</Text>
                </View>
            ))}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        padding : 16
    }
})