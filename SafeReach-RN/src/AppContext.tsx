import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { generateCode, createSession, Location } from './utils/session'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  id: string
}

interface AppState {
  emergencyActive: boolean
  sessionCode: string | null
  chatHistory: ChatMessage[]
  naloxoneGiven: boolean
  userName: string
  location: Location | null
  visionResult: string | null
  familyJoinCode: string
  familyMemberName: string
}

interface AppContextValue extends AppState {
  startEmergency: () => void
  endEmergency: () => void
  setChatHistory: (h: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void
  setNaloxoneGiven: (v: boolean) => void
  saveUserName: (name: string) => void
  setLocation: (loc: Location | null) => void
  setVisionResult: (r: string | null) => void
  setFamilyJoinCode: (code: string) => void
  setFamilyMemberName: (name: string) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [emergencyActive, setEmergencyActive] = useState(false)
  const [sessionCode, setSessionCode] = useState<string | null>(null)
  const [chatHistory, setChatHistoryState] = useState<ChatMessage[]>([])
  const [naloxoneGiven, setNaloxoneGiven] = useState(false)
  const [userName, setUserName] = useState('')
  const [location, setLocation] = useState<Location | null>(null)
  const [visionResult, setVisionResult] = useState<string | null>(null)
  const [familyJoinCode, setFamilyJoinCode] = useState('')
  const [familyMemberName, setFamilyMemberName] = useState('')

  // Load userName on init
  React.useEffect(() => {
    AsyncStorage.getItem('sr_userName').then(name => {
      if (name) setUserName(name)
    })
  }, [])

  const setChatHistory = useCallback((h: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    setChatHistoryState(h)
  }, [])

  const startEmergency = useCallback(() => {
    const code = generateCode()
    createSession(code, userName)
    setSessionCode(code)
    setEmergencyActive(true)
    setChatHistoryState([])
    setNaloxoneGiven(false)
    setVisionResult(null)
  }, [userName])

  const endEmergency = useCallback(() => {
    setEmergencyActive(false)
    setSessionCode(null)
    setChatHistoryState([])
    setNaloxoneGiven(false)
    setVisionResult(null)
    setLocation(null)
  }, [])

  const saveUserName = useCallback((name: string) => {
    setUserName(name)
    AsyncStorage.setItem('sr_userName', name)
  }, [])

  return (
    <AppContext.Provider value={{
      emergencyActive, sessionCode, chatHistory, naloxoneGiven,
      userName, location, visionResult, familyJoinCode, familyMemberName,
      startEmergency, endEmergency,
      setChatHistory, setNaloxoneGiven, saveUserName,
      setLocation, setVisionResult,
      setFamilyJoinCode, setFamilyMemberName,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
