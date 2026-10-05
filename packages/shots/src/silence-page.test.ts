import { beforeAll, describe, expect, it, vi } from 'vitest'

import { seedStorage } from './seed-storage.ts'
import { silencePage } from './silence-page.ts'

class FakeAudioContext {
  state = 'running'

  resume(): Promise<void> {
    this.state = 'running'
    return Promise.resolve()
  }

  suspend(): Promise<void> {
    this.state = 'suspended'
    return Promise.resolve()
  }
}

class FakeUtterance {
  readonly text: string
  volume = 1

  constructor(text: string) {
    this.text = text
  }
}

const spokenVolumes: number[] = []
const NOTIFICATION = class Notification {}

beforeAll(() => {
  vi.stubGlobal('AudioContext', FakeAudioContext)
  vi.stubGlobal('Notification', NOTIFICATION)
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
  vi.stubGlobal('speechSynthesis', {
    speak: (utterance: { volume: number }) => {
      spokenVolumes.push(utterance.volume)
    }
  })
  localStorage.setItem('app.volume', '0.8')
  silencePage(['app.volume', 'app.music'])
})

describe('silencePage', () => {
  it('[silence-page] writes 0 under every persisted volume key', () => {
    expect(localStorage.getItem('app.volume')).toBe('0')
    expect(localStorage.getItem('app.music')).toBe('0')
  })

  it('[silence-page] holds an element at volume 0 and muted, whatever the app sets', () => {
    const audio = document.createElement('audio')

    audio.volume = 1
    audio.muted = false

    expect(audio.volume).toBe(0)
    expect(audio.muted).toBe(true)
  })

  it('[silence-page] mutes an element the moment it plays', () => {
    const video = document.createElement('video')
    video.defaultMuted = false

    void video.play().catch(() => undefined)

    expect(video.muted).toBe(true)
  })

  it('[silence-page] mutes an element that starts loading', () => {
    const audio = document.createElement('audio')
    document.body.append(audio)

    audio.dispatchEvent(new Event('loadstart'))

    expect(audio.muted).toBe(true)
  })

  it('[silence-page] keeps an AudioContext suspended, even when the app resumes it', async () => {
    const context = new AudioContext()
    await context.resume()

    expect(context.state).toBe('suspended')
  })

  it('[silence-page] speaks at volume 0', () => {
    speechSynthesis.speak(new SpeechSynthesisUtterance('hello'))

    expect(spokenVolumes).toEqual([0])
  })

  it('[silence-page] leaves Notification as the page had it', () => {
    expect(window.Notification).toBe(NOTIFICATION)
  })
})

describe('seedStorage', () => {
  it('[seed-storage] writes every entry', () => {
    seedStorage({ 'app.locale': 'fr', 'app.theme': 'dark' })

    expect(localStorage.getItem('app.locale')).toBe('fr')
    expect(localStorage.getItem('app.theme')).toBe('dark')
  })

  it('[seed-storage] stops quietly when storage refuses', () => {
    const refusing = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('denied', 'SecurityError')
      })

    expect(() => seedStorage({ 'app.locale': 'fr' })).not.toThrow()
    expect(() => silencePage(['app.volume'])).not.toThrow()
    refusing.mockRestore()
  })
})
