use tauri::State;
use crate::db::Database;

#[tauri::command]
pub async fn get_all_trades_including_deleted(
    db: State<'_, Database>,
) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    // Get total count
    let total: i64 = conn
        .query_row("SELECT COUNT(*) FROM trades", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    // Get count of deleted
    let deleted: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM trades WHERE deleted_at IS NOT NULL",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    // Get count of non-deleted
    let active: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM trades WHERE deleted_at IS NULL",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    Ok(serde_json::json!({
        "total": total,
        "deleted": deleted,
        "active": active
    }))
}

#[tauri::command]
pub async fn restore_all_trades(
    db: State<'_, Database>,
) -> Result<i64, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let count = conn
        .execute("UPDATE trades SET deleted_at = NULL WHERE deleted_at IS NOT NULL", [])
        .map_err(|e| e.to_string())?;

    Ok(count as i64)
}
