import React, { useRef } from "react";
import { Modal, Text, TouchableOpacity, View, Alert } from "react-native";
import QRCode from "react-native-qrcode-svg";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { StockProducto } from "../types/StockProducto";
import { Product } from "../types/Product";
import { colors } from "../theme/colors";

type Props = {
  visible : boolean, 
  stockItem : StockProducto, 
  producto : Product
}

export default function GenerarCodigoButton({
  visible,
  stockItem,
  producto,
  onClose,
}: {
  visible: boolean;
  stockItem : StockProducto | null;
  producto : Product | null;
  onClose: () => void;
}) {
  const qrRef = useRef<any>(null);
  if (!stockItem) return null;
  if (!visible) return null; 

  const payload = `rppro:stock:${stockItem.productoId}:${stockItem.talleId}:${stockItem.colorId}`;

  const onDownloadPdf = async () => {
    try {
      if (!qrRef.current?.toDataURL) {
        Alert.alert("Error", "No pude obtener la imagen del QR.");
        return;
      }

      const qrDataUrl: string = await new Promise((resolve) => {
        qrRef.current.toDataURL((base64: string) => {
          resolve(`data:image/png;base64,${base64}`);
        });
      });

      const html = `
        <html>
          <head>
            <meta charset="utf-8" />
            <style>
              body { font-family: Arial, sans-serif; padding: 16px; }
              .card { width: 320px; border: 1px solid #ddd; border-radius: 12px; padding: 16px; }
              .title { font-size: 18px; font-weight: 700; margin: 0 0 8px 0; }
              .meta { margin: 0; line-height: 1.4; }
              .qr { margin-top: 12px; text-align: center; }
              .id { margin-top: 10px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="card">
              <p class="title">${producto?.nombre ?? ""}</p>
              <p class="meta"><b>Precio:</b> $${producto?.precio ?? 0}>
              <p class="meta"><b>Stock:</b> ${stockItem.stock}</p>
              <div class="qr">
                <img src="${qrDataUrl}" width="220" height="220" />
              </div>
              <p class="id">ID: ${producto?.id ?? 0}</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });

      // Si compartir no está, abrí impresión (suele dejar guardar PDF)
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        await Print.printAsync({ uri });
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo generar el PDF");
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            backgroundColor: colors.surface,
            padding: 20,
            borderRadius: 12,
            width: 300,
            alignItems: "center",
          }}
        >
          <Text style={{ fontWeight: "800", marginBottom: 10, color: colors.textPrimary }}>
            {producto?.nombre ?? ""}
          </Text>

          <QRCode
            value={payload}
            size={220}
            getRef={(c) => (qrRef.current = c)}
          />

          <Text style={{ marginTop: 8, fontSize: 12, color: colors.textSecondary }}>
              ID: {producto?.id ?? 0}
          </Text>

          <TouchableOpacity
            onPress={onDownloadPdf}
            disabled = {!qrRef.current}
            style={{
              marginTop: 14,
              backgroundColor: colors.surfaceDark,
              padding: 12,
              borderRadius: 10,
              width: "100%",
              alignItems: "center",
            }}
          >
            <Text style={{ color: colors.textInverse, fontWeight: "800" }}>
              Descargar / Compartir PDF
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={{ marginTop: 12 }}>
            <Text style={{ fontWeight: "800", color: colors.primary }}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
