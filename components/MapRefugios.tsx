import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { BlurView } from 'expo-blur';
import { MapPin, Navigation, Info, ArrowRight } from 'lucide-react-native';
import { colors } from '../src/shared/design/theme';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface Shelter {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  petsCount: number;
  phone: string;
}

const SHELTERS_MOCK: Shelter[] = [
  { id: '1', name: 'Refugio Patitas Felices', lat: -12.046374, lng: -77.042793, address: 'Av. Las Palmeras 450, Lima', petsCount: 15, phone: '+51 987 654 321' },
  { id: '2', name: 'Albergue Huellitas de Luz', lat: -12.062106, lng: -77.036528, address: 'Calle Los Jazmines 120, Lince', petsCount: 22, phone: '+51 912 345 678' },
  { id: '3', name: 'Asociación Arca de Noé', lat: -12.083141, lng: -77.048927, address: 'Av. Salaverry 1800, Jesús María', petsCount: 8, phone: '+51 955 667 788' },
];

export default function MapRefugios() {
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);

  // Generate Leaflet Dark Mode HTML content
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        html, body, #map {
          height: 100%;
          width: 100%;
          margin: 0;
          padding: 0;
          background-color: #070B14;
        }
        /* Custom Neon Pulse Marker */
        .neon-marker {
          width: 20px;
          height: 20px;
          background-color: #00F0FF;
          border: 3px solid #fff;
          border-radius: 50%;
          box-shadow: 0 0 15px #00F0FF, 0 0 25px #00F0FF;
          animation: pulse 1.8s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(0.9); box-shadow: 0 0 10px rgba(0, 240, 255, 0.7); }
          50% { transform: scale(1.1); box-shadow: 0 0 20px rgba(0, 240, 255, 0.9), 0 0 30px rgba(0, 240, 255, 0.5); }
          100% { transform: scale(0.9); box-shadow: 0 0 10px rgba(0, 240, 255, 0.7); }
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        // Init map center at Lince/Lima area
        var map = L.map('map', {
          zoomControl: false,
          attributionControl: false
        }).setView([-12.0621, -77.0427], 13);

        // CartoDB Dark Matter tile layer for premium dark style
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19
        }).addTo(map);

        // Pin database
        var shelters = ${JSON.stringify(SHELTERS_MOCK)};

        shelters.forEach(function(s) {
          var icon = L.divIcon({
            className: 'custom-icon-wrapper',
            html: '<div class="neon-marker"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });

          var marker = L.marker([s.lat, s.lng], { icon: icon }).addTo(map);
          
          marker.on('click', function() {
            // Post back selected shelter info to React Native
            window.ReactNativeWebView.postMessage(JSON.stringify(s));
          });
        });
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const shelter: Shelter = JSON.parse(event.nativeEvent.data);
      setSelectedShelter(shelter);
    } catch (e) {
      console.error("Error al procesar mensaje del mapa:", e);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.map}
        onMessage={handleMessage}
      />

      {/* Floating Header */}
      <BlurView intensity={35} tint="dark" style={styles.floatingHeader}>
        <View style={styles.headerRow}>
          <Navigation size={18} color={colors.secondary} />
          <Text style={styles.headerTitle}>Refugios Cercanos</Text>
        </View>
        <Text style={styles.headerSubtitle}>Toca un pin azul para conectar con un albergue</Text>
      </BlurView>

      {/* Interactive Bottom Sheet */}
      {selectedShelter && (
        <BlurView intensity={45} tint="dark" style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetContent}>
            <View style={styles.titleRow}>
              <Text style={styles.shelterName}>{selectedShelter.name}</Text>
              <TouchableOpacity 
                style={styles.closeBtn} 
                onPress={() => setSelectedShelter(null)}
              >
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoRow}>
              <MapPin size={16} color={colors.secondary} />
              <Text style={styles.infoText}>{selectedShelter.address}</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{selectedShelter.petsCount}</Text>
                <Text style={styles.statLabel}>Mascotas</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>Vía GPS</Text>
                <Text style={styles.statLabel}>Ubicación</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.85}>
              <LinearGradient
                colors={[colors.secondary, '#6A0DAD']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionGradient}
              >
                <Text style={styles.actionBtnText}>Ver Mascotas en Adopción</Text>
                <ArrowRight size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070B14',
  },
  map: {
    flex: 1,
  },
  floatingHeader: {
    position: 'absolute',
    top: 20,
    left: 16,
    right: 16,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(11, 19, 38, 0.65)',
    paddingTop: 10,
    paddingBottom: 22,
    paddingHorizontal: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetContent: {},
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  shelterName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
    flex: 1,
    paddingRight: 10,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -2,
  },
  closeText: {
    color: '#94a3b8',
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  infoText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionGradient: {
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
});
