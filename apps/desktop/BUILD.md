# Building VoChat Desktop App

## Prerequisites

1. **Visual Studio Build Tools 2022** with "Desktop development with C++" workload
   - Download: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
   - During installation, select: "Desktop development with C++"

2. **Rust** (already installed ✓)
   - Verify: `rustc --version`

3. **Node.js 18+** (already installed ✓)
   - Verify: `node --version`

4. **pnpm** (already installed ✓)
   - Verify: `pnpm --version`

## Build Instructions

### Option 1: Using PowerShell (Recommended)

Open **PowerShell** (not Git Bash) and run:

```powershell
# Navigate to desktop app
cd C:\Users\rickt\OneDrive\Desktop\vochat.io\apps\desktop

# Install dependencies
pnpm install

# Development mode
pnpm tauri dev

# Production build
pnpm tauri build
```

### Option 2: Using Visual Studio Developer Command Prompt

1. Open "x64 Native Tools Command Prompt for VS 2022"
2. Navigate to project:
   ```cmd
   cd C:\Users\rickt\OneDrive\Desktop\vochat.io\apps\desktop
   ```
3. Run:
   ```cmd
   pnpm tauri dev
   ```

### Option 3: Using CMD

```cmd
cd C:\Users\rickt\OneDrive\Desktop\vochat.io\apps\desktop
pnpm tauri dev
```

## Troubleshooting

### Error: `link.exe` not found

**Problem**: The MSVC linker is not in your PATH.

**Solution**:
1. Close Git Bash
2. Use PowerShell or CMD instead
3. Or use "Developer Command Prompt for VS 2022"

### Error: `link: extra operand`

**Problem**: Git Bash is using the wrong `link` command (Unix link instead of MSVC link.exe).

**Solution**: Use PowerShell or CMD, not Git Bash.

### Build succeeds but app crashes

**Problem**: Missing WebView2 runtime.

**Solution**: WebView2 is usually pre-installed on Windows 10/11. If missing:
- Download: https://developer.microsoft.com/en-us/microsoft-edge/webview2/

## Output

**Development mode:**
- App runs immediately with hot reload

**Production build:**
- Executable: `src-tauri/target/release/vochat-desktop.exe`
- Installer (MSI): `src-tauri/target/release/bundle/msi/VoChat_0.1.0_x64_en-US.msi`

## Features Implemented

✅ **Global Hotkey**: Ctrl + Win + Space
✅ **System Tray**: Minimize to tray with menu
✅ **Overlay Window**: Transparent, always-on-top dictation window
✅ **Supabase Authentication**: Sign in/up with email & password
✅ **Profile Sync**: View app profiles from web dashboard
✅ **Session Persistence**: Stay signed in across app restarts
✅ **Tauri Plugins**:
- global-shortcut (keyboard shortcuts)
- clipboard-manager (text insertion)
- shell (open links)

## Next Steps After Build

1. **Sign in**: Use the desktop app to sign in with your VoChat account
2. **Create profiles**: Visit the web dashboard to create app profiles
3. **Test global hotkey**: Press Ctrl + Win + Space
4. **Check system tray**: Look for VoChat icon in taskbar
5. **Test overlay**: Hotkey should show overlay window
6. **Verify profile sync**: Your app profiles should appear in the desktop app

## Known Limitations (MVP)

- STT integration not yet connected (mock transcript)
- Text insertion via clipboard only (not native injection)
- No app detection yet (uses default profile only)
- AI refinement not yet implemented

These will be added in Phase 7 (STT) and Phase 8 (AI Refinement).
