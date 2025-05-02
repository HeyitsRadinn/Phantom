//
//  PhantomApp.swift
//  Phantom
//
//  Created by Radin Najafi on 5/2/25.
//

import Carbon
import SwiftUI

@main
struct PhantomApp: App {
  // init hotkey manager
  let hotkeyManager = HotkeyManager.shared

  init() {
    setupHotkeys()
  }

  var body: some Scene {
    // Using Settings scene provides a standard way to open preferences (Cmd+,)
    // but doesn't show a main window on launch.
    Settings {
      // Placeholder for future Preferences window
      Text("Phantom Preferences")
        .frame(width: 300, height: 200)  // Adjusted size
    }
    // To add a MenuBarExtra later:
    // MenuBarExtra("Phantom", systemImage: "bolt.circle") {
    //     Button("Capture Region") { Task { try? await CaptureEngine.shared.capture(mode: .region) } }
    //     Divider()
    //     Button("Preferences...") { NSApp.sendAction(Selector(("showSettingsWindow:")), to: nil, from: nil) } // Standard way to open settings
    //     Button("Quit Phantom") { NSApplication.shared.terminate(nil) }
    // }
  }

  private func setupHotkeys() {

    let cmdOptShift = UInt32(cmdKey + optionKey + shiftKey)
    let cmdShift = UInt32(cmdKey + shiftKey)

    hotkeyManager.registerHotkey(
      keyCode: UInt32(kVK_ANSI_2), modifiers: cmdShift, action: .captureWindow)

    hotkeyManager.registerHotkey(
      keyCode: UInt32(kVK_ANSI_3), modifiers: cmdOptShift, action: .captureFullscreen)

    hotkeyManager.registerHotkey(
      keyCode: UInt32(kVK_ANSI_4), modifiers: cmdOptShift, action: .captureRegion)

    print(
      "Default hotkeys registered: Cmd+Shift+2 (Window), Cmd+Opt+Shift+3 (Fullscreen), Cmd+Opt+Shift+4 (Region)"
    )
    // TODO: Load user-defined hotkeys from UserDefaults in the future
  }
}
