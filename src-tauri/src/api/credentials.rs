use super::error::ApiError;
use super::secure_storage::SecureStorage;
use std::sync::{Mutex, OnceLock};
use std::path::PathBuf;

static STORAGE: OnceLock<Mutex<SecureStorage>> = OnceLock::new();

/// Initialize secure storage with app data directory
pub fn init_storage(app_data_dir: PathBuf) -> Result<(), ApiError> {
    let storage = SecureStorage::new(app_data_dir)?;
    STORAGE.set(Mutex::new(storage)).map_err(|_| {
        ApiError::EncryptionError("Storage already initialized".to_string())
    })?;
    println!("Secure credential storage initialized");
    Ok(())
}

/// Get the storage instance
fn get_storage() -> Result<std::sync::MutexGuard<'static, SecureStorage>, ApiError> {
    STORAGE
        .get()
        .ok_or_else(|| ApiError::EncryptionError("Storage not initialized".to_string()))?
        .lock()
        .map_err(|e| ApiError::EncryptionError(format!("Failed to lock storage: {}", e)))
}

/// Store an API key in secure storage
pub fn store_api_key(credential_id: &str, api_key: &str) -> Result<(), ApiError> {
    let key = format!("{}-api-key", credential_id);
    println!("Storing API key: {}", key);

    let storage = get_storage()?;
    storage.store(&key, api_key)?;

    // Verify it was stored
    match storage.retrieve(&key) {
        Ok(_) => {
            println!("✓ Verified API key stored successfully");
            Ok(())
        }
        Err(e) => {
            eprintln!("✗ WARNING: Stored but cannot retrieve immediately: {}", e);
            Err(e)
        }
    }
}

/// Retrieve an API key from secure storage
pub fn retrieve_api_key(credential_id: &str) -> Result<String, ApiError> {
    let key = format!("{}-api-key", credential_id);
    println!("Retrieving API key: {}", key);

    let storage = get_storage()?;
    storage.retrieve(&key).map_err(|e| {
        eprintln!("✗ Failed to retrieve API key for {}: {}", key, e);
        e
    })
}

/// Store an API secret in secure storage
pub fn store_api_secret(credential_id: &str, api_secret: &str) -> Result<(), ApiError> {
    let key = format!("{}-api-secret", credential_id);
    let storage = get_storage()?;
    storage.store(&key, api_secret)
}

/// Retrieve an API secret from secure storage
pub fn retrieve_api_secret(credential_id: &str) -> Result<String, ApiError> {
    let key = format!("{}-api-secret", credential_id);
    let storage = get_storage()?;
    storage.retrieve(&key)
}

/// Store an API passphrase in secure storage
pub fn store_passphrase(credential_id: &str, passphrase: &str) -> Result<(), ApiError> {
    let key = format!("{}-passphrase", credential_id);
    let storage = get_storage()?;
    storage.store(&key, passphrase)
}

/// Retrieve an API passphrase from secure storage
pub fn retrieve_passphrase(credential_id: &str) -> Result<String, ApiError> {
    let key = format!("{}-passphrase", credential_id);
    let storage = get_storage()?;
    storage.retrieve(&key)
}

/// Delete all credentials for a given credential_id
pub fn delete_credentials(credential_id: &str) -> Result<(), ApiError> {
    let storage = get_storage()?;
    storage.delete_all_with_prefix(credential_id)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    fn setup_test_storage() {
        let temp_dir = env::temp_dir().join("trading-journal-test-creds");
        let _ = init_storage(temp_dir);
    }

    #[test]
    fn test_store_retrieve_api_key() {
        setup_test_storage();
        let test_id = "test-credential-001";
        let test_key = "my-test-api-key-12345";

        store_api_key(test_id, test_key).unwrap();
        let retrieved = retrieve_api_key(test_id).unwrap();
        assert_eq!(retrieved, test_key);

        delete_credentials(test_id).unwrap();
    }

    #[test]
    fn test_store_retrieve_api_secret() {
        setup_test_storage();
        let test_id = "test-credential-002";
        let test_secret = "my-secret-value-xyz";

        store_api_secret(test_id, test_secret).unwrap();
        let retrieved = retrieve_api_secret(test_id).unwrap();
        assert_eq!(retrieved, test_secret);

        delete_credentials(test_id).unwrap();
    }

    #[test]
    fn test_delete_credentials() {
        setup_test_storage();
        let test_id = "test-credential-003";

        store_api_key(test_id, "key123").unwrap();
        store_api_secret(test_id, "secret456").unwrap();
        store_passphrase(test_id, "pass789").unwrap();

        delete_credentials(test_id).unwrap();

        assert!(retrieve_api_key(test_id).is_err());
        assert!(retrieve_api_secret(test_id).is_err());
        assert!(retrieve_passphrase(test_id).is_err());
    }
}
