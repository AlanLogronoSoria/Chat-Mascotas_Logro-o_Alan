
import { useAuth } from "@features/auth/presentation/hooks/useAuth";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { useState } from "react";
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

import {
  Heart,
  Lock,
  Mail,
  Sparkles,
} from "lucide-react-native";

import { colors } from "../../src/shared/design/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { login, isLoading, error } = useAuth();

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) return;

    login({
      email: email.trim(),
      password,
    });
  };

  const handleGoogleLogin = () => {
    setEmail("adoptante@petadopt.com");
    setPassword("password123");
  };

  const CardContainer =
    Platform.OS === "ios" ? BlurView : View;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={["#070B14", "#0F172A", "#02050B"]}
        style={styles.container}
      >
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoOutline}>
              <LinearGradient
                colors={[colors.secondary, "#6A0DAD"]}
                style={styles.logoGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Heart
                  size={34}
                  color="#fff"
                  fill="#fff"
                />
              </LinearGradient>
            </View>

            <Text style={styles.brand}>
              PetAdopt
            </Text>

            <View style={styles.statusRow}>
              <Sparkles
                size={12}
                color={colors.secondary}
              />

              <Text style={styles.statusText}>
                FIND YOUR PERFECT COMPANION
              </Text>
            </View>
          </View>

          <CardContainer
            {...(Platform.OS === "ios"
              ? {
                  intensity: 45,
                  tint: "dark",
                }
              : {})}
            style={styles.card}
          >
            <View style={styles.cardGlow} />

            <View style={styles.titleWrapper}>
              <Text style={styles.titleLight}>
                Inicia
              </Text>

              <Text style={styles.titleDark}>
                Sesión.
              </Text>

              <Text style={styles.subtitle}>
                Únete a la plataforma de adopción del
                futuro.
              </Text>
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>
                  {error}
                </Text>
              </View>
            )}

            <View style={styles.form}>
              {/* EMAIL */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  CORREO ELECTRÓNICO
                </Text>

                <View
                  style={[
                    styles.inputWrapper,
                    focusedField === "email" &&
                      styles.inputWrapperFocused,
                  ]}
                >
                  <Mail
                    size={18}
                    color={
                      focusedField === "email"
                        ? colors.secondary
                        : "#64748b"
                    }
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="ejemplo@petadopt.com"
                    placeholderTextColor="#64748b"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onFocus={() =>
                      setFocusedField("email")
                    }
                    onBlur={() =>
                      setFocusedField(null)
                    }
                  />
                </View>
              </View>

              {/* PASSWORD */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  CONTRASEÑA
                </Text>

                <View
                  style={[
                    styles.inputWrapper,
                    focusedField === "password" &&
                      styles.inputWrapperFocused,
                  ]}
                >
                  <Lock
                    size={18}
                    color={
                      focusedField === "password"
                        ? colors.secondary
                        : "#64748b"
                    }
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#64748b"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCorrect={false}
                    returnKeyType="done"
                    onFocus={() =>
                      setFocusedField("password")
                    }
                    onBlur={() =>
                      setFocusedField(null)
                    }
                  />
                </View>
              </View>

              {/* LOGIN BUTTON */}
              <TouchableOpacity
                style={[
                  styles.btnPrimary,
                  isLoading && styles.btnDisabled,
                ]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[
                    colors.secondary,
                    "#6A0DAD",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.btnGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text
                      style={styles.btnPrimaryText}
                    >
                      Ingresar
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* DEMO */}
              <TouchableOpacity
                style={styles.btnGoogle}
                onPress={handleGoogleLogin}
                activeOpacity={0.85}
              >
                <View style={styles.googleContent}>
                  <Text
                    style={styles.googleIconText}
                  >
                    G
                  </Text>

                  <Text
                    style={styles.btnGoogleText}
                  >
                    Acceso rápido Demo
                  </Text>
                </View>
              </TouchableOpacity>

              {/* REGISTER */}
              <Link
                href="/(auth)/register"
                asChild
              >
                <TouchableOpacity
                  style={styles.btnSecondary}
                  activeOpacity={0.85}
                >
                  <Text
                    style={styles.btnSecondaryText}
                  >
                    Crear una cuenta nueva
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </CardContainer>

          <View style={styles.footerContainer}>
            <View style={styles.footerDivider} />

            <Text style={styles.footer}>
              TECNOLOGÍA · EMPATÍA · FUTURO PREMIUM
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#070B14",
  },

  container: {
    flex: 1,
  },

  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  glowTop: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor:
      "rgba(0, 240, 255, 0.15)",
  },

  glowBottom: {
    position: "absolute",
    bottom: -120,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor:
      "rgba(208, 188, 255, 0.15)",
  },

  header: {
    alignItems: "center",
    marginBottom: 30,
  },

  logoOutline: {
    width: 80,
    height: 80,
    borderRadius: 26,
    padding: 2,
    backgroundColor:
      "rgba(255, 255, 255, 0.08)",
    shadowColor: colors.neonBlue,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
  },

  logoGradient: {
    flex: 1,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  brand: {
    fontSize: 36,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -1.5,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },

  statusText: {
    color: colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
  },

  card: {
    borderRadius: 30,
    overflow: "hidden",
    padding: 24,
    borderWidth: 1,
    borderColor:
      "rgba(255, 255, 255, 0.06)",
    backgroundColor:
      "rgba(11, 19, 38, 0.55)",
  },

  cardGlow: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor:
      "rgba(0, 240, 255, 0.06)",
  },

  titleWrapper: {
    marginBottom: 24,
  },

  titleLight: {
    fontSize: 38,
    fontWeight: "300",
    color: "#94a3b8",
    lineHeight: 40,
    letterSpacing: -1.5,
  },

  titleDark: {
    fontSize: 38,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 40,
    letterSpacing: -1.5,
    marginTop: 2,
  },

  subtitle: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 8,
    lineHeight: 22,
  },

  errorBox: {
    backgroundColor:
      "rgba(255, 139, 139, 0.12)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor:
      "rgba(255, 139, 139, 0.22)",
  },

  errorText: {
    color: "#FF8B8B",
    fontSize: 13,
    fontWeight: "500",
  },

  form: {
    gap: 16,
  },

  fieldGroup: {
    gap: 8,
  },

  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: 2,
    marginLeft: 4,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor:
      "rgba(255, 255, 255, 0.08)",
    backgroundColor:
      "rgba(255, 255, 255, 0.03)",
    borderRadius: 18,
    paddingHorizontal: 16,
  },

  inputWrapperFocused: {
    borderColor: colors.secondary,
    backgroundColor:
      "rgba(0, 240, 255, 0.05)",
  },

  input: {
    flex: 1,
    color: "#ffffff",
    paddingVertical: 14,
    fontSize: 15,
  },

  btnPrimary: {
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 10,
  },

  btnGradient: {
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  btnDisabled: {
    opacity: 0.6,
  },

  btnPrimaryText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.5,
  },

  btnGoogle: {
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor:
      "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor:
      "rgba(255, 255, 255, 0.1)",
  },

  googleContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  googleIconText: {
    color: colors.secondary,
    fontWeight: "800",
    fontSize: 16,
  },

  btnGoogleText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  btnSecondary: {
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
  },

  btnSecondaryText: {
    color: "#cbd5e1",
    fontWeight: "600",
    fontSize: 14,
  },

  footerContainer: {
    alignItems: "center",
    marginTop: 30,
  },

  footerDivider: {
    width: 60,
    height: 4,
    borderRadius: 2,
    backgroundColor:
      "rgba(255, 255, 255, 0.08)",
    marginBottom: 16,
  },

  footer: {
    textAlign: "center",
    fontSize: 11,
    color: "#64748b",
    letterSpacing: 2,
    fontWeight: "700",
  },
});

