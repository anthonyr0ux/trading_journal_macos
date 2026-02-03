use tauri::State;
use serde::{Deserialize, Serialize};
use crate::db::Database;
use crate::api::{
    bitget::{BitgetClient, types::{PendingOrdersRequest, BitgetPendingOrder}},
    credentials::{retrieve_api_key, retrieve_api_secret, retrieve_passphrase},
};

/// Frontend-friendly open order representation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenOrder {
    pub order_id: String,
    pub symbol: String,
    pub side: String,
    pub order_type: String,
    pub price: String,
    pub size: String,
    pub filled_size: String,
    pub status: String,
    pub pos_side: Option<String>,
    pub trade_side: Option<String>,
    pub leverage: Option<String>,
    pub created_at: i64,
    pub updated_at: Option<i64>,
}

/// Request for fetching open orders
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FetchOpenOrdersRequest {
    pub credential_id: String,
    pub symbol: Option<String>,
}

impl From<BitgetPendingOrder> for OpenOrder {
    fn from(order: BitgetPendingOrder) -> Self {
        let created_at = order.c_time.parse::<i64>().unwrap_or(0);
        let updated_at = order.u_time.as_ref().and_then(|t| t.parse::<i64>().ok());
        let filled_size = order.base_volume.unwrap_or_else(|| "0".to_string());

        OpenOrder {
            order_id: order.order_id,
            symbol: order.symbol,
            side: order.side,
            order_type: order.order_type,
            price: order.price,
            size: order.size,
            filled_size,
            status: order.status,
            pos_side: order.pos_side,
            trade_side: order.trade_side,
            leverage: order.leverage,
            created_at,
            updated_at,
        }
    }
}

/// Fetch open/pending orders from exchange
#[tauri::command]
pub async fn fetch_open_orders(
    db: State<'_, Database>,
    request: FetchOpenOrdersRequest,
) -> Result<Vec<OpenOrder>, String> {
    // Fetch and decrypt credentials
    let (exchange, api_key, api_secret, passphrase) = {
        let conn = db.conn.lock().map_err(|e| e.to_string())?;

        // Get credential
        let exchange: String = conn
            .query_row(
                "SELECT exchange FROM api_credentials WHERE id = ?",
                [&request.credential_id],
                |row| row.get(0),
            )
            .map_err(|e| format!("Credential not found: {}", e))?;

        // Retrieve credentials from system keychain
        let api_key = retrieve_api_key(&request.credential_id).map_err(|e| e.to_string())?;
        let api_secret = retrieve_api_secret(&request.credential_id).map_err(|e| e.to_string())?;
        let passphrase = retrieve_passphrase(&request.credential_id).unwrap_or_default();

        (exchange, api_key, api_secret, passphrase)
    };

    // Currently only Bitget is supported
    if exchange != "bitget" {
        return Err(format!("Exchange '{}' not supported for open orders", exchange));
    }

    // Create Bitget client
    let client = BitgetClient::new(api_key, api_secret, passphrase);

    // Fetch pending orders
    let pending_orders_request = PendingOrdersRequest {
        product_type: "USDT-FUTURES".to_string(),
        symbol: request.symbol,
        order_id: None,
    };

    let pending_data = client.fetch_pending_orders(&pending_orders_request)
        .await
        .map_err(|e| e.to_string())?;

    // Convert to frontend-friendly format
    let orders: Vec<OpenOrder> = pending_data
        .entrusted_list
        .unwrap_or_default()
        .into_iter()
        .map(OpenOrder::from)
        .collect();

    Ok(orders)
}
