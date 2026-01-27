import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useInstallPrompt } from './useInstallPrompt'

describe('useInstallPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initially returns canInstall as false and isInstalled as false', () => {
    const { result } = renderHook(() => useInstallPrompt())

    expect(result.current.canInstall).toBe(false)
    expect(result.current.isInstalled).toBe(false)
  })

  it('sets isInstalled to true when appinstalled event fires', () => {
    const { result } = renderHook(() => useInstallPrompt())

    act(() => {
      window.dispatchEvent(new Event('appinstalled'))
    })

    expect(result.current.isInstalled).toBe(true)
    expect(result.current.canInstall).toBe(false)
  })

  it('detects standalone mode as installed', () => {
    const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(display-mode: standalone)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    vi.stubGlobal('matchMedia', mockMatchMedia)

    const { result } = renderHook(() => useInstallPrompt())

    expect(result.current.isInstalled).toBe(true)

    vi.unstubAllGlobals()
  })

  it('promptInstall returns false when no install prompt available', async () => {
    const { result } = renderHook(() => useInstallPrompt())

    let installResult: boolean
    await act(async () => {
      installResult = await result.current.promptInstall()
    })

    expect(installResult!).toBe(false)
  })

  it('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => useInstallPrompt())
    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('appinstalled', expect.any(Function))
  })
})
