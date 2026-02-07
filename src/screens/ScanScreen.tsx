import React, { useEffect, useState } from "react";
import {View, Text, Button, ActivityIndicator, Alert} from "react-native"; 
import { Product } from "../types/Product";
import { Camera, CameraView } from "expo-camera";

type RouteParams = {
    products : Product[]
}
export default function ScanScreen({navigation, route} : any) {
    const { products } = route.params as { products: Product[] };
    const [hasPermission, setHasPermission] = useState<boolean | null>(null); 
    const [scanned, setScanned] = useState(false); 

    useEffect(() => {
        (async () => {
            const {status} = await Camera.requestCameraPermissionsAsync(); 
            setHasPermission(status === "granted")
        })();
    }, []); 

    const parseProductId = (data : string) => {
        const parts = data.split(":");
        if (parts.length >= 3 && parts[0] === "rppro" && parts[1] === "product") {
            return Number(parts[2]);
        }
        if(data.startsWith("PROD:")) return Number(data.replace("PROD:", ""));
        try {
            const obj = JSON.parse(data); 
            if(obj?.id != null) return Number(obj.id)
        } catch {}
        
        return Number(data);
    }

    const handleBarCodeScanned = ({ data }: { data: string }) => {
        if (scanned) return;
        setScanned(true);

        const id = parseProductId(data);

        if (Number.isNaN(id)) {
            Alert.alert("QR invalido", data);
            return;
        }
        console.log("ID escaneado:", String(id));
        console.log("IDs en products:", products.map(p => String(p.id)));
        const found = products.find((p) => Number(p.id) === id);

        if (!found) {
            Alert.alert("No encontrado", `No existe un producto con id ${id}`);
            return;
        }

        navigation.navigate("Productos", { scannedProduct: found });
    };

    if (hasPermission === null) return <ActivityIndicator/>; 
    if(hasPermission === false) return <Text>No hay permiso para camara</Text>

    return (
        <View style = {{flex : 1}}>
            <CameraView
                style={{ flex: 1 }}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39", "upc_a", "upc_e"],
                }}
                onBarcodeScanned={handleBarCodeScanned}
            />
            <View style={{ padding: 16 }}>
                <Text>{scanned ? "Escaneado ✅" : "Apuntá al QR"}</Text>
                {scanned && (
                    <Button title="Escanear otra vez" onPress={() => setScanned(false)} />
                )}
            </View>
        </View>
    )
}