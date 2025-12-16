# Design Document: Linera Workspace Migration

## Overview

This design outlines the migration of the current single-package Linera application to a workspace-based structure following the microcard-cross-app pattern. The migration will reorganize the codebase into three main packages: an ABI package for shared types, and the main linera-trade-ai package containing contract and service implementations. This structure improves modularity, enables better dependency management, and aligns with Linera ecosystem best practices.

## Architecture

### Current Structure
```
linera-app/
├── Cargo.toml (single package)
└── src/
    ├── lib.rs
    ├── contract.rs
    ├── service.rs
    └── state.rs
```

### Target Structure
```
linera-app/
├── Cargo.toml (workspace root)
├── rust-toolchain.toml
├── abi/
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs (all types, ABI definitions)
└── trade-ai/
    ├── Cargo.toml
    └── src/
        ├── contract.rs (contract binary)
        ├── service.rs (service binary)
        └── state.rs (state management)
```

### Workspace Configuration

The workspace root will:
- Define all member packages (abi, trade-ai)
- Centralize dependency versions in `[workspace.dependencies]`
- Configure release profile optimizations for WASM
- Use Cargo resolver version 2

### Package Responsibilities

**ABI Package (`abi/`)**:
- Contains all shared data structures (Signal, Strategy, Order, etc.)
- Defines enums (Operation, Event, Query, QueryResponse, OrderStatus, StrategyType)
- Implements the application ABI (ContractAbi and ServiceAbi traits)
- Provides serialization/deserialization implementations
- No binary targets (library only)

**Trade-AI Package (`trade-ai/`)**:
- Implements contract logic (state mutations, operation handling)
- Implements service logic (query handling)
- Defines state management with linera-sdk views
- Produces two WASM binaries: contract and service
- Depends on the ABI package for types

## Components and Interfaces

### 1. Workspace Root (linera-app/Cargo.toml)

```toml
[workspace]
resolver = "2"
members = ["abi", "trade-ai"]

[workspace.dependencies]
linera-sdk = { version = "0.15.6" }
async-graphql = { version = "=7.0.17", default-features = false }
serde = { version = "1.0", features = ["derive"] }
serde_json = { version = "1.0" }
bcs = { version = "0.1" }
thiserror = { version = "1.0" }
abi = { path = "./abi" }

[profile.release]
debug = true
lto = true
opt-level = 'z'
strip = 'debuginfo'
```

### 2. ABI Package Interface

**Public Exports**:
- `LineraTradeAbi` - Main ABI struct implementing ContractAbi and ServiceAbi
- Data structures: `Signal`, `Strategy`, `Order`, `FormStrategy`
- Enums: `Operation`, `Event`, `Query`, `QueryResponse`, `OrderStatus`, `StrategyType`

**Dependencies**:
- linera-sdk (for ABI traits, base types)
- serde (for serialization)
- async-graphql (for GraphQL schema generation)

### 3. Trade-AI Package Interface

**Binary Targets**:
- `trade_ai_contract` - Contract execution binary
- `trade_ai_service` - Query service binary

**State Management**:
- `LineraTradeState` - RootView containing all application state
- Uses MapView for indexed collections (signals, strategies, orders)
- Uses RegisterView for counters

**Contract Operations**:
- Handles all Operation variants from ABI
- Emits Event variants defined in ABI
- Manages state persistence

**Service Queries**:
- Handles all Query variants from ABI
- Returns QueryResponse variants
- Provides read-only access to state

## Data Models

### Core Data Structures (in ABI package)

