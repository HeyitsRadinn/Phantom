<plan>
Phantom: Lightning-Fast, Native macOS Screenshot & Markup Tool

---

## 1. Overview & Vision

*Phantom* is a pure-native macOS screenshot app designed for speed and simplicity:

* **Instant capture (<50 ms)** via global hotkey for full-screen, window, or arbitrary region
* **Zero-click copy**: auto-paste-ready image in clipboard
* **On-demand annotation**: SwiftUI-based editor for crop, arrows, blur, text
* **Built-in OCR & summarization**: Vision framework text recognition + on-device ML summary
* **One-click cloud share**: upload to Cloudflare R2 / AWS S3 / MinIO / Imgur, auto-copy short URL + Markdown/HTML snippet

> **Elevator pitch:** Phantom grabs your screen before you even see a preview, lets you mark it up, extract text or AI-summarize it, and share it—all in a sub-10 MB, sub-50 ms native macOS bundle.

---

## 2. Tech Stack & Architecture

### 2.1 Core Technologies

| Layer            | Technology                             | Purpose                                                |
| ---------------- | -------------------------------------- | ------------------------------------------------------ |
| Language         | Swift 5+                               | Business logic, UI, concurrency with Swift concurrency |
| UI Framework     | SwiftUI + Canvas / MetalKit            | Declarative UI, custom drawing & GPU-accelerated blur  |
| Capture          | CoreGraphics / Metal                   | High-speed screen grab, region/window/fullscreen       |
| OCR              | Vision framework                       | On-device text recognition with async/await            |
| ML Summarization | NLLanguageRecognizer / Core ML         | Simple text summary and entity extraction              |
| Networking       | URLSession + AWS SDK for Swift + Imgur | Secure uploads to configurable endpoints               |
| Persistence      | FileManager / CoreData / UserDefaults  | Temp files, history store, user settings               |
| Notifications    | UserNotifications framework            | Optional capture/upload success & link alerts          |
| Auto-update      | Sparkle framework                      | Safari-style background updates                        |
| Security         | KeychainAccess                         | Secure storage of API keys                             |

### 2.2 High-Level Modules

```
┌───────────────┐      ┌─────────────┐      ┌───────────┐
│  Hotkey &     │────▶│ Capture     │────▶│ Clipboard │
│  Shortcuts    │      │ Engine      │      │ Service   │
└───────────────┘      └─────────────┘      └───────────┘
       │                       │                    │
       ▼                       ▼                    ▼
  (Option)                (Image)                (Image)
       │                       ▼                    │
       ▼               ┌─────────────┐            │
       ▼               │ Annotation  │◀───────────┘
                       │ Editor UI   │
                       └─────────────┘
                              │
                              ▼
                       ┌─────────────┐
                       │ OCR Worker  │
                       └─────────────┘
                              │
                              ▼
                       ┌─────────────┐
                       │ Uploader    │
                       └─────────────┘
                              │
                              ▼
                       ┌─────────────┐
                       │ History &   │
                       │ Settings    │
                       └─────────────┘
```

---

## 3. Module Breakdown & Responsibilities

### 3.1 Hotkey & Shortcut Manager

* Use **Carbon API** for global hotkey registration (permit background capture)
* Expose UI in Preferences to bind hotkeys for:

  * Full-screen capture
  * Window capture
  * Region capture
* Provide modifier detection (Option/Shift) to trigger editor or silent save

### 3.2 Capture Engine

* Implement `CGWindowListCreateImage` for multiple modes:

  * `.optionOnScreenOnly` for active window
  * `.optionAll` for full desktop
* Fallback to **Metal shader** pass-through for GPU-based blur preview in editor
* Output `NSImage` or raw pixel buffer to downstream services

### 3.3 Clipboard Service

* Immediately write `NSImage` to `NSPasteboard.general`
* Expose utility to write text (for OCR) to clipboard

### 3.4 Annotation Editor UI

* **SwiftUI Canvas** View with layers:

  * **Background**: captured image
  * **Overlay**: shapes (arrow, rectangle, ellipse), freehand path, text blocks
