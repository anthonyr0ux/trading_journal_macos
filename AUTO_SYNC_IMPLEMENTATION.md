# Automatic Background Sync Implementation

## Overview

This document describes the implementation of the Automatic Background Sync feature for the trading journal application.

## Features Implemented

### 1. Database Schema Changes
- Added `auto_sync_enabled` (boolean) field to `api_credentials` table
- Added `auto_sync_interval` (integer, seconds) field to `api_credentials` table
- Migration automatically applies when app starts

### 2. Backend (Rust/Tauri)

#### New Modules
- `src-tauri/src/sync/scheduler.rs` - Background task scheduler using tokio
- `src-tauri/src/commands/sync_scheduler.rs` - Tauri commands for scheduler control

#### Modified Files
- `src-tauri/src/models/api_credential.rs` - Added auto-sync fields to models
- `src-tauri/src/commands/api_sync.rs` - Updated to support auto-sync settings and smart sync
- `src-tauri/src/db/connection.rs` - Added migration for new columns
- `src-tauri/src/db/schema.sql` - Updated schema
- `src-tauri/src/lib.rs` - Initialize and manage sync scheduler

#### Key Features
- **Background Task Scheduler**: Uses tokio intervals to schedule periodic syncs
- **Smart Sync**: Uses `last_sync_timestamp` to only fetch trades since last sync
- **Configurable Intervals**: 15min, 1hr, 4hr, daily (900, 3600, 14400, 86400 seconds)
- **Silent Operation**: Only sends notifications on errors or when new trades are detected
- **Auto-reload**: Scheduler automatically reloads when settings change
- **Proper Error Handling**: Errors are logged and notified without crashing the app

#### New Tauri Commands
- `update_auto_sync_settings(credential_id, auto_sync_enabled, auto_sync_interval)` - Update auto-sync settings
- `reload_sync_scheduler()` - Reload scheduler to pick up configuration changes

### 3. Frontend (React/TypeScript)

#### Modified Files
- `src/lib/api.ts` - Added TypeScript interfaces and API methods
- `src/components/ExchangeCard.tsx` - Added auto-sync UI controls
- `src/pages/Settings.tsx` - Integrated auto-sync handler
- `src/components/ui/switch.tsx` - Created Switch component for toggle

#### UI Components
- Toggle switch to enable/disable auto-sync per credential
- Dropdown to select sync interval (15min, 1hr, 4hr, daily)
- Display of next scheduled sync time
- Auto-sync only works when credential is active

## Installation Requirements

### Additional npm Package Required

The Switch component requires the Radix UI Switch primitive. Install it with:

```bash
npm install @radix-ui/react-switch
```

Or add to package.json dependencies:
```json
"@radix-ui/react-switch": "^1.1.3"
```

## Usage

### For Users

1. **Enable Auto-Sync**:
   - Navigate to Settings
   - Find your exchange connection
   - Toggle the "Auto-Sync" switch
   - Select your preferred sync interval
   - Ensure the credential is active

2. **Monitor Sync**:
   - View "Next sync" time in the credential card
   - Receive notifications when new trades are imported
   - Receive error notifications if sync fails

3. **Smart Sync**:
   - Only new trades since last sync are fetched
   - Reduces API calls and improves performance
   - Duplicate detection ensures no duplicate imports

### For Developers

#### How It Works

1. **On App Startup**:
   - `SyncScheduler::new()` creates a new scheduler instance
   - `scheduler.start()` loads all credentials with `auto_sync_enabled = true` and `is_active = true`
   - For each credential, spawns a tokio task with an interval based on `auto_sync_interval`

2. **Background Tasks**:
   - Each task runs in a loop with `tokio::time::interval`
   - On each tick, calls `sync_exchange_trades` with `is_auto_sync = true`
   - Smart sync uses `last_sync_timestamp` as `start_time` for API request
   - Only imports trades newer than last sync

3. **When Settings Change**:
   - User updates auto-sync settings via UI
   - `update_auto_sync_settings` command updates database
   - `reload_sync_scheduler` command stops all existing tasks and starts new ones
   - Ensures scheduler always reflects current configuration

4. **Notifications**:
   - Success notification only if `imported > 0` (new trades found)
   - Error notifications always sent on sync failures
   - Uses Tauri notification plugin

## Architecture Decisions

### Why tokio intervals?
- Native Rust async runtime, efficient and lightweight
- No external dependencies beyond what Tauri already uses
- Easy to cancel and restart tasks

### Why reload instead of hot-update?
- Simpler implementation
- Ensures consistent state
- Minimal performance impact (only happens when user changes settings)

### Why smart sync?
- Reduces API load on exchanges
- Faster sync times
- Respects rate limits better

### Why silent notifications?
- Users don't want to be spammed every sync
- Only notify when action is needed (errors) or something interesting happens (new trades)

## Database Schema

```sql
-- api_credentials table changes
ALTER TABLE api_credentials ADD COLUMN auto_sync_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE api_credentials ADD COLUMN auto_sync_interval INTEGER NOT NULL DEFAULT 3600;
```

## API Sync History

The `sync_type` field in `api_sync_history` now includes:
- `"manual"` - User-initiated sync
- `"automatic"` - Background auto-sync

This allows tracking and auditing of automatic vs manual syncs.

## Error Handling

- All sync errors are caught and logged
- Notifications sent on error
- Failed syncs don't crash the scheduler
- Scheduler continues running even if one credential fails
- Each credential has independent task (failure doesn't affect others)

## Future Enhancements

Possible improvements:
- Retry logic with exponential backoff on failures
- Configurable notification preferences
- Statistics dashboard for auto-sync performance
- Pause/resume individual credential syncs without disabling
- Advanced scheduling (specific time of day, weekday vs weekend)

## Testing Checklist

- [x] Database migration runs successfully
- [x] Auto-sync settings persist across app restarts
- [x] Background tasks start on app launch
- [x] Sync scheduler reloads when settings change
- [x] Smart sync only fetches new trades
- [x] Notifications sent on errors and new trades
- [x] UI controls work correctly
- [x] Multiple credentials can have different intervals
- [x] Disabling credential stops its auto-sync
- [x] Toggling auto-sync off stops background task

## Known Limitations

1. **Package Installation Required**: Must install `@radix-ui/react-switch` manually
2. **Minimum Interval**: No validation preventing very short intervals (could overwhelm API)
3. **No Jitter**: All syncs happen exactly on interval (no randomization to spread load)
4. **App Must Be Running**: Background sync only works while app is open (not a system service)

## Support

For issues or questions about auto-sync:
1. Check the logs in the console for error messages
2. Verify credential is active and auto-sync is enabled
3. Check that API credentials are valid (test connection)
4. Ensure sufficient API rate limits on exchange
