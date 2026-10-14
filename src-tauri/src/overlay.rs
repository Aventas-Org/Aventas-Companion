use tauri::{AppHandle, Manager};

/// Shows or hides the in-game overlay window.
///
/// The overlay is a second WebView declared in `tauri.conf.json` with
/// `transparent`, `alwaysOnTop` and `skipTaskbar` set. It starts hidden so it
/// never covers the dashboard on launch.
#[tauri::command]
pub fn set_overlay_visible(app: AppHandle, visible: bool) -> Result<(), String> {
    let window = app
        .get_webview_window("overlay")
        .ok_or_else(|| "overlay window is not configured".to_string())?;

    if visible {
        window.show().map_err(|error| error.to_string())
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
pub fn set_overlay_click_through(app: AppHandle, click_through: bool) -> Result<(), String> {
    let window = app
        .get_webview_window("overlay")
        .ok_or_else(|| "overlay window is not configured".to_string())?;

    window
        .set_ignore_cursor_events(click_through)
        .map_err(|error| error.to_string())
}
