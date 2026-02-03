use rusqlite::{Connection, Result};
use std::sync::Mutex;

pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    pub fn new(db_path: &str) -> Result<Self> {
        let conn = Connection::open(db_path)?;

        // Enable foreign keys
        conn.execute("PRAGMA foreign_keys = ON", [])?;

        // Enable WAL mode for better concurrency (PRAGMA returns results, so we use pragma_update)
        conn.pragma_update(None, "journal_mode", "WAL")?;

        // Execute schema
        let schema = include_str!("schema.sql");
        conn.execute_batch(schema)?;

        // Run migrations
        Self::run_migrations(&conn)?;

        Ok(Database {
            conn: Mutex::new(conn),
        })
    }

    fn run_migrations(conn: &Connection) -> Result<()> {
        // Migration: Add planned_entries and effective_entries columns
        // Check if columns exist first
        let has_planned_entries: bool = conn
            .prepare("SELECT COUNT(*) FROM pragma_table_info('trades') WHERE name='planned_entries'")?
            .query_row([], |row| row.get::<_, i32>(0))
            .map(|count| count > 0)?;

        if !has_planned_entries {
            conn.execute("ALTER TABLE trades ADD COLUMN planned_entries TEXT", [])?;
            conn.execute("ALTER TABLE trades ADD COLUMN effective_entries TEXT", [])?;
            println!("Migration: Added planned_entries and effective_entries columns");
        }

        // Migration: Add import_source column
        let has_import_source: bool = conn
            .prepare("SELECT COUNT(*) FROM pragma_table_info('trades') WHERE name='import_source'")?
            .query_row([], |row| row.get::<_, i32>(0))
            .map(|count| count > 0)?;

        if !has_import_source {
            conn.execute("ALTER TABLE trades ADD COLUMN import_source TEXT NOT NULL DEFAULT 'USER_CREATED'", [])?;
            println!("Migration: Added import_source column");
        }

        // Migration: Add auto_sync_enabled and auto_sync_interval columns
        let has_auto_sync_enabled: bool = conn
            .prepare("SELECT COUNT(*) FROM pragma_table_info('api_credentials') WHERE name='auto_sync_enabled'")?
            .query_row([], |row| row.get::<_, i32>(0))
            .map(|count| count > 0)?;

        if !has_auto_sync_enabled {
            conn.execute("ALTER TABLE api_credentials ADD COLUMN auto_sync_enabled INTEGER NOT NULL DEFAULT 0", [])?;
            conn.execute("ALTER TABLE api_credentials ADD COLUMN auto_sync_interval INTEGER NOT NULL DEFAULT 3600", [])?;
            println!("Migration: Added auto_sync_enabled and auto_sync_interval columns");
        }

        // Migration: Add live_mirror_enabled column
        let has_live_mirror_enabled: bool = conn
            .prepare("SELECT COUNT(*) FROM pragma_table_info('api_credentials') WHERE name='live_mirror_enabled'")?
            .query_row([], |row| row.get::<_, i32>(0))
            .map(|count| count > 0)?;

        if !has_live_mirror_enabled {
            conn.execute("ALTER TABLE api_credentials ADD COLUMN live_mirror_enabled INTEGER NOT NULL DEFAULT 0", [])?;
            println!("Migration: Added live_mirror_enabled column");
        }

        Ok(())
    }
}
