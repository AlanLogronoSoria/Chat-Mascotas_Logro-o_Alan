import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { Check, ClipboardList, PhoneCall, Gift, HeartCrack } from 'lucide-react-native';
import { colors } from '../src/shared/design/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { AdoptionRepository, AdoptionApplication, useAdoptionStore } from '../src/features/applications/infrastructure/repositories/AdoptionRepository';
import { useAuthStore } from '../src/features/auth/presentation/store/authStore';

const adoptionRepo = new AdoptionRepository();

const STAGES = [
  { key: 'enviada', label: 'Enviada', description: 'Tu solicitud fue recibida por el albergue.', icon: ClipboardList },
  { key: 'revisando', label: 'En Revisión', description: 'El albergue está evaluando tu perfil y hogar.', icon: ClipboardList },
  { key: 'entrevista', label: 'Entrevista', description: 'Agendando una llamada para conocerte mejor.', icon: PhoneCall },
  { key: 'aprobada', label: 'Aprobada', description: '¡Felicidades! Estás listo para recoger a tu nuevo amigo.', icon: Gift },
];

export default function AdoptionApplicationsView() {
  const user = useAuthStore((s) => s.user);
  const applications = useAdoptionStore((s) => s.applications);
  const [loading, setLoading] = useState(true);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      adoptionRepo.getApplicationsForAdopter(user.id).then((data) => {
        setLoading(false);
        if (data.length > 0) {
          setSelectedAppId(data[0].id);
        }
      });
    }
  }, [user]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.secondary} />
        <Text style={styles.loadingText}>Cargando solicitudes...</Text>
      </View>
    );
  }

  const adopterApps = applications.filter(
    (app) => (app.adopterId === user?.id || app.id === 'demo-app-1') && app.status !== 'rechazada'
  );
  const selectedApp = adopterApps.find((app) => app.id === selectedAppId) || adopterApps[0];

  // Helper to determine stage color
  const getStageStatus = (stageKey: string, currentStatus: string) => {
    const statusOrder = ['enviada', 'revisando', 'entrevista', 'aprobada'];
    const currentIdx = statusOrder.indexOf(currentStatus === 'rechazada' ? 'entrevista' : currentStatus);
    const stageIdx = statusOrder.indexOf(stageKey);

    if (currentStatus === 'rechazada' && stageKey === 'aprobada') {
      return 'rejected';
    }
    if (stageIdx < currentIdx) return 'completed';
    if (stageIdx === currentIdx) return 'active';
    return 'pending';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Tus Solicitudes</Text>

      {adopterApps.length === 0 ? (
        <BlurView intensity={30} tint="dark" style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🐾</Text>
          <Text style={styles.emptyTitle}>Sin solicitudes activas</Text>
          <Text style={styles.emptySubtitle}>Cuando inicies un proceso de adopción, podrás seguir su estado aquí en tiempo real.</Text>
        </BlurView>
      ) : (
        <>
          {/* horizontal list of pets applied */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizList}>
            {adopterApps.map((app) => (
              <TouchableOpacity
                key={app.id}
                style={[styles.petTab, selectedAppId === app.id && styles.petTabActive]}
                onPress={() => setSelectedAppId(app.id)}
                activeOpacity={0.8}
              >
                {app.petImage && (
                  <Image source={{ uri: app.petImage }} style={styles.petTabImage} />
                )}
                <Text style={[styles.petTabText, selectedAppId === app.id && styles.petTabTextActive]}>
                  {app.petName}
                </Text>
                <View style={[
                  styles.statusIndicator,
                  app.status === 'aprobada' && styles.statusIndicatorApproved,
                  app.status === 'rechazada' && styles.statusIndicatorRejected,
                ]} />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Timeline Card */}
          {selectedApp && (
            <BlurView intensity={40} tint="dark" style={styles.timelineCard}>
              <View style={styles.petCardHeader}>
                {selectedApp.petImage && (
                  <Image source={{ uri: selectedApp.petImage }} style={styles.petHeaderImage} />
                )}
                <View>
                  <Text style={styles.petHeaderName}>{selectedApp.petName}</Text>
                  <Text style={styles.petHeaderDate}>
                    Iniciada: {new Date(selectedApp.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  selectedApp.status === 'aprobada' && styles.statusBadgeApproved,
                  selectedApp.status === 'rechazada' && styles.statusBadgeRejected,
                ]}>
                  <Text style={styles.statusBadgeText}>{selectedApp.status.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.timeline}>
                {STAGES.map((stage, idx) => {
                  const state = getStageStatus(stage.key, selectedApp.status);
                  const Icon = stage.key === 'aprobada' && selectedApp.status === 'rechazada' ? HeartCrack : stage.icon;

                  return (
                    <View key={stage.key} style={styles.timelineStep}>
                      {/* Left: Icon and Line */}
                      <View style={styles.stepIndicatorCol}>
                        <View style={[
                          styles.iconRing,
                          state === 'completed' && styles.ringCompleted,
                          state === 'active' && styles.ringActive,
                          state === 'rejected' && styles.ringRejected,
                        ]}>
                          {state === 'completed' ? (
                            <Check size={14} color="#fff" />
                          ) : (
                            <Icon size={14} color={
                              state === 'active' ? colors.secondary :
                              state === 'rejected' ? colors.error : '#64748b'
                            } />
                          )}
                        </View>
                        {idx < STAGES.length - 1 && (
                          <View style={[
                            styles.connectorLine,
                            state === 'completed' && styles.lineCompleted
                          ]} />
                        )}
                      </View>

                      {/* Right: Texts */}
                      <View style={styles.stepInfoCol}>
                        <Text style={[
                          styles.stepTitle,
                          state === 'active' && styles.textActive,
                          state === 'rejected' && styles.textRejected,
                        ]}>
                          {stage.key === 'aprobada' && selectedApp.status === 'rechazada' ? 'Solicitud Rechazada' : stage.label}
                        </Text>
                        <Text style={styles.stepDesc}>
                          {stage.key === 'aprobada' && selectedApp.status === 'rechazada'
                            ? 'Lamentablemente la solicitud no fue aprobada. Te invitamos a postular por otra mascota.'
                            : stage.description}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </BlurView>
          )}
        </>
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
  sectionTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  emptyCard: {
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  horizList: {
    gap: 12,
    marginBottom: 24,
  },
  petTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  petTabActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderColor: colors.secondary,
  },
  petTabImage: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  petTabText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
  },
  petTabTextActive: {
    color: '#fff',
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
  },
  statusIndicatorApproved: {
    backgroundColor: colors.successGreen,
  },
  statusIndicatorRejected: {
    backgroundColor: colors.error,
  },
  timelineCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(11, 19, 38, 0.55)',
    padding: 22,
    overflow: 'hidden',
  },
  petCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingBottom: 16,
    marginBottom: 20,
  },
  petHeaderImage: {
    width: 50,
    height: 50,
    borderRadius: 18,
  },
  petHeaderName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  petHeaderDate: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    marginLeft: 'auto',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
  },
  statusBadgeApproved: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  statusBadgeRejected: {
    backgroundColor: 'rgba(255, 139, 139, 0.15)',
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  timeline: {
    paddingLeft: 4,
  },
  timelineStep: {
    flexDirection: 'row',
    gap: 16,
  },
  stepIndicatorCol: {
    alignItems: 'center',
  },
  iconRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  ringCompleted: {
    borderColor: colors.successGreen,
    backgroundColor: colors.successGreen,
  },
  ringActive: {
    borderColor: colors.secondary,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  ringRejected: {
    borderColor: colors.error,
    backgroundColor: 'rgba(255, 139, 139, 0.1)',
  },
  connectorLine: {
    width: 2,
    height: 52,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: -2,
    marginBottom: -2,
  },
  lineCompleted: {
    backgroundColor: colors.successGreen,
  },
  stepInfoCol: {
    flex: 1,
    paddingTop: 2,
    paddingBottom: 24,
  },
  stepTitle: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '700',
  },
  textActive: {
    color: colors.secondary,
  },
  textRejected: {
    color: colors.error,
  },
  stepDesc: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
});
