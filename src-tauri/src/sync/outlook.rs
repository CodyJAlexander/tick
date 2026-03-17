use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OutlookToken {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_at: i64,
}

pub fn get_auth_url(client_id: &str, redirect_uri: &str, tenant: &str) -> String {
    format!(
        "https://login.microsoftonline.com/{}/oauth2/v2.0/authorize?client_id={}&redirect_uri={}&response_type=code&scope=https://graph.microsoft.com/Calendars.ReadWrite offline_access",
        tenant, client_id, redirect_uri
    )
}

pub async fn exchange_code(
    client_id: &str,
    client_secret: &str,
    code: &str,
    redirect_uri: &str,
    tenant: &str,
) -> Result<OutlookToken, String> {
    let client = reqwest::Client::new();
    let resp = client
        .post(format!("https://login.microsoftonline.com/{}/oauth2/v2.0/token", tenant))
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
    struct TokenResponse { access_token: String, refresh_token: Option<String>, expires_in: i64 }
    let body: TokenResponse = resp.json().await.map_err(|e| e.to_string())?;
    let expires_at = chrono::Utc::now().timestamp() + body.expires_in;
    Ok(OutlookToken {
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
) -> Result<String, String> {
    let client = reqwest::Client::new();
    #[derive(Serialize)]
    struct DateTime {
        #[serde(rename = "dateTime")]
        date_time: String,
        #[serde(rename = "timeZone")]
        time_zone: String,
    }
    #[derive(Serialize)]
    struct Body {
        #[serde(rename = "contentType")]
        content_type: String,
        content: String,
    }
    #[derive(Serialize)]
    struct Event { subject: String, body: Body, start: DateTime, end: DateTime }
    let event = Event {
        subject: task.to_string(),
        body: Body {
            content_type: "Text".into(),
            content: format!("Client: {}\nProject: {}", client_name, project_name),
        },
        start: DateTime { date_time: started_at.to_string(), time_zone: "UTC".into() },
        end: DateTime { date_time: stopped_at.to_string(), time_zone: "UTC".into() },
    };
    let resp = client
        .post("https://graph.microsoft.com/v1.0/me/events")
        .bearer_auth(token)
        .json(&event)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    #[derive(Deserialize)]
    struct EventResponse { id: String }
    let body: EventResponse = resp.json().await.map_err(|e| e.to_string())?;
    Ok(body.id)
}

pub async fn delete_event(token: &str, event_id: &str) -> Result<(), String> {
    let client = reqwest::Client::new();
    client
        .delete(format!("https://graph.microsoft.com/v1.0/me/events/{}", event_id))
        .bearer_auth(token)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}
