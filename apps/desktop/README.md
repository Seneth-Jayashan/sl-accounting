# SL Accounting LMS - Desktop App

This is the Tauri desktop wrapper for the SL Accounting LMS. It is configured to bundle and serve the existing web application (`apps/web`) seamlessly as a native desktop application.

## Prerequisites

Before developing or building the desktop app, ensure you have the following installed:

1. **Rust & Cargo**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```
   *(Make sure to restart your terminal or run `source $HOME/.cargo/env` after installing)*

2. **Linux OS Dependencies** (If developing on Linux/Ubuntu)
   ```bash
   sudo apt update
   sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
   ```

---

## Useful Commands

All commands should be run from inside this directory (`apps/desktop`).

### 1. Start the Development Server
This command will automatically start the web server in `apps/web` and open the Tauri desktop window to render it.
```bash
npm run tauri dev
```

### 2. Change the App Icon
To update the application icons across all platforms:
1. Place a high-quality logo (e.g., `1024x1024` PNG) in this folder (e.g., `app-icon.png`).
2. Run the icon generation command:
   ```bash
   npm run tauri icon app-icon.png
   ```

### 3. Build the Downloadable Installers
To compile the final, downloadable app (e.g., `.deb`, `.AppImage`, `.exe`, or `.msi`), run:
```bash
npm run tauri build
```
*Note: This process bundles the production build of `apps/web` and compiles the Rust binary. It might take several minutes.*

**Where to find the built installers:**
Once the build is complete, you can find your installers inside:
`src-tauri/target/release/bundle/`

- **Linux build:** Generates `.deb` and `.AppImage` files.
- **Windows build:** Generates `.exe` and `.msi` installers.
- **macOS build:** Generates `.dmg` and `.app` files.

*(Note: To build the `.exe` Windows installer, you must run `npm run tauri build` from a Windows machine or set up a cross-compilation pipeline via GitHub Actions).*
