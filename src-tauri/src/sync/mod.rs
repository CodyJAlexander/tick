pub mod google;
pub mod outlook;

use rusqlite::{Connection, params};
use crate::models::Entry;

pub fn get_pending_entries(conn: &Connection) -> rusqlite::Result<Vec<Entry>> {
    let mut stmt = conn.prepare(
        "SELECT id, task, client_id, project_id, started_at, stopped_at,
                google_event_id, outlook_event_id, sync_pending, created_at
         FROM entries WHERE sync_pending=1 AND stopped_at IS NOT NULL",
    )?;
    let rows = stmt.query_map([], |row| {
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

pub fn mark_synced_google(conn: &Connection, entry_id: i64, event_id: &str) -> rusqlite::Result<()> {
    conn.execute(
        "UPDATE entries SET google_event_id=?1, sync_pending=0 WHERE id=?2",
        params![event_id, entry_id],
    )?;
    Ok(())
}

pub fn mark_synced_outlook(conn: &Connection, entry_id: i64, event_id: &str) -> rusqlite::Result<()> {
    conn.execute(
        "UPDATE entries SET outlook_event_id=?1, sync_pending=0 WHERE id=?2",
        params![event_id, entry_id],
    )?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;
    use crate::db::run_migrations;
    use crate::commands::entries::create_entry_raw;

    #[test]
    fn test_get_pending_entries_returns_sync_pending() {
        let conn = Connection::open_in_memory().unwrap();
        run_migrations(&conn).unwrap();
        let id = create_entry_raw(&conn, "task", "2026-03-16T09:00:00Z").unwrap();
        conn.execute(
            "UPDATE entries SET stopped_at='2026-03-16T10:00:00Z', sync_pending=1 WHERE id=?1",
            rusqlite::params![id],
        ).unwrap();
        let pending = get_pending_entries(&conn).unwrap();
        assert_eq!(pending.len(), 1);
        assert_eq!(pending[0].task, "task");
    }
}
