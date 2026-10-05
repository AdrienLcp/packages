/**
 * Runs in the page, before any of its scripts, so no sound ever leaves it:
 * writes `0` under each persisted volume key, holds every audio and video
 * element muted at volume 0 whatever the app sets, keeps every `AudioContext`
 * suspended, and speaks at volume 0. `Notification` is left alone: an app that
 * checks for it would take another path. Self-contained, since Playwright sends
 * its source text alone.
 */
export const silencePage = (volumeKeys: readonly string[]): void => {
  const writeSilentVolumes = (): void => {
    try {
      for (const key of volumeKeys) {
        localStorage.setItem(key, '0')
      }
    } catch {
      return
    }
  }
  writeSilentVolumes()

  const media = HTMLMediaElement.prototype
  const volume = Object.getOwnPropertyDescriptor(media, 'volume')
  const muted = Object.getOwnPropertyDescriptor(media, 'muted')
  const play = media.play

  const silence = (element: HTMLMediaElement): void => {
    muted?.set?.call(element, true)
    volume?.set?.call(element, 0)
  }

  Object.defineProperty(media, 'volume', {
    ...volume,
    set(this: HTMLMediaElement) {
      volume?.set?.call(this, 0)
    }
  })
  Object.defineProperty(media, 'muted', {
    ...muted,
    set(this: HTMLMediaElement) {
      muted?.set?.call(this, true)
    }
  })
  media.play = function (this: HTMLMediaElement) {
    silence(this)
    return play.call(this)
  }

  const silenceTarget = (event: Event): void => {
    if (event.target instanceof HTMLMediaElement) silence(event.target)
  }
  window.addEventListener('loadstart', silenceTarget, true)
  window.addEventListener('play', silenceTarget, true)

  if ('AudioContext' in window) {
    const NativeAudioContext = window.AudioContext
    window.AudioContext = class SilentAudioContext extends NativeAudioContext {
      constructor(options?: AudioContextOptions) {
        super(options)
        void super.suspend()
      }

      override resume(): Promise<void> {
        return Promise.resolve()
      }
    }
  }

  if ('speechSynthesis' in window) {
    const synthesis = window.speechSynthesis
    const speak = synthesis.speak.bind(synthesis)
    synthesis.speak = (utterance) => {
      utterance.volume = 0
      speak(utterance)
    }
  }
}
