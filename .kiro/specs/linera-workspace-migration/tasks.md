# Implementation Plan

- [x] 1. Create workspace root configuration


  - Create root Cargo.toml with workspace definition
  - Define workspace members array with "abi" and "trade-ai"
  - Configure workspace.dependencies section with linera-sdk 0.15.6, serde, async-graphql, bcs, thiserror, serde_json
  - Add release profile with opt-level='z', lto=true, strip='debuginfo', debug=true
  - Set resolver = "2"
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 7.1, 7.2, 7.3, 7.4, 7.5_



- [ ] 2. Create Rust toolchain configuration
  - Create rust-toolchain.toml in workspace root
  - Specify Rust version 1.86.0
  - Add wasm32-unknown-unknown target
  - Include clippy, rustfmt, and rust-src components

  - Set profile to minimal


  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3. Create ABI package structure
- [ ] 3.1 Create abi package directory and Cargo.toml
  - Create abi/ directory


  - Create abi/Cargo.toml with package metadata
  - Configure dependencies using .workspace = true for linera-sdk, serde, async-graphql
  - Set crate-type to ["cdylib", "rlib"]
  - _Requirements: 2.4, 2.5_



- [ ] 3.2 Extract and move data structures to ABI package
  - Create abi/src/lib.rs
  - Move Signal, Strategy, Order, FormStrategy structs from current codebase
  - Add serde Serialize/Deserialize derives
  - Add async-graphql derives where needed
  - _Requirements: 2.1_



- [ ] 3.3 Extract and move enum definitions to ABI package
  - Move Operation enum with all variants (SubmitSignal, CreateStrategy, CreateOrder, UpdateOrderStatus, DeleteSignal, DeleteStrategy, DeleteOrder)
  - Move Event enum with all variants


  - Move Query enum with all variants (GetSignals, GetStrategies, GetOrders, GetSignal, GetStrategy, GetOrder)
  - Move QueryResponse enum with all variants
  - Move OrderStatus and StrategyType enums
  - _Requirements: 2.2_


- [ ] 3.4 Define application ABI traits
  - Create LineraTradeAbi struct


  - Implement ContractAbi trait with Operation and Event types
  - Implement ServiceAbi trait with Query and QueryResponse types
  - _Requirements: 2.3_

- [x] 3.5 Write property test for ABI type serialization

  - **Feature: linera-workspace-migration, Property 2: Type Reference Consistency**
  - **Validates: Requirements 2.1, 2.2, 2.5**
  - Generate random instances of Signal, Strategy, Order
  - Test that all types serialize and deserialize correctly
  - Verify type references compile in isolation

- [x] 4. Restructure main application package


- [ ] 4.1 Rename and configure trade-ai package
  - Rename linera-app directory to trade-ai (or create new structure)
  - Create trade-ai/Cargo.toml with package metadata
  - Add [[bin]] section for contract binary with name="trade_ai_contract" and path="src/contract.rs"


  - Add [[bin]] section for service binary with name="trade_ai_service" and path="src/service.rs"
  - _Requirements: 4.1, 4.2_

- [x] 4.2 Configure trade-ai dependencies


  - Add abi dependency with .workspace = true
  - Add linera-sdk dependency with .workspace = true

  - Add other required dependencies (serde, bcs, thiserror, serde_json) with .workspace = true
  - Add dev-dependencies for linera-sdk with test features
  - Add conditional dependencies for tokio and wasmer on non-WASM targets
  - _Requirements: 4.3, 4.4, 4.5_

- [x] 4.3 Update imports in contract module

  - Update contract.rs to import types from abi crate (use abi::{Operation, Event, Signal, Strategy, Order, etc.})
  - Update linera-sdk imports to use linera_sdk::views instead of linera-views
  - Add linera_sdk::contract! macro registration
  - _Requirements: 5.3, 5.4_


- [ ] 4.4 Update imports in service module
  - Update service.rs to import types from abi crate (use abi::{Query, QueryResponse, etc.})
  - Update linera-sdk imports to use linera_sdk::views
  - Add linera_sdk::service! macro registration
  - _Requirements: 5.3, 5.5_



- [ ] 4.5 Update state module
  - Update state.rs to import types from abi crate
  - Ensure LineraTradeState uses correct view types from linera_sdk::views




  - Verify all MapView and RegisterView declarations are correct
  - _Requirements: 5.3, 6.3_

- [ ] 4.6 Write property test for operation preservation
  - **Feature: linera-workspace-migration, Property 4: Operation Behavior Equivalence**

  - **Validates: Requirements 6.1**
  - Generate random Operation variants with valid parameters
  - Test that contract handles operations identically to original implementation
  - Verify state changes match expected behavior



- [ ] 4.7 Write property test for query preservation
  - **Feature: linera-workspace-migration, Property 5: Query Response Equivalence**
  - **Validates: Requirements 6.2**
  - Generate random Query variants
  - Test that service returns responses with same structure as original
  - Verify data retrieval works correctly




- [ ] 5. Verify compilation and build
- [ ] 5.1 Test workspace compilation
  - Run cargo check on workspace root
  - Verify all workspace members compile without errors


  - Fix any import or dependency resolution issues
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 5.2 Test WASM binary compilation


  - Run cargo build --release --target wasm32-unknown-unknown
  - Verify trade_ai_contract.wasm is produced
  - Verify trade_ai_service.wasm is produced
  - Check binary sizes are optimized


  - _Requirements: 4.1, 4.2, 7.1, 7.2, 7.3, 7.4_

- [ ] 5.3 Write property test for binary compilation
  - **Feature: linera-workspace-migration, Property 3: Binary Compilation**
  - **Validates: Requirements 4.1, 4.2**
  - Test that both contract and service binaries compile to valid WASM
  - Verify wasm32-unknown-unknown target works

- [ ] 5.4 Write property test for workspace dependency resolution
  - **Feature: linera-workspace-migration, Property 1: Workspace Member Resolution**
  - **Validates: Requirements 1.2, 1.3**
  - Generate random workspace member dependency declarations
  - Test that all workspace dependencies resolve to workspace root versions

- [ ] 6. Final verification and cleanup
- [ ] 6.1 Verify all functionality is preserved
  - Manually test that all operations work (SubmitSignal, CreateStrategy, CreateOrder, etc.)
  - Manually test that all queries work (GetSignals, GetStrategies, GetOrders, etc.)
  - Verify state structures are accessible and correct
  - Verify events are emitted correctly
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 6.2 Clean up old files
  - Remove old lib.rs if it exists in trade-ai package
  - Remove any orphaned files from migration
  - Verify directory structure matches microcard-cross-app pattern
  - _Requirements: 6.5_

- [ ] 6.3 Document migration completion
  - Verify rust-toolchain.toml is in correct location
  - Verify all Cargo.toml files are properly configured
  - Ensure README or documentation reflects new structure
  - _Requirements: 1.1, 3.1_

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
