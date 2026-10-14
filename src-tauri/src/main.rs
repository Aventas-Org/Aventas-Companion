// Prevents an extra console window on Windows in release builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod overlay;
mod process;

use overlay::{set_overlay_click_through, set_overlay_visible};
use process::ValorantProcessResponse;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {name}! Welcome to Aventas Desktop Companion.")
}

/// Checks whether the VALORANT game process is running.
#[tauri::command]
fn check_valorant_process() -> ValorantProcessResponse {
    process::check_valorant_process()
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            greet,
            check_valorant_process,
            set_overlay_visible,
            set_overlay_click_through
        ])
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
