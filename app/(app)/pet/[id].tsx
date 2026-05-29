import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, Image, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useProducts } from '../../../src/features/products/presentation/hooks/useProducts';
import { useRooms } from '../../../src/features/chat/presentation/hooks/useRooms';
import { AdoptionRepository } from '../../../src/features/applications/infrastructure/repositories/AdoptionRepository';
import { useAuthStore } from '../../../src/features/auth/presentation/store/authStore';
import { notifyShelterNewApplication } from '../../../src/shared/infrastructure/notifications/NotificationService';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, ArrowLeft, ShieldAlert, Award, Calendar, Dog } from 'lucide-react-native';
import { colors } from '../../../src/shared/design/theme';

const adoptionRepo = new AdoptionRepository();

export default function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const { products } = useProducts();
  const { createRoom } = useRooms();

  const [requesting, setRequesting] = useState(false);

  // Find pet matching id
  const pet = products.find((p) => p.id === id);

  if (!pet) {
    return (
      <View style={styles.errorContainer}>
        <ArrowLeft size={24} color="#fff" onPress={() => router.back()} />
        <Text style={styles.errorText}>No se encontró la mascota</Text>
      </View>
    );
  }

  // Parse description details
  let breed = 'Común / Criollo';
  let age = '1 año';
  let image = pet.imageUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=600&auto=format&fit=crop';
  let cleanDesc = pet.description;

  try {
    if (pet.description && pet.description.startsWith('{')) {
      const parsed = JSON.parse(pet.description);
      breed = parsed.breed || breed;
      age = parsed.age || age;
      image = parsed.imageUrl || image;
      cleanDesc = `Esta adorable mascota se llama ${pet.name}. Fue rescatada y está buscando un hogar que le brinde todo el amor que se merece. Es muy sociable y está lista para conocerte.`;
    }
  } catch (e) {
    // Treat as plain text
  }

  const handleStartAdoption = async () => {
    if (!user) {
      Alert.alert("Acceso requerido", "Debes iniciar sesión para postular a una adopción.");
      return;
    }

    if (user.role === 'vendedor') {
      Alert.alert("No permitido", "Los refugios no pueden postular a adopciones.");
      return;
    }

    try {
      setRequesting(true);

      const app = await adoptionRepo.createApplication({
        petId: pet.id,
        petName: pet.name,
        petImage: image,
        adopterId: user.id,
        adopterUsername: user.username || user.email,
        shelterId: pet.sellerId,
        details: 'Me interesa mucho adoptar a esta linda mascota. Prometo darle el mejor cuidado posible.',
      });

      notifyShelterNewApplication({
        shelterId: pet.sellerId,
        adopterName: user.username || user.email,
        petName: pet.name,
        applicationId: app.id,
      });

      // 2. Open chat room with the shelter
      const room = await createRoom({
        productId: pet.id,
        productName: pet.name,
      });

      Alert.alert(
        "Solicitud Enviada",
        "Tu solicitud fue registrada. Te estamos redirigiendo al chat con el refugio.",
        [
          {
            text: "Ir al Chat",
            onPress: () => {
              if (room?.id) {
                router.push(`/chat/${room.id}`);
              } else {
                router.push('/');
              }
            }
          }
        ]
      );
    } catch (e: any) {
      Alert.alert("Error", e.message || "No se pudo procesar la adopción");
    } finally {
      setRequesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Cover Photo */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.coverImage} resizeMode="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(7,11,20,0.4)', '#070B14']}
            style={styles.gradientOverlay}
          />
          
          {/* Header row */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Content info */}
        <View style={styles.detailsBlock}>
          <View style={styles.nameRow}>
            <View>
              <Text style={styles.petName}>{pet.name}</Text>
              <Text style={styles.petBreed}>{breed}</Text>
            </View>
            <View style={styles.ageBadge}>
              <Text style={styles.ageText}>{age}</Text>
            </View>
          </View>

          {/* Quick Stats Grid */}
          <View style={styles.statsGrid}>
            <BlurView intensity={30} tint="dark" style={styles.statBox}>
              <Dog size={20} color={colors.secondary} />
              <Text style={styles.statVal}>{breed.split(' ')[0]}</Text>
              <Text style={styles.statLbl}>Raza</Text>
            </BlurView>
            <BlurView intensity={30} tint="dark" style={styles.statBox}>
              <Calendar size={20} color={colors.secondary} />
              <Text style={styles.statVal}>{age}</Text>
              <Text style={styles.statLbl}>Edad</Text>
            </BlurView>
            <BlurView intensity={30} tint="dark" style={styles.statBox}>
              <Award size={20} color={colors.secondary} />
              <Text style={styles.statVal}>Saludable</Text>
              <Text style={styles.statLbl}>Ficha Médica</Text>
            </BlurView>
          </View>

          {/* Bio Description */}
          <Text style={styles.sectionTitle}>Mi Historia</Text>
          <Text style={styles.petDesc}>{cleanDesc || 'Sin descripción disponible.'}</Text>

          {/* Health Records list */}
          <Text style={styles.sectionTitle}>Salud & Cuidados</Text>
          <View style={styles.healthList}>
            <View style={styles.healthChip}>
              <View style={styles.dot} />
              <Text style={styles.healthText}>Vacunas completas</Text>
            </View>
            <View style={styles.healthChip}>
              <View style={styles.dot} />
              <Text style={styles.healthText}>Esterilizado/a</Text>
            </View>
            <View style={styles.healthChip}>
              <View style={styles.dot} />
              <Text style={styles.healthText}>Desparasitado/a</Text>
            </View>
          </View>

          {/* Safe message banner */}
          <BlurView intensity={25} tint="dark" style={styles.warningBanner}>
            <ShieldAlert size={18} color={colors.secondary} />
            <Text style={styles.warningText}>
              PetAdopt promueve el cuidado y bienestar. Las solicitudes pasan por una verificación con el albergue correspondiente.
            </Text>
          </BlurView>

          {/* Adoption Button */}
          {user?.role !== 'vendedor' && (
            <TouchableOpacity
              style={styles.adoptBtn}
              onPress={handleStartAdoption}
              disabled={requesting}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={[colors.secondary, '#6A0DAD']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.adoptGradient}
              >
                <Heart size={20} color="#fff" fill="#fff" />
                <Text style={styles.adoptBtnText}>
                  {requesting ? "Procesando..." : "Quiero Adoptar"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070B14',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#070B14',
    gap: 16,
  },
  errorText: {
    color: '#94a3b8',
    fontSize: 16,
  },
  imageContainer: {
    height: 380,
    width: '100%',
    position: 'relative',
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 180,
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(7, 11, 20, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsBlock: {
    paddingHorizontal: 22,
    marginTop: -20,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  petName: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  petBreed: {
    color: colors.secondary,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
  },
  ageBadge: {
    backgroundColor: 'rgba(208, 188, 255, 0.15)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(208, 188, 255, 0.25)',
  },
  ageText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 26,
  },
  statBox: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingVertical: 16,
    alignItems: 'center',
    overflow: 'hidden',
  },
  statVal: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 8,
  },
  statLbl: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 10,
    marginTop: 6,
  },
  petDesc: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  healthList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 26,
  },
  healthChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.successGreen,
  },
  healthText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  warningBanner: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.1)',
    backgroundColor: 'rgba(0, 240, 255, 0.03)',
    marginBottom: 28,
    overflow: 'hidden',
  },
  warningText: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  adoptBtn: {
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  adoptGradient: {
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  adoptBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
});
