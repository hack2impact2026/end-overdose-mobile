import { useState, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Alert } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import * as FileSystem from 'expo-file-system'
import { useApp } from '../src/AppContext'
import { CLAUDE_API_KEY, CLAUDE_API_URL } from '../src/config'
import { colors, radius, font } from '../src/theme'

async function analyzeWithVision(base64: string): Promise<string> {
  const resp = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
          },
          {
            type: 'text',
            text: `You are an emergency AI assistant analyzing a scene for potential overdose or medical emergency indicators. 
Look at this image and provide:
1. RISK LEVEL: HIGH / MEDIUM / LOW
2. Key visual observations (2-3 bullet points)
3. Immediate action recommended (1 sentence)

Keep your response under 100 words. Be direct and clinical.`,
          }
        ],
      }],
    }),
  })
  if (!resp.ok) throw new Error(`Vision API ${resp.status}`)
  const data = await resp.json()
  return data.content[0].text
}

export default function CameraScreen() {
  const { setVisionResult } = useApp()
  const insets = useSafeAreaInsets()
  const [permission, requestPermission] = useCameraPermissions()
  const [analyzing, setAnalyzing] = useState(false)
  const [captured, setCaptured] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const cameraRef = useRef<CameraView>(null)

  async function takePicture() {
    if (!cameraRef.current) return
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: true })
    if (photo?.uri) {
      setCaptured(photo.uri)
      await analyze(photo.base64 || '')
    }
  }

  async function pickFromLibrary() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    })
    if (!res.canceled && res.assets[0]) {
      setCaptured(res.assets[0].uri)
      await analyze(res.assets[0].base64 || '')
    }
  }

  async function analyze(base64: string) {
    if (!base64) return
    setAnalyzing(true)
    try {
      const analysis = await analyzeWithVision(base64)
      setResult(analysis)
    } catch {
      setResult('Unable to analyze image. Check your connection and try again.')
    }
    setAnalyzing(false)
  }

  function acceptResult() {
    if (result) {
      setVisionResult(result)
    }
    router.back()
  }

  if (!permission) {
    return <View style={s.screen} />
  }

  if (!permission.granted) {
    return (
      <View style={[s.screen, s.center, { paddingTop: insets.top }]}>
        <Text style={s.permText}>Camera access needed for symptom scanning</Text>
        <TouchableOpacity style={s.permBtn} onPress={requestPermission}>
          <Text style={s.permBtnText}>Grant Access</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.backLink} onPress={() => router.back()}>
          <Text style={s.backLinkText}>← Go back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Symptom Scan</Text>
        <TouchableOpacity style={s.libraryBtn} onPress={pickFromLibrary}>
          <Text style={s.libraryBtnText}>Photo Library</Text>
        </TouchableOpacity>
      </View>

      {result ? (
        // Results view
        <View style={s.resultsContainer}>
          {captured && <Image source={{ uri: captured }} style={s.capturedImage} />}
          <View style={s.resultCard}>
            <Text style={s.resultTitle}>📷 AI Analysis</Text>
            <Text style={s.resultText}>{result}</Text>
          </View>
          <TouchableOpacity style={s.acceptBtn} onPress={acceptResult}>
            <Text style={s.acceptBtnText}>Send to Reach AI ↑</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.retakeBtn} onPress={() => { setResult(null); setCaptured(null) }}>
            <Text style={s.retakeBtnText}>Retake</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Camera view
        <>
          {captured && analyzing ? (
            <View style={[s.cameraPlaceholder, s.center]}>
              <Image source={{ uri: captured }} style={s.capturedImageFull} />
              <View style={s.analyzingOverlay}>
                <ActivityIndicator size="large" color={colors.red} />
                <Text style={s.analyzingText}>Analyzing with AI...</Text>
              </View>
            </View>
          ) : (
            <CameraView ref={cameraRef} style={s.camera} facing="back">
              <View style={s.cameraOverlay}>
                <View style={s.scanFrame} />
                <Text style={s.scanHint}>Point at the person to scan</Text>
              </View>
            </CameraView>
          )}

          <View style={s.cameraControls}>
            <TouchableOpacity style={s.captureBtn} onPress={takePicture} disabled={analyzing}>
              <View style={s.captureBtnInner} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  center: { alignItems: 'center', justifyContent: 'center', gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: font.lg, fontWeight: '700', color: '#fff' },
  libraryBtn: { paddingHorizontal: 12, paddingVertical: 7, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radius.md },
  libraryBtnText: { color: '#fff', fontSize: font.sm, fontWeight: '600' },
  camera: { flex: 1 },
  cameraPlaceholder: { flex: 1, position: 'relative' },
  cameraOverlay: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 40 },
  scanFrame: { position: 'absolute', top: '20%', left: '15%', right: '15%', bottom: '25%', borderWidth: 2, borderColor: 'rgba(232,0,13,0.6)', borderRadius: 12 },
  scanHint: { color: 'rgba(255,255,255,0.7)', fontSize: font.sm, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full },
  cameraControls: { paddingVertical: 32, alignItems: 'center', backgroundColor: '#000' },
  captureBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  captureBtnInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff' },
  capturedImageFull: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.5 },
  analyzingOverlay: { alignItems: 'center', gap: 12 },
  analyzingText: { color: '#fff', fontSize: font.md, fontWeight: '600' },
  resultsContainer: { flex: 1, padding: 16, gap: 14 },
  capturedImage: { width: '100%', height: 200, borderRadius: radius.lg, backgroundColor: '#111' },
  resultCard: { backgroundColor: 'rgba(59,130,246,0.1)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.25)', borderRadius: radius.lg, padding: 16 },
  resultTitle: { fontSize: font.md, fontWeight: '700', color: colors.blue, marginBottom: 8 },
  resultText: { fontSize: font.sm, color: colors.textSecondary, lineHeight: 22 },
  acceptBtn: { paddingVertical: 16, backgroundColor: colors.red, borderRadius: radius.xl, alignItems: 'center' },
  acceptBtnText: { fontSize: font.lg, fontWeight: '800', color: '#fff' },
  retakeBtn: { paddingVertical: 12, alignItems: 'center' },
  retakeBtnText: { fontSize: font.sm, color: colors.textMuted },
  permText: { fontSize: font.md, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
  permBtn: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.red, borderRadius: radius.md },
  permBtnText: { color: '#fff', fontSize: font.md, fontWeight: '700' },
  backLink: { padding: 8 },
  backLinkText: { color: colors.textSecondary, fontSize: font.sm },
})
