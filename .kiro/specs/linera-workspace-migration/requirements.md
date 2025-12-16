# Requirements Document

## Introduction

This document outlines the requirements for migrating the current Linera application from a single-package structure to a workspace-based configuration that follows the microcard-cross-app pattern. The migration will improve code organization, enable better dependency management, and align with Linera best practices for multi-module applications.

## Glossary

- **Workspace**: A Cargo workspace that contains multiple related packages with shared dependencies
- **ABI Package**: A shared package containing application binary interface definitions, data structures, and common types
- **Contract Binary**: The WASM binary that executes on-chain operations
- **Service Binary**: The WASM binary that handles read-only queries
- **Linera SDK**: The software development kit for building Linera applications (version 0.15.6)
- **Root Workspace**: The top-level Cargo.toml that defines workspace members and shared dependencies

## Requirements

### Requirement 1

**User Story:** As a developer, I want to organize my Linera application into a workspace structure, so that I can manage multiple related packages with shared dependencies efficiently.

#### Acceptance Criteria

1. WHEN the workspace is created, THE Root Workspace SHALL define all member packages in the members array
2. WHEN dependencies are declared, THE Root Workspace SHALL specify shared dependencies in the workspace.dependencies section
3. WHEN a member package needs a dependency, THE member package SHALL reference workspace dependencies using .workspace = true syntax
4. THE Root Workspace SHALL use resolver = "2" for dependency resolution
5. THE Root Workspace SHALL include release profile optimizations for WASM binary size

### Requirement 2

**User Story:** As a developer, I want to extract common types and interfaces into a shared ABI package, so that both contract and service modules can use consistent data structures.

#### Acceptance Criteria

1. WHEN the ABI package is created, THE ABI package SHALL contain all shared data structures (Signal, Strategy, Order, etc.)
2. WHEN the ABI package is created, THE ABI package SHALL contain all enum definitions (Operation, Event, Query, QueryResponse, etc.)
3. WHEN the ABI package is created, THE ABI package SHALL define the application ABI traits (ContractAbi and ServiceAbi)
4. THE ABI package SHALL depend on linera-sdk, serde, and async-graphql from workspace dependencies
5. THE ABI package SHALL be referenced by other workspace members using abi.workspace = true

### Requirement 3

**User Story:** As a developer, I want to configure the Rust toolchain consistently, so that all developers and CI systems use the same compiler version and targets.

#### Acceptance Criteria

1. WHEN the toolchain file is created, THE toolchain file SHALL specify Rust version 1.86.0
2. THE toolchain file SHALL include the wasm32-unknown-unknown target for WASM compilation
3. THE toolchain file SHALL include clippy and rustfmt components for code quality
4. THE toolchain file SHALL include rust-src component for standard library source
5. THE toolchain file SHALL use minimal profile to reduce installation size

### Requirement 4

**User Story:** As a developer, I want to structure the main application package with separate contract and service binaries, so that I can build and deploy them independently.

#### Acceptance Criteria

1. WHEN the main package is configured, THE main package SHALL define a contract binary with path src/contract.rs
2. WHEN the main package is configured, THE main package SHALL define a service binary with path src/service.rs
3. THE main package SHALL depend on the ABI package for shared types
4. THE main package SHALL include dev-dependencies for testing with linera-sdk test features
5. THE main package SHALL conditionally include tokio and wasmer features for non-WASM targets

### Requirement 5

**User Story:** As a developer, I want to update the Linera SDK to version 0.15.6, so that I can use the latest features and bug fixes.

#### Acceptance Criteria

1. WHEN dependencies are updated, THE workspace SHALL specify linera-sdk version 0.15.6
2. WHEN the ABI is defined, THE application SHALL use ContractAbi and ServiceAbi traits from linera-sdk
3. WHEN views are used, THE application SHALL use linera-sdk::views instead of linera-views directly
4. THE contract module SHALL use linera_sdk::contract! macro for registration
5. THE service module SHALL use linera_sdk::service! macro for registration

### Requirement 6

**User Story:** As a developer, I want to maintain all existing functionality during migration, so that the application continues to work without behavioral changes.

#### Acceptance Criteria

1. WHEN the migration is complete, THE application SHALL support all existing operations (SubmitSignal, CreateStrategy, etc.)
2. WHEN the migration is complete, THE application SHALL support all existing queries (GetSignals, GetStrategies, etc.)
3. WHEN the migration is complete, THE application SHALL maintain all state structures (signals, strategies, orders)
4. WHEN the migration is complete, THE application SHALL emit all existing events
5. WHEN the migration is complete, THE application SHALL preserve all business logic without modification

### Requirement 7

**User Story:** As a developer, I want to configure WASM build optimizations, so that the compiled binaries are as small as possible for on-chain deployment.

#### Acceptance Criteria

1. WHEN the release profile is configured, THE release profile SHALL set opt-level to 'z' for maximum size optimization
2. WHEN the release profile is configured, THE release profile SHALL enable lto (link-time optimization)
3. WHEN the release profile is configured, THE release profile SHALL strip debuginfo to reduce binary size
4. WHEN the release profile is configured, THE release profile SHALL keep debug = true for better error messages
5. THE workspace SHALL apply these optimizations to all member packages
