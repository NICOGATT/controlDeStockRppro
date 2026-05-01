import {useCallback, useState} from "react";
import {View, Text, Pressable, StyleSheet, Platform, Alert} from "react-native";
import {useFocusEffect} from "@react-navigation/native";
import { colors } from "../theme/colors";
import {deleteMovement, loadMovements} from "../storage/movementStorage";
import {Movement} from "../types/Movement";

type MovementsScreenProps = {
    movements?: Movement[];
    onClear?: () => void | Promise<void>;
};

export default function MovementsScreens({movements, onClear}: MovementsScreenProps) {
    const [storedMovements, setStoredMovements] = useState<Movement[]>([]);

    const loadStoredData = useCallback(async () => {
        if (Array.isArray(movements)) {
            setStoredMovements(movements);
            return;
        }

        const savedMovements = await loadMovements();
        setStoredMovements(Array.isArray(savedMovements) ? savedMovements : []);
    }, [movements]);

    useFocusEffect(
        useCallback(() => {
            void loadStoredData();
        }, [loadStoredData])
    );

    const handleClear = useCallback(async () => {
        try {
            if (onClear) {
                await onClear();
            } else {
                await deleteMovement();
            }

            setStoredMovements([]);
        } catch (error) {
            console.error("Error borrando movimientos", error);
            Alert.alert("Error", "No se pudieron borrar los movimientos.");
        }
    }, [onClear]);

    const safeMovements = Array.isArray(movements) ? movements : storedMovements;

    return (
        <View style={styles.container}>
            <Pressable onPress={() => void handleClear()} style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>Borrar Movimientos</Text>
            </Pressable>

            <View style={styles.movimientos}>
                {safeMovements.length === 0 ? (
                    <Text style={styles.movimientoEmpty}>No hay movimientos registrados</Text>
                ) : (
                    safeMovements.map((m) => (
                        <View key={m.id} style={styles.movimientosItem}>
                            <Text style={[styles.movimientoType, {color: m.type === "ENTRADA" ? colors.success : colors.error}]}>
                                {m.type}
                            </Text>
                            <Text style={styles.movimientoProduct}>{m.productName} - (x{m.cantidad})</Text>
                            <Text style={styles.movimientoDate}>{new Date(m.createAt).toLocaleString()}</Text>
                        </View>
                    ))
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.backgroundDark,
        padding: 16,
        width: "100%",
        height: "100%",
        paddingBottom: 90,
    },
    deleteButton: {
        backgroundColor: colors.error,
        justifyContent: "center",
        alignItems: "center",
        padding: 10,
        borderRadius: 8,
        marginTop: 10,
        width: Platform.OS === "web" ? "15%" : "50%",
    },
    deleteButtonText: {
        color: colors.textInverse,
        fontWeight: "bold",
    },
    movimientos: {
        borderRadius: 8,
        overflow: "hidden",
        width: "100%",
        marginTop: 10,
    },
    movimientoEmpty: {
        padding: 10,
        color: colors.textInverse,
        fontSize: 20,
    },
    movimientosItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    movimientoType: {
        fontWeight: "bold",
    },
    movimientoProduct: {
        color: colors.textPrimary,
    },
    movimientoDate: {
        color: colors.textLight,
        fontSize: 12,
    },
});
