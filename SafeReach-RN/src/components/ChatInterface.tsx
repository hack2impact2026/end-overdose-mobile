import { useState, useRef, useEffect, useCallback } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
  Animated, Easing, Alert
} from 'react-native'
import * as Speech from 'expo-speech'
import { Audio } from 'expo-av'
import Svg, { Path, Rect, Line } from 'react-native-svg'
import { useApp } from '../AppContext'
import { CLAUDE_MODEL, CLAUDE_API_KEY, CLAUDE_API_URL, OPENAI_API_KEY, buildSystemPrompt, smartFallback } from '../config'
import { radius, font, lightColors as L } from '../theme'

type GuidanceMode = 'awake' | 'emergency'

function initialMessage(guidanceMode: GuidanceMode) {
  return {
    role: 'assistant' as const,
    content: guidanceMode === 'awake'
      ? "They're awake. Keep them talking and watch their breathing. Tell me if anything changes."
      : "They're unresponsive. Keep them on their side and watch their breathing closely. Tell me if anything changes.",
    id: 'init',
  }
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

function MicIcon() {
  return (
    <Svg width={18} height={22} viewBox="0 0 24 28" fill="none">
      {/* Capsule body */}
      <Path
        d="M12 2C9.79 2 8 3.79 8 6v8c0 2.21 1.79 4 4 4s4-1.79 4-4V6c0-2.21-1.79-4-4-4z"
        fill="#FFFFFF"
      />
      {/* Arc stand */}
      <Path
        d="M5 13a7 7 0 0 0 14 0"
        stroke="#FFFFFF"
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
      {/* Stem */}
      <Line x1={12} y1={20} x2={12} y2={25} stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
      {/* Base */}
      <Line x1={8} y1={25} x2={16} y2={25} stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  )
}

async function transcribeAudio(uri: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', { uri, type: 'audio/m4a', name: 'voice.m4a' } as any)
  formData.append('model', 'whisper-1')
  const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: formData,
  })
  if (!resp.ok) throw new Error(`Whisper ${resp.status}`)
  const data = await resp.json()
  return data.text ?? ''
}

export default function ChatInterface({
  guidanceMode = 'emergency',
  expanded = false,
  onToggleExpanded,
}: {
  guidanceMode?: GuidanceMode
  expanded?: boolean
  onToggleExpanded?: () => void
}) {
  const { chatHistory, setChatHistory, naloxoneGiven, visionResult, userName } = useApp()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const flatListRef = useRef<FlatList>(null)
  const recordingRef = useRef<Audio.Recording | null>(null)
  const breathAnim = useRef(new Animated.Value(1)).current
  const breathLoopRef = useRef<Animated.CompositeAnimation | null>(null)

  const firstMessage = initialMessage(guidanceMode)
  const messages = chatHistory.length > 0 ? chatHistory : [firstMessage]

  useEffect(() => {
    if (chatHistory.length === 0) {
      setChatHistory([firstMessage])
      Speech.speak(firstMessage.content, { rate: 0.88, pitch: 1.05 })
    }
  }, [chatHistory.length, firstMessage, setChatHistory])

  function startBreathing() {
    breathLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, {
          toValue: 1.07,
          duration: 550,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breathAnim, {
          toValue: 1,
          duration: 550,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    )
    breathLoopRef.current.start()
  }

  function stopBreathing() {
    breathLoopRef.current?.stop()
    breathLoopRef.current = null
    breathAnim.setValue(1)
  }

  async function startVoice() {
    try {
      const { status } = await Audio.requestPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant microphone permissions to use voice.')
        return
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true })
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      )
      recordingRef.current = recording
      setIsRecording(true)
      startBreathing()
    } catch (err: any) {
      console.error('Microphone start error:', err)
      Alert.alert('Microphone Error', err.message || 'Could not start recording. Check permissions.')
    }
  }

  async function stopVoice() {
    if (!recordingRef.current) return
    setIsRecording(false)
    stopBreathing()
    setTranscribing(true)
    try {
      await recordingRef.current.stopAndUnloadAsync()
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false })
      const uri = recordingRef.current.getURI()
      recordingRef.current = null
      if (uri) {
        const text = await transcribeAudio(uri)
        if (text.trim()) setInput(text.trim())
      }
    } catch (err: any) {
      console.error('Transcription error:', err)
      Alert.alert('Transcription Error', err.message || 'Could not transcribe audio.')
    }
    setTranscribing(false)
  }

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return
    const base = chatHistory.length > 0 ? chatHistory : [firstMessage]
    const userMsg = { role: 'user' as const, content: text.trim(), id: String(Date.now()) }
    const next = [...base, userMsg]
    setChatHistory(next)
    setInput('')
    setLoading(true)

    const systemPrompt = buildSystemPrompt({ naloxoneGiven, visionResult, userName, guidanceMode })

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
  }, [chatHistory, firstMessage, guidanceMode, loading, naloxoneGiven, visionResult, userName])

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
        <View style={s.chatHeaderCopy}>
          <Text style={s.chatHeaderText}>Reach AI</Text>
          <Text style={s.chatHeaderSub}>Emergency companion</Text>
        </View>
        {onToggleExpanded && (
          <TouchableOpacity
            style={s.expandBtn}
            onPress={onToggleExpanded}
            accessibilityRole="button"
            accessibilityLabel={expanded ? 'Shrink AI guide' : 'Enlarge AI guide'}
          >
            <Text style={s.expandBtnText}>{expanded ? '⌄' : '↗'}</Text>
          </TouchableOpacity>
        )}
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
              <ActivityIndicator size="small" color={L.red} />
            </View>
          ) : null
        }
      />
      <View style={s.inputRow}>
        {/* Voice mic button — left of input */}
        <Animated.View style={{ transform: [{ scale: breathAnim }] }}>
          <TouchableOpacity
            style={s.micBtn}
            onPress={isRecording ? stopVoice : startVoice}
            disabled={transcribing}
            accessibilityRole="button"
            accessibilityLabel={isRecording ? 'Stop recording' : 'Start voice input'}
          >
            {transcribing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : isRecording ? (
              <View style={s.stopIcon} />
            ) : (
              <MicIcon />
            )}
          </TouchableOpacity>
        </Animated.View>

        <TextInput
          style={s.input}
          value={input}
          onChangeText={setInput}
          placeholder="Tell Reach what's happening..."
          placeholderTextColor={L.textMuted}
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  chatHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: L.border,
    backgroundColor: '#FFFFFF',
  },
  reachDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: L.red },
  chatHeaderCopy: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  chatHeaderText: { fontSize: font.sm, fontWeight: '700', color: L.textPrimary },
  chatHeaderSub: { fontSize: font.xs, color: L.textMuted },
  expandBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: L.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 18,
  },
  list: { padding: 14, gap: 8, paddingBottom: 4 },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: L.red,
    borderBottomRightRadius: 6,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#E9E9EB',
    borderBottomLeftRadius: 6,
  },
  aiLabel: { fontSize: font.xs, fontWeight: '700', color: L.textMuted, marginBottom: 4 },
  bubbleText: { fontSize: font.md, lineHeight: 22 },
  userText: { color: '#fff' },
  aiText: { color: '#111111' },
  typingBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#E9E9EB',
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    padding: 10, borderTopWidth: 1, borderTopColor: L.border,
    backgroundColor: '#FFFFFF',
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: L.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopIcon: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1, backgroundColor: L.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: L.borderStrong,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: font.md, color: L.textPrimary,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: L.red, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { fontSize: 18, color: '#fff', fontWeight: '800' },
})
