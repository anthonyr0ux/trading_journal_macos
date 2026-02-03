use tauri::State;
use crate::sync::SyncScheduler;

/// Reload sync scheduler tasks
#[tauri::command]
pub async fn reload_sync_scheduler(
    scheduler: State<'_, SyncScheduler>,
) -> Result<(), String> {
    println!("Reloading sync scheduler from command...");
    scheduler.reload_tasks().await?;
    Ok(())
}
