# Linera Conway Testnet Connection Guide

This document explains how the linCasino project connects to the Linera Conway Testnet.

---

## Overview

The linCasino project connects to the **Linera Conway Testnet** using the faucet service at:

```
https://faucet.testnet-conway.linera.net/
```

The connection is established through the `run.bash` script, which uses the `linera` CLI to interact with the testnet.

---

## Connection Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Your Machine                                   │
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                      │
│  │  Wallet 1   │    │  Wallet 2   │    │  Wallet 3   │                      │
│  │  wallet_1   │    │  wallet_2   │    │  wallet_3   │                      │
│  │  keystore_1 │    │  keystore_2 │    │  keystore_3 │                      │
│  │  client_1.db│    │  client_2.db│    │  client_3.db│                      │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                      │
│         │                  │                  │                             │
│         └──────────────────┼──────────────────┘                             │
│                            │                                                │
│                            ▼                                                │
│                    linera CLI Tool                                          │
└────────────────────────────┬────────────────────────────────────────────────┘
                             │
                             │ HTTPS / gRPC
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Linera Conway Testnet                               │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Faucet Service (HTTPS)                           │    │
│  │            https://faucet.testnet-conway.linera.net/                │    │
│  │                                                                     │    │
│  │  • Provides network configuration                                   │    │
│  │  • Returns validator list                                           │    │
│  │  • Creates new chains with test tokens                              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      Validators (gRPC/TLS)                          │    │
│  │                                                                     │    │
│  │  • conway1.linera.blockhunters.services:443                         │    │
│  │  • linera.everstake.one:443                                         │    │
│  │  • conway-testnet.dzdaic.com:443                                    │    │
│  │  • linera-testnet.rubynodes.io:443                                  │    │
│  │  • validator-3.testnet-conway.linera.net:443                        │    │
│  │  • validator-4.testnet-conway.linera.net:443                        │    │
│  │  • tn.linera.stakingcabin.com:443                                   │    │
│  │  • linera.blockscope.net:443                                        │    │
│  │  • linera.banansen.dev:443                                          │    │
│  │  • tnlinera.azurenode.xyz:443                                       │    │
│  │  • linera-conway.tecnodes.network:443                               │    │
│  │  • linera-testnet.brightlystake.com:443                             │    │
│  │  • linera-testnet.talentum.id:443                                   │    │
│  │  • linera-testnet.stakefi.network:443                               │    │
│  │  • linera-testnet.senseinode.com:443                                │    │
│  │  • linera-test.artifact.systems:443                                 │    │
│  │  ... and more                                                       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Connection Flow When Running `./run.bash`

### Phase 1: Wallet Initialization

**Command executed:**
```bash
linera --with-wallet "1" wallet init --faucet "https://faucet.testnet-conway.linera.net/"
```

**What happens:**

| Step | Action | Protocol | Details |
|------|--------|----------|---------|
| 1 | HTTP GET to faucet | HTTPS | Fetches network configuration |
| 2 | Parse response | - | Extracts validator endpoints, genesis config |
| 3 | Create wallet files | Local | Creates `wallet_1.json`, `keystore_1.json` |
| 4 | Initialize storage | Local | Creates `client_1.db` (RocksDB) |

**Files created in `/tmp/linera_testnet/`:**
- `wallet_1.json` - Chain configurations and metadata
- `keystore_1.json` - Private keys for chain owners
- `client_1.db/` - RocksDB database for blockchain state

---

### Phase 2: Chain Creation from Faucet

**Command executed:**
```bash
linera --with-wallet "1" wallet request-chain --faucet "https://faucet.testnet-conway.linera.net/"
```

**What happens:**

| Step | Action | Protocol | Details |
|------|--------|----------|---------|
| 1 | Generate keypair | Local | Creates new owner address |
| 2 | POST to faucet | HTTPS | Sends public key/owner address |
| 3 | Faucet creates chain | Testnet | New chain with 100 test tokens |
| 4 | Receive chain ID | HTTPS | Returns chain ID to CLI |
| 5 | Update wallet | Local | Adds chain to `wallet_1.json` |

