use tauri::{AppHandle, Manager};

/// Shows or hides the in-game overlay window.
///
/// The overlay is a second WebView declared in `tauri.conf.json` with
/// `transparent`, `alwaysOnTop` and `skipTaskbar` set. It starts hidden so it
/// never covers the dashboard on launch.
#[tauri::command]
pub fn set_overlay_visible(app: AppHandle, caller: tauri::WebviewWindow, visible: bool) -> Result<(), String> {
    crate::platform_api::require_main_window(&caller)?;
    let window = app
        .get_webview_window("overlay")
        .ok_or_else(|| "overlay window is not configured".to_string())?;

    if visible {
        // Enforce click-through before making the fullscreen window visible.
        // Fail closed so a game-facing overlay never captures mouse input.
        if let Err(error) = window.set_ignore_cursor_events(true) {
            let _ = window.hide();
            return Err(format!("Overlay click-through unavailable: {error}"));
        }
        if let Err(error) = window.show() {
            let _ = window.hide();
            return Err(format!("Unable to show safe overlay: {error}"));
        }
        Ok(())
    } else {
        window.hide().map_err(|error| error.to_string())
    }
}

/// Toggles whether the overlay passes mouse clicks through to the game.
///
/// This uses Tauri's own `set_ignore_cursor_events`, which is the supported way
/// to make a window click-through. It deliberately does **not** poke
/// `WS_EX_TRANSPARENT` / `SetWindowLongW` through the Win32 API: that is
/// unnecessary here, and the window is never injected into the game process, so
/// there is nothing for Vanguard to object to.
#[tauri::command]
pub fn set_overlay_click_through(app: AppHandle, caller: tauri::WebviewWindow, click_through: bool) -> Result<(), String> {
    crate::platform_api::require_main_window(&caller)?;
    let window = app
        .get_webview_window("overlay")
        .ok_or_else(|| "overlay window is not configured".to_string())?;

    // This preview is never interactive in the game window.
    if !click_through {
        return Err("Practice overlay is always click-through in this preview.".into());
    }
    window
        .set_ignore_cursor_events(true)
        .map_err(|error| error.to_string())
}