* Tool palette UI built with **SwiftUI**:

  * Stroke color picker, line thickness, font selector
  * Blur tool uses **MetalKit** shader on selected region
* Keyboard shortcuts:

  * ⌘Z / ⌘⇧Z for undo/redo
  * ⌘S to save to disk
  * ↩︎ to upload & copy link
  * ⎋ to cancel

### 3.5 OCR & Summarization Worker

* Use `VNRecognizeTextRequest` with Swift concurrency:

  ```swift
  let request = VNRecognizeTextRequest(completionHandler: ...)
  request.recognitionLevel = .accurate
  try await imageRequestHandler.perform([request])
  ```
* Post-process `VNRecognizedTextObservation` to structured text
* **Summarization**:

  * Pass recognized text to `NLLanguageRecognizer` or a small Core ML summarization model
  * Return 1–2 sentence summary

### 3.6 Uploader

* Define pluggable endpoint protocols:

  ```swift
  protocol Uploader {
    func upload(image: Data) async throws -> URL
  }
  ```
* Provide implementations for:

  * **Cloudflare R2** via signed URL PUT
  * **AWS S3/MinIO** with `AWSClient`
  * **Imgur** fallback using anonymous API
* Copy returned URL + Markdown snippet (`![alt](url)`) to clipboard and optionally notify user

### 3.7 History & Settings

* **CoreData** model for past captures:

  * Entity: `Capture` with image thumbnail, timestamp, annotations metadata
* **UserDefaults** storage for:

  * Hotkey bindings
  * Default save folder
  * Endpoint configurations & API keys

### 3.8 Auto-updater

* Integrate **Sparkle**:

  * Configure feed URL (GitHub Releases or custom)
  * Silent background download
  * Prompt user to restart & install

---

## 4. User Experience & Flow

1. **Global hotkey pressed** → (
   target mode: full/window/region) → capture image
2. **Immediately** write image to clipboard; send macOS notification: “Phantom: screenshot copied”
3. If **Option key is held**, open annotation window with captured image

   * Otherwise, exit to background
4. In **Editor**:

   * Use tool palette to draw arrows, shapes, blur, add text
   * Optionally switch to **OCR Mode**: draw region → text auto-copied; “Summarize” button appears
   * Save or upload via ⌘S / ↩︎
5. **Uploader** runs, returns URL → copied to clipboard; notify user with “Link copied” alert
6. **History** panel in Preferences lists past captures; click to re-open or re-upload

---

## 5. Week-by-Week Roadmap

| Week | Tasks                                                                                    |
| ---- | ---------------------------------------------------------------------------------------- |
| 1    | Set up Xcode project, hotkey manager, full/window/region capture & clipboard write       |
| 2    | Build Annotation Editor UI (Canvas layer, shape tools, blur shader)                      |
| 3    | Integrate Vision OCR & summarization; add OCR Mode in editor                             |
| 4    | Implement Uploader protocol & endpoint modules; Preferences UI for settings & history    |
| 5    | Sparkle auto-update integration; CSS theming (light/dark mode); finalize packaging (DMG) |

---

## 6. Security, Performance & Privacy

* **Performance:** all core loops in native Swift/Metal; capture-to-clipboard in <50 ms cold start
* **Memory footprint:** lean bundle (\~8–12 MB app, 20 MB including Core ML models)
* **Security:** TLS 1.3, App Sandbox, Keychain storage, minimal entitlements
* **Privacy:** local-first design; only user-initiated uploads; no analytics or telemetry

---

## 7. Future Apple Intelligence Enhancements

* **Live Text Integration**: optionally use `DataScannerView` for inline selection in editor
* **LLM Hooks**: expose post-OCR “Summarize” via on-device generative model when available
* **SwiftUI Modifiers**: adopt new Vision UI components from WWDC25 to streamline OCR flows

---

Phantom—a sub-50 ms, under-20 MB, all-native macOS screenshot and markup powerhouse.
</plan>