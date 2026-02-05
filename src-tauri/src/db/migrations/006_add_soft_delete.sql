-- Add soft delete support to trades table
ALTER TABLE trades ADD COLUMN deleted_at INTEGER;

-- Create index for efficient querying of non-deleted trades
CREATE INDEX IF NOT EXISTS idx_trades_deleted_at ON trades(deleted_at);
