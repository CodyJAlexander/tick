use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GoogleToken {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_at: i64,
}

pub fn get_auth_url(client_id: &str, redirect_uri: &str) -> String {
    format!(
        "https://accounts.google.com/o/oauth2/v2/auth?client_id={}&redirect_uri={}&response_type=code&scope=https://www.googleapis.com/auth/calendar.events&access_type=offline&prompt=consent",
        client_id, redirect_uri
    )
}

pub async fn exchange_code(
    client_id: &str,
    client_secret: &str,
    code: &str,
    redirect_uri: &str,
) -> Result<GoogleToken, String> {
    let client = reqwest::Client::new();
    let resp = client
        .post("https://oauth2.googleapis.com/token")
        .form(&[
            ("code", code),
            ("client_id", client_id),
            ("client_secret", client_secret),
            ("redirect_uri", redirect_uri),
            ("grant_type", "authorization_code"),
        ])
        .send()
        .await
        .map_err(|e| e.to_string())?;

    #[derive(Deserialize)]
    struct TokenResponse {
        access_token: String,
        refresh_token: Option<String>,
        expires_in: i64,
    }

    let body: TokenResponse = resp.error_for_status().map_err(|e| e.to_string())?.json().await.map_err(|e| e.to_string())?;
    let expires_at = chrono::Utc::now().timestamp() + body.expires_in;
    Ok(GoogleToken {
        access_token: body.access_token,
        refresh_token: body.refresh_token.unwrap_or_default(),
        expires_at,
    })
}

pub async fn create_event(
    token: &str,
    task: &str,
    client_name: &str,
    project_name: &str,
    started_at: &str,
    stopped_at: &str,
    calendar_id: &str,
) -> Result<String, String> {
    let client = reqwest::Client::new();

    #[derive(Serialize)]
    struct EventTime {
        #[serde(rename = "dateTime")]
        date_time: String,
        #[serde(rename = "timeZone")]
        time_zone: String,
    }
    #[derive(Serialize)]
    struct Event {
        summary: String,
        description: String,
        start: EventTime,
        end: EventTime,
    }

    let event = Event {
        summary: task.to_string(),
        description: format!("Client: {}\nProject: {}", client_name, project_name),
        start: EventTime { date_time: started_at.to_string(), time_zone: "UTC".into() },
        end: EventTime { date_time: stopped_at.to_string(), time_zone: "UTC".into() },
    };

    let resp = client
        .post(format!("https://www.googleapis.com/calendar/v3/calendars/{}/events", calendar_id))
        .bearer_auth(token)
        .json(&event)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    #[derive(Deserialize)]
    struct EventResponse { id: String }
    let body: EventResponse = resp.error_for_status().map_err(|e| e.to_string())?.json().await.map_err(|e| e.to_string())?;
    Ok(body.id)
}

pub async fn update_event(
    token: &str,
    event_id: &str,
    task: &str,
    client_name: &str,
    project_name: &str,
    started_at: &str,
    stopped_at: &str,
    calendar_id: &str,
) -> Result<(), String> {
    let client = reqwest::Client::new();

    #[derive(Serialize)]
    struct EventTime {
        #[serde(rename = "dateTime")]
        date_time: String,
        #[serde(rename = "timeZone")]
        time_zone: String,
    }
    #[derive(Serialize)]
    struct Event {
        summary: String,
        description: String,
        start: EventTime,
        end: EventTime,
    }

    let event = Event {
        summary: task.to_string(),
        description: format!("Client: {}\nProject: {}", client_name, project_name),
        start: EventTime { date_time: started_at.to_string(), time_zone: "UTC".into() },
        end: EventTime { date_time: stopped_at.to_string(), time_zone: "UTC".into() },
    };

    let resp = client
        .put(format!("https://www.googleapis.com/calendar/v3/calendars/{}/events/{}", calendar_id, event_id))
        .bearer_auth(token)
        .json(&event)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    resp.error_for_status().map_err(|e| e.to_string())?;
    Ok(())
}

pub async fn delete_event(token: &str, event_id: &str, calendar_id: &str) -> Result<(), String> {
    let client = reqwest::Client::new();
    let resp = client
        .delete(format!("https://www.googleapis.com/calendar/v3/calendars/{}/events/{}", calendar_id, event_id))
        .bearer_auth(token)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    resp.error_for_status().map_err(|e| e.to_string())?;
    Ok(())
}
