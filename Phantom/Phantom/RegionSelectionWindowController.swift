import Cocoa
import SwiftUI

class RegionSelectionWindowController: NSWindowController, NSWindowDelegate {

  var onSelectionComplete: ((CGRect) -> Void)?

  convenience init(completion: @escaping (CGRect) -> Void) {
    // make a opaque transparent window
    guard let mainScreen = NSScreen.main else {
      fatalError("Could not get main screen")
    }

    let windowRect = mainScreen.frame
    let contentRect = NSRect(origin: .zero, size: windowRect.size)
    let window = NSWindow(
      contentRect: contentRect,
      styleMask: [.borderless],
      backing: .buffered,
      defer: false,
      screen: mainScreen
    )

    window.isOpaque = false
    window.backgroundColor = .clear
    window.level = .screenSaver
    window.hasShadow = false
    window.ignoresMouseEvents = false

    self.init(window: window)
    self.onSelectionComplete = completion
    window.delegate = self

    // set content view
    let selectionView = RegionSelectionView { [weak self] selectedRect in
      // convert rect from view coords to screen coords before calling completion
      guard let self = self, let window = self.window else { return }
      let screenRect = window.convertToScreen(selectedRect)
      print("Selected Screen Rect: \(screenRect)")
      self.onSelectionComplete?(screenRect)
      self.close()
    }
    window.contentView = NSHostingView(rootView: selectionView)

    window.makeKeyAndOrderFront(nil)
    NSApp.activate(ignoringOtherApps: true)
  }

  func windowWillClose(_ notification: Notification) {
    print("Region selection window closing.")
  }

  override func showWindow(_ sender: Any?) {
    guard let window = window else { return }
    // make sure window covers whole screen when shown
    if let mainScreen = NSScreen.main {
      window.setFrame(mainScreen.frame, display: true)
    }
    super.showWindow(sender)
    window.makeKeyAndOrderFront(nil)
    NSApp.activate(ignoringOtherApps: true)
    print("Region selection window shown.")
  }
}
