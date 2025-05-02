import SwiftUI

struct RegionSelectionView: View {
  @State private var startPoint: CGPoint?
  @State private var currentPoint: CGPoint?
  @State private var selectedRect: CGRect?

  var onComplete: (CGRect) -> Void

  var body: some View {
    GeometryReader { geometry in
      ZStack {
        // overlay
        Color.black.opacity(0.3)
          .edgesIgnoringSafeArea(.all)

        // selection rectangle
        if let rect = currentSelectionRect() {
          // clear area in rectangle
          Color.clear
            .frame(width: rect.width, height: rect.height)
            .position(x: rect.midX, y: rect.midY)
            .blendMode(.destinationOut)

          // border around selection
          Rectangle()
            .stroke(Color.white, lineWidth: 1)
            .frame(width: rect.width, height: rect.height)
            .position(x: rect.midX, y: rect.midY)
        }
      }
      .compositingGroup()
      .gesture(dragGesture(in: geometry.size))
      .onAppear {
        // change cursor to crosshair
        NSCursor.crosshair.push()
      }
      .onDisappear {
        NSCursor.pop()
      }

      .background(
        KeyPressHandlingView { event in
          if event.keyCode == 53 {  // 53 is the keycode for Escape
            print("Escape pressed, cancelling selection.")
            // Find the window and close it
            if let window = NSApp.keyWindow,
              window.windowController is RegionSelectionWindowController
            {
              window.close()
            }
            return true
          }
          return false
        })
    }
  }

  private func dragGesture(in size: CGSize) -> some Gesture {
    DragGesture(minimumDistance: 0)
      .onChanged { value in
        if startPoint == nil {
          startPoint = value.startLocation
        }
        currentPoint = value.location

        let currentX = max(0, min(value.location.x, size.width))
        let currentY = max(0, min(value.location.y, size.height))
        currentPoint = CGPoint(x: currentX, y: currentY)

        selectedRect = calculateRect()
      }
      .onEnded { value in
        if let finalRect = calculateRect(), finalRect.width > 1 && finalRect.height > 1 {

          print("Drag ended, final rect (view coords): \(finalRect)")
          onComplete(finalRect)
        } else {
          print("Drag ended, but selection too small or invalid.")

          if let window = NSApp.keyWindow,
            window.windowController is RegionSelectionWindowController
          {
            window.close()
          }
        }

        startPoint = nil
        currentPoint = nil
        selectedRect = nil
      }
  }

  private func calculateRect() -> CGRect? {
    guard let start = startPoint, let current = currentPoint else {
      return nil
    }
    let originX = min(start.x, current.x)
    let originY = min(start.y, current.y)
    let width = abs(start.x - current.x)
    let height = abs(start.y - current.y)

    return CGRect(x: originX, y: originY, width: width, height: height)
  }

  private func currentSelectionRect() -> CGRect? {
    return calculateRect()
  }
}

struct KeyPressHandlingView: NSViewRepresentable {
  var onEvent: (NSEvent) -> Bool

  func makeNSView(context: Context) -> NSView {
    let view = KeyHandlingNSView()
    view.onEvent = onEvent
    DispatchQueue.main.async {
      view.window?.makeFirstResponder(view)
    }
    return view
  }

  func updateNSView(_ nsView: NSView, context: Context) {}

  class KeyHandlingNSView: NSView {
    var onEvent: ((NSEvent) -> Bool)?

    override var acceptsFirstResponder: Bool { true }

    override func keyDown(with event: NSEvent) {
      if let handler = onEvent, handler(event) {
      } else {
        super.keyDown(with: event)
      }
    }
  }
}
