// Prevents additional console window on Windows in release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{AppHandle, Emitter, Manager, State, WebviewUrl, WebviewWindowBuilder};
use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::{MouseButton, TrayIconBuilder, TrayIconEvent};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

// State to track overlay visibility and recording
struct AppState {
    overlay_visible: std::sync::Mutex<bool>,
    is_recording: std::sync::Mutex<bool>,
}

#[tauri::command]
fn toggle_overlay(app: AppHandle, state: State<AppState>) -> Result<(), String> {
    let mut visible = state.overlay_visible.lock().unwrap();
    *visible = !*visible;

    if let Some(window) = app.get_webview_window("overlay") {
        if *visible {
            window.show().map_err(|e| e.to_string())?;
            window.set_focus().map_err(|e| e.to_string())?;
        } else {
            window.hide().map_err(|e| e.to_string())?;
        }
    } else if *visible {
        // Create overlay window if it doesn't exist
        create_overlay_window(&app)?;
    }

    Ok(())
}

#[tauri::command]
fn hide_overlay(app: AppHandle, state: State<AppState>) -> Result<(), String> {
    let mut visible = state.overlay_visible.lock().unwrap();
    *visible = false;

    if let Some(window) = app.get_webview_window("overlay") {
        window.hide().map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
fn simulate_paste() -> Result<(), String> {
    use enigo::{Enigo, Key, Keyboard, Settings};

    // Small delay to ensure clipboard is ready
    std::thread::sleep(std::time::Duration::from_millis(100));

    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;

    // Simulate Ctrl+V
    enigo.key(Key::Control, enigo::Direction::Press).map_err(|e| e.to_string())?;
    enigo.key(Key::Unicode('v'), enigo::Direction::Click).map_err(|e| e.to_string())?;
    enigo.key(Key::Control, enigo::Direction::Release).map_err(|e| e.to_string())?;

    println!("✓ Simulated Ctrl+V paste");

    Ok(())
}

fn create_overlay_window(app: &AppHandle) -> Result<(), String> {
    // Create small, subtle indicator window at bottom of screen (like Wispr Flow)
    let window = WebviewWindowBuilder::new(app, "overlay", WebviewUrl::App("overlay.html".into()))
        .title("vochat.io")
        .inner_size(280.0, 70.0)
        .position(0.0, 0.0) // Will be repositioned to bottom-center in JS
        .always_on_top(true)
        .decorations(false)
        .transparent(true)
        .resizable(false)
        .skip_taskbar(true)
        .visible(true)
        .build()
        .map_err(|e| e.to_string())?;

    // Open devtools in development mode
    #[cfg(debug_assertions)]
    {
        window.open_devtools();
    }

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    println!("🎹 Global shortcut: {:?}, state: {:?}", shortcut, event.state);

                    // Emit event to overlay window
                    if let Some(window) = app.get_webview_window("overlay") {
                        let event_name = match event.state {
                            ShortcutState::Pressed => "hotkey-pressed",
                            ShortcutState::Released => "hotkey-released",
                        };
                        let _ = window.emit(event_name, ());
                        println!("✓ Emitted {} to overlay", event_name);
                    }
                })
                .build(),
        )
        .manage(AppState {
            overlay_visible: std::sync::Mutex::new(false),
            is_recording: std::sync::Mutex::new(false),
        })
        .invoke_handler(tauri::generate_handler![toggle_overlay, hide_overlay, simulate_paste])
        .setup(|app| {
            // Create tray icon with menu
            let quit_item = MenuItemBuilder::with_id("quit", "Quit vochat.io").build(app)?;
            let show_item = MenuItemBuilder::with_id("show", "Show dashboard").build(app)?;

            let menu = MenuBuilder::new(app)
                .item(&show_item)
                .item(&quit_item)
                .build()?;

            let _tray = TrayIconBuilder::new()
                .menu(&menu)
                .on_menu_event(|app, event| {
                    match event.id().as_ref() {
                        "quit" => {
                            std::process::exit(0);
                        }
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|_tray, event| {
                    if let TrayIconEvent::Click { button: MouseButton::Left, .. } = event {
                        // Handle left click on tray icon
                        println!("Tray icon clicked");
                    }
                })
                .build(app)?;

            // Create overlay window at startup (always visible, small indicator)
            create_overlay_window(&app.handle())?;

            // Register global hotkey: Ctrl + Shift + D (temporary for testing)
            // TODO: Change to Ctrl + Win once we figure out Win key support
            let shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyD);

            match app.global_shortcut().register(shortcut) {
                Ok(_) => {
                    println!("✓ vochat.io desktop initialized");
                    println!("✓ Hold Ctrl + Shift + D to dictate");
                }
                Err(e) => {
                    eprintln!("✗ Failed to register global hotkey: {}", e);
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
