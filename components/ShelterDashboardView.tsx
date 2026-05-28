import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Image, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { Plus, ShieldCheck, Heart, ClipboardCheck, Sparkles } from 'lucide-react-native';
import { colors } from '../src/shared/design/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { AdoptionRepository, AdoptionApplication, useAdoptionStore } from '../src/features/applications/infrastructure/repositories/AdoptionRepository';
import { useAuthStore } from '../src/features/auth/presentation/store/authStore';
import { useProducts } from '../src/features/products/presentation/hooks/useProducts';

const adoptionRepo = new AdoptionRepository();

export default function ShelterDashboardView() {
  const user = useAuthStore((s) => s.user);
  const applications = useAdoptionStore((s) => s.applications);
  const { products, createProduct, isCreating } = useProducts();

  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  // New Pet Form fields
  const [petName, setPetName] = useState('');
  const [petBreed, setPetBreed] = useState('');
  const [petAge, setPetAge] = useState('');
  const [petImage, setPetImage] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      adoptionRepo.getApplicationsForShelter(user.id).then(() => {
        setLoading(false);
      });
    }
  }, [user]);

  const handleUpdateStatus = async (appId: string, newStatus: AdoptionApplication['status']) => {
    try {
      await adoptionRepo.updateApplicationStatus(appId, newStatus);
      Alert.alert("Éxito", `Solicitud actualizada a: ${newStatus.toUpperCase()}`);
    } catch (e: any) {
      Alert.alert("Error", e.message || "No se pudo actualizar la solicitud");
    }
  };

  const handlePublishPet = async () => {
    setFormError(null);
    if (!petName.trim() || !petBreed.trim() || !petAge.trim()) {
      setFormError("El nombre, raza y edad son obligatorios.");
      return;
    }

    try {
      // Re-use createProduct underneath: name is petName, description is breed/age, price is 0 (free adoption) or a symbolic fee
      const descCombined = JSON.stringify({
        breed: petBreed.trim(),
        age: petAge.trim(),
        imageUrl: petImage.trim() || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300&auto=format&fit=crop',
      });

      await createProduct({
        name: petName.trim(),
        description: descCombined,
        price: 0, // Symbolic free price
      });

      setPetName('');
      setPetBreed('');
      setPetAge('');
      setPetImage('');
      setFormOpen(false);
      Alert.alert("Éxito", "¡Mascota publicada para adopción!");
    } catch (e: any) {
      setFormError(e.message || "Error al publicar mascota");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.secondary} />
        <Text style={styles.loadingText}>Cargando panel...</Text>
      </View>
    );
  }

  const activeApplications = applications.filter(
    (app) => app.status !== 'rechazada' && app.status !== 'aprobada'
  );
  const pendingRequests = activeApplications.filter(
    (app) => app.status === 'enviada' || app.status === 'revisando'
  );
  const activeMascotsCount = products.length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <BlurView intensity={35} tint="dark" style={styles.metricCard}>
          <Text style={styles.metricValue}>{activeMascotsCount}</Text>
          <Text style={styles.metricLabel}>Mascotas</Text>
        </BlurView>
        <BlurView intensity={35} tint="dark" style={styles.metricCard}>
          <Text style={styles.metricValue}>{pendingRequests.length}</Text>
          <Text style={styles.metricLabel}>Solicitudes</Text>
        </BlurView>
        <BlurView intensity={35} tint="dark" style={styles.metricCard}>
          <Text style={styles.metricValue}>12</Text>
          <Text style={styles.metricLabel}>Adopciones</Text>
        </BlurView>
      </View>

      {/* Action Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {formOpen ? "Publicar Mascota" : "Solicitudes de Adopción"}
        </Text>
        <TouchableOpacity
          style={styles.plusBtn}
          onPress={() => setFormOpen(!formOpen)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.secondary, '#6A0DAD']}
            style={styles.plusGradient}
          >
            <Plus size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {formOpen ? (
        // Add Pet Form
        <BlurView intensity={45} tint="dark" style={styles.formCard}>
          <Text style={styles.formTitle}>Registra una nueva mascota</Text>
          <Text style={styles.formSubtitle}>Ayuda a un rescatado a encontrar un hogar.</Text>

          {formError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{formError}</Text>
            </View>
          )}

          <View style={styles.form}>
            <Text style={styles.label}>NOMBRE</Text>
            <TextInput
              style={styles.input}
              placeholder="Luna, Bobby..."
              placeholderTextColor="#64748b"
              value={petName}
              onChangeText={setPetName}
            />

            <Text style={styles.label}>RAZA / ESPECIE</Text>
            <TextInput
              style={styles.input}
              placeholder="Golden Retriever, Gato Siamés..."
              placeholderTextColor="#64748b"
              value={petBreed}
              onChangeText={setPetBreed}
            />

            <Text style={styles.label}>EDAD / TIEMPO</Text>
            <TextInput
              style={styles.input}
              placeholder="2 meses, 1 año..."
              placeholderTextColor="#64748b"
              value={petAge}
              onChangeText={setPetAge}
            />

            <Text style={styles.label}>URL DE IMAGEN (OPCIONAL)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://ejemplo.com/foto.jpg"
              placeholderTextColor="#64748b"
              value={petImage}
              onChangeText={setPetImage}
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handlePublishPet}
              disabled={isCreating}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[colors.secondary, '#6A0DAD']}
                style={styles.submitGradient}
              >
                {isCreating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Publicar Mascota</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </BlurView>
      ) : (
        // Incoming Adoption Requests list
        <View style={styles.requestsList}>
          {activeApplications.length === 0 ? (
            <BlurView intensity={30} tint="dark" style={styles.emptyCard}>
              <ClipboardCheck size={36} color="#64748b" />
              <Text style={styles.emptyTitle}>Sin solicitudes</Text>
              <Text style={styles.emptySubtitle}>No hay solicitudes de adopción recibidas por el momento.</Text>
            </BlurView>
          ) : (
            activeApplications.map((app) => (
              <BlurView key={app.id} intensity={35} tint="dark" style={styles.appCard}>
                <View style={styles.appHeader}>
                  {app.petImage && (
                    <Image source={{ uri: app.petImage }} style={styles.petThumb} />
                  )}
                  <View>
                    <Text style={styles.appTitle}>Solicitud para {app.petName}</Text>
                    <Text style={styles.appAdopter}>Por: {app.adopterUsername}</Text>
                  </View>
                </View>

                {app.details && (
                  <Text style={styles.appDetails}>
                    {`"${app.details}"`}
                  </Text>
                )}

                <View style={styles.statusRow}>
                  <Text style={styles.currentStatusText}>Estado: {app.status.toUpperCase()}</Text>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.btnReject]}
                    onPress={() => handleUpdateStatus(app.id, 'rechazada')}
                  >
                    <Text style={styles.rejectText}>Rechazar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.btnReview]}
                    onPress={() => handleUpdateStatus(app.id, 'revisando')}
                  >
                    <Text style={styles.reviewText}>Revisar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.btnApprove]}
                    onPress={() => handleUpdateStatus(app.id, 'aprobada')}
                  >
                    <Text style={styles.approveText}>Aprobar</Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070B14',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
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
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 26,
  },
  metricCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 18,
    alignItems: 'center',
    overflow: 'hidden',
  },
  metricValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  metricLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  plusBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  plusGradient: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(11, 19, 38, 0.55)',
    padding: 22,
    overflow: 'hidden',
  },
  formTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  formSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 139, 139, 0.12)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 139, 139, 0.22)',
  },
  errorText: {
    color: '#FF8B8B',
    fontSize: 13,
    fontWeight: '500',
  },
  form: {
    gap: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1.5,
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  submitBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 12,
  },
  submitGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  requestsList: {
    gap: 14,
  },
  emptyCard: {
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 4,
  },
  emptySubtitle: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
  },
  appCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(11, 19, 38, 0.45)',
    padding: 18,
    overflow: 'hidden',
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingBottom: 12,
    marginBottom: 12,
  },
  petThumb: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  appTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  appAdopter: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  appDetails: {
    color: '#dae2fd',
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  currentStatusText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.secondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  btnReject: {
    backgroundColor: 'rgba(255, 139, 139, 0.08)',
    borderColor: 'rgba(255, 139, 139, 0.2)',
  },
  rejectText: {
    color: colors.error,
    fontWeight: '700',
    fontSize: 12,
  },
  btnReview: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  reviewText: {
    color: '#94a3b8',
    fontWeight: '700',
    fontSize: 12,
  },
  btnApprove: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  approveText: {
    color: colors.successGreen,
    fontWeight: '700',
    fontSize: 12,
  },
});
