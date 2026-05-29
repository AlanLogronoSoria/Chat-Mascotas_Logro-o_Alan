import { useAuthStore } from "@features/auth/presentation/store/authStore";
import { Message } from "@features/chat/domain/entities/Message";
import { useChat } from "@features/chat/presentation/hooks/useChat";
import { pickAndUploadImage } from "@shared/infrastructure/supabase/StorageService";

import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import LottieView from 'lottie-react-native';

import { useCallback, useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  ArrowUp,
  ImagePlus,
  ShieldCheck,
} from "lucide-react-native";

export default function ChatScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();

  const { messages, sendMessage, isLoading } = useChat(roomId);

  const user = useAuthStore((s) => s.user);

  const [input, setInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    console.log("ID de sala recibido:", roomId);

    if (messages.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = useCallback(() => {
    if (!input.trim() || !user) return;

    sendMessage({
      content: input.trim(),
    });

    setInput("");
  }, [input, sendMessage, user]);

  const handleImagePick = useCallback(async () => {
    if (!user) return;

    try {
      setIsUploading(true);

      const imageUrl = await pickAndUploadImage();

      if (imageUrl) {
        sendMessage({
          content: "",
          imageUrl,
        });
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setIsUploading(false);
    }
  }, [sendMessage, user]);

  const renderMsg = ({ item }: { item: Message }) => {
    const isOwn = item.userId === user?.id;

    const initials = (item.authorUsername ?? "U")
      .charAt(0)
      .toUpperCase();

    return (
      <View
        style={[
          styles.row,
          isOwn && styles.rowOwn,
        ]}
      >
        {!isOwn && (
          <LinearGradient
            colors={["#ef4444", "#991b1b"]}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>
              {initials}
            </Text>
          </LinearGradient>
        )}

        <BlurView
          intensity={35}
          tint={isOwn ? "dark" : "light"}
          style={[
            styles.bubble,
            isOwn
              ? styles.ownBubble
              : styles.otherBubble,
          ]}
        >
          {!isOwn && (
            <Text style={styles.author}>
              {item.authorUsername ||
                (user?.role === "cliente"
                  ? "Vendedor"
                  : "Cliente")}
            </Text>
          )}

          {item.imageUrl && (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.msgImage}
              resizeMode="cover"
            />
          )}

          {!!item.content && (
            <Text
              style={[
                styles.msgText,
                isOwn && styles.msgTextOwn,
              ]}
            >
              {item.content}
            </Text>
          )}

          <Text
            style={[
              styles.time,
              isOwn && styles.timeOwn,
            ]}
          >
            {new Date(item.createdAt).toLocaleTimeString(
              [],
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            )}
          </Text>
        </BlurView>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#ef4444"
        />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={["#070B14", "#0F172A", "#111827"]}
        style={styles.container}
      >
        {/* Ambient lights */}
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.statusRow}>
            <ShieldCheck
              size={14}
              color="#22c55e"
            />

            <Text style={styles.statusText}>
              Encrypted connection active
              
            </Text>
          </View>
          <LottieView
            source={require('../../../src/assets/lottie/chatRoomAnimation.json')}
            autoPlay
            loop
            style={styles.headerLottie}
          />
        </View>

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderMsg}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
        />

        {/* Input */}
        <BlurView
          intensity={45}
          tint="dark"
          style={styles.inputContainer}
        >
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={handleImagePick}
            disabled={isUploading}
            activeOpacity={0.8}
          >
            {isUploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ImagePlus
                size={20}
                color="#fff"
              />
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Write a secure message..."
            placeholderTextColor="#64748b"
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={[
              styles.sendBtn,
              !input.trim() &&
                styles.sendBtnOff,
            ]}
            onPress={handleSend}
            disabled={!input.trim()}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={
                input.trim()
                  ? ["#ef4444", "#dc2626"]
                  : ["#374151", "#374151"]
              }
              style={styles.sendGradient}
            >
              <ArrowUp
                size={18}
                color="#fff"
              />
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070B14",
  },

  glowTop: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 240,
    backgroundColor: "rgba(239,68,68,0.18)",
  },

  glowBottom: {
    position: "absolute",
    bottom: -120,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 240,
    backgroundColor: "rgba(59,130,246,0.18)",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#070B14",
  },

  header: {
    paddingTop: 70,
    paddingHorizontal: 22,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(15,23,42,0.7)",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLottie: {
    width: 80,
    height: 40,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -1,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },

  statusText: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "500",
  },

  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 14,
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },

  rowOwn: {
    justifyContent: "flex-end",
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },

  avatarText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  bubble: {
    maxWidth: "78%",
    borderRadius: 24,
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },

  ownBubble: {
    backgroundColor: "rgba(239,68,68,0.18)",
    borderColor: "rgba(239,68,68,0.22)",
    borderBottomRightRadius: 8,
  },

  otherBubble: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.08)",
    borderBottomLeftRadius: 8,
  },

  author: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fca5a5",
    marginBottom: 6,
    letterSpacing: 0.4,
  },

  msgText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#f8fafc",
  },

  msgTextOwn: {
    color: "#fff",
  },

  time: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 6,
    alignSelf: "flex-end",
  },

  timeOwn: {
    color: "rgba(255,255,255,0.55)",
  },

  msgImage: {
    width: 220,
    height: 170,
    borderRadius: 16,
    marginBottom: 8,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(15,23,42,0.82)",
  },

  attachBtn: {
    width: 46,
    height: 46,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },

  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 110,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 15,
    color: "#fff",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  sendBtn: {
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 2,
  },

  sendBtnOff: {
    opacity: 0.6,
  },

  sendGradient: {
    width: 46,
    height: 46,
    justifyContent: "center",
    alignItems: "center",
  },
});