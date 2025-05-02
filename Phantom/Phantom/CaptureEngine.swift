import AVFoundation
import AppKit
import Combine
import Foundation
import ScreenCaptureKit

enum CaptureMode {
  case fullscreen
  case window
  case region
}

enum CaptureError: Error {
  case permissionDenied
  case noDisplaysFound
  case noWindowsFound
  case streamSetupFailed(Error?)
  case frameCaptureFailed
  case imageConversionFailed
  case invalidParameter
}

// delegate to handle stream output (capturing a single frame)
class FrameCaptureDelegate: NSObject, SCStreamDelegate, SCStreamOutput {
  var onFrame: ((NSImage?) -> Void)?
  private var captureCompleted = false

  // reset state before a new capture
  func reset() {
    captureCompleted = false
    print("FrameCaptureDelegate reset.")
  }

  // this receives the sample buffers from the stream
  func stream(
    _ stream: SCStream, didOutputSampleBuffer sampleBuffer: CMSampleBuffer,
    of type: SCStreamOutputType
  ) {
    guard type == .screen, sampleBuffer.isValid, !captureCompleted else { return }

    // get pixel buffer from sample buffer
    guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else {
      print("Error: Could not get pixel buffer from sample buffer.")
      stream.stopCapture()
      onFrame?(nil)
      return
    }

    let ciImage = CIImage(cvPixelBuffer: pixelBuffer)

    let context = CIContext(options: nil)
    guard let cgImage = context.createCGImage(ciImage, from: ciImage.extent) else {
      print("Error: Could not create CGImage from CIImage.")
      stream.stopCapture()
      onFrame?(nil)
      return
    }

    let nsImage = NSImage(cgImage: cgImage, size: ciImage.extent.size)

    captureCompleted = true
    stream.stopCapture()
    onFrame?(nsImage)
    print("Frame captured and processed successfully.")
  }

  // handle stream errors
  func stream(_ stream: SCStream, didStopWithError error: Error) {
    print("Stream stopped with error: \(error.localizedDescription)")
    let nsError = error as NSError
    if nsError.domain == "SCStream" && nsError.code == -5834 {
      print("Permission denied error detected.")
    }

    if !captureCompleted {
      onFrame?(nil)
    }
    captureCompleted = false
  }

  func stream(_ stream: SCStream, didUpdateContentFilter contentFilter: SCContentFilter) {
    // Handle filter changes if necessary
  }

  func stream(_ stream: SCStream, didUpdateStreamConfiguration streamConfig: SCStreamConfiguration)
  {
    // Handle configuration changes if necessary
  }
}

class CaptureEngine {
  static let shared = CaptureEngine()
  private var availableContent: SCShareableContent?
  private let frameDelegate = FrameCaptureDelegate()
  private var stream: SCStream?
  private var selectionWindowController: RegionSelectionWindowController?

  private init() {
    // Refresh content initially, but permissions are checked implicitly on capture attempt
    // Task { await refreshAvailableContent() } // Refresh happens just before capture now
  }

  @MainActor
  func refreshAvailableContent() async {
    do {
      availableContent = try await SCShareableContent.excludingDesktopWindows(
        false, onScreenWindowsOnly: true)
      print("Refreshed available capture content.")
    } catch {
      print("Error fetching shareable content: \(error)")
      // If fetching fails here, it might be a permission issue already.
      // The actual capture attempt will likely fail too.
      availableContent = nil
    }
  }

  func capture(mode: CaptureMode) async throws {
    await refreshAvailableContent()

    // TODO: Implement modifier key detection (e.g., Option key for editor)
    let openEditor = false  // Placeholder

    // The actual capture methods now throw errors, including potential permission errors
    // Need to handle region selection presentation outside of the `try await` for capture itself
    if mode == .region {
      // Region selection needs UI presentation first
      presentRegionSelector(openEditor: openEditor)
    } else {
      // Fullscreen and Window can proceed directly
      switch mode {
      case .fullscreen:
        try await captureFullscreen(openEditor: openEditor)
      case .window:
        try await captureWindow(openEditor: openEditor)
      case .region:
        // Should not happen due to check above, but satisfy compiler
        print("Error: Region capture called directly without UI.")
        throw CaptureError.invalidParameter
      }
    }
  }

  private func captureFullscreen(openEditor: Bool) async throws {
    print("Initiating fullscreen capture with ScreenCaptureKit...")
    guard let displays = availableContent?.displays, let mainDisplay = displays.first else {
      throw CaptureError.noDisplaysFound
    }

    // Use mainDisplay.width/height directly - they are already pixel dimensions
    let filter = SCContentFilter(
      display: mainDisplay, excludingApplications: [], exceptingWindows: [])
    let config = SCStreamConfiguration()
    config.width = mainDisplay.width
    config.height = mainDisplay.height
    config.minimumFrameInterval = CMTime(value: 1, timescale: 60)  // Low frame rate needed for single frame
    config.pixelFormat = kCVPixelFormatType_32BGRA  //'BGRA' (32 bpp)
    config.showsCursor = false  // Configurable

    // Await the result of capturing the frame
    let image = try await captureFrame(filter: filter, config: config)
    processCapturedImage(image, openEditor: openEditor)
  }

  private func captureWindow(openEditor: Bool) async throws {
    print("Initiating window capture with ScreenCaptureKit...")
    await refreshAvailableContent()  // Ensure content is fresh
    guard let windows = availableContent?.windows else {
      throw CaptureError.noWindowsFound
    }

    // TODO: Implement proper window selection logic.
    guard let frontmostApp = NSWorkspace.shared.frontmostApplication,
      let targetWindow = windows.first(where: {
        $0.owningApplication?.processID == frontmostApp.processIdentifier && $0.isOnScreen
      })
    else {
      print("Could not find a suitable target window for the frontmost application.")
      throw CaptureError.noWindowsFound
    }
    print("Targeting window: \(targetWindow.title ?? "Untitled") (\(targetWindow.windowID))")

    let filter = SCContentFilter(desktopIndependentWindow: targetWindow)
    let config = SCStreamConfiguration()
    let frame = targetWindow.frame
    // Find the NSScreen containing the window's frame to get the correct scale factor
    let screenContainingWindow =
      NSScreen.screens.first { $0.frame.intersects(frame) } ?? NSScreen.main
    let scale = screenContainingWindow?.backingScaleFactor ?? 1.0

    config.width = Int(frame.width * scale)
    config.height = Int(frame.height * scale)
    print(
      "Window Capture Config: Frame=\(frame), Scale=\(scale), Width=\(config.width), Height=\(config.height)"
    )
    config.minimumFrameInterval = CMTime(value: 1, timescale: 60)
    config.pixelFormat = kCVPixelFormatType_32BGRA
    config.showsCursor = false

    let image = try await captureFrame(filter: filter, config: config)
    processCapturedImage(image, openEditor: openEditor)
  }

  // Method to present the overlay and handle the callback
  private func presentRegionSelector(openEditor: Bool) {
    print("Presenting region selection overlay...")
    // Ensure we run UI updates on the main thread
    DispatchQueue.main.async {
      self.selectionWindowController = RegionSelectionWindowController { [weak self] selectedRect in
        guard let self = self else { return }
        print("Region selected: \(selectedRect). Proceeding with capture.")
        // Run the actual capture in a background Task
        Task {
          do {
            // Call the capture logic with the selected rect
            try await self.performRegionCapture(rect: selectedRect, openEditor: openEditor)
          } catch {
            print("Error performing region capture after selection: \(error)")
            // Handle error (e.g., show alert)
          }
          // Release the controller reference after completion or error
          DispatchQueue.main.async {
            self.selectionWindowController = nil
          }
        }
      }
      self.selectionWindowController?.showWindow(nil)
    }
  }

  // Actual capture logic for the selected region
  private func performRegionCapture(rect selectedRect: CGRect, openEditor: Bool) async throws {
    print("Performing region capture for rect: \(selectedRect)")
    await refreshAvailableContent()  // Ensure content is fresh

    // Find the display containing the selected rect (simplistic: assumes main display for now)
    // More robust logic might check which display contains the rect's origin or center.
    guard let displays = availableContent?.displays, let mainDisplay = displays.first else {
      throw CaptureError.noDisplaysFound
    }

    // Ensure the selected rect is valid
    guard selectedRect.width > 0 && selectedRect.height > 0 else {
      print("Invalid selection rectangle: \(selectedRect)")
      throw CaptureError.invalidParameter
    }

    // Find the SCRunningApplication corresponding to the current app to exclude it
    let currentAppPID = NSRunningApplication.current.processIdentifier
    let phantomAppToExclude = availableContent?.applications.first(where: {
      $0.processID == currentAppPID
    })

    // Create filter for the display, excluding the Phantom app if found
    let applicationsToExclude = phantomAppToExclude != nil ? [phantomAppToExclude!] : []
    let filter = SCContentFilter(
      display: mainDisplay, excludingApplications: applicationsToExclude, exceptingWindows: [])

    let config = SCStreamConfiguration()

    // Configure stream for the selected region in screen coordinates
    config.sourceRect = selectedRect  // The area to capture from the source (display), specified in points (screen coords)
    // Find the NSScreen containing the selected rect to get the correct scale factor
    let screenContainingRect =
      NSScreen.screens.first { $0.frame.intersects(selectedRect) } ?? NSScreen.main
    let scale = screenContainingRect?.backingScaleFactor ?? 1.0
    // Set output size to match the selection rect's size in PIXELS
    config.width = Int(selectedRect.width * scale)
    config.height = Int(selectedRect.height * scale)
    print(
      "Region Capture Config: sourceRect=\(selectedRect), Scale=\(scale), Width=\(config.width), Height=\(config.height)"
    )
    config.scalesToFit = false  // Do not scale the output

    config.minimumFrameInterval = CMTime(value: 1, timescale: 60)
    config.pixelFormat = kCVPixelFormatType_32BGRA
    config.showsCursor = false  // Usually false for region capture

    let image = try await captureFrame(filter: filter, config: config)
    processCapturedImage(image, openEditor: openEditor)
  }

  // --- Frame Capture and Processing (Now returns NSImage or throws Error) ---

  private func captureFrame(filter: SCContentFilter, config: SCStreamConfiguration) async throws
    -> NSImage
  {
    // Reset the delegate's state before starting a new capture
    self.frameDelegate.reset()

    // Use a Continuation to bridge the delegate callback with async/await
    return try await withCheckedThrowingContinuation { continuation in
      self.frameDelegate.onFrame = { image in
        if let img = image {
          continuation.resume(returning: img)
        } else {
          // Determine specific error if possible, otherwise use generic failure
          // Check delegate's error status if stream stopped with error?
          continuation.resume(throwing: CaptureError.frameCaptureFailed)
        }
        self.stream = nil  // Release stream reference
      }

      // Attempt to setup and start the stream
      do {
        self.stream = SCStream(filter: filter, configuration: config, delegate: self.frameDelegate)
        // Add stream output on main queue for simplicity - does not throw
        try self.stream?.addStreamOutput(
          self.frameDelegate, type: .screen, sampleHandlerQueue: .main)
        // Start capture - this can throw permission errors
        try self.stream?.startCapture()  // Added try
        print("Stream started, waiting for frame...")
      } catch {
        print("Error setting up or starting stream: \(error)")
        // Check if it's a permission error
        let nsError = error as NSError
        if nsError.domain == "SCStream" && nsError.code == -5834 {
          continuation.resume(throwing: CaptureError.permissionDenied)
        } else {
          continuation.resume(throwing: CaptureError.streamSetupFailed(error))
        }
        self.stream = nil  // Release stream reference
      }
    }
  }

  // --- Post-Capture Processing ---

  private func processCapturedImage(_ image: NSImage, openEditor: Bool) {
    // This function is now called only on successful capture
    ClipboardService.shared.copyImageToClipboard(image)
    print("Image copied to clipboard.")

    if openEditor {
      print("Opening Annotation Editor (Placeholder)...")
      // TODO: Trigger Annotation Editor UI
    } else {
      print("Capture complete, editor not requested.")
    }
  }

  // --- Error Handling (Simplified - errors propagated now) ---

  // No longer needed here as errors are thrown by capture(mode:)
  // private func processError(_ error: Error) { ... }
}

// --- Clipboard Service (Remains the same) ---
class ClipboardService {
  static let shared = ClipboardService()
  private init() {}

  func copyImageToClipboard(_ image: NSImage) {
    let pasteboard = NSPasteboard.general
    pasteboard.clearContents()
    if !pasteboard.writeObjects([image]) {
      print("Error: Failed to write image to pasteboard.")
    }
  }

  func copyTextToClipboard(_ text: String) {
    let pasteboard = NSPasteboard.general
    pasteboard.clearContents()
    if !pasteboard.writeObjects([text as NSPasteboardWriting]) {
      print("Error: Failed to write text to pasteboard.")
    }
  }
}

// Other placeholders remain commented out
// extension CGRect { ... } // Helper if needed
