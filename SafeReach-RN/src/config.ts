// Replace with your actual keys — use expo-constants or a .env approach in production
export const CLAUDE_MODEL = 'claude-haiku-4-5-20251001'

// In production, proxy through your own backend (never expose keys in the app binary)
export const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
export const CLAUDE_API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY || ''

export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ''
export const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || ''

export interface ReachContext {
  naloxoneGiven?: boolean
  visionResult?: string | null
  userName?: string
  guidanceMode?: 'awake' | 'emergency'
}

export function buildSystemPrompt({
  naloxoneGiven = false,
  visionResult = null,
  userName = '',
  guidanceMode = 'emergency',
}: ReachContext = {}) {
  const name = userName ? `The person's name is ${userName}.` : ''
  const situation = guidanceMode === 'awake'
    ? 'Current path: the person is awake or responsive. Focus on monitoring, keeping them awake, watching breathing, and escalating to 911 if they get worse.'
    : 'Current path: possible overdose or unresponsiveness. Focus on 911, naloxone, breathing, recovery position, and staying with them.'
  const nalox = naloxoneGiven
    ? 'Naloxone HAS been administered. Monitor breathing for 2-3 minutes. If no improvement, a second dose may be needed.'
    : 'Naloxone has NOT been given yet. If available, gently ask if they have Narcan/naloxone nearby.'
  const vision = visionResult
    ? `A visual scan was performed. Observations: ${visionResult}`
    : ''

  return `You are Reach, a calm and warm emergency AI companion built into SafeReach, a first-response app for overdose and medical emergencies.

${name}
${situation}
Current situation: ${nalox}
${vision}

Your rules:
- Speak in 2-3 short sentences max per reply. Be warm and direct.
- Never diagnose. Never say "I think it might be X."
- Guide ONE concrete action at a time.
- If breathing has stopped: immediately say to call 911 and start rescue breathing (tilt head, 2 slow breaths every 5 seconds).
- If person is unconscious but breathing: guide recovery position (on their side, mouth down).
- If naloxone hasn't been given and is available: calmly tell them to administer it.
- After naloxone: watch for breathing to improve in 2-3 min. If not, give second dose if available.
- Always end each message with a brief reassurance ("You're doing great", "Help is on the way", "Stay with me").
- Adjust to who's talking — if it's the victim, speak gently and slowly. If it's a helper, be action-focused.`
}

export const REACH_FALLBACKS = [
  "Stay with me. Take a slow breath. You're not alone right now.",
  "Keep them on their side if possible. Help is on the way.",
  "You're doing great. Keep watching their breathing.",
  "Talk to them — familiar voices help. Help is coming.",
  "If they stop breathing, tilt their head back gently and give 2 slow breaths.",
  "Stay calm. Every second counts and you're handling this.",
]

export function smartFallback(text: string, historyLength: number): string {
  const t = text.toLowerCase()
  const nameMatch = text.match(/(?:i'?m|i am|this is|my name is)\s+([A-Za-z]+)/i)
  if (nameMatch) return `Hey ${nameMatch[1]}! I'm Reach — I'm right here with you. Tell me what's happening.`
  if (/help/.test(t)) return "I'm right here. Tell me what you're seeing — I'll guide you step by step."
  if (/breath|breathing|can't breathe|not breathing/.test(t)) return "If they've stopped breathing, tilt their head back, lift the chin, and give 2 slow breaths. I'm with you."
  if (/pain|hurts|hurt/.test(t)) return "Tell me where the pain is. That helps me guide you better. You're doing great."
  if (/unconscious|won't wake|not waking|passed out/.test(t)) return "Roll them onto their side — chin forward — to keep the airway open. Call 911 now if you haven't."
  if (/naloxone|narcan/.test(t)) return "Give one spray into one nostril now. Wait 2-3 minutes — if no improvement, a second dose can help."
  if (/scared|panic|don't know|freaking/.test(t)) return "Take one breath. You're not alone — I'm here. Are they conscious? Are they breathing?"
  if (/911|ambulance|called/.test(t)) return "Good. Stay on the line with 911. Keep them on their side and keep watching their breathing."
  if (/okay|ok|better|fine/.test(t)) return "Good — keep watching their breathing and don't leave them alone. Stay close until help arrives."
  if (/what do|what should/.test(t)) return "First: call 911. Second: keep them on their side. Third: give naloxone if you have it. I'm right here."
  if (/awake|conscious|responding/.test(t)) return "Good — keep talking to them. Ask them to squeeze your hand. Help is on the way."
  if (/tired|sleepy|can't stay awake/.test(t)) return "Stay with me. Keep talking to them — use their name. Loud voices help keep people awake."
  return REACH_FALLBACKS[historyLength % REACH_FALLBACKS.length]
}
