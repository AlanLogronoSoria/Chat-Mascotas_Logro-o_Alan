import { useAuth } from "@features/auth/presentation/hooks/useAuth";
import { BlurView } from "expo-blur";
import { Stack } from "expo-router";
import LottieView from 'lottie-react-native';
import { StyleSheet, Text, View } from "react-native";

// ==========================================
// SKYCHAT "BEAUTIFUL RED" DESIGN SYSTEM
// ==========================================
const COLORS = {
  dark: "#070B14",
  secondary: "#00F0FF",
  grayMid: "#6b7280",
  white: "#ffffff",
  success: "#22c55e",
};

export default function AppLayout() {
  const { logout } = useAuth();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.dark,
        },
        headerTintColor: COLORS.secondary,
        headerTitleStyle: {
          fontWeight: "800",
          color: "#fff",
        },
        headerShadowVisible: false,
        headerBackTitle: "",
        contentStyle: {
          backgroundColor: COLORS.dark,
        },
        headerTitleAlign: "center",
        headerBackVisible: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false, // Usamos la cabecera personalizada interactiva de index.tsx
        }}
      />

      <Stack.Screen
        name="chat/[roomId]"
        options={({ route }) => ({
          headerTransparent: true,

          headerTitle: () => (
            <BlurView intensity={45} tint="dark" style={styles.chatHeader}>
              
              <Text style={styles.chatTitle}>
                {(route.params as any)?.roomId ? "Chat Directo" : "Chat"}

                <LottieView
                source={require('../../src/assets/lottie/chatRoomAnimation.json')}
                autoPlay
                loop
                style={styles.chatLottie}
              />
              </Text>

              
            </BlurView>
          ),
          
          headerRight: () => <View style={{ width: 88 }} />,
        })}
      />
    </Stack>
  );
}

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  // ======================================
  // HEADER PRINCIPAL
  // ======================================
  headerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },

  brand: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.redPrimary, // Texto de la marca en rojo
    letterSpacing: -0.8,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },

  tagline: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.grayMid,
    letterSpacing: 2.8,
  },

  // ======================================
  // ======================================
  // HEADER CHAT (BlurView adaptado)
  // ======================================
  chatHeader: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0, 240, 255, 0.15)",
    backgroundColor: "rgba(11, 19, 38, 0.75)",
    alignItems: "center",
    justifyContent: "center",
  },

  chatTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },

  chatSubtitle: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.grayMid,
    letterSpacing: 2.4,
  },
  chatLottie: {
    width: 100,
    height: 50,
    marginBottom: 2,
    
  },
});