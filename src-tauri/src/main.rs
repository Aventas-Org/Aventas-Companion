// Prevents an extra console window on Windows in release builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod process;

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
        .invoke_handler(tauri::generate_handler![greet, check_valorant_process])
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
