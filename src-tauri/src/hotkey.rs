use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_global_shortcut::GlobalShortcutExt;
use std::sync::Mutex;
use rusqlite::Connection;
use crate::commands::entries::get_running_entry_raw;

pub fn register_hotkey(app: &AppHandle) {
    app.global_shortcut()
        .on_shortcut("ctrl+k", move |app, _shortcut, _event| {
            toggle_popup(app);
        })
        .expect("Failed to register global shortcut");
}

fn toggle_popup(app: &AppHandle) {
    let popup = match app.get_webview_window("popup") {
        Some(w) => w,
        None => return,
    };

    // If already visible, just focus it (double-press guard)
    if popup.is_visible().unwrap_or(false) {
        popup.set_focus().ok();
        return;
    }

    // Determine mode: start or stop
    let db = app.state::<Mutex<Connection>>();
    let conn = db.lock().unwrap();
    let running = get_running_entry_raw(&conn).unwrap_or(None);
    drop(conn);

    if running.is_some() {
        popup.set_size(tauri::LogicalSize::new(360.0_f64, 220.0_f64)).ok();
        popup.emit("popup-mode", "stop").ok();
    } else {
        popup.set_size(tauri::LogicalSize::new(360.0_f64, 120.0_f64)).ok();
        popup.emit("popup-mode", "start").ok();
    }

    popup.center().ok();
    popup.show().ok();
    popup.set_focus().ok();
}