**Each chain receives:** 100 test LINERA tokens

---

### Phase 3: Validator Communication

After initialization, all blockchain operations communicate directly with validators via gRPC:

**Operations that use validators:**
- `linera sync` - Synchronizes chain state
- `linera query-balance` - Queries account balance
- `linera project publish-and-create` - Deploys applications
- GraphQL mutations via `linera service`

**Protocol:** gRPC over TLS (port 443)

---

## Code References

### `run.bash` - Main Connection Points

| Line | Code | Purpose |
|------|------|---------|
| 34 | `FAUCET_URL=https://faucet.testnet-conway.linera.net/` | Defines faucet URL |
| 43 | `echo "Connecting to Testnet Conway at $FAUCET_URL"` | Logs connection |
| 83 | `linera --with-wallet "$1" wallet init --faucet "$FAUCET_URL"` | Initializes wallet |
| 101 | `linera --with-wallet "$1" wallet request-chain --faucet "$FAUCET_URL"` | Requests new chain |

### `croissant/web/src/wallet/index.ts` - Browser Wallet (Alternative)

```typescript
// Line 296-298
const FAUCET_URL = 'http://localhost:8079'
// const FAUCET_URL = 'https://faucet.testnet-conway.linera.net/'
const faucet = new wasm.Faucet(FAUCET_URL)
```

> **Note:** The browser wallet currently uses localhost. Uncomment line 297 to use testnet directly.

---

## Network Information

### Faucet Response Data

When connecting to the faucet, it returns:

```
--- Faucet info ---
Linera protocol: v0.15.8
RPC API hash: dYdv0oSjieFam5sNCUoabG3O2HkATGwTHFKiudkk94o
GraphQL API hash: PqsJuSIZyklncFPclsD7ref579YUS9BJ2MkDSHXpHGg
WIT API hash: jlOYlK/Zygg52sb+phlX2IxekCfFTqlfjfE/ZUKDUq4
Source code: https://github.com/linera-io/linera-protocol/tree/9d40fc5edf43e8ae86db6f4a2b918cd32327a16d
```

### Version Compatibility

| Component | Required Version |
|-----------|------------------|
| Linera Protocol | v0.15.8 |
| linera-service | 0.15.8 |
| linera-storage-service | 0.15.8 |

**Install compatible CLI:**
```bash
cargo install --locked linera-service@0.15.8
cargo install --locked linera-storage-service@0.15.8
```

---

## Troubleshooting

### Version Mismatch Warning

```
WARN linera: Make sure to use a Linera client compatible with this network.
--- Faucet info --- Linera protocol: v0.15.8
--- This binary --- Linera protocol: v0.15.7
```

**Fix:** Update your Linera CLI to match the network version.

### Clock Synchronization Error

```
Block timestamp is further in the future from local time than block time grace period (500ms)
```

**Fix:** Sync your system clock:
```bash
# In WSL/Linux
sudo ntpdate pool.ntp.org
# OR
sudo timedatectl set-ntp true
```

### gRPC Connection Errors

```
grpc_client: error=Grpc error: remote request failed with status: Status { code: Internal, message: "h2 protocol error" }
```

**Cause:** Temporary validator connection issues (usually recovers automatically).

### Blobs Not Found

```
error=Blobs not found: [BlobId { blob_type: ChainDescription, hash: ... }]
```

**Cause:** Some validators may not have all chain data yet. The system will retry with other validators.

---

## Summary

| Action | Protocol | Endpoint | When Used |
|--------|----------|----------|-----------|
| Wallet initialization | HTTPS | `faucet.testnet-conway.linera.net` | Once per wallet |
| Chain creation | HTTPS | `faucet.testnet-conway.linera.net` | When requesting tokens |
| Sync, queries, transactions | gRPC | Multiple validators | All other operations |

The **faucet is only used twice**:
1. To get network configuration during `wallet init`
2. To create new chains with test tokens via `request-chain`

After that, all blockchain operations go directly to the **validators** via gRPC.
