use rusqlite::{Connection, params};
use crate::models::{Entry, StopEntryInput, UpdateEntryInput};

// --- Raw functions (used in tests and by commands) ---

pub fn create_entry_raw(conn: &Connection, task: &str, started_at: &str) -> rusqlite::Result<i64> {
    conn.execute(
        "INSERT INTO entries (task, started_at) VALUES (?1, ?2)",
        params![task, started_at],
    )?;
    Ok(conn.last_insert_rowid())
}

pub fn stop_entry_raw(
    conn: &Connection,
    id: i64,
    task: &str,
    client_id: Option<i64>,
    project_id: Option<i64>,
    stopped_at: &str,
) -> rusqlite::Result<()> {
    conn.execute(
        "UPDATE entries SET task=?1, client_id=?2, project_id=?3, stopped_at=?4, sync_pending=1 WHERE id=?5",
        params![task, client_id, project_id, stopped_at, id],
    )?;
    Ok(())
}

pub fn update_entry_raw(conn: &Connection, input: &UpdateEntryInput) -> rusqlite::Result<()> {
    conn.execute(
        "UPDATE entries SET task=?1, client_id=?2, project_id=?3, started_at=?4, stopped_at=?5 WHERE id=?6",
        params![input.task, input.client_id, input.project_id, input.started_at, input.stopped_at, input.id],
    )?;
    Ok(())
}

pub fn delete_entry_raw(conn: &Connection, id: i64) -> rusqlite::Result<()> {
    conn.execute("DELETE FROM entries WHERE id=?1", params![id])?;
    Ok(())
}

pub fn list_entries_raw(
    conn: &Connection,
    from: Option<&str>,
    to: Option<&str>,
) -> rusqlite::Result<Vec<Entry>> {
    let mut stmt = conn.prepare(
        "SELECT id, task, client_id, project_id, started_at, stopped_at,
                google_event_id, outlook_event_id, sync_pending, created_at
         FROM entries
         WHERE (?1 IS NULL OR started_at >= ?1)
           AND (?2 IS NULL OR started_at <= ?2)
         ORDER BY started_at DESC",
    )?;
    let rows = stmt.query_map(params![from, to], |row| {
        Ok(Entry {
            id: row.get(0)?,
            task: row.get(1)?,
            client_id: row.get(2)?,
            project_id: row.get(3)?,
            started_at: row.get(4)?,
            stopped_at: row.get(5)?,
            google_event_id: row.get(6)?,
            outlook_event_id: row.get(7)?,
            sync_pending: row.get::<_, i32>(8)? != 0,
            created_at: row.get(9)?,
        })
    })?;
    rows.collect()
}

pub fn get_running_entry_raw(conn: &Connection) -> rusqlite::Result<Option<Entry>> {
    let mut stmt = conn.prepare(
        "SELECT id, task, client_id, project_id, started_at, stopped_at,
                google_event_id, outlook_event_id, sync_pending, created_at
         FROM entries WHERE stopped_at IS NULL LIMIT 1",
    )?;
    let mut rows = stmt.query_map([], |row| {
        Ok(Entry {
            id: row.get(0)?,
            task: row.get(1)?,
            client_id: row.get(2)?,
            project_id: row.get(3)?,
            started_at: row.get(4)?,
            stopped_at: row.get(5)?,
            google_event_id: row.get(6)?,
            outlook_event_id: row.get(7)?,
            sync_pending: row.get::<_, i32>(8)? != 0,
            created_at: row.get(9)?,
        })
    })?;
    rows.next().transpose()
}

// --- Tauri commands ---

use tauri::State;
use std::sync::Mutex;

#[tauri::command]
pub fn create_entry(
    app: tauri::AppHandle,
    db: State<'_, Mutex<Connection>>,
    task: String,
    started_at: String,
) -> Result<i64, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let id = create_entry_raw(&conn, &task, &started_at).map_err(|e| e.to_string())?;
    drop(conn);
    crate::tray::notify_timer_changed(&app, true);
    Ok(id)
}

#[tauri::command]
pub fn stop_entry(
    app: tauri::AppHandle,
    db: State<'_, Mutex<Connection>>,
    input: StopEntryInput,
) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    stop_entry_raw(&conn, input.id, &input.task, input.client_id, input.project_id, &input.stopped_at)
        .map_err(|e| e.to_string())?;
    drop(conn);
    crate::tray::notify_timer_changed(&app, false);
    Ok(())
}

#[tauri::command]
pub fn update_entry(
    db: State<'_, Mutex<Connection>>,
    input: UpdateEntryInput,
) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    update_entry_raw(&conn, &input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_entry(
    app: tauri::AppHandle,
    db: State<'_, Mutex<Connection>>,
    id: i64,
) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    // Check if the deleted entry was running before deleting
    let was_running = get_running_entry_raw(&conn)
        .ok().flatten()
        .map(|e| e.id == id)
        .unwrap_or(false);
    delete_entry_raw(&conn, id).map_err(|e| e.to_string())?;
    drop(conn);
    if was_running {
        crate::tray::notify_timer_changed(&app, false);
    }
    Ok(())
}

#[tauri::command]
pub fn list_entries(
    db: State<'_, Mutex<Connection>>,
    from: Option<String>,
    to: Option<String>,
) -> Result<Vec<Entry>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    list_entries_raw(&conn, from.as_deref(), to.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_running_entry(
    db: State<'_, Mutex<Connection>>,
) -> Result<Option<Entry>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    get_running_entry_raw(&conn).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;
    use crate::db::run_migrations;

    fn setup() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        run_migrations(&conn).unwrap();
        conn
    }

    #[test]
    fn test_create_and_get_entry() {
        let conn = setup();
        let id = create_entry_raw(&conn, "fix nav bug", "2026-03-16T09:00:00Z").unwrap();
        assert!(id > 0);
        let entries = list_entries_raw(&conn, None, None).unwrap();
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].task, "fix nav bug");
    }

    #[test]
    fn test_stop_entry() {
        let conn = setup();
        let id = create_entry_raw(&conn, "fix nav bug", "2026-03-16T09:00:00Z").unwrap();
        stop_entry_raw(&conn, id, "fix nav bug", None, None, "2026-03-16T09:30:00Z").unwrap();
        let entries = list_entries_raw(&conn, None, None).unwrap();
        assert!(entries[0].stopped_at.is_some());
    }

    #[test]
    fn test_discard_entry() {
        let conn = setup();
        let id = create_entry_raw(&conn, "fix nav bug", "2026-03-16T09:00:00Z").unwrap();
        delete_entry_raw(&conn, id).unwrap();
        let entries = list_entries_raw(&conn, None, None).unwrap();
        assert!(entries.is_empty());
    }
}
