use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use argon2::{Argon2, PasswordHasher};
use argon2::password_hash::{rand_core::RngCore, PasswordHash, SaltString};
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use super::error::ApiError;

const ENCRYPTION_VERSION: u8 = 1;

#[derive(Serialize, Deserialize, Clone)]
struct EncryptedCredential {
    nonce: String,      // Base64 encoded nonce
    ciphertext: String, // Base64 encoded encrypted data
}

#[derive(Serialize, Deserialize)]
struct CredentialStore {
    version: u8,
    salt: String,              // Base64 encoded salt for key derivation
    credentials: HashMap<String, EncryptedCredential>,
}

pub struct SecureStorage {
    store_path: PathBuf,
    master_key: Vec<u8>,
}

impl SecureStorage {
    /// Initialize secure storage with app data directory
    pub fn new(app_data_dir: PathBuf) -> Result<Self, ApiError> {
        let store_path = app_data_dir.join("credentials.enc");

        // Derive master key from machine-specific data
        let machine_id = Self::get_machine_id();
        let master_key = Self::derive_key(&machine_id)?;

        Ok(Self {
            store_path,
            master_key,
        })
    }

    /// Get a machine-specific identifier for key derivation
    fn get_machine_id() -> String {
        // Use a combination of machine-specific data
        // In production, this could include MAC address, hostname, etc.
        use std::env;

        let hostname = hostname::get()
            .ok()
            .and_then(|h| h.into_string().ok())
            .unwrap_or_else(|| "unknown-host".to_string());

        let username = env::var("USER")
            .or_else(|_| env::var("USERNAME"))
            .unwrap_or_else(|_| "unknown-user".to_string());

        format!("trading-journal-{}-{}", hostname, username)
    }

    /// Derive encryption key from machine ID
    fn derive_key(machine_id: &str) -> Result<Vec<u8>, ApiError> {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();

        let password_hash = argon2
            .hash_password(machine_id.as_bytes(), &salt)
            .map_err(|e| ApiError::EncryptionError(format!("Key derivation failed: {}", e)))?;

        // Extract the hash bytes (32 bytes for AES-256)
        let hash_bytes = password_hash.hash
            .ok_or_else(|| ApiError::EncryptionError("No hash generated".to_string()))?;

        Ok(hash_bytes.as_bytes()[..32].to_vec())
    }

    /// Load the credential store from disk
    fn load_store(&self) -> Result<CredentialStore, ApiError> {
        if !self.store_path.exists() {
            // Create new store with fresh salt
            let mut salt_bytes = vec![0u8; 16];
            OsRng.fill_bytes(&mut salt_bytes);

            return Ok(CredentialStore {
                version: ENCRYPTION_VERSION,
                salt: BASE64.encode(&salt_bytes),
                credentials: HashMap::new(),
            });
        }

        let data = fs::read(&self.store_path)
            .map_err(|e| ApiError::EncryptionError(format!("Failed to read store: {}", e)))?;

        serde_json::from_slice(&data)
            .map_err(|e| ApiError::EncryptionError(format!("Failed to parse store: {}", e)))
    }

    /// Save the credential store to disk
    fn save_store(&self, store: &CredentialStore) -> Result<(), ApiError> {
        let data = serde_json::to_vec_pretty(store)
            .map_err(|e| ApiError::EncryptionError(format!("Failed to serialize store: {}", e)))?;

        // Ensure parent directory exists
        if let Some(parent) = self.store_path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| ApiError::EncryptionError(format!("Failed to create directory: {}", e)))?;
        }

        fs::write(&self.store_path, data)
            .map_err(|e| ApiError::EncryptionError(format!("Failed to write store: {}", e)))
    }

    /// Encrypt and store a credential
    pub fn store(&self, key: &str, value: &str) -> Result<(), ApiError> {
        let cipher = Aes256Gcm::new_from_slice(&self.master_key)
            .map_err(|e| ApiError::EncryptionError(format!("Failed to create cipher: {}", e)))?;

        // Generate random nonce
        let mut nonce_bytes = [0u8; 12];
        OsRng.fill_bytes(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);

        // Encrypt the value
        let ciphertext = cipher
            .encrypt(nonce, value.as_bytes())
            .map_err(|e| ApiError::EncryptionError(format!("Encryption failed: {}", e)))?;

        // Store encrypted credential
        let mut store = self.load_store()?;
        store.credentials.insert(
            key.to_string(),
            EncryptedCredential {
                nonce: BASE64.encode(nonce_bytes),
                ciphertext: BASE64.encode(&ciphertext),
            },
        );

        self.save_store(&store)?;
        println!("✓ Credential '{}' stored and encrypted successfully", key);
        Ok(())
    }

    /// Retrieve and decrypt a credential
    pub fn retrieve(&self, key: &str) -> Result<String, ApiError> {
        let store = self.load_store()?;

        let encrypted = store.credentials.get(key)
            .ok_or_else(|| ApiError::EncryptionError(format!("Credential '{}' not found", key)))?;

        let cipher = Aes256Gcm::new_from_slice(&self.master_key)
            .map_err(|e| ApiError::EncryptionError(format!("Failed to create cipher: {}", e)))?;

        // Decode nonce and ciphertext
        let nonce_bytes = BASE64.decode(&encrypted.nonce)
            .map_err(|e| ApiError::EncryptionError(format!("Invalid nonce: {}", e)))?;
        let nonce = Nonce::from_slice(&nonce_bytes);

        let ciphertext = BASE64.decode(&encrypted.ciphertext)
            .map_err(|e| ApiError::EncryptionError(format!("Invalid ciphertext: {}", e)))?;

        // Decrypt
        let plaintext = cipher
            .decrypt(nonce, ciphertext.as_ref())
            .map_err(|e| ApiError::EncryptionError(format!("Decryption failed: {}", e)))?;

        String::from_utf8(plaintext)
            .map_err(|e| ApiError::EncryptionError(format!("Invalid UTF-8: {}", e)))
    }

    /// Delete a credential
    pub fn delete(&self, key: &str) -> Result<(), ApiError> {
        let mut store = self.load_store()?;
        store.credentials.remove(key);
        self.save_store(&store)?;
        Ok(())
    }

    /// Delete all credentials for a given prefix
    pub fn delete_all_with_prefix(&self, prefix: &str) -> Result<(), ApiError> {
        let mut store = self.load_store()?;
        store.credentials.retain(|k, _| !k.starts_with(prefix));
        self.save_store(&store)?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    fn get_test_storage() -> SecureStorage {
        let temp_dir = env::temp_dir().join("trading-journal-test");
        fs::create_dir_all(&temp_dir).unwrap();
        SecureStorage::new(temp_dir).unwrap()
    }

    #[test]
    fn test_store_retrieve() {
        let storage = get_test_storage();
        let key = "test-key-001";
        let value = "my-secret-value-123";

        storage.store(key, value).unwrap();
        let retrieved = storage.retrieve(key).unwrap();

        assert_eq!(retrieved, value);
        storage.delete(key).unwrap();
    }

    #[test]
    fn test_not_found() {
        let storage = get_test_storage();
        let result = storage.retrieve("nonexistent-key");

        assert!(result.is_err());
    }

    #[test]
    fn test_delete() {
        let storage = get_test_storage();
        let key = "test-key-002";

        storage.store(key, "value").unwrap();
        storage.delete(key).unwrap();

        assert!(storage.retrieve(key).is_err());
    }
}
