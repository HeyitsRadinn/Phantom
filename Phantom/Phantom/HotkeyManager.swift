import Carbon
import Foundation

enum HotkeyAction: UInt32 {
  case captureFullscreen = 1
  case captureWindow = 2
  case captureRegion = 3
}

class HotkeyManager {

  static let shared = HotkeyManager()
  private var eventHandlerRef: EventHandlerRef?
  private var hotKeyRefs: [UInt32: EventHotKeyRef] = [:]

  private init() {
    setupEventHandler()
  }

  deinit {
    unregisterAllHotkeys()
    if let handler = eventHandlerRef {
      RemoveEventHandler(handler)
    }
  }

  private func setupEventHandler() {
    var eventType = EventTypeSpec(
      eventClass: OSType(kEventClassKeyboard), eventKind: OSType(kEventHotKeyPressed))
    InstallEventHandler(
      GetApplicationEventTarget(),
      { (nextHandler, event, userData) -> OSStatus in

        HotkeyManager.shared.handleHotkeyEvent(event: event)
        return CallNextEventHandler(nextHandler, event)
      }, 1, &eventType, nil, &eventHandlerRef)
  }

  func registerHotkey(keyCode: UInt32, modifiers: UInt32, action: HotkeyAction) {

    let hotKeyId = action.rawValue

    var eventHotKey: EventHotKeyRef?
    let hotKeyID = EventHotKeyID(signature: OSType("PHNT".fourCharCodeValue), id: hotKeyId)

    let status = RegisterEventHotKey(
      keyCode,
      modifiers,
      hotKeyID,
      GetApplicationEventTarget(),
      0,
      &eventHotKey)

    if status == noErr, let hotKeyRef = eventHotKey {
      hotKeyRefs[hotKeyId] = hotKeyRef
      print("Hotkey registered successfully for action: \(action) with ID: \(hotKeyId)")
    } else {
      print("Error registering hotkey for action \(action): \(status)")

    }
  }

  func unregisterHotkey(action: HotkeyAction) {
    let hotKeyId = action.rawValue
    if let hotKeyRef = hotKeyRefs[hotKeyId] {
      UnregisterEventHotKey(hotKeyRef)
      hotKeyRefs.removeValue(forKey: hotKeyId)
      print("Hotkey unregistered for action: \(action)")
    }
  }

  func unregisterAllHotkeys() {
    for hotKeyRef in hotKeyRefs.values {
      UnregisterEventHotKey(hotKeyRef)
    }
    hotKeyRefs.removeAll()
    print("All hotkeys unregistered.")
  }

  private func handleHotkeyEvent(event: EventRef?) {
    guard let event = event else { return }

    var hotKeyID = EventHotKeyID()
    let status = GetEventParameter(
      event,
      OSType(kEventParamDirectObject),
      OSType(typeEventHotKeyID),
      nil,
      MemoryLayout<EventHotKeyID>.size,
      nil,
      &hotKeyID)

    guard status == noErr else {
      print("Error getting hotkey ID from event: \(status)")
      return
    }

    guard hotKeyID.signature == OSType("PHNT".fourCharCodeValue) else {
      return
    }

    guard let action = HotkeyAction(rawValue: hotKeyID.id) else {
      print("Unknown hotkey ID received: \(hotKeyID.id)")
      return
    }

    switch action {
    case .captureFullscreen:
      print("Capture Fullscreen hotkey pressed!")
      Task {
        do {
          try await CaptureEngine.shared.capture(mode: .fullscreen)
        } catch {
          print("Error during fullscreen capture: \(error)")
          // TODO: show a nice error to the user
        }
      }
    case .captureWindow:
      print("Capture Window hotkey pressed!")
      Task {
        do {
          try await CaptureEngine.shared.capture(mode: .window)
        } catch {
          print("Error during window capture: \(error)")
          // TODO: show a nice error to the user
        }
      }
    case .captureRegion:
      print("Capture Region hotkey pressed!")
      Task {
        do {
          try await CaptureEngine.shared.capture(mode: .region)
        } catch {
          print("Error during region capture: \(error)")
          // TODO: show a nice error to the user
        }
      }
    }
  }
}

extension String {
  var fourCharCodeValue: FourCharCode {
    return self.utf16.reduce(0) { ($0 << 8) + FourCharCode($1) }
  }
}
