import { useEffect, useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from "react-native";
import { apiFetch } from "../api/apiClient";
import { TipoDePrenda } from "../types/TipoDePrenda";
import { colors } from "../theme/colors";

interface ProductoResponse {
  id: string;
  nombre: string;
  precio: number;
  tipoDePrenda: TipoDePrenda | null;
}

export default function EditProductScreen({ route, navigation }: any) {
  const { producto } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: producto?.nombre ?? "",
    precio: String(producto?.precio ?? ""),
    tipoDePrenda: producto?.tipoDePrenda ?? (null as TipoDePrenda | null),
  });

  const nombreValido = form.nombre.trim().length > 0;
  const tipoDePrendaValido = (form.tipoDePrenda?.nombre ?? "").trim().length > 0;
  const precioNumber = Number(form.precio);
  const precioValido = !Number.isNaN(precioNumber) && precioNumber > 0;
  const formValido = nombreValido && precioValido && tipoDePrendaValido;

  useEffect(() => {
    if (!producto) {
      Alert.alert("Error", "Producto no encontrado");
      navigation.goBack();
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const data = await apiFetch<ProductoResponse>(`/api/productos/${producto.id}`);
        setForm({
          nombre: data.nombre ?? "",
          precio: String(data.precio ?? ""),
          tipoDePrenda: data.tipoDePrenda ?? null,
        });
      } catch (error) {
        console.log("Error cargando producto", error);
        Alert.alert("Error", "No se pudo cargar el producto");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [navigation, producto]);

  const handleChange = (campo: "nombre" | "precio", valor: string) => {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  async function handleSave() {
    if (!formValido || saving) return;

    try {
      setSaving(true);
      await apiFetch<ProductoResponse>(`/api/productos/${producto.id}`, {
        method: "PUT",
        body: {
          nombre: form.nombre.trim(),
          tipoDePrenda: form.tipoDePrenda?.nombre?.trim(),
          precio: Number(form.precio),
        },
      });
      navigation.goBack();
    } catch (error) {
      console.log("Error actualizando producto", error);
      Alert.alert("Error", "No se pudo actualizar el producto");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando producto...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.headerCard}>
        <Text style={styles.eyebrow}>Edicion de producto</Text>
        <Text style={styles.title}>{form.nombre || "Producto sin nombre"}</Text>
        <Text style={styles.subtitle}>
          Actualiza los datos principales manteniendo la misma interfaz visual del listado.
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaBadge}>
            <Text style={styles.metaLabel}>Articulo</Text>
            <Text style={styles.metaValue}>{producto.id}</Text>
          </View>
        </View>
      </View>

      <View style={styles.formCard}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            value={form.nombre}
            onChangeText={(text) => handleChange("nombre", text)}
            placeholder="Nombre del producto"
            placeholderTextColor={colors.textLight}
            style={[styles.input, !nombreValido && styles.inputError]}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Precio</Text>
          <TextInput
            value={form.precio}
            onChangeText={(text) => handleChange("precio", text.replace(/[^0-9.]/g, ""))}
            placeholder="Precio"
            placeholderTextColor={colors.textLight}
            keyboardType="numeric"
            style={[styles.input, !precioValido && styles.inputError]}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tipo de prenda</Text>
          <TextInput
            value={form.tipoDePrenda?.nombre ?? ""}
            onChangeText={(text) =>
              setForm((prev) => ({
                ...prev,
                tipoDePrenda: {
                  id: prev.tipoDePrenda?.id ?? 0,
                  nombre: text,
                },
              }))
            }
            placeholder="Ej: Remera, Buzo, Pantalon"
            placeholderTextColor={colors.textLight}
            style={[styles.input, !tipoDePrendaValido && styles.inputError]}
          />
        </View>
      </View>

      <View style={styles.actionsCard}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={[styles.secondaryButton, saving && styles.buttonDisabled]}
          disabled={saving}
        >
          <Text style={styles.secondaryButtonText}>Cancelar</Text>
        </Pressable>

        <Pressable
          onPress={handleSave}
          disabled={!formValido || saving}
          style={[styles.primaryButton, (!formValido || saving) && styles.buttonDisabled]}
        >
          <Text style={styles.primaryButtonText}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    color: colors.textLight,
    fontSize: 16,
  },
  headerCard: {
    backgroundColor: colors.surfaceDark,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderDark,
    gap: 8,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  metaBadge: {
    backgroundColor: colors.backgroundDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 120,
  },
  metaLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  formCard: {
    backgroundColor: colors.surfaceDark,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    color: colors.textLight,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderDark,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.backgroundDark,
  },
  inputError: {
    borderColor: colors.error,
  },
  actionsCard: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 15,
  },
  primaryButton: {
    flex: 1.4,
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryButtonText: {
    color: colors.textInverse,
    fontWeight: "800",
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
