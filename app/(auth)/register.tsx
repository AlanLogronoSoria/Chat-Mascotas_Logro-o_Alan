import { useAuth } from "@features/auth/presentation/hooks/useAuth";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import {
  ArrowRight,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Heart,
  User,
  Building,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../../src/shared/design/theme";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"cliente" | "vendedor">("cliente");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { register, isLoading, error } = useAuth();

  const roleDescription = useMemo(() => {
    return role === "cliente"
      ? "Explora mascotas adorables y envía solicitudes al instante."
      : "Publica mascotas perdidas o en adopción y gestiona solicitudes.";
  }, [role]);

  return (
    <>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={["#070B14", "#0F172A", "#02050B"]}
        style={styles.root}
      >
        {/* Ambient Glows */}
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* HERO */}
            <View style={styles.hero}>
              <View style={styles.logoOutline}>
                <LinearGradient
                  colors={[colors.secondary, "#6A0DAD"]}
                  style={styles.logoGradient}
                >
                  <Heart color="#fff" size={20} fill="#fff" />
                </LinearGradient>
              </View>

              <Text style={styles.brand}>PetAdopt</Text>
              <Text style={styles.tagline}>
                FUTURE OF ANIMAL CARE
              </Text>
            </View>

            {/* CARD */}
            <BlurView intensity={45} tint="dark" style={styles.card}>
              <View style={styles.cardBorder} />

              <Text style={styles.titleMuted}>Crea</Text>
              <Text style={styles.title}>tu cuenta.</Text>

              <Text style={styles.subtitle}>{roleDescription}</Text>

              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* ROLE SELECTOR */}
              <View style={styles.section}>
                <Text style={styles.label}>SELECCIONA TU ROL</Text>

                <View style={styles.roleContainer}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={[
                      styles.roleCard,
                      role === "cliente" && styles.roleCardActive,
                    ]}
                    onPress={() => setRole("cliente")}
                  >
                    <View
                      style={[
                        styles.roleIcon,
                        role === "cliente" && styles.roleIconActive,
                      ]}
                    >
                      <User
                        size={18}
                        color={role === "cliente" ? "#ffffff" : "#9ca3af"}
                      />
                    </View>

                    <Text
                      style={[
                        styles.roleTitle,
                        role === "cliente" && styles.roleTitleActive,
                      ]}
                    >
                      Adoptante
                    </Text>

                    <Text style={styles.roleSubtitle}>
                      Busca y adopta una mascota ideal
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={[
                      styles.roleCard,
                      role === "vendedor" && styles.roleCardActivePurple,
                    ]}
                    onPress={() => setRole("vendedor")}
                  >
                    <View
                      style={[
                        styles.roleIcon,
                        role === "vendedor" && styles.roleIconActivePurple,
                      ]}
                    >
                      <Building
                        size={18}
                        color={role === "vendedor" ? "#ffffff" : "#9ca3af"}
                      />
                    </View>

                    <Text
                      style={[
                        styles.roleTitle,
                        role === "vendedor" && styles.roleTitleActive,
                      ]}
                    >
                      Refugio
                    </Text>

                    <Text style={styles.roleSubtitle}>
                      Gestiona tu albergue y rescates
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* FORM */}
              <View style={styles.form}>
                {/* USERNAME */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>NOMBRE DE USUARIO</Text>

                  <View
                    style={[
                      styles.inputWrapper,
                      focusedField === "username" &&
                        styles.inputWrapperFocused,
                    ]}
                  >
                    <User size={18} color={focusedField === "username" ? colors.secondary : "#6b7280"} />

                    <TextInput
                      style={styles.input}
                      placeholder="nombre_usuario"
                      placeholderTextColor="#6b7280"
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                      onFocus={() => setFocusedField("username")}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>

                {/* EMAIL */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>CORREO ELECTRÓNICO</Text>

                  <View
                    style={[
                      styles.inputWrapper,
                      focusedField === "email" &&
                        styles.inputWrapperFocused,
                    ]}
                  >
                    <Mail size={18} color={focusedField === "email" ? colors.secondary : "#6b7280"} />

                    <TextInput
                      style={styles.input}
                      placeholder="ejemplo@petadopt.com"
                      placeholderTextColor="#6b7280"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>

                {/* PASSWORD */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>CONTRASEÑA</Text>

                  <View
                    style={[
                      styles.inputWrapper,
                      focusedField === "password" &&
                        styles.inputWrapperFocused,
                    ]}
                  >
                    <Lock size={18} color={focusedField === "password" ? colors.secondary : "#6b7280"} />

                    <TextInput
                      style={styles.input}
                      placeholder="Mínimo 6 caracteres"
                      placeholderTextColor="#6b7280"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>

                {/* SECURITY INFO */}
                <View style={styles.securityBox}>
                  <ShieldCheck size={16} color="#22c55e" />

                  <Text style={styles.securityText}>
                    Autenticación encriptada y acceso seguro.
                  </Text>
                </View>

                {/* REGISTER BUTTON */}
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={[
                    styles.primaryButton,
                    isLoading && styles.buttonDisabled,
                  ]}
                  onPress={() =>
                    register({
                      email: email.trim(),
                      password,
                      username: username.trim(),
                      role,
                    })
                  }
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={
                      role === "vendedor"
                        ? ["#6A0DAD", colors.primaryContainer]
                        : [colors.secondary, "#00a3ff"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryGradient}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.primaryButtonText}>
                          Crear Cuenta
                        </Text>

                        <ArrowRight color="#fff" size={18} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* LOGIN BUTTON */}
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.secondaryButton}
                  >
                    <Text style={styles.secondaryButtonText}>
                      ¿Ya tienes cuenta? Inicia sesión
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </BlurView>

            <Text style={styles.footer}>
              TECNOLOGÍA · EMPATÍA · FUTURO PREMIUM
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#070B14",
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  glowTop: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(0, 240, 255, 0.15)",
  },
  glowBottom: {
    position: "absolute",
    bottom: -100,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(160, 120, 255, 0.15)",
  },
  hero: {
    alignItems: "center",
    marginBottom: 28,
  },
  logoOutline: {
    width: 64,
    height: 64,
    borderRadius: 20,
    padding: 2,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
  },
  logoGradient: {
    flex: 1,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    fontSize: 34,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -1,
  },
  tagline: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 4,
    color: colors.onSurfaceVariant,
  },
  card: {
    overflow: "hidden",
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    backgroundColor: "rgba(11, 19, 38, 0.55)",
    padding: 28,
  },
  cardBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  titleMuted: {
    fontSize: 40,
    color: "#6b7280",
    fontWeight: "300",
    letterSpacing: -1.5,
    lineHeight: 42,
  },
  title: {
    fontSize: 40,
    color: "#ffffff",
    fontWeight: "800",
    letterSpacing: -1.5,
    lineHeight: 42,
    marginTop: -2,
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 14,
    marginTop: 12,
    marginBottom: 28,
    lineHeight: 22,
  },
  errorBox: {
    backgroundColor: "rgba(255, 139, 139, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 139, 139, 0.22)",
    padding: 14,
    borderRadius: 16,
    marginBottom: 20,
  },
  errorText: {
    color: "#FF8B8B",
    fontSize: 13,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#94a3b8",
    marginBottom: 12,
  },
  roleContainer: {
    flexDirection: "row",
    gap: 14,
  },
  roleCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  roleCardActive: {
    borderColor: colors.secondary,
    backgroundColor: "rgba(0, 240, 255, 0.08)",
  },
  roleCardActivePurple: {
    borderColor: colors.primary,
    backgroundColor: "rgba(208, 188, 255, 0.08)",
  },
  roleIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  roleIconActive: {
    backgroundColor: colors.secondary,
  },
  roleIconActivePurple: {
    backgroundColor: colors.primary,
  },
  roleTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  roleTitleActive: {
    color: "#ffffff",
  },
  roleSubtitle: {
    color: "#94a3b8",
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  form: {
    gap: 16,
  },
  fieldGroup: {
    gap: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 18,
    paddingHorizontal: 16,
  },
  inputWrapperFocused: {
    borderColor: colors.secondary,
    backgroundColor: "rgba(0, 240, 255, 0.04)",
  },
  input: {
    flex: 1,
    color: "#ffffff",
    paddingVertical: 14,
    fontSize: 15,
  },
  securityBox: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(34,197,94,0.08)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.15)",
    padding: 14,
  },
  securityText: {
    color: "#bbf7d0",
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  primaryButton: {
    marginTop: 10,
    borderRadius: 18,
    overflow: "hidden",
  },
  primaryGradient: {
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  secondaryButton: {
    marginTop: 2,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  secondaryButtonText: {
    color: "#cbd5e1",
    fontWeight: "600",
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footer: {
    textAlign: "center",
    marginTop: 28,
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 3,
  },
});