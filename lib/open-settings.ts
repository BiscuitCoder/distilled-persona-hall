/** 与 `SettingsModal` 中监听的事件名保持一致 */
export const OPEN_SETTINGS_EVENT = 'zhenrentang:open-settings'

export function requestOpenSettings() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(OPEN_SETTINGS_EVENT))
}
