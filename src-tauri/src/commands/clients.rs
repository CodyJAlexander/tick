use rusqlite::{Connection, params};
use crate::models::Client;
use tauri::State;
use std::sync::Mutex;

pub fn create_client_raw(conn: &Connection, name: &str, color: &str) -> rusqlite::Result<i64> {
    conn.execute("INSERT INTO clients (name, color) VALUES (?1, ?2)", params![name, color])?;
    Ok(conn.last_insert_rowid())
}

pub fn list_clients_raw(conn: &Connection) -> rusqlite::Result<Vec<Client>> {
    let mut stmt = conn.prepare("SELECT id, name, color FROM clients ORDER BY name")?;
    let rows = stmt.query_map([], |row| Ok(Client { id: row.get(0)?, name: row.get(1)?, color: row.get(2)? }))?;
    rows.collect()
}

pub fn delete_client_raw(conn: &Connection, id: i64) -> rusqlite::Result<Result<(), String>> {
    let entry_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM entries WHERE client_id=?1", params![id], |r| r.get(0)
    )?;
    if entry_count > 0 {
        return Ok(Err(format!("This client has {} entries. Reassign or delete those entries first.", entry_count)));
    }
    conn.execute("DELETE FROM projects WHERE client_id=?1", params![id])?;
    conn.execute("DELETE FROM clients WHERE id=?1", params![id])?;
    Ok(Ok(()))
}

#[tauri::command]
pub fn create_client(db: State<'_, Mutex<Connection>>, name: String, color: String) -> Result<i64, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    create_client_raw(&conn, &name, &color).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_clients(db: State<'_, Mutex<Connection>>) -> Result<Vec<Client>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    list_clients_raw(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_client(db: State<'_, Mutex<Connection>>, id: i64, name: String, color: String) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    conn.execute("UPDATE clients SET name=?1, color=?2 WHERE id=?3", params![name, color, id])
        .map(|_| ()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_client(db: State<'_, Mutex<Connection>>, id: i64) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    delete_client_raw(&conn, id).map_err(|e| e.to_string())?.map_err(|e| e)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::run_migrations;
    use rusqlite::Connection;

    #[test]
    fn test_delete_client_with_entries_fails() {
        let conn = Connection::open_in_memory().unwrap();
        run_migrations(&conn).unwrap();
        let cid = create_client_raw(&conn, "Acme", "#ff0000").unwrap();
        conn.execute(
            "INSERT INTO entries (task, started_at, client_id) VALUES ('task', '2026-01-01T00:00:00Z', ?1)",
            params![cid],
        ).unwrap();
        let result = delete_client_raw(&conn, cid).unwrap();
        assert!(result.is_err());
    }

    #[test]
    fn test_delete_client_without_entries_succeeds() {
        let conn = Connection::open_in_memory().unwrap();
        run_migrations(&conn).unwrap();
        let cid = create_client_raw(&conn, "Acme", "#ff0000").unwrap();
        let result = delete_client_raw(&conn, cid).unwrap();
        assert!(result.is_ok());
    }
}
