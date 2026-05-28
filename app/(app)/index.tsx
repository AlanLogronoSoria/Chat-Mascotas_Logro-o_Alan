import { useAuthStore } from "@features/auth/presentation/store/authStore";
import { Room } from "@features/chat/domain/entities/Room";
import { useRooms } from "@features/chat/presentation/hooks/useRooms";
import { useProducts } from "@features/products/presentation/hooks/useProducts";
import { useAuth } from "@features/auth/presentation/hooks/useAuth";

import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  TextInput,
  ScrollView,
} from "react-native";

import {
  MessageCircle,
  Sparkles,
  MapPin,
  ClipboardList,
  Heart,
  Search,
  LayoutDashboard,
  Cat,
  LogOut,
} from "lucide-react-native";

import { colors } from "../../src/shared/design/theme";
import MapRefugios from "../../components/MapRefugios";
import GeminiChatView from "../../components/GeminiChatView";
import AdoptionApplicationsView from "../../components/AdoptionApplicationsView";
import ShelterDashboardView from "../../components/ShelterDashboardView";

export default function AppIndexScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const user = useAuthStore((s) => s.user);
  const { rooms, isLoading: loadingRooms } = useRooms();
  const { products, isLoading: loadingProducts } = useProducts();

  // Selected Tab state for Navigation
  // Adoptante tabs: 'feed' | 'map' | 'ai' | 'apps'
  // Refugio tabs: 'dashboard' | 'rooms'
  const isRefugio = user?.role?.toLowerCase().trim() === "vendedor";
  const [activeTab, setActiveTab] = useState<string>(isRefugio ? "dashboard" : "feed");

  // Feed states
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");

  if (!user) {
    return (
      <LinearGradient
        colors={["#070B14", "#0F172A", "#02050B"]}
        style={styles.centered}
      >
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />

        <BlurView
          intensity={40}
          tint="dark"
          style={styles.loaderCard}
        >
          <ActivityIndicator
            size="large"
            color={colors.secondary}
          />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </BlurView>
      </LinearGradient>
    );
  }

  // =====================================
  // ADOPTANTE - PET CARD RENDER
  // =====================================
  const renderPetCard = ({ item }: { item: any }) => {
    // Parse description JSON or plain text
    let breed = "Común / Criollo";
    let age = "1 año";
    let image = item.imageUrl || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300&auto=format&fit=crop";

    try {
      if (item.description && item.description.startsWith("{")) {
        const parsed = JSON.parse(item.description);
        breed = parsed.breed || breed;
        age = parsed.age || age;
        image = parsed.imageUrl || image;
      }
    } catch (e) {
      // Keep defaults
    }

    return (
      <TouchableOpacity
        style={styles.petCardWrapper}
        onPress={() => router.push(`/pet/${item.id}`)}
        activeOpacity={0.92}
      >
        <BlurView intensity={35} tint="dark" style={styles.petCard}>
          <Image source={{ uri: image }} style={styles.petImage} resizeMode="cover" />
          <View style={styles.petInfo}>
            <View style={styles.petTitleRow}>
              <Text style={styles.petName}>{item.name}</Text>
              <View style={styles.ageBadge}>
                <Text style={styles.ageText}>{age}</Text>
              </View>
            </View>
            <Text style={styles.petBreed}>{breed}</Text>
          </View>
        </BlurView>
      </TouchableOpacity>
    );
  };

  // =====================================
  // REFUGIO - CHAT ROOM CARD RENDER
  // =====================================
  const renderRoomCard = ({ item }: { item: Room }) => (
    <TouchableOpacity
      style={styles.roomWrapper}
      onPress={() => router.push(`/chat/${item.id}`)}
      activeOpacity={0.88}
    >
      <BlurView
        intensity={35}
        tint="dark"
        style={styles.roomCard}
      >
        <View style={styles.roomAvatar}>
          <LinearGradient
            colors={[colors.secondary, "#6A0DAD"]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Text style={styles.roomAvatarText}>
            {(item.productName ?? "M")
              .charAt(0)
              .toUpperCase()}
          </Text>
        </View>

        <View style={styles.roomInfo}>
          <Text numberOfLines={1} style={styles.roomName}>
            Conversación: {item.productName}
          </Text>
          <Text style={styles.roomMeta}>Adoptante registrado</Text>
        </View>

        <View style={styles.chevronContainer}>
          <Text style={styles.roomChevron}>›</Text>
        </View>
      </BlurView>
    </TouchableOpacity>
  );

  // =====================================
  // RENDER DYNAMIC ACTIVE VIEW
  // =====================================
  const renderViewContent = () => {
    // 1. REFUGIO views
    if (isRefugio) {
      if (activeTab === "dashboard") {
        return <ShelterDashboardView />;
      }
      if (activeTab === "rooms") {
        return loadingRooms ? (
          <View style={styles.centerSpinner}>
            <ActivityIndicator size="large" color={colors.secondary} />
          </View>
        ) : (
          <FlatList
            data={rooms}
            keyExtractor={(r) => r.id}
            renderItem={renderRoomCard}
            contentContainerStyle={styles.listContainer}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Sin chats activos</Text>
                <Text style={styles.emptySubtitle}>Las conversaciones de los adoptantes interesados aparecerán aquí.</Text>
              </View>
            }
          />
        );
      }
    }

    // 2. ADOPTANTE views
    if (activeTab === "map") {
      return <MapRefugios />;
    }
    if (activeTab === "ai") {
      return <GeminiChatView />;
    }
    if (activeTab === "apps") {
      return <AdoptionApplicationsView />;
    }

    // Default: Feed View
    const categories = ["Todos", "Perros", "Gatos", "Aves", "Otros"];

    const filteredPets = products.filter((item) => {
      const nameMatch = item.name.toLowerCase().includes(search.toLowerCase());
      if (activeCategory === "Todos") return nameMatch;
      
      let petCategory = "Otros";
      try {
        if (item.description && item.description.startsWith("{")) {
          const parsed = JSON.parse(item.description);
          const breedLower = (parsed.breed || "").toLowerCase();
          if (breedLower.includes("perro") || breedLower.includes("dog") || breedLower.includes("retriever") || breedLower.includes("pug") || breedLower.includes("bobby")) {
            petCategory = "Perros";
          } else if (breedLower.includes("gato") || breedLower.includes("cat") || breedLower.includes("siamés") || breedLower.includes("luna")) {
            petCategory = "Gatos";
          } else if (breedLower.includes("ave") || breedLower.includes("loro") || breedLower.includes("pájaro")) {
            petCategory = "Aves";
          }
        }
      } catch (e) {}

      return nameMatch && petCategory === activeCategory;
    });

    return (
      <View style={{ flex: 1 }}>
        <FlatList
          data={filteredPets}
          keyExtractor={(p) => p.id}
          renderItem={renderPetCard}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.feedScroll}
          ListHeaderComponent={
            <>
              {/* AI Recommendation Banner */}
              <TouchableOpacity onPress={() => setActiveTab("ai")} activeOpacity={0.88}>
                <LinearGradient
                  colors={[colors.secondary, "#6A0DAD"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.aiBanner}
                >
                  <View style={styles.aiBannerGlow} />
                  <Sparkles size={20} color="#fff" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.aiBannerTitle}>Recomendación por IA</Text>
                    <Text style={styles.aiBannerText}>Encuentra qué mascota ideal se alinea con tu estilo de vida.</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Search Bar */}
              <View style={styles.searchWrapper}>
                <Search size={18} color="#64748b" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar mascotas..."
                  placeholderTextColor="#64748b"
                  value={search}
                  onChangeText={setSearch}
                />
              </View>

              {/* Categories */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryBtn, activeCategory === cat && styles.categoryBtnActive]}
                    onPress={() => setActiveCategory(cat)}
                  >
                    <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Cat size={44} color="#64748b" />
              <Text style={styles.emptyTitle}>No se encontraron mascotas</Text>
              <Text style={styles.emptySubtitle}>Intenta ajustar los filtros o el término de búsqueda.</Text>
            </View>
          }
        />
      </View>
    );
  };

  return (
    <>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={["#070B14", "#0F172A", "#02050B"]}
        style={styles.container}
      >
        <SafeAreaView style={styles.safe}>
          {/* Header area */}
          <View style={styles.header}>
            <View>
              <Text style={styles.brandTitle}>PetAdopt</Text>
              <Text style={styles.brandSubtitle}>
                {isRefugio ? "Shelter Admin Panel" : "Adopción de mascotas"}
              </Text>
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <LogOut size={18} color="#FF8B8B" />
            </TouchableOpacity>
          </View>

          {/* Core View Content */}
          <View style={{ flex: 1 }}>
            {renderViewContent()}
          </View>

          {/* Floating Navigation Tab Bar */}
          <BlurView intensity={45} tint="dark" style={styles.tabBar}>
            {isRefugio ? (
              // Shelter Tab System
              <>
                <TouchableOpacity
                  style={[styles.tabItem, activeTab === "dashboard" && styles.tabItemActive]}
                  onPress={() => setActiveTab("dashboard")}
                >
                  <LayoutDashboard size={20} color={activeTab === "dashboard" ? colors.secondary : "#94a3b8"} />
                  <Text style={[styles.tabLabel, activeTab === "dashboard" && styles.tabLabelActive]}>Albergue</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabItem, activeTab === "rooms" && styles.tabItemActive]}
                  onPress={() => setActiveTab("rooms")}
                >
                  <MessageCircle size={20} color={activeTab === "rooms" ? colors.secondary : "#94a3b8"} />
                  <Text style={[styles.tabLabel, activeTab === "rooms" && styles.tabLabelActive]}>Mensajes</Text>
                </TouchableOpacity>
              </>
            ) : (
              // Adopter Tab System
              <>
                <TouchableOpacity
                  style={[styles.tabItem, activeTab === "feed" && styles.tabItemActive]}
                  onPress={() => setActiveTab("feed")}
                >
                  <Heart size={20} color={activeTab === "feed" ? colors.secondary : "#94a3b8"} />
                  <Text style={[styles.tabLabel, activeTab === "feed" && styles.tabLabelActive]}>Mascotas</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabItem, activeTab === "map" && styles.tabItemActive]}
                  onPress={() => setActiveTab("map")}
                >
                  <MapPin size={20} color={activeTab === "map" ? colors.secondary : "#94a3b8"} />
                  <Text style={[styles.tabLabel, activeTab === "map" && styles.tabLabelActive]}>Mapa</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabItem, activeTab === "ai" && styles.tabItemActive]}
                  onPress={() => setActiveTab("ai")}
                >
                  <Sparkles size={20} color={activeTab === "ai" ? colors.secondary : "#94a3b8"} />
                  <Text style={[styles.tabLabel, activeTab === "ai" && styles.tabLabelActive]}>PetGemini</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabItem, activeTab === "apps" && styles.tabItemActive]}
                  onPress={() => setActiveTab("apps")}
                >
                  <ClipboardList size={20} color={activeTab === "apps" ? colors.secondary : "#94a3b8"} />
                  <Text style={[styles.tabLabel, activeTab === "apps" && styles.tabLabelActive]}>Solicitudes</Text>
                </TouchableOpacity>
              </>
            )}
          </BlurView>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070B14",
  },
  safe: {
    flex: 1,
  },
  glowTop: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(0, 240, 255, 0.15)",
  },
  glowBottom: {
    position: "absolute",
    bottom: -120,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(208, 188, 255, 0.15)",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderCard: {
    paddingVertical: 30,
    paddingHorizontal: 34,
    borderRadius: 28,
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  loadingText: {
    marginTop: 14,
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "500",
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -1,
  },
  brandSubtitle: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,139,139,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,139,139,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  feedScroll: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  aiBanner: {
    borderRadius: 22,
    padding: 16,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
    overflow: "hidden",
  },
  aiBannerGlow: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  aiBannerTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  aiBannerText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    marginTop: 2,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 18,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    paddingVertical: 12,
    fontSize: 14,
  },
  categoriesScroll: {
    gap: 8,
    marginBottom: 20,
  },
  categoryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  categoryBtnActive: {
    backgroundColor: "rgba(0, 240, 255, 0.08)",
    borderColor: colors.secondary,
  },
  categoryText: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "700",
  },
  categoryTextActive: {
    color: "#fff",
  },
  gridRow: {
    justifyContent: "space-between",
    gap: 12,
  },
  petCardWrapper: {
    flex: 1,
    marginBottom: 12,
  },
  petCard: {
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  petImage: {
    width: "100%",
    height: 140,
  },
  petInfo: {
    padding: 12,
  },
  petTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  petName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  ageBadge: {
    backgroundColor: "rgba(208, 188, 255, 0.12)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ageText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "800",
  },
  petBreed: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 4,
  },
  tabBar: {
    position: "absolute",
    bottom: 16,
    left: 20,
    right: 20,
    borderRadius: 24,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-around",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(11, 19, 38, 0.75)",
    overflow: "hidden",
  },
  tabItem: {
    alignItems: "center",
    gap: 4,
  },
  tabItemActive: {
    transform: [{ scale: 1.05 }],
  },
  tabLabel: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "700",
  },
  tabLabelActive: {
    color: colors.secondary,
  },
  centerSpinner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  roomWrapper: {
    borderRadius: 22,
    overflow: "hidden",
  },
  roomCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  roomAvatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  roomAvatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  roomName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  roomMeta: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 4,
  },
  chevronContainer: {
    marginLeft: "auto",
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  roomChevron: {
    color: "#fff",
    fontSize: 18,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 100,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 14,
  },
  emptySubtitle: {
    color: "#64748b",
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },
});