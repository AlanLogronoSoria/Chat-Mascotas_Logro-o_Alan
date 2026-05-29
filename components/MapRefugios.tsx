import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { BlurView } from 'expo-blur';
import { MapPin, Navigation, Crosshair, ArrowRight, Phone } from 'lucide-react-native';
import { colors } from '../src/shared/design/theme';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import LottieView from 'lottie-react-native';
import { ShelterLocationRepository, ShelterLocation } from '../src/features/products/infrastructure/repositories/ShelterLocationRepository';

const { width } = Dimensions.get('window');
const shelterRepo = new ShelterLocationRepository();

export default function MapRefugios() {
  const [selectedShelter, setSelectedShelter] = useState<ShelterLocation | null>(null);
  const [shelters, setShelters] = useState<ShelterLocation[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [distances, setDistances] = useState<Record<string, number>>({});

  const requestLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permiso de ubicación denegado');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      setLocationError(null);
    } catch (e: any) {
      setLocationError('No se pudo obtener la ubicación');
      console.warn('Error GPS:', e.message);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await shelterRepo.getAllShelters();
        setShelters(data);
      } catch (e) {
        console.warn('Error cargando refugios:', e);
      }
      await requestLocation();
      setLoading(false);
    })();
  }, [requestLocation]);

  useEffect(() => {
    if (userLocation && shelters.length > 0) {
      const newDistances: Record<string, number> = {};
      shelters.forEach((s) => {
        newDistances[s.id] = calculateDistance(userLocation.lat, userLocation.lng, s.lat, s.lng);
      });
      setDistances(newDistances);
    }
  }, [userLocation, shelters]);

  const center = userLocation || (shelters.length > 0 ? { lat: shelters[0].lat, lng: shelters[0].lng } : { lat: -12.046374, lng: -77.042793 });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background-color: #070B14; }
        .shelter-marker {
          width: 22px; height: 22px;
          background-color: #00F0FF;
          border: 3px solid #fff;
          border-radius: 50%;
          box-shadow: 0 0 15px #00F0FF, 0 0 25px #00F0FF;
          animation: pulse 1.8s infinite;
        }
        .user-marker {
          width: 18px; height: 18px;
          background-color: #22c55e;
          border: 3px solid #fff;
          border-radius: 50%;
          box-shadow: 0 0 12px #22c55e, 0 0 20px #22c55e;
        }
        @keyframes pulse {
          0% { transform: scale(0.9); box-shadow: 0 0 10px rgba(0, 240, 255, 0.7); }
          50% { transform: scale(1.15); box-shadow: 0 0 20px rgba(0, 240, 255, 0.9), 0 0 30px rgba(0, 240, 255, 0.5); }
          100% { transform: scale(0.9); box-shadow: 0 0 10px rgba(0, 240, 255, 0.7); }
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${center.lat}, ${center.lng}], 13);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);

        var shelters = ${JSON.stringify(shelters)};
        var userLoc = ${JSON.stringify(userLocation)};

        shelters.forEach(function(s) {
          var icon = L.divIcon({
            className: 'custom-icon',
            html: '<div class="shelter-marker"></div>',
            iconSize: [22, 22],
            iconAnchor: [11, 11]
          });
          var marker = L.marker([s.lat, s.lng], { icon: icon }).addTo(map);
          marker.on('click', function() {
            window.ReactNativeWebView.postMessage(JSON.stringify(s));
          });
        });

        if (userLoc) {
          var userIcon = L.divIcon({
            className: 'custom-icon',
            html: '<div class="user-marker"></div>',
            iconSize: [18, 18],
            iconAnchor: [9, 9]
          });
          L.marker([userLoc.lat, userLoc.lng], { icon: userIcon }).addTo(map).bindPopup('Tu ubicación');
        }
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const shelter: ShelterLocation = JSON.parse(event.nativeEvent.data);
      setSelectedShelter(shelter);
    } catch (e) {
      console.error("Error al procesar mensaje del mapa:", e);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <LottieView
          source={require('../src/assets/lottie/mapAnimation.json')}
          autoPlay
          loop
          style={styles.loadingLottie}
        />
        <Text style={styles.loadingText}>Cargando mapa y refugios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.map}
        onMessage={handleMessage}
        key={`${shelters.length}-${userLocation?.lat || 0}`}
      />

      {/* Floating Header */}
      <BlurView intensity={35} tint="dark" style={styles.floatingHeader}>
        <View style={styles.headerRow}>
          <Navigation size={18} color={colors.secondary} />
          <Text style={styles.headerTitle}>Refugios Cercanos</Text>
        </View>
        <View style={styles.headerBottomRow}>
          <Text style={styles.headerSubtitle}>
            {shelters.length > 0
              ? `${shelters.length} refugio(s) encontrado(s)`
              : 'Toca un pin azul para ver detalles'}
          </Text>
          <TouchableOpacity style={styles.gpsBtn} onPress={requestLocation}>
            <Crosshair size={16} color={userLocation ? '#22c55e' : '#94a3b8'} />
          </TouchableOpacity>
        </View>
        {locationError && (
          <Text style={styles.locationError}>{locationError}</Text>
        )}
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

            {selectedShelter.address ? (
              <View style={styles.infoRow}>
                <MapPin size={16} color={colors.secondary} />
                <Text style={styles.infoText}>{selectedShelter.address}</Text>
              </View>
            ) : null}

            {selectedShelter.phone ? (
              <View style={styles.infoRow}>
                <Phone size={16} color={colors.secondary} />
                <Text style={styles.infoText}>{selectedShelter.phone}</Text>
              </View>
            ) : null}

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{selectedShelter.petsCount}</Text>
                <Text style={styles.statLabel}>Mascotas</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {distances[selectedShelter.id] != null
                    ? distances[selectedShelter.id] < 1
                      ? `${(distances[selectedShelter.id] * 1000).toFixed(0)} m`
                      : `${distances[selectedShelter.id].toFixed(1)} km`
                    : '---'}
                </Text>
                <Text style={styles.statLabel}>Distancia</Text>
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

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070B14',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#070B14',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 10,
  },
  loadingLottie: {
    width: 160,
    height: 160,
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
    paddingVertical: 12,
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
  headerBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
  },
  gpsBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationError: {
    color: '#FF8B8B',
    fontSize: 11,
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
    marginBottom: 6,
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
    marginTop: 8,
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
