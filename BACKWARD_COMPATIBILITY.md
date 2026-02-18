# Backward Compatibility for Import/Export

## Overview

The Trading Journal app now supports importing data exports from **any previous version** since the import/export feature was first introduced (v1.0.0, January 2026).

## What Was Changed

### Problem
The `import_source` field was added to the Trade model in February 2026 (commit `abdef7e`). This field was required, which meant that exports created before this date would fail to import with the error:
```
missing field `import_source`
```

### Solution
Added a serde default attribute to the `import_source` field that automatically sets it to `"USER_CREATED"` when the field is missing from imported JSON data.

**File modified:** `src-tauri/src/models/trade.rs`

```rust
// Default value for backward compatibility
fn default_import_source() -> String {
    "USER_CREATED".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Trade {
    // ... other fields ...

    #[serde(default = "default_import_source")]
    pub import_source: String, // USER_CREATED | API_IMPORT | CSV_IMPORT

    // ... other fields ...
}
```

## Compatibility Matrix

| Export Version | Import Source Field | Status | Default Value |
|---------------|---------------------|--------|---------------|
| v1.0.0 - v1.1.0 (Jan-Feb 2026) | Missing | ✅ Works | `USER_CREATED` |
| v1.1.1+ (Feb 2026+) | Present | ✅ Works | Value from export |

## Other Fields

All other fields added after the initial implementation are already optional (`Option<T>`) and handle missing values gracefully:

- `planned_entries` - defaults to `None`
- `effective_entries` - defaults to `None`
- `execution_portfolio` - defaults to `None`
- `execution_r_percent` - defaults to `None`
- `execution_margin` - defaults to `None`
- `execution_position_size` - defaults to `None`
- `execution_quantity` - defaults to `None`
- `execution_one_r` - defaults to `None`
- `execution_potential_profit` - defaults to `None`

## Testing

Two unit tests verify backward compatibility:

1. **`test_backward_compatibility_import_source`** - Verifies old exports without `import_source` deserialize correctly with default value
2. **`test_new_export_with_import_source`** - Verifies new exports with `import_source` preserve the original value

Run tests with:
```bash
cargo test test_backward_compatibility
cargo test test_new_export_with_import_source
```

## For Users

### Importing Old Exports
Simply use the "Import Data" feature in Settings → Data Management. The app will automatically handle any missing fields from older versions.

### No Action Required
Users don't need to modify their old export files. The app handles compatibility automatically.

## For Developers

### Adding New Required Fields

When adding new **required** (non-Option) fields to the Trade struct in the future:

1. Add a default function:
   ```rust
   fn default_my_field() -> MyType {
       // return sensible default
   }
   ```

2. Add serde attribute:
   ```rust
   #[serde(default = "default_my_field")]
   pub my_field: MyType,
   ```

3. Add a test to verify backward compatibility

### Adding New Optional Fields

Optional fields (using `Option<T>`) automatically default to `None` when missing - no special handling needed.

## Version History

- **v1.1.2** (February 2026) - Added backward compatibility for `import_source` field
- **v1.1.1** (February 2026) - Added `import_source` field (breaking change - fixed in v1.1.2)
- **v1.0.0** (January 2026) - Initial implementation of import/export feature
