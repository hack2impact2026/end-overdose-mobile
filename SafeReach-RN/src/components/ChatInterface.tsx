import { useState, useRef, useEffect, useCallback } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import * as Speech from 'expo-speech'
import { useApp } from '../AppContext'
import { CLAUDE_MODEL, CLAUDE_API_KEY, CLAUDE_API_URL, buildSystemPrompt, smartFallback, REACH_FALLBACKS } from '../config'
import { colors, radius, font } from '../theme'

const INITIAL_MESSAGE = {
  role: 'assistant' as const,
  content: "Hey, I'm here with you. Can you hear me? Tell me how you feel.",
  id: 'init',
}

async function callReach(messages: any[], systemPrompt: string): Promise<string> {
  const resp = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 280,
      system: systemPrompt,
      messages: messages.map(({ role, content }) => ({ role, content })),
    }),
  })
  if (!resp.ok) throw new Error(`API ${resp.status}`)
  const data = await resp.json()
  return data.content[0].text
}

export default function ChatInterface() {
  const { chatHistory, setChatHistory, naloxoneGiven, visionResult, userName } = useApp()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const flatListRef = useRef<FlatList>(null)

  const messages = chatHistory.length > 0 ? chatHistory : [INITIAL_MESSAGE]

  useEffect(() => {
    if (chatHistory.length === 0) {
      setChatHistory([INITIAL_MESSAGE])
      Speech.speak(INITIAL_MESSAGE.content, { rate: 0.88, pitch: 1.05 })
    }
  }, [])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return
    setError(null)
    const base = chatHistory.length > 0 ? chatHistory : [INITIAL_MESSAGE]
    const userMsg = { role: 'user' as const, content: text.trim(), id: String(Date.now()) }
    const next = [...base, userMsg]
    setChatHistory(next)
    setInput('')
    setLoading(true)

    const systemPrompt = buildSystemPrompt({ naloxoneGiven, visionResult, userName })

    try {
      const reply = await callReach(next, systemPrompt)
      const aiMsg = { role: 'assistant' as const, content: reply, id: String(Date.now() + 1) }
      setChatHistory(prev => [...prev, aiMsg])
      Speech.speak(reply, { rate: 0.88, pitch: 1.05 })
    } catch {
      const fallback = smartFallback(text, next.length)
      const aiMsg = { role: 'assistant' as const, content: fallback, id: String(Date.now() + 1) }
      setChatHistory(prev => [...prev, aiMsg])
      Speech.speak(fallback, { rate: 0.88, pitch: 1.05 })
    }
    setLoading(false)
  }, [chatHistory, loading, naloxoneGiven, visionResult, userName])

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }, [messages.length, loading])

  const renderItem = ({ item }: { item: typeof messages[0] }) => {
    const isUser = item.role === 'user'
    return (
      <View style={[s.bubble, isUser ? s.userBubble : s.aiBubble]}>
        {!isUser && <Text style={s.aiLabel}>Reach</Text>}
        <Text style={[s.bubbleText, isUser ? s.userText : s.aiText]}>{item.content}</Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0}
    >
      <View style={s.chatHeader}>
        <View style={s.reachDot} />
        <Text style={s.chatHeaderText}>Reach AI</Text>
        <Text style={s.chatHeaderSub}>Emergency companion</Text>
      </View>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          loading ? (
            <View style={s.typingBubble}>
              <Text style={s.aiLabel}>Reach</Text>
              <ActivityIndicator size="small" color={colors.red} />
            </View>
          ) : null
        }
      />
      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          value={input}
          onChangeText={setInput}
          placeholder="Tell Reach what's happening..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={() => sendMessage(input)}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[s.sendBtn, (!input.trim() || loading) && s.sendBtnDisabled]}
          onPress={() => sendMessage(input)}
          disabled={!input.trim() || loading}
        >
          <Text style={s.sendBtnText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
  chatHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  reachDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.red },
  chatHeaderText: { fontSize: font.sm, fontWeight: '700', color: colors.white },
  chatHeaderSub: { fontSize: font.xs, color: colors.textMuted },
  list: { padding: 14, gap: 10, paddingBottom: 4 },
  bubble: { maxWidth: '85%', padding: 12, borderRadius: radius.lg, marginBottom: 4 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.red, borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  aiLabel: { fontSize: font.xs, fontWeight: '700', color: colors.textMuted, marginBottom: 4 },
  bubbleText: { fontSize: font.md, lineHeight: 22 },
  userText: { color: '#fff' },
  aiText: { color: colors.textSecondary },
  typingBubble: { alignSelf: 'flex-start', backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 12, marginBottom: 4 },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    padding: 10, borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  input: {
    flex: 1, backgroundColor: colors.bgCard,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: font.md, color: colors.white,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { fontSize: 18, color: '#fff', fontWeight: '800' },
})
