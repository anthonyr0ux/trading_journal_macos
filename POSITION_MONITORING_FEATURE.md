# Real-Time Position Monitoring Feature

## Overview
This feature adds real-time position monitoring capabilities to the trading journal app, allowing traders to view their current open positions, unrealized PnL, and liquidation risk directly from the dashboard.

## Implementation Details

### Backend (Rust/Tauri)

#### New Files
- `src-tauri/src/commands/positions.rs` - Position monitoring command handlers

#### Modified Files
- `src-tauri/src/api/bitget/types.rs` - Added position-related data structures:
  - `BitgetPosition` - Position data from Bitget API
  - `AllPositionsData` - Wrapper for positions list
  - `AllPositionsRequest` - Request parameters for fetching positions

- `src-tauri/src/api/bitget/client.rs` - Added methods:
  - `fetch_all_positions()` - Fetches current positions from Bitget API
  - Uses endpoint: `/api/v2/mix/position/all-position`

- `src-tauri/src/commands/mod.rs` - Registered positions module
- `src-tauri/src/lib.rs` - Registered `fetch_current_positions` Tauri command

#### Data Structure
```rust
pub struct Position {
    pub position_id: String,
    pub symbol: String,
    pub exchange: String,
    pub position_side: String,        // LONG/SHORT
    pub entry_price: f64,
    pub current_price: f64,
    pub quantity: f64,
    pub leverage: i32,
    pub unrealized_pnl: f64,
    pub unrealized_pnl_percent: f64,
    pub liquidation_price: f64,
    pub margin: f64,
    pub margin_mode: String,          // crossed/isolated
    pub price_distance_to_liquidation_percent: f64,
    pub created_at: i64,
    pub updated_at: i64,
}
```

### Frontend (React/TypeScript)

#### New Files
- `src/components/PositionMonitor.tsx` - Main position monitoring component

#### Modified Files
- `src/lib/api.ts` - Added:
  - `Position` interface
  - `fetchCurrentPositions()` API method

- `src/pages/Dashboard.tsx` - Integrated PositionMonitor component

## Features

### Position Monitor Widget

The PositionMonitor component provides:

1. **API Credential Selection**
   - Dropdown to select active API credentials
   - Automatically selects first active credential

2. **Auto-Refresh Mechanism**
   - Configurable refresh intervals: 5s, 10s, 15s, 30s, or Off
   - Real-time updates of position data
   - Last update timestamp display

3. **Position Display**
   Each position card shows:
   - Symbol and exchange
   - Position side (LONG/SHORT) with visual indicators
   - Leverage and margin mode
   - Entry price and current market price
   - Position quantity and margin
   - Unrealized PnL (dollar amount and percentage)
   - Liquidation price
   - Distance to liquidation with color-coded warnings

4. **Liquidation Warnings**
   - Red badge: < 5% from liquidation (critical)
   - Orange badge: 5-10% from liquidation (warning)
   - Yellow badge: 10-20% from liquidation (caution)
   - Gray badge: > 20% from liquidation (safe)

5. **Summary Statistics**
   - Total number of open positions
   - Total unrealized PnL across all positions

6. **State Management**
   - Loading state with spinner
   - Error state with error message display
   - Empty state when no positions are open
   - No credentials state

## Usage

### Prerequisites
1. Add active API credentials in Settings
2. Ensure credentials have read permissions for positions

### Viewing Positions
1. Navigate to Dashboard
2. Select an API credential from dropdown
3. Click "Load Positions" or enable auto-refresh
4. Monitor positions in real-time

### Auto-Refresh
1. Click on desired refresh interval (5s, 10s, 15s, 30s)
2. Positions will automatically refresh at selected interval
3. Click "Off" to disable auto-refresh
4. Manual refresh available via refresh button

## API Integration

### Bitget API Endpoint
- **Endpoint**: `GET /api/v2/mix/position/all-position`
- **Authentication**: HMAC-SHA256 signature
- **Parameters**:
  - `productType`: "USDT-FUTURES" (default)
  - `marginCoin`: "USDT" (optional)

### Rate Limiting
- Respects existing rate limiter (10 requests/second)
- Auto-refresh intervals designed to stay within limits

## Security
- Uses existing credential storage (system keychain)
- No credentials exposed in frontend
- API keys/secrets retrieved securely from backend

## Error Handling
- Network errors displayed to user
- Invalid credentials shown with error message
- Rate limit errors handled gracefully
- Empty response handled as no positions

## Future Enhancements
- [ ] Add BloFin exchange support
- [ ] Position size recommendations
- [ ] Risk metrics (portfolio heat, drawdown risk)
- [ ] Notifications for liquidation proximity
- [ ] Historical position tracking
- [ ] Multi-credential simultaneous monitoring
- [ ] Export position snapshots
- [ ] Position performance analytics

## Testing Checklist
- [x] Backend compiles without errors
- [ ] Frontend compiles without errors
- [ ] API endpoint returns valid data
- [ ] Position card displays correctly
- [ ] Auto-refresh works as expected
- [ ] Liquidation warnings show correct colors
- [ ] Empty state displays properly
- [ ] Error states handled gracefully
- [ ] Credential selection works
- [ ] Summary calculations are accurate
- [ ] Manual refresh button works
- [ ] Loading states display correctly

## Known Limitations
1. Currently only supports Bitget exchange
2. Only supports USDT-FUTURES product type
3. Auto-refresh may impact API rate limits with very short intervals
4. No websocket support (uses polling)

## Performance Considerations
- Component uses React hooks efficiently
- Auto-refresh cleanup on unmount
- Loading states prevent duplicate API calls
- Minimal re-renders with proper state management
