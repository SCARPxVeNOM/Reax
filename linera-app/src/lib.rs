mod state;
mod contract;
mod service;

pub use state::*;
pub use contract::*;
pub use service::*;

use linera_sdk::abi::{ContractAbi, ServiceAbi};
pub use linera_sdk::{ContractRuntime, ServiceRuntime};

// Define the ABI - No explicit impl needed, derived from ContractAbi + ServiceAbi
pub struct LineraTradeAbi;

impl ContractAbi for LineraTradeAbi {
    type Operation = state::Operation;
    type Response = u64;
}

impl ServiceAbi for LineraTradeAbi {
    type Query = service::Query;
    type QueryResponse = service::QueryResponse;
}