// src-tauri/src/oauth_callback.rs
// Starts a temporary HTTP listener on localhost to receive the OAuth redirect.
// Returns the `code` query parameter once received.

use tokio::net::TcpListener;
use tokio::io::{AsyncReadExt, AsyncWriteExt};

pub async fn wait_for_code(port: u16) -> Result<String, String> {
    let listener = TcpListener::bind(format!("127.0.0.1:{}", port))
        .await
        .map_err(|e| format!("Failed to bind port {}: {}", port, e))?;

    let (mut stream, _) = listener.accept().await.map_err(|e| e.to_string())?;
    let mut buf = vec![0u8; 4096];
    let n = stream.read(&mut buf).await.map_err(|e| e.to_string())?;
    let request = String::from_utf8_lossy(&buf[..n]);

    // Send 200 response so browser shows success
    let response = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n\
        <html><body><h2>Tick: authorization complete. You can close this tab.</h2></body></html>";
    stream.write_all(response.as_bytes()).await.ok();

    // Parse ?code=... from the GET request line
    let code = request
        .lines()
        .next()
        .and_then(|line| line.split_whitespace().nth(1))
        .and_then(|path| path.split('?').nth(1))
        .and_then(|query| {
            query.split('&').find(|p| p.starts_with("code="))
                .map(|p| p.trim_start_matches("code=").to_string())
        })
        .ok_or_else(|| "No code in callback".to_string())?;

    Ok(code)
}
