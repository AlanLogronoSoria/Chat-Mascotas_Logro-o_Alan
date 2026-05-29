import { useAuthStore } from "@features/auth/presentation/store/authStore";
import { useRooms } from "@features/chat/presentation/hooks/useRooms";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  MessageCircleMore,
  ShieldCheck,
  Sparkles,
  Store,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useProducts } from "../hooks/useProducts";

// ==============================
// SKYCHAT NEXT UI
// ==============================
const BG_DARK = "#070B14";
const BG_MID = "#0F172A";
const CARD_BG = "rgba(255,255,255,0.05)";
const BORDER = "rgba(255,255,255,0.08)";
const TEXT = "#F8FAFC";
const TEXT_SOFT = "#94A3B8";
const RED = "#EF4444";
const RED_DARK = "#991B1B";

export function MarketplaceView() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const { products, isLoading, createProduct, isCreating } =
    useProducts();

  const { createRoom } = useRooms();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [formError, setFormError] = useState<string | null>(
    null
  );

  const [focusedField, setFocusedField] =
    useState<string | null>(null);

  const isVendedor =
    user?.role?.toLowerCase().trim() === "vendedor";

  // ==============================
  // PUBLICAR PRODUCTO
  // ==============================
  const handlePublish = async () => {
    setFormError(null);

    if (!name.trim() || !price.trim()) {
      setFormError(
        "El nombre y el precio son obligatorios."
      );
      return;
    }

    const parsedPrice = parseFloat(price);

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setFormError("Ingresa un precio válido.");
      return;
    }

    try {
      await createProduct({
        name: name.trim(),
        description: description.trim(),
        price: parsedPrice,
      });

      setName("");
      setDescription("");
      setPrice("");
    } catch (err: any) {
      setFormError(
        err?.message ||
          "No se pudo publicar el producto."
      );
    }
  };

  // ==============================
  // CHAT
  // ==============================
  const handleContactSeller = async (
    productId: string,
    productName: string
  ) => {
    try {
      const room = await createRoom({
        productId,
        productName,
      });

      if (room?.id) {
        router.push(`/chat/${room.id}`);
      }
    } catch (err) {
      console.error("Error al abrir chat:", err);
    }
  };

  // ==============================
  // PRODUCT CARD
  // ==============================
  const renderProduct = ({ item }: { item: any }) => (
    <BlurView
      intensity={35}
      tint="dark"
      style={styles.productCard}
    >
      {/* Glow */}
      <View style={styles.cardGlow} />

      {/* Top */}
      <View style={styles.productTop}>
        <LinearGradient
          colors={[RED, RED_DARK]}
          style={styles.productBadge}
        >
          <Store size={12} color="#fff" />

          <Text style={styles.productBadgeText}>
            PRODUCT
          </Text>
        </LinearGradient>

        <Text style={styles.productPrice}>
          ${item.price.toFixed(2)}
        </Text>
      </View>

      {/* Name */}
      <Text style={styles.productName}>
        {item.name}
      </Text>

      {/* Description */}
      {!!item.description && (
        <Text style={styles.productDescription}>
          {item.description}
        </Text>
      )}

      {/* Button */}
      {!isVendedor && (
        <TouchableOpacity
          style={styles.btnContact}
          onPress={() =>
            handleContactSeller(item.id, item.name)
          }
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[RED, "#DC2626"]}
            style={styles.contactGradient}
          >
            <MessageCircleMore
              size={18}
              color="#fff"
            />

            <Text style={styles.btnContactText}>
              Secure Chat
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </BlurView>
  );

  // ==============================
  // LOADING
  // ==============================
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={RED}
        />

        <Text style={styles.loadingText}>
          Loading marketplace...
        </Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[BG_DARK, BG_MID, "#111827"]}
        style={styles.container}
      >
        {/* Ambient Lights */}
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : "height"
          }
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <FlatList
            data={products}
            keyExtractor={(p) => p.id}
            renderItem={renderProduct}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
            ItemSeparatorComponent={() => (
              <View style={{ height: 16 }} />
            )}
            ListHeaderComponent={
              <>
                {/* ========================= */}
                {/* HERO */}
                {/* ========================= */}
                <View style={styles.hero}>
                  <View>
                    <Text style={styles.heroTitle}>
                      Marketplace
                    </Text>

                    <View style={styles.statusRow}>
                      <ShieldCheck
                        size={14}
                        color="#22c55e"
                      />

                      <Text style={styles.statusText}>
                        Secure encrypted commerce
                      </Text>
                    </View>
                  </View>

                  <LinearGradient
                    colors={[RED, RED_DARK]}
                    style={styles.heroBadge}
                  >
                    <Sparkles
                      size={16}
                      color="#fff"
                    />

                    <Text style={styles.heroBadgeText}>
                      {products.length}
                    </Text>
                  </LinearGradient>
                </View>

                {/* ========================= */}
                {/* FORM VENDEDOR */}
                {/* ========================= */}
                {isVendedor && (
                  <BlurView
                    intensity={40}
                    tint="dark"
                    style={styles.card}
                  >
                    <View style={styles.cardGlowBig} />

                    <Text style={styles.titleLight}>
                      Publish
                    </Text>

                    <Text style={styles.titleDark}>
                      Product.
                    </Text>

                    <Text style={styles.subtitle}>
                      Share your products with
                      clients securely.
                    </Text>

                    {formError && (
                      <View style={styles.errorBox}>
                        <Text
                          style={styles.errorText}
                        >
                          {formError}
                        </Text>
                      </View>
                    )}

                    <View style={styles.form}>
                      {/* NAME */}
                      <View
                        style={styles.fieldGroup}
                      >
                        <Text style={styles.label}>
                          PRODUCT NAME
                        </Text>

                        <TextInput
                          style={[
                            styles.input,
                            focusedField ===
                              "name" &&
                              styles.inputFocused,
                          ]}
                          placeholder="Gaming Laptop"
                          placeholderTextColor="#64748b"
                          value={name}
                          onChangeText={setName}
                          onFocus={() =>
                            setFocusedField(
                              "name"
                            )
                          }
                          onBlur={() =>
                            setFocusedField(
                              null
                            )
                          }
                        />
                      </View>

                      {/* DESCRIPTION */}
                      <View
                        style={styles.fieldGroup}
                      >
                        <Text style={styles.label}>
                          DESCRIPTION
                        </Text>

                        <TextInput
                          style={[
                            styles.input,
                            styles.textArea,
                            focusedField ===
                              "description" &&
                              styles.inputFocused,
                          ]}
                          placeholder="Describe your product..."
                          placeholderTextColor="#64748b"
                          multiline
                          value={description}
                          onChangeText={
                            setDescription
                          }
                          onFocus={() =>
                            setFocusedField(
                              "description"
                            )
                          }
                          onBlur={() =>
                            setFocusedField(
                              null
                            )
                          }
                        />
                      </View>

                      {/* PRICE */}
                      <View
                        style={styles.fieldGroup}
                      >
                        <Text style={styles.label}>
                          PRICE
                        </Text>

                        <TextInput
                          style={[
                            styles.input,
                            focusedField ===
                              "price" &&
                              styles.inputFocused,
                          ]}
                          placeholder="$0.00"
                          placeholderTextColor="#64748b"
                          keyboardType="numeric"
                          value={price}
                          onChangeText={setPrice}
                          onFocus={() =>
                            setFocusedField(
                              "price"
                            )
                          }
                          onBlur={() =>
                            setFocusedField(
                              null
                            )
                          }
                        />
                      </View>

                      {/* BUTTON */}
                      <TouchableOpacity
                        style={[
                          styles.btnPrimary,
                          isCreating &&
                            styles.btnDisabled,
                        ]}
                        onPress={handlePublish}
                        disabled={isCreating}
                        activeOpacity={0.85}
                      >
                        <LinearGradient
                          colors={[
                            RED,
                            "#DC2626",
                          ]}
                          style={
                            styles.primaryGradient
                          }
                        >
                          {isCreating ? (
                            <ActivityIndicator color="#fff" />
                          ) : (
                            <Text
                              style={
                                styles.btnPrimaryText
                              }
                            >
                              Publish Product
                            </Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </BlurView>
                )}
              </>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>
                  📦
                </Text>

                <Text style={styles.emptyTitle}>
                  Marketplace vacío
                </Text>

                <Text
                  style={styles.emptySubtitle}
                >
                  No hay productos disponibles.
                </Text>
              </View>
            }
          />
        </KeyboardAvoidingView>
      </LinearGradient>
    </>
  );
}

