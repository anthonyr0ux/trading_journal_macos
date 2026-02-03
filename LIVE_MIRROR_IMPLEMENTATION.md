# Live Trade Mirroring Implementation

## Overview
This implementation adds real-time WebSocket-based live trade mirroring for the trading journal app, specifically for Bitget exchange. The feature automatically creates, updates, and closes journal entries based on live position changes.

## Components Implemented

### Backend (Rust)

#### 1. WebSocket Client (`src-tauri/src/api/bitget/websocket.rs`)
- Connects to Bitget WebSocket API (`wss://ws.bitget.com/v2/ws/private`)
- Implements authentication using HMAC-SHA256 signatures
- Subscribes to position updates channel
- Implements ping/pong heartbeat mechanism (30-second interval)
- Detects position events: Opened, Updated, Closed

#### 2. Live Mirror Manager (`src-tauri/src/api/live_mirror.rs`)
- Manages active WebSocket connections per credential
- Tracks open positions and their corresponding journal trades
- Handles position events:
  - **Position Opened**: Creates new journal trade with `LIVE_MIRROR` import source
  - **Position Updated**: Updates existing trade with current PnL
  - **Position Closed**: Finalizes trade with exit price, final PnL, and status (WIN/LOSS/BE)
- Emits Tauri events to frontend for UI updates

#### 3. Commands (`src-tauri/src/commands/live_mirror.rs`)
- `start_live_mirroring`: Starts WebSocket connection for a credential
- `stop_live_mirroring`: Stops active WebSocket connection
- `is_live_mirroring_active`: Checks if mirroring is active
- `toggle_live_mirroring`: Enables/disables live mirroring setting
- `get_live_mirroring_status`: Gets status for all credentials

#### 4. Database Changes
- Added `live_mirror_enabled` column to `api_credentials` table
- Added `LIVE_MIRROR` as valid import source for trades
- Migration applied automatically on app start

### Frontend (TypeScript/React)

#### 1. API Types (`src/lib/api.ts`)
- Added `LiveMirrorStatus` interface
- Added live mirroring API functions
- Extended `ApiCredentialSafe` with `live_mirror_enabled` field
- Extended `Trade.import_source` to include `LIVE_MIRROR`

#### 2. Tauri Events
Frontend can listen to these events:
- `live-mirror-started`: When mirroring starts
- `live-mirror-disconnected`: When WebSocket disconnects
- `live-mirror-error`: On error processing positions
- `live-trade-opened`: When new position is opened
- `live-trade-updated`: When position is updated
- `live-trade-closed`: When position is closed

## How It Works

### 1. Connection Flow
```
User enables live mirroring → Start WebSocket client → Authenticate → Subscribe to positions → Monitor events
```

### 2. Position Lifecycle

**Opening a Position:**
1. WebSocket receives position data with non-zero size
2. Creates journal trade with:
   - Entry price from position average open price
   - Quantity and leverage from position data
   - Estimated stop-loss based on 1R calculation
   - Status: OPEN
   - Import source: LIVE_MIRROR

**Position Updates:**
1. WebSocket receives updated position data
2. Updates journal trade with current unrealized PnL
3. Emits update event to frontend

**Closing a Position:**
1. WebSocket receives position with zero size or close event
2. Updates journal trade with:
   - Exit price from market price
   - Final realized PnL
   - Status: WIN/LOSS/BE (based on PnL)
   - Close timestamp
3. Removes position from tracking
4. Emits close event to frontend

### 3. Trade Data Mapping

Position fields → Trade fields:
- `average_open_price` → `planned_pe`, `effective_pe`
- `total` → `quantity`
- `leverage` → `leverage`
- `margin_size` → `margin`
- `hold_side` (long/short) → `position_type`
- `unrealized_pl` → `total_pnl` (while open)
- `achieved_profits` → `total_pnl` (when closed)
- `market_price` → exit price (when closed)

## Dependencies Added

```toml
tokio-tungstenite = { version = "0.24", features = ["native-tls"] }
```

## Usage

### Enable Live Mirroring
1. Navigate to Settings
2. Add/configure Bitget API credentials
3. Toggle "Live Mirror" switch for the credential
4. System will automatically connect and start monitoring

### Monitor Live Trades
- Trades are created automatically with `LIVE_MIRROR` source
- UI shows live indicator for mirrored trades
- Real-time PnL updates while position is open
- Automatic finalization when position closes

## Security Considerations

- API credentials stored in system keychain (existing pattern)
- WebSocket authentication uses temporary signatures
- No credentials sent to frontend
- All connections require valid API permissions

## Error Handling

- Automatic reconnection on WebSocket disconnect
- Errors emitted as Tauri events for UI feedback
- Position tracking persists across reconnections
- Failed trade creation/update logged but doesn't crash connection

## Future Enhancements

1. Support for multiple exchanges (Blofin, etc.)
2. TP/SL detection from order data
3. Partial position close tracking
4. Reconnection with exponential backoff
5. UI controls for manual sync/disconnect
6. Position size alerts and notifications
7. Historical position replay on startup

## Testing Recommendations

1. Test with small real positions first
2. Verify trade creation on position open
3. Check PnL updates during position lifecycle
4. Confirm proper closure with correct status
5. Test WebSocket reconnection scenarios
6. Verify deduplication works (fingerprint-based)

## Technical Notes

- WebSocket runs in background Tokio task
- Each credential has its own connection
- Position tracking uses HashMap with position ID as key
- Fingerprint format: `live|bitget|{pos_id}|{inst_id}|{timestamp}`
- Database operations use WAL mode for concurrency
