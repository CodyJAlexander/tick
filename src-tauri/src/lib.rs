mod db;
mod models;
mod commands;

use std::sync::Mutex;
use rusqlite::Connection;

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
        ])
        .run(tauri::generate_context!())
        .expect("error running Tauri app");
}
