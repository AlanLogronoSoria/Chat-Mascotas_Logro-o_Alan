import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, ClipboardCheck, Edit3, Heart, Plus, Trash2, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AdoptionApplication, AdoptionRepository, useAdoptionStore } from '../src/features/applications/infrastructure/repositories/AdoptionRepository';
import { useAuthStore } from '../src/features/auth/presentation/store/authStore';
import { useProducts } from '../src/features/products/presentation/hooks/useProducts';
import { notifyAdopterStatusUpdate } from '../src/shared/infrastructure/notifications/NotificationService';
import { PetImageService } from '../src/shared/infrastructure/supabase/PetImageService';
import { colors } from '../src/shared/design/theme';

const adoptionRepo = new AdoptionRepository();

export default function ShelterDashboardView() {
  const user = useAuthStore((s) => s.user);
  const applications = useAdoptionStore((s) => s.applications);
  const { products, createProduct, isCreating, updateProduct, isUpdating, deleteProduct, isDeleting } = useProducts();

  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [viewSection, setViewSection] = useState<'requests' | 'mypets' | 'form'>('requests');

  // Form fields
  const [petName, setPetName] = useState('');
  const [petBreed, setPetBreed] = useState('');
  const [petAge, setPetAge] = useState('');
  const [petImage, setPetImage] = useState('');
  const [pickedAsset, setPickedAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      adoptionRepo
        .getApplicationsForShelter(user.id)
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [user]);

  const resetForm = () => {
    setPetName('');
    setPetBreed('');
    setPetAge('');
    setPetImage('');
    setPickedAsset(null);
    setFormError(null);
    setEditMode(null);
  };

  const handlePickImage = async () => {
    const granted = await PetImageService.requestPermission();
    if (!granted) {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la galería para subir imágenes.');
      return;
    }
    const asset = await PetImageService.pickImage();
    if (asset) {
      setPickedAsset(asset);
    }
  };

  const fillFormForEdit = (product: any) => {
    let breed = '';
    let age = '';
    let image = '';
    try {
      if (
      product.description &&
      typeof product.description === 'string' &&
      product.description.startsWith('{')
      ) {
        const parsed = JSON.parse(product.description);
        breed = parsed.breed || '';
        age = parsed.age || '';
        image = parsed.imageUrl || product.imageUrl || '';
      }
    } catch (e) {}
    setPetName(product.name);
    setPetBreed(breed);
    setPetAge(age);
    setPetImage(image);
    setPickedAsset(null);
    setEditMode(product.id);
    setViewSection('form');
  };

  const handleUpdateStatus = async (appId: string, newStatus: AdoptionApplication['status'], adopterId: string, petName: string) => {
    try {
      await adoptionRepo.updateApplicationStatus(appId, newStatus);
      notifyAdopterStatusUpdate({
        adopterId,
        petName,
        newStatus,
        applicationId: appId,
      });
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
      setUploadingImage(true);

      let imageFile: { uri: string; name: string; type: string } | undefined;
      if (pickedAsset) {
        const ext = pickedAsset.uri?.split('.').pop()?.toLowerCase() ?? 'jpg';
        imageFile = {
          uri: pickedAsset.uri,
          name: `${Date.now()}.${ext}`,
          type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        };
      }

      const fallbackImage = imageFile ? '' : (petImage.trim() || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300&auto=format&fit=crop');
      const descCombined = JSON.stringify({
        breed: petBreed.trim(),
        age: petAge.trim(),
        imageUrl: fallbackImage,
      });

      if (editMode) {
        await updateProduct({
          id: editMode,
          name: petName.trim(),
          description: descCombined,
          price: 0,
          imageUrl: imageFile ? undefined : (petImage.trim() || undefined),
          imageFile,
        });
        Alert.alert("Éxito", "¡Mascota actualizada correctamente!");
      } else {
        await createProduct({
          name: petName.trim(),
          description: descCombined,
          price: 0,
          imageUrl: imageFile ? undefined : (petImage.trim() || undefined),
          imageFile,
        });
        Alert.alert("Éxito", "¡Mascota publicada para adopción!");
      }
      resetForm();
      setViewSection('mypets');
    } catch (e: any) {
      setFormError(e.message || "Error al publicar/actualizar mascota");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeletePet = (id: string, name: string, imageUrl: string) => {
    Alert.alert(
      "Eliminar mascota",
      `¿Estás seguro de eliminar a "${name}"? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              if (imageUrl && imageUrl.includes('pet_images')) {
                await PetImageService.deletePetImage(imageUrl);
              }
              await deleteProduct(id);
              Alert.alert("Éxito", "Mascota eliminada correctamente.");
            } catch (e: any) {
              Alert.alert("Error", e.message || "No se pudo eliminar la mascota.");
            }
          }
        }
      ]
    );
  };

  const shelterPets = products.filter(p => p.sellerId === user?.id);

  const parsePetInfo = (product: any) => {
    let breed = "N/A";
    let age = "N/A";
    let image = product.imageUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300&auto=format&fit=crop';
    try {
      if (product.description && product.description.startsWith('{')) {
        const parsed = JSON.parse(product.description);
        breed = parsed.breed || breed;
        age = parsed.age || age;
        image = parsed.imageUrl || image;
      }
    } catch (e) {}
    return { breed, age, image };
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <BlurView intensity={35} tint="dark" style={styles.metricCard}>
          <Text style={styles.metricValue}>{shelterPets.length}</Text>
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

      {/* Section Switcher */}
      <View style={styles.sectionSwitcher}>
        <TouchableOpacity
          style={[styles.switchBtn, viewSection === 'requests' && styles.switchBtnActive]}
          onPress={() => { setViewSection('requests'); resetForm(); }}
        >
          <ClipboardCheck size={16} color={viewSection === 'requests' ? colors.secondary : '#94a3b8'} />
          <Text style={[styles.switchText, viewSection === 'requests' && styles.switchTextActive]}>Solicitudes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.switchBtn, viewSection === 'mypets' && styles.switchBtnActive]}
          onPress={() => { setViewSection('mypets'); resetForm(); }}
        >
          <Heart size={16} color={viewSection === 'mypets' ? colors.secondary : '#94a3b8'} />
          <Text style={[styles.switchText, viewSection === 'mypets' && styles.switchTextActive]}>Mis Mascotas</Text>
        </TouchableOpacity>
      </View>

      {/* Action Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {viewSection === 'form'
            ? (editMode ? "Editar Mascota" : "Publicar Mascota")
            : viewSection === 'mypets'
            ? "Mis Mascotas Publicadas"
            : "Solicitudes de Adopción"}
        </Text>
        {(viewSection === 'mypets' || viewSection === 'requests') && (
          <TouchableOpacity
            style={styles.plusBtn}
            onPress={() => { resetForm(); setViewSection('form'); }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.secondary, '#6A0DAD']}
              style={styles.plusGradient}
            >
              <Plus size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}
        {viewSection === 'form' && (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => { resetForm(); setViewSection('mypets'); }}
          >
            <X size={18} color="#FF8B8B" />
          </TouchableOpacity>
        )}
      </View>

      {/* FORM SECTION */}
      {viewSection === 'form' && (
        <BlurView intensity={45} tint="dark" style={styles.formCard}>
          <Text style={styles.formTitle}>
            {editMode ? 'Edita la información de la mascota' : 'Registra una nueva mascota'}
          </Text>
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

            <Text style={styles.label}>IMAGEN</Text>
            {pickedAsset ? (
              <View style={styles.imagePreviewRow}>
                <Image source={{ uri: pickedAsset.uri }} style={styles.imagePreview} />
                <TouchableOpacity style={styles.removeImageBtn} onPress={() => setPickedAsset(null)}>
                  <X size={14} color="#FF8B8B" />
                </TouchableOpacity>
              </View>
            ) : petImage ? (
              <View style={styles.imagePreviewRow}>
                <Image source={{ uri: petImage }} style={styles.imagePreview} />
                <TouchableOpacity style={styles.removeImageBtn} onPress={() => setPetImage('')}>
                  <X size={14} color="#FF8B8B" />
                </TouchableOpacity>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.imagePickerBtn}
              onPress={handlePickImage}
              activeOpacity={0.85}
            >
              <Camera size={18} color={colors.secondary} />
              <Text style={styles.imagePickerText}>
                {pickedAsset ? 'Cambiar imagen' : 'Seleccionar imagen'}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.label, { marginTop: 8 }]}>O PEGA UN ENLACE (OPCIONAL)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://ejemplo.com/foto.jpg"
              placeholderTextColor="#64748b"
              value={petImage}
              onChangeText={(text) => { setPetImage(text); setPickedAsset(null); }}
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handlePublishPet}
              disabled={isCreating || isUpdating || uploadingImage}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[colors.secondary, '#6A0DAD']}
                style={styles.submitGradient}
              >
                {(isCreating || isUpdating) ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {editMode ? 'Guardar Cambios' : 'Publicar Mascota'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </BlurView>
      )}

      {/* MY PETS SECTION */}
      {viewSection === 'mypets' && (
        <View style={styles.requestsList}>
          {shelterPets.length === 0 ? (
            <BlurView intensity={30} tint="dark" style={styles.emptyCard}>
              <Heart size={36} color="#64748b" />
              <Text style={styles.emptyTitle}>Sin mascotas publicadas</Text>
              <Text style={styles.emptySubtitle}>Aún no has publicado ninguna mascota en adopción. ¡Agrega la primera!</Text>
            </BlurView>
          ) : (
            shelterPets.map((pet) => {
              const info = parsePetInfo(pet);
              return (
                <BlurView key={pet.id} intensity={35} tint="dark" style={styles.petCard}>
                  <View style={styles.petHeaderRow}>
                    {info.image ? (
                      <Image source={{ uri: info.image }} style={styles.petThumb} />
                    ) : (
                      <View style={[styles.petThumb, styles.petThumbPlaceholder]}>
                        <Heart size={20} color="#64748b" />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.petNameText}>{pet.name}</Text>
                      <Text style={styles.petBreedText}>{info.breed} · {info.age}</Text>
                    </View>
                  </View>
                  <View style={styles.petActions}>
                    <TouchableOpacity
                      style={[styles.petActionBtn, styles.btnEdit]}
                      onPress={() => fillFormForEdit(pet)}
                    >
                      <Edit3 size={14} color={colors.secondary} />
                      <Text style={styles.editText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.petActionBtn, styles.btnDelete]}
                       onPress={() => handleDeletePet(pet.id, pet.name, pet.imageUrl)}
                      disabled={isDeleting}
                    >
                      <Trash2 size={14} color={colors.error} />
                      <Text style={styles.deleteText}>
                        {isDeleting ? '...' : 'Eliminar'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </BlurView>
              );
            })
          )}
        </View>
      )}

      {/* REQUESTS SECTION */}
      {viewSection === 'requests' && (
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
                    onPress={() => handleUpdateStatus(app.id, 'rechazada', app.adopterId, app.petName)}
                  >
                    <Text style={styles.rejectText}>Rechazar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.btnReview]}
                    onPress={() => handleUpdateStatus(app.id, 'revisando', app.adopterId, app.petName)}
                  >
                    <Text style={styles.reviewText}>Revisar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.btnApprove]}
                    onPress={() => handleUpdateStatus(app.id, 'aprobada', app.adopterId, app.petName)}
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
  </KeyboardAvoidingView>
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
    paddingBottom: 120,
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
    marginBottom: 20,
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
  sectionSwitcher: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  switchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  switchBtnActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.06)',
    borderColor: 'rgba(0, 240, 255, 0.18)',
  },
  switchText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
  switchTextActive: {
    color: colors.secondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
    flex: 1,
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
  cancelBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 139, 139, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 139, 139, 0.15)',
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
  petCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(11, 19, 38, 0.45)',
    padding: 16,
    overflow: 'hidden',
  },
  petHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  petNameText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  petBreedText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  petActions: {
    flexDirection: 'row',
    gap: 8,
  },
  petActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  btnEdit: {
    backgroundColor: 'rgba(0, 240, 255, 0.06)',
    borderColor: 'rgba(0, 240, 255, 0.15)',
  },
  btnDelete: {
    backgroundColor: 'rgba(255, 139, 139, 0.06)',
    borderColor: 'rgba(255, 139, 139, 0.15)',
  },
  editText: {
    color: colors.secondary,
    fontWeight: '700',
    fontSize: 12,
  },
  deleteText: {
    color: colors.error,
    fontWeight: '700',
    fontSize: 12,
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
  petThumbPlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
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
  imagePreviewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  removeImageBtn: {
    marginLeft: -8,
    marginTop: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 139, 139, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(0, 240, 255, 0.04)',
  },
  imagePickerText: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '700',
  },
});
