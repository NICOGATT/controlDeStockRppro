import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { apiFetch } from "../api/apiClient";
import { Prefactura } from "../types/Prefactura";
import { useNavigation } from "@react-navigation/native";

export default function PrefacturasScreen() {
    const navigation = useNavigation<any>();
    const [prefacturas, setPrefacturas] = useState<Prefactura[]>([]);

    useEffect(() => {
        loadPrefacturas();
    }, []);

    async function loadPrefacturas() {
        try {
            const data = await apiFetch<Prefactura[]>('/api/preFacturas');
            setPrefacturas(data);
        } catch (e) {
            Alert.alert('Error', 'No se pudieron cargar las prefacturas');
        }
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={prefacturas}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => navigation.navigate('Prefactura', { prefacturaId: item.id })}
                    >
                        <Text style={styles.cardTitle}>Prefactura #{item.id}</Text>
                        <Text style={styles.muted}>Cliente: {item.cliente?.nombre || 'Sin cliente'}</Text>
                        <Text style={styles.muted}>Fecha: {new Date(item.fecha).toLocaleDateString()}</Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.muted}>No hay prefacturas</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: "#0b0b0d" },
    card: {
        backgroundColor: "#15151a",
        borderWidth: 1,
        borderColor: "#2a2a33",
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
    },
    cardTitle: { color: "white", fontWeight: "900", fontSize: 16 },
    muted: { color: "#9aa4b2", marginTop: 4 },
});
