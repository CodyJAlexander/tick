use rusqlite::{Connection, Result};

pub fn run_migrations(conn: &Connection) -> Result<()> {
    conn.execute_batch("
        PRAGMA journal_mode=WAL;
        PRAGMA foreign_keys=ON;

        CREATE TABLE IF NOT EXISTS clients (
            id    INTEGER PRIMARY KEY AUTOINCREMENT,
            name  TEXT NOT NULL,
            color TEXT NOT NULL DEFAULT '#6366f1'
        );

        CREATE TABLE IF NOT EXISTS projects (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            name      TEXT NOT NULL,
            client_id INTEGER REFERENCES clients(id)
        );

        CREATE TABLE IF NOT EXISTS entries (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            task             TEXT NOT NULL,
            client_id        INTEGER REFERENCES clients(id),
            project_id       INTEGER REFERENCES projects(id),
            started_at       TEXT NOT NULL,
            stopped_at       TEXT,
            google_event_id  TEXT,
            outlook_event_id TEXT,
            sync_pending     INTEGER NOT NULL DEFAULT 0,
            created_at       TEXT NOT NULL DEFAULT (datetime('now'))
        );
    ")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_migrations_run_without_error() {
        let conn = rusqlite::Connection::open_in_memory().unwrap();
        let result = run_migrations(&conn);
        assert!(result.is_ok());
    }

    #[test]
    fn test_clients_table_created() {
        let conn = rusqlite::Connection::open_in_memory().unwrap();
        run_migrations(&conn).unwrap();
        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM clients", [], |r| r.get(0))
            .unwrap();
        assert_eq!(count, 0);
    }
}
