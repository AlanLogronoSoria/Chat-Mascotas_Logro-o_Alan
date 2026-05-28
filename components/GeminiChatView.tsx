import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowUp, Sparkles } from 'lucide-react-native';
import { colors } from '../src/shared/design/theme';
import { GeminiService } from '../src/shared/infrastructure/ai/GeminiService';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  "¿Qué mascota se adapta a un departamento?",
  "¿Cómo socializar un perro y un gato?",
  "Requisitos para adoptar una mascota",
  "Calendario de vacunas básico para gatos"
];

export default function GeminiChatView() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: '¡Hola! Soy PetGemini AI, tu asistente experto. 🐾 Puedo ayudarte a elegir la mascota ideal, darte consejos de adiestramiento o explicarte el proceso de adopción. ¿En qué puedo ayudarte hoy?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Map to Gemini history format
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({
          role: m.sender === 'user' ? 'user' as const : 'model' as const,
          parts: m.text
        }));

      const aiReply = await GeminiService.chat(userMsg.text, history);

      const aiMsg: Message = {
        id: Math.random().toString(),
        sender: 'ai',
        text: aiReply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: Math.random().toString(),
        sender: 'ai',
        text: 'Lo siento, he experimentado una interferencia en mi red cuántica. Por favor, inténtalo de nuevo en unos momentos.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAi]}>
        {!isUser && (
          <LinearGradient
            colors={[colors.secondary, '#6A0DAD']}
            style={styles.aiAvatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Sparkles size={14} color="#fff" />
          </LinearGradient>
        )}
        <BlurView
          intensity={35}
          tint={isUser ? 'dark' : 'light'}
          style={[
            styles.bubble,
            isUser ? styles.bubbleUser : styles.bubbleAi,
          ]}
        >
          <Text style={[styles.msgText, isUser ? styles.msgTextUser : styles.msgTextAi]}>
            {item.text}
          </Text>
          <Text style={styles.timeText}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </BlurView>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Messages list */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          loading ? (
            <View style={styles.loadingBubbleRow}>
              <LinearGradient
                colors={[colors.secondary, '#6A0DAD']}
                style={styles.aiAvatar}
              >
                <Sparkles size={14} color="#fff" />
              </LinearGradient>
              <BlurView intensity={30} tint="light" style={[styles.bubble, styles.bubbleAi, styles.loadingBubble]}>
                <ActivityIndicator size="small" color={colors.secondary} />
              </BlurView>
            </View>
          ) : null
        }
      />

      {/* Suggestions */}
      {messages.length === 1 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Sugerencias de chat:</Text>
          <FlatList
            data={SUGGESTIONS}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsScroll}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionChip}
                onPress={() => handleSend(item)}
                activeOpacity={0.8}
              >
                <Text style={styles.suggestionText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Input container */}
      <BlurView intensity={45} tint="dark" style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Pregúntale a PetGemini AI..."
          placeholderTextColor="#64748b"
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={400}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
          onPress={() => handleSend(input)}
          disabled={!input.trim() || loading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={input.trim() ? [colors.secondary, '#6A0DAD'] : ['#1e293b', '#1e293b']}
            style={styles.sendGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <ArrowUp size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </BlurView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070B14',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 16,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    maxWidth: '85%',
  },
  msgRowUser: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  msgRowAi: {
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    shadowColor: colors.secondary,
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  bubble: {
    borderRadius: 22,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  bubbleUser: {
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderColor: 'rgba(0, 240, 255, 0.2)',
    borderBottomRightRadius: 6,
  },
  bubbleAi: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomLeftRadius: 6,
  },
  msgText: {
    fontSize: 15,
    lineHeight: 22,
  },
  msgTextUser: {
    color: '#fff',
  },
  msgTextAi: {
    color: '#dae2fd',
  },
  timeText: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  loadingBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    alignSelf: 'flex-start',
  },
  loadingBubble: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionsContainer: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    backgroundColor: 'rgba(7, 11, 20, 0.9)',
  },
  suggestionsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1.5,
    marginLeft: 18,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  suggestionsScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  suggestionChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  suggestionText: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(11, 19, 38, 0.95)',
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 100,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sendBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 1,
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
  sendGradient: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
