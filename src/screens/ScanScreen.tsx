import React, { useEffect, useState, useCallback, useRef } from "react";
import {
    View, 
    Text, 
    Pressable, 
    StyleSheet, 
    Modal, 
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Alert
} from "react-native"; 
import { Camera, CameraView } from "expo-camera";
import { Product } from "../types/Product";
import { StockProducto } from "../types/StockProducto";
import { apiFetch } from "../api/apiClient";
import { colors } from "../theme/colors";
import QRCode from "react-native-qrcode-svg";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

interface ScannedData {
    producto: Product;
    stockItem: StockProducto;
    qrData: string;
}

export default function ScanScreen({ navigation, route }: any) {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null); 
    const [scanned, setScanned] = useState(false); 
    const [loading, setLoading] = useState(false);
    const [productos, setProductos] = useState<Product[]>([]);
    const [scannedData, setScannedData] = useState<ScannedData | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [flashOn, setFlashOn] = useState(false);
    const qrRef = useRef<any>(null);

    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync(); 
            setHasPermission(status === "granted");
        })();
        cargarProductos();
    }, []); 

    const cargarProductos = async () => {
        try {
            const data = await apiFetch<Product[]>('/api/productos');
            setProductos(data || []);
        } catch (error) {
            console.error('Error cargando productos:', error);
        }
    };

    const parseQrStock = (data: string): { productoId: string; talleId: number; colorId: number } | null => {
        const parts = data.trim().split(":");
        if (parts.length >= 5 && parts[0] === "rppro" && parts[1] === "stock") {
            return {
                productoId: parts[2],
                talleId: Number(parts[3]),
                colorId: Number(parts[4])
            };
        }
        return null;
    };

    const encontrarVariante = (productoId: string, talleId: number, colorId: number): { producto: Product; stockItem: StockProducto } | null => {
        const producto = productos.find(p => p.id === productoId);
        if (!producto) return null;
        
        let stockItem = producto.stockProductos?.find(
            sp => sp.talleId === talleId && sp.colorId === colorId
        );
        
        if (!stockItem) {
            stockItem = producto.stockProductos?.[0];
        }
        
        if (!stockItem) return null;
        
        return { producto, stockItem };
    };

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        if (scanned || loading) return;
        
        const parsed = parseQrStock(data);
        
        if (parsed) {
            setLoading(true);
            if (productos.length === 0) {
                await cargarProductos();
            }
            
            console.log('QR data:', parsed);
            console.log('Productos disponibles:', productos.map(p => ({ id: p.id, nombre: p.nombre })));
            
            const resultado = encontrarVariante(parsed.productoId, parsed.talleId, parsed.colorId);
            console.log('Resultado encontrado:', resultado);
            
            if (resultado) {
                const stockItemConIds = {
                    ...resultado.stockItem,
                    productoId: parsed.productoId,
                    talleId: parsed.talleId,
                    colorId: parsed.colorId
                };
                setScannedData({
                    producto: resultado.producto,
                    stockItem: stockItemConIds,
                    qrData: data
                });
                setShowResult(true);
                setScanned(true);
            } else {
                const producto = productos.find(p => p.id === parsed.productoId);
                console.log('Producto por ID:', parsed.productoId, producto);
                if (producto) {
                    const stockItemConIds: StockProducto = {
                        productoId: parsed.productoId,
                        talleId: parsed.talleId,
                        colorId: parsed.colorId,
                        stock: 0,
                        precio: 0
                    };
                    setScannedData({
                        producto: producto,
                        stockItem: stockItemConIds,
                        qrData: data
                    });
                    setShowResult(true);
                    setScanned(true);
                } else {
                    setScannedData({
                        producto: { id: parsed.productoId, nombre: 'Producto no encontrado', tipoDePrenda: { id: 0, nombre: '' }, stockProductos: [], precio: 0, colorYTalle: [] } as unknown as Product,
                        stockItem: {
                            productoId: parsed.productoId,
                            talleId: parsed.talleId,
                            colorId: parsed.colorId,
                            stock: 0,
                            precio: 0
                        },
                        qrData: data
                    });
                    setShowResult(true);
                    setScanned(true);
                }
            }
            setLoading(false);
        } else {
            setScannedData(null);
            setShowResult(true);
            setScanned(true);
        }
    };

    const resetScan = () => {
        setScanned(false);
        setScannedData(null);
        setShowResult(false);
    };

    const verProducto = () => {
        if (scannedData?.producto) {
            navigation.navigate("EditProduct", { producto: scannedData.producto });
        }
    };

    const irAPedido = () => {
        if (scannedData?.stockItem) {
            navigation.navigate("Pedido", { 
                variantToAdd: scannedData.stockItem,
                producto: scannedData.producto
            });
        }
    };

    const handlePrint = async () => {
        if (!qrRef.current?.toDataURL) {
            Alert.alert('Error', 'No pude obtener la imagen del QR.');
            return;
        }

        try {
            const qrDataUrl: string = await new Promise((resolve) => {
                qrRef.current.toDataURL((base64: string) => {
                    resolve(`data:image/png;base64,${base64}`);
                });
            });

            const html = `
                <!DOCTYPE html>
                <html>
                    <head>
                        <meta charset="utf-8" />
                        <style>
                            * { box-sizing: border-box; margin: 0; padding: 0; }
                            body { 
                                font-family: 'Segoe UI', Arial, sans-serif; 
                                padding: 24px; 
                                background: #f5f5f5;
                                min-height: 100vh;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                            }
                            .card { 
                                background: white; 
                                border-radius: 16px; 
                                padding: 24px; 
                                width: 340px;
                                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                            }
                            .header { display: flex; align-items: center; margin-bottom: 20px; }
                            .product-name { font-size: 20px; font-weight: 700; color: #1a1a1a; }
                            .sku { font-size: 12px; color: #666; margin-top: 4px; }
                            .variant-grid {
                                display: grid;
                                grid-template-columns: repeat(3, 1fr);
                                gap: 12px;
                                margin-bottom: 20px;
                            }
                            .variant-item { background: #f8f8f8; border-radius: 8px; padding: 12px; text-align: center; }
                            .variant-label { font-size: 10px; color: #888; text-transform: uppercase; }
                            .variant-value { font-size: 16px; font-weight: 600; color: #1a1a1a; margin-top: 4px; }
                            .qr-container { text-align: center; padding: 20px; background: #f8f8f8; border-radius: 12px; }
                            .qr-title { font-size: 12px; color: #666; margin-bottom: 12px; }
                        </style>
                    </head>
                    <body>
                        <div class="card">
                            <div class="header">
                                <div>
                                    <p class="product-name">${scannedData?.producto.nombre || 'Producto'}</p>
                                    <p class="sku">SKU: ${scannedData?.producto.id || '-'}</p>
                                </div>
                            </div>
                            <div class="variant-grid">
                                <div class="variant-item">
                                    <p class="variant-label">Color</p>
                                    <p class="variant-value">${(scannedData?.stockItem as any)?.colorNombre || scannedData?.stockItem.color?.nombre || '-'}</p>
                                </div>
                                <div class="variant-item">
                                    <p class="variant-label">Talle</p>
                                    <p class="variant-value">${(scannedData?.stockItem as any)?.talleNombre || scannedData?.stockItem.talle?.nombre || '-'}</p>
                                </div>
                                <div class="variant-item">
                                    <p class="variant-label">Stock</p>
                                    <p class="variant-value">${scannedData?.stockItem.stock ?? 0}</p>
                                </div>
                            </div>
                            <div class="qr-container">
                                <p class="qr-title">Código QR</p>
                                <img src="${qrDataUrl}" width="180" height="180" />
                            </div>
                        </div>
                    </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
            } else {
                await Print.printAsync({ uri });
            }
        } catch (e: any) {
            Alert.alert('Error', e?.message || 'No se pudo generar el PDF');
        }
    };

    if (hasPermission === null) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Solicitando permisos de cámara...</Text>
            </View>
        );
    }
    
    if (hasPermission === false) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorIcon}>📷</Text>
                <Text style={styles.errorTitle}>Sin acceso a la cámara</Text>
                <Text style={styles.errorText}>
                    Para escanear códigos QR, necesitas permitir el acceso a la cámara.
                </Text>
                <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
                    <Text style={styles.buttonText}>Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                facing="back"
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />
            
            <View style={styles.overlay}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Escanear QR</Text>
                    <View style={styles.backButton} />
                </View>
                
                <View style={styles.scanArea}>
                    <View style={styles.scanFrame}>
                        <View style={[styles.corner, styles.topLeft]} />
                        <View style={[styles.corner, styles.topRight]} />
                        <View style={[styles.corner, styles.bottomLeft]} />
                        <View style={[styles.corner, styles.bottomRight]} />
                    </View>
                </View>
                
                <View style={styles.footer}>
                    <View style={styles.statusCard}>
                        <Text style={styles.statusText}>
                            {loading ? "Buscando producto..." : scanned ? "✅ Código escaneado" : "📷 Apuntá al código QR"}
                        </Text>
                    </View>
                    
                    {scanned && (
                        <TouchableOpacity style={styles.rescanButton} onPress={resetScan}>
                            <Text style={styles.rescanText}>🔄 Escanear otro</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <Modal
                visible={showResult}
                transparent
                animationType="slide"
                onRequestClose={resetScan}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.resultCard}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {scannedData ? (
                                <>
                                    <View style={styles.resultHeader}>
                                        <Text style={styles.resultIcon}>✅</Text>
                                        <Text style={styles.resultTitle}>Producto encontrado</Text>
                                    </View>
                                    
                                    <View style={styles.productCard}>
                                        <Text style={styles.productName}>{scannedData.producto.nombre}</Text>
                                        <Text style={styles.productMeta}>SKU: {scannedData.producto.id}</Text>
                                    </View>
                                    
                                    <View style={styles.variantSection}>
                                        <Text style={styles.sectionTitle}>VARIANTE</Text>
                                        
                                        <View style={styles.variantGrid}>
                                            <View style={styles.variantItem}>
                                                <Text style={styles.variantLabel}>Color</Text>
                                                <Text style={styles.variantValue}>
                                                    {(scannedData.stockItem as any).colorNombre || scannedData.stockItem.color?.nombre || `Color #${scannedData.stockItem.colorId}`}
                                                </Text>
                                            </View>
                                            <View style={styles.variantItem}>
                                                <Text style={styles.variantLabel}>Talle</Text>
                                                <Text style={styles.variantValue}>
                                                    {(scannedData.stockItem as any).talleNombre || scannedData.stockItem.talle?.nombre || `Talle #${scannedData.stockItem.talleId}`}
                                                </Text>
                                            </View>
                                            <View style={styles.variantItem}>
                                                <Text style={styles.variantLabel}>Stock</Text>
                                                <Text style={[styles.variantValue, (scannedData.stockItem.stock ?? 0) <= 3 && styles.stockLow]}>
                                                    {scannedData.stockItem.stock ?? 0}
                                                </Text>
                                            </View>
                                            {scannedData.stockItem.precio != null && scannedData.stockItem.precio > 0 && (
                                                <View style={styles.variantItem}>
                                                    <Text style={styles.variantLabel}>Precio</Text>
                                                    <Text style={styles.variantValue}>
                                                        ${scannedData.stockItem.precio.toLocaleString('es-AR')}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                    
                                    <View style={styles.qrPreview}>
                                        <Text style={styles.qrPreviewLabel}>QR Escaneado</Text>
                                        <View style={styles.qrContainer}>
                                            <QRCode
                                                value={scannedData.qrData}
                                                size={100}
                                                color="#000000"
                                                backgroundColor="#FFFFFF"
                                                getRef={(c) => (qrRef.current = c)}
                                            />
                                        </View>
                                        <Text style={styles.qrId}>{scannedData.qrData}</Text>
                                    </View>
                                    
                                    <TouchableOpacity style={styles.printButton} onPress={handlePrint}>
                                        <Text style={styles.printButtonIcon}>🖨️</Text>
                                        <Text style={styles.printButtonText}>Imprimir / Compartir</Text>
                                    </TouchableOpacity>
                                    
                                    <View style={styles.actions}>
                                        <TouchableOpacity style={styles.actionButton} onPress={verProducto}>
                                            <Text style={styles.actionIcon}>✏️</Text>
                                            <Text style={styles.actionText}>Editar</Text>
                                        </TouchableOpacity>
                                        
                                        <TouchableOpacity style={[styles.actionButton, styles.primaryAction]} onPress={irAPedido}>
                                            <Text style={styles.actionIcon}>🛒</Text>
                                            <Text style={styles.actionText}>Agregar</Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            ) : (
                                <>
                                    <View style={styles.resultHeader}>
                                        <Text style={styles.resultIcon}>❓</Text>
                                        <Text style={styles.resultTitle}>Código no reconocido</Text>
                                    </View>
                                    <Text style={styles.unknownText}>
                                        Este código QR no corresponde a un producto de stock.
                                    </Text>
                                </>
                            )}
                        </ScrollView>
                        
                        <TouchableOpacity style={styles.closeButton} onPress={resetScan}>
                            <Text style={styles.closeButtonText}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.backgroundDark,
    },
    centerContainer: {
        flex: 1,
        backgroundColor: colors.backgroundDark,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    camera: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButtonText: {
        color: colors.textInverse,
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerTitle: {
        color: colors.textInverse,
        fontSize: 18,
        fontWeight: '600',
    },
    scanArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanFrame: {
        width: 250,
        height: 250,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: colors.primary,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderTopWidth: 4,
        borderLeftWidth: 4,
    },
    topRight: {
        top: 0,
        right: 0,
        borderTopWidth: 4,
        borderRightWidth: 4,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 4,
        borderRightWidth: 4,
    },
    footer: {
        padding: 24,
        paddingBottom: 40,
        alignItems: 'center',
    },
    statusCard: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        marginBottom: 16,
    },
    statusText: {
        color: colors.textInverse,
        fontSize: 15,
        fontWeight: '500',
    },
    rescanButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
    },
    rescanText: {
        color: colors.textInverse,
        fontSize: 15,
        fontWeight: '600',
    },
    loadingText: {
        color: colors.textLight,
        marginTop: 16,
        fontSize: 15,
    },
    errorIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    errorTitle: {
        color: colors.textInverse,
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
    },
    errorText: {
        color: colors.textLight,
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 24,
    },
    button: {
        backgroundColor: colors.primary,
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12,
    },
    buttonText: {
        color: colors.textInverse,
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'flex-end',
    },
    resultCard: {
        backgroundColor: colors.surfaceDark,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '85%',
    },
    resultHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    resultIcon: {
        fontSize: 48,
        marginBottom: 8,
    },
    resultTitle: {
        color: colors.textInverse,
        fontSize: 20,
        fontWeight: '700',
    },
    productCard: {
        backgroundColor: colors.backgroundDark,
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    productName: {
        color: colors.textInverse,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    productMeta: {
        color: colors.textLight,
        fontSize: 13,
    },
    variantSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        color: colors.textLight,
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 12,
    },
    variantGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    variantItem: {
        backgroundColor: colors.backgroundDark,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        minWidth: 80,
        alignItems: 'center',
    },
    variantLabel: {
        color: colors.textLight,
        fontSize: 10,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    variantValue: {
        color: colors.textInverse,
        fontSize: 16,
        fontWeight: '700',
    },
    stockLow: {
        color: colors.error,
    },
    qrPreview: {
        alignItems: 'center',
        marginBottom: 20,
    },
    qrPreviewLabel: {
        color: colors.textLight,
        fontSize: 12,
        marginBottom: 8,
    },
    qrContainer: {
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 12,
    },
    qrId: {
        color: colors.textLight,
        fontSize: 10,
        marginTop: 8,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    primaryAction: {
        backgroundColor: colors.primary,
    },
    actionIcon: {
        fontSize: 18,
    },
    actionText: {
        color: colors.textInverse,
        fontSize: 15,
        fontWeight: '600',
    },
    printButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.warning,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
        marginBottom: 16,
    },
    printButtonIcon: {
        fontSize: 18,
    },
    printButtonText: {
        color: colors.textInverse,
        fontSize: 15,
        fontWeight: '600',
    },
    closeButton: {
        paddingVertical: 14,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: colors.borderDark,
        marginTop: 8,
    },
    closeButtonText: {
        color: colors.textLight,
        fontSize: 15,
    },
    unknownText: {
        color: colors.textLight,
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 20,
    },
});
