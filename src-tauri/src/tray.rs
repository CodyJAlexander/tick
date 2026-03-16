// src-tauri/src/tray.rs
use tauri::{
    AppHandle, Emitter, Manager,
    image::Image,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
};
use std::sync::Mutex;
use rusqlite::Connection;

/// Call after any timer state change to:
/// (a) emit `timer-changed` event to all webviews
/// (b) swap the tray icon to reflect recording state
pub fn notify_timer_changed(app: &AppHandle, running: bool) {
    app.emit("timer-changed", running).ok();

    let icon_bytes: &[u8] = if running {
        include_bytes!("../icons/tray-recording.png")
    } else {
        include_bytes!("../icons/tray-default.png")
    };
    if let Some(tray) = app.tray_by_id("main-tray") {
        if let Ok(image) = Image::from_bytes(icon_bytes) {
            tray.set_icon(Some(image)).ok();
        }
    }
}

pub fn build_tray(app: &AppHandle) -> tauri::Result<()> {
    let open_item = MenuItemBuilder::with_id("open", "Open Tick").build(app)?;
    let stop_item = MenuItemBuilder::with_id("stop", "Stop Timer").build(app)?;
    let quit_item = MenuItemBuilder::with_id("quit", "Quit").build(app)?;
    let menu = MenuBuilder::new(app)
        .items(&[&open_item, &stop_item, &quit_item])
        .build()?;

    let icon = Image::from_bytes(include_bytes!("../icons/tray-default.png"))
        .unwrap_or_else(|_| app.default_window_icon().unwrap().clone());

    TrayIconBuilder::with_id("main-tray")
        .icon(icon)
        .menu(&menu)
        .on_menu_event(|app, event| match event.id().as_ref() {
            "open" => {
                if let Some(win) = app.get_webview_window("main") {
                    win.show().ok();
                    win.set_focus().ok();
                }
            }
            "stop" => {
                let db = app.state::<Mutex<Connection>>();
                let conn = db.lock().unwrap();
                if let Ok(Some(entry)) =
                    crate::commands::entries::get_running_entry_raw(&conn)
                {
                    let now = chrono::Utc::now().to_rfc3339();
                    crate::commands::entries::stop_entry_raw(
                        &conn,
                        entry.id,
                        &entry.task,
                        entry.client_id,
                        entry.project_id,
                        &now,
                    )
                    .ok();
                    drop(conn);
                    notify_timer_changed(app, false);
                }
            }
            "quit" => std::process::exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(win) = app.get_webview_window("main") {
                    win.show().ok();
                    win.set_focus().ok();
                }
            }
        })
        .build(app)?;
    Ok(())
}