// ======================================
// STYLES
// ======================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_DARK,
  },

  glowTop: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor:
      "rgba(239,68,68,0.18)",
  },

  glowBottom: {
    position: "absolute",
    bottom: -120,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor:
      "rgba(59,130,246,0.18)",
  },

  scroll: {
    paddingHorizontal: 18,
    paddingTop: 70,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BG_DARK,
  },

  loadingText: {
    marginTop: 14,
    color: TEXT_SOFT,
    fontSize: 14,
  },

  // =========================
  // HERO
  // =========================
  hero: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
  },

  heroTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: TEXT,
    letterSpacing: -1.5,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },

  statusText: {
    color: TEXT_SOFT,
    fontSize: 12,
    fontWeight: "500",
  },

  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  heroBadgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  // =========================
  // CARD
  // =========================
  card: {
    borderRadius: 30,
    overflow: "hidden",
    padding: 24,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 28,
  },

  cardGlowBig: {
    position: "absolute",
    top: -70,
    right: -70,
    width: 180,
    height: 180,
    borderRadius: 180,
    backgroundColor:
      "rgba(239,68,68,0.15)",
  },

  titleLight: {
    fontSize: 46,
    fontWeight: "300",
    color: "#64748B",
    letterSpacing: -2,
    lineHeight: 48,
  },

  titleDark: {
    fontSize: 46,
    fontWeight: "800",
    color: TEXT,
    letterSpacing: -2,
    lineHeight: 48,
    marginTop: -6,
  },

  subtitle: {
    fontSize: 15,
    color: TEXT_SOFT,
    marginTop: 10,
    marginBottom: 28,
    lineHeight: 24,
  },

  // =========================
  // ERROR
  // =========================
  errorBox: {
    backgroundColor:
      "rgba(220,38,38,0.12)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor:
      "rgba(239,68,68,0.18)",
  },

  errorText: {
    color: "#FCA5A5",
    fontSize: 13,
    fontWeight: "500",
  },

  // =========================
  // FORM
  // =========================
  form: {
    gap: 18,
  },

  fieldGroup: {
    gap: 8,
  },

  label: {
    fontSize: 11,
    fontWeight: "700",
    color: TEXT_SOFT,
    letterSpacing: 2,
    marginLeft: 4,
  },

  input: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 15,
    color: TEXT,
    backgroundColor:
      "rgba(255,255,255,0.05)",
  },

  inputFocused: {
    borderColor:
      "rgba(239,68,68,0.55)",
    backgroundColor:
      "rgba(255,255,255,0.08)",
  },

  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },

  btnPrimary: {
    borderRadius: 22,
    overflow: "hidden",
    marginTop: 8,
  },

  primaryGradient: {
    paddingVertical: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  btnDisabled: {
    opacity: 0.6,
  },

  btnPrimaryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.4,
  },

  // =========================
  // PRODUCT CARD
  // =========================
  productCard: {
    borderRadius: 28,
    overflow: "hidden",
    padding: 22,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
  },

  cardGlow: {
    position: "absolute",
    bottom: -50,
    right: -50,
    width: 140,
    height: 140,
    borderRadius: 140,
    backgroundColor:
      "rgba(59,130,246,0.12)",
  },

  productTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  productBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  productBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },

  productPrice: {
    color: TEXT,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -1,
  },

  productName: {
    color: TEXT,
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 10,
    letterSpacing: -1,
  },

  productDescription: {
    color: TEXT_SOFT,
    fontSize: 14,
    lineHeight: 24,
  },

  btnContact: {
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 24,
  },

  contactGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
  },

  btnContactText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.3,
  },

  // =========================
  // EMPTY
  // =========================
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },

  emptyIcon: {
    fontSize: 52,
    marginBottom: 16,
  },

  emptyTitle: {
    color: TEXT,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },

  emptySubtitle: {
    color: TEXT_SOFT,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 30,
  },
});