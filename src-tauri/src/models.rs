use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Client {
    pub id: i64,
    pub name: String,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: i64,
    pub name: String,
    pub client_id: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Entry {
    pub id: i64,
    pub task: String,
    pub client_id: Option<i64>,
    pub project_id: Option<i64>,
    pub started_at: String,
    pub stopped_at: Option<String>,
    pub google_event_id: Option<String>,
    pub outlook_event_id: Option<String>,
    pub sync_pending: bool,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateEntryInput {
    pub task: String,
    pub started_at: String,
}

#[derive(Debug, Deserialize)]
pub struct StopEntryInput {
    pub id: i64,
    pub task: String,
    pub client_id: Option<i64>,
    pub project_id: Option<i64>,
    pub stopped_at: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateEntryInput {
    pub id: i64,
    pub task: String,
    pub client_id: Option<i64>,
    pub project_id: Option<i64>,
    pub started_at: String,
    pub stopped_at: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_entry_serializes_to_json() {
        let entry = Entry {
            id: 1,
            task: "Test task".into(),
            client_id: None,
            project_id: None,
            started_at: "2026-03-16T09:00:00Z".into(),
            stopped_at: Some("2026-03-16T09:30:00Z".into()),
            google_event_id: None,
            outlook_event_id: None,
            sync_pending: false,
            created_at: "2026-03-16T09:00:00Z".into(),
        };
        let json = serde_json::to_string(&entry).unwrap();
        assert!(json.contains("\"task\":\"Test task\""));
    }
}