```rust
// Signal - Trading signal from influencer analysis
pub struct Signal {
    pub id: u64,
    pub influencer: String,
    pub token: String,
    pub contract: String,
    pub sentiment: String,
    pub confidence: f64,
    pub timestamp: u64,
    pub tweet_url: String,
    pub entry_price: Option<f64>,
    pub stop_loss: Option<f64>,
    pub take_profit: Option<f64>,
    pub position_size: Option<f64>,
    pub leverage: Option<u8>,
    pub platform: Option<String>,
}

// Strategy - User-defined trading strategy
pub struct Strategy {
    pub id: u64,
    pub owner: String,
    pub name: String,
    pub strategy_type: StrategyType,
    pub active: bool,
    pub created_at: u64,
}

// Order - Trading order execution record
pub struct Order {
    pub id: u64,
    pub strategy_id: u64,
    pub signal_id: u64,
    pub order_type: String,
    pub token: String,
    pub quantity: f64,
    pub status: OrderStatus,
    pub tx_hash: Option<String>,
    pub fill_price: Option<f64>,
    pub created_at: u64,
    pub filled_at: Option<u64>,
}
```

### State Structure (in trade-ai package)

```rust
#[derive(RootView)]
#[view(context = ViewStorageContext)]
pub struct LineraTradeState {
    pub signals: MapView<u64, Signal>,
    pub strategies: MapView<u64, Strategy>,
    pub orders: MapView<u64, Order>,
    pub signal_counter: RegisterView<u64>,
    pub strategy_counter: RegisterView<u64>,
    pub order_counter: RegisterView<u64>,
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Workspace member resolution
*For any* workspace member package that declares a workspace dependency, the dependency version SHALL resolve to the version specified in the workspace root's [workspace.dependencies] section.
**Validates: Requirements 1.2, 1.3**

### Property 2: ABI type consistency
*For any* data structure moved to the ABI package, all references to that type in the trade-ai package SHALL compile successfully when using the abi workspace dependency.
**Validates: Requirements 2.1, 2.2, 2.5**

### Property 3: Binary compilation
*For any* binary target (contract or service) defined in the trade-ai package, the Cargo build system SHALL produce a valid WASM binary when targeting wasm32-unknown-unknown.
**Validates: Requirements 4.1, 4.2**

### Property 4: Operation preservation
*For any* Operation variant that existed in the original codebase, the migrated contract SHALL handle that operation with identical business logic.
**Validates: Requirements 6.1**

### Property 5: Query preservation
*For any* Query variant that existed in the original codebase, the migrated service SHALL handle that query with identical response structure and data.
**Validates: Requirements 6.2**

### Property 6: State structure preservation
*For any* state field (signals, strategies, orders, counters) that existed in the original LineraTradeState, the migrated state SHALL maintain the same field name, type, and view implementation.
**Validates: Requirements 6.3**

### Property 7: Event emission preservation
*For any* Event variant that existed in the original codebase, the migrated contract SHALL emit that event at the same logical points in execution.
**Validates: Requirements 6.4**

### Property 8: WASM size optimization
*For any* release build of the contract or service binary, the compiled WASM file size SHALL be smaller than or equal to the size produced without the release profile optimizations.
**Validates: Requirements 7.1, 7.2, 7.3**

## Error Handling

### Migration Errors

1. **Dependency Resolution Failures**
   - Cause: Incorrect workspace dependency references
   - Handling: Verify all .workspace = true references have corresponding workspace.dependencies entries
   - Recovery: Add missing dependencies to workspace root

2. **Import Path Errors**
   - Cause: Moving types to ABI package breaks existing imports
   - Handling: Update all use statements to reference abi:: module
   - Recovery: Use compiler errors to identify all required import updates

3. **Binary Target Configuration Errors**
   - Cause: Incorrect [[bin]] sections in Cargo.toml
   - Handling: Ensure path points to correct source file and name follows convention
   - Recovery: Reference microcard-cross-app pattern for correct configuration

4. **WASM Compilation Failures**
   - Cause: Missing wasm32-unknown-unknown target or incompatible dependencies
   - Handling: Verify rust-toolchain.toml includes correct target
   - Recovery: Run `rustup target add wasm32-unknown-unknown`

### Runtime Preservation

All existing error handling in contract and service implementations will be preserved without modification. The migration only affects code organization, not runtime behavior.

## Testing Strategy

### Unit Testing

Unit tests will verify specific aspects of the migration:

1. **Workspace Configuration Test**
   - Verify Cargo.toml parses correctly
   - Verify all members are recognized
   - Verify workspace dependencies resolve

2. **ABI Package Test**
   - Verify all types are publicly exported
   - Verify serialization/deserialization works
   - Verify ABI trait implementations compile

3. **Binary Target Test**
   - Verify contract binary compiles to WASM
   - Verify service binary compiles to WASM
   - Verify binary names match expected pattern

4. **Import Resolution Test**
   - Verify all abi:: imports resolve correctly
   - Verify no broken references remain
   - Verify linera-sdk imports use correct paths

### Property-Based Testing

Property-based tests will verify universal correctness properties:

**Testing Framework**: We will use `quickcheck` for Rust property-based testing, as it integrates well with Cargo and supports custom generators for complex types.

**Test Configuration**: Each property test will run a minimum of 100 iterations to ensure adequate coverage of the input space.

**Property Test Tagging**: Each property-based test will include a comment with the format:
```rust
// Feature: linera-workspace-migration, Property N: <property description>
```

1. **Property Test 1: Workspace Dependency Resolution**
   - Generate: Random workspace member names and dependency declarations
   - Test: All workspace dependencies resolve to workspace root versions
   - Validates: Property 1

2. **Property Test 2: Type Reference Consistency**
   - Generate: Random combinations of ABI types used in trade-ai package
   - Test: All type references compile and resolve correctly
   - Validates: Property 2

3. **Property Test 3: Operation Behavior Equivalence**
   - Generate: Random Operation variants with valid parameters
   - Test: Migrated contract produces same state changes as original
   - Validates: Property 4

4. **Property Test 4: Query Response Equivalence**
   - Generate: Random Query variants with various parameters
   - Test: Migrated service returns same responses as original
   - Validates: Property 5

5. **Property Test 5: State Field Accessibility**
   - Generate: Random state access patterns
   - Test: All original state fields remain accessible with same types
   - Validates: Property 6

### Integration Testing

Integration tests will verify the complete system works after migration:

1. **End-to-End Operation Test**
   - Submit signals, create strategies, create orders
   - Verify all operations execute successfully
   - Verify state updates correctly

2. **End-to-End Query Test**
   - Execute all query variants
   - Verify responses match expected structure
   - Verify data retrieval works correctly

3. **Build System Test**
   - Run `cargo build --release --target wasm32-unknown-unknown`
   - Verify both binaries are produced
   - Verify binary sizes are optimized

### Compilation Testing

Since this is primarily a structural migration, compilation success is a strong indicator of correctness:

1. **Incremental Compilation Test**
   - Build workspace root
   - Build ABI package independently
   - Build trade-ai package independently
   - Verify all builds succeed

2. **Dependency Graph Test**
   - Verify no circular dependencies
   - Verify dependency order is correct
   - Verify all transitive dependencies resolve

### Manual Verification

After migration, manually verify:

1. All source files are in correct locations
2. No orphaned files remain
3. Directory structure matches microcard-cross-app pattern
4. rust-toolchain.toml is in workspace root
5. Release profile optimizations are configured

## Implementation Notes

### Migration Sequence

The migration should follow this sequence to minimize breakage:

1. Create workspace root Cargo.toml
2. Create rust-toolchain.toml
3. Create abi/ package structure
4. Move types from state.rs to abi/src/lib.rs
5. Move ABI definition from lib.rs to abi/src/lib.rs
6. Rename linera-app/ to trade-ai/
7. Update trade-ai/Cargo.toml with binary targets
8. Update all imports in trade-ai to use abi::
9. Remove old lib.rs from trade-ai
10. Test compilation at each step

### Backward Compatibility

This migration maintains 100% backward compatibility at the application level:
- All operations work identically
- All queries return same data
- All state structures unchanged
- All events emitted at same points

The only changes are organizational (file structure, package boundaries).

### Future Extensibility

The workspace structure enables future enhancements:
- Additional packages for new features (e.g., analytics, governance)
- Shared utility packages
- Multiple application packages sharing the same ABI
- Easier testing with mock implementations
