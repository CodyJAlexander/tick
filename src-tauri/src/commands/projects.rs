use rusqlite::{Connection, params};
use crate::models::Project;
use tauri::State;
use std::sync::Mutex;

pub fn create_project_raw(conn: &Connection, name: &str, client_id: Option<i64>) -> rusqlite::Result<i64> {
    conn.execute("INSERT INTO projects (name, client_id) VALUES (?1, ?2)", params![name, client_id])?;
    Ok(conn.last_insert_rowid())
}

pub fn list_projects_raw(conn: &Connection) -> rusqlite::Result<Vec<Project>> {
    let mut stmt = conn.prepare("SELECT id, name, client_id FROM projects ORDER BY name")?;
    let rows = stmt.query_map([], |row| Ok(Project { id: row.get(0)?, name: row.get(1)?, client_id: row.get(2)? }))?;
    rows.collect()
}

pub fn delete_project_raw(conn: &Connection, id: i64) -> rusqlite::Result<Result<(), String>> {
    let entry_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM entries WHERE project_id=?1", params![id], |r| r.get(0)
    )?;
    if entry_count > 0 {
        return Ok(Err(format!("This project has {} entries. Reassign or delete those entries first.", entry_count)));
    }
    conn.execute("DELETE FROM projects WHERE id=?1", params![id])?;
    Ok(Ok(()))
}

#[tauri::command]
pub fn create_project(db: State<'_, Mutex<Connection>>, name: String, client_id: Option<i64>) -> Result<i64, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    create_project_raw(&conn, &name, client_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_projects(db: State<'_, Mutex<Connection>>) -> Result<Vec<Project>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    list_projects_raw(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_project(db: State<'_, Mutex<Connection>>, id: i64, name: String, client_id: Option<i64>) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    conn.execute("UPDATE projects SET name=?1, client_id=?2 WHERE id=?3", params![name, client_id, id])
        .map(|_| ()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_project(db: State<'_, Mutex<Connection>>, id: i64) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    delete_project_raw(&conn, id).map_err(|e| e.to_string())?.map_err(|e| e)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::run_migrations;
    use rusqlite::Connection;

    #[test]
    fn test_delete_project_with_entries_fails() {
        let conn = Connection::open_in_memory().unwrap();
        run_migrations(&conn).unwrap();
        let pid = create_project_raw(&conn, "Website", None).unwrap();
        conn.execute(
            "INSERT INTO entries (task, started_at, project_id) VALUES ('task', '2026-01-01T00:00:00Z', ?1)",
            rusqlite::params![pid],
        ).unwrap();
        let result = delete_project_raw(&conn, pid).unwrap();
        assert!(result.is_err());
    }

    #[test]
    fn test_delete_project_without_entries_succeeds() {
        let conn = Connection::open_in_memory().unwrap();
        run_migrations(&conn).unwrap();
        let pid = create_project_raw(&conn, "Website", None).unwrap();
        let result = delete_project_raw(&conn, pid).unwrap();
        assert!(result.is_ok());
    }
}
