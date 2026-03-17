mod db;
mod models;
mod commands;
mod tray;
mod hotkey;
mod sync;

use std::sync::Mutex;
use rusqlite::Connection;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let conn = Connection::open("tick.db").expect("Failed to open database");
    db::run_migrations(&conn).expect("Failed to run migrations");

    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .manage(Mutex::new(conn))
        .invoke_handler(tauri::generate_handler![
            commands::entries::create_entry,
            commands::entries::stop_entry,
            commands::entries::update_entry,
            commands::entries::delete_entry,
            commands::entries::list_entries,
            commands::entries::get_running_entry,
            commands::clients::create_client,
            commands::clients::list_clients,
            commands::clients::update_client,
            commands::clients::delete_client,
            commands::projects::create_project,
            commands::projects::list_projects,
            commands::projects::update_project,
            commands::projects::delete_project,
            commands::sync_commands::google_sync_status,
            commands::sync_commands::outlook_sync_status,
            commands::sync_commands::connect_google,
            commands::sync_commands::connect_outlook,
            commands::sync_commands::disconnect_google,
            commands::sync_commands::disconnect_outlook,
        ])
        .setup(|app| {
            hotkey::register_hotkey(&app.handle());
            tray::build_tray(&app.handle())?;

            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let db = app_handle.state::<std::sync::Mutex<rusqlite::Connection>>();
                let pending = {
                    let conn = db.lock().unwrap();
                    crate::sync::get_pending_entries(&conn).unwrap_or_default()
                };
                for entry in pending {
                    let google_token_path = app_handle.path().app_data_dir().unwrap().join("google_token.json");
                    if google_token_path.exists() {
                        if let Ok(token_json) = std::fs::read_to_string(&google_token_path) {
                            if let Ok(token) = serde_json::from_str::<crate::sync::google::GoogleToken>(&token_json) {
                                let result = crate::sync::google::create_event(
                                    &token.access_token, &entry.task, "", "",
                                    &entry.started_at, entry.stopped_at.as_deref().unwrap_or(""),
                                    "primary",
                                ).await;
                                if let Ok(event_id) = result {
                                    let conn = db.lock().unwrap();
                                    crate::sync::mark_synced_google(&conn, entry.id, &event_id).ok();
                                }
                            }
                        }
                    }
                    let outlook_token_path = app_handle.path().app_data_dir().unwrap().join("outlook_token.json");
                    if outlook_token_path.exists() {
                        if let Ok(token_json) = std::fs::read_to_string(&outlook_token_path) {
                            if let Ok(token) = serde_json::from_str::<crate::sync::outlook::OutlookToken>(&token_json) {
                                let result = crate::sync::outlook::create_event(
                                    &token.access_token, &entry.task, "", "",
                                    &entry.started_at, entry.stopped_at.as_deref().unwrap_or(""),
                                ).await;
                                if let Ok(event_id) = result {
                                    let conn = db.lock().unwrap();
                                    crate::sync::mark_synced_outlook(&conn, entry.id, &event_id).ok();
                                }
                            }
                        }
                    }
                }
            });

            Ok(())
        })
        // Hide window on close instead of quitting
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if window.label() != "popup" {
                    window.hide().ok();
                    api.prevent_close();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error running Tauri app");
}
