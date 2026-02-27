# CodeVault - Blockchain-Secured P2P Content Delivery Network

## 🎯 Problem Statement
"The Inefficiency and Vulnerability of Centralized Content Delivery in High-Latency Networks."

## 💡 Solution
A Blockchain-secured Private P2P Content Delivery Network (CDN) for Digital Assets.

---

## 🛠️ Single PC Development Setup

Since you have one PC, we'll simulate a P2P network by running:
- **2 IPFS nodes** on different ports (simulating 2 peers)
- **Hardhat local testnet** for blockchain
- **React frontend** for the marketplace UI

---

## 📋 Prerequisites

### 1. Install Kubo (IPFS)
Download from: https://docs.ipfs.tech/install/command-line/#windows
```powershell
# After downloading, extract and add to PATH
# Verify installation:
ipfs --version
```

### 2. Install Node.js (v18+)
Download from: https://nodejs.org/

### 3. Install Python (3.9+)
Download from: https://python.org/

### 4. Install MetaMask Browser Extension
https://metamask.io/

---

## 🚀 Quick Start (Phase 1 - 3 Day Prototype)

### Step 1: Setup IPFS Nodes (Simulating 2 Peers)

```powershell
# Terminal 1 - Node 1 (Default)
cd ipfs-network
mkdir node1
set IPFS_PATH=./node1
ipfs init
ipfs config Addresses.API /ip4/127.0.0.1/tcp/5001
ipfs config Addresses.Gateway /ip4/127.0.0.1/tcp/8080
ipfs config Addresses.Swarm --json '["/ip4/0.0.0.0/tcp/4001"]'

# Terminal 2 - Node 2 (Different Ports)
cd ipfs-network
mkdir node2
set IPFS_PATH=./node2
ipfs init
ipfs config Addresses.API /ip4/127.0.0.1/tcp/5002
ipfs config Addresses.Gateway /ip4/127.0.0.1/tcp/8081
ipfs config Addresses.Swarm --json '["/ip4/0.0.0.0/tcp/4002"]'
```

### Step 2: Apply Swarm Key (Private Network)
Copy `swarm.key` to both node1 and node2 folders.

### Step 3: Start Both Nodes
```powershell
# Terminal 1
set IPFS_PATH=./ipfs-network/node1
ipfs daemon

# Terminal 2
set IPFS_PATH=./ipfs-network/node2
ipfs daemon
```

### Step 4: Connect Nodes to Each Other
```powershell
# Get Node1's peer ID
set IPFS_PATH=./ipfs-network/node1
ipfs id

# From Node2, connect to Node1
set IPFS_PATH=./ipfs-network/node2
ipfs swarm connect /ip4/127.0.0.1/tcp/4001/p2p/<NODE1_PEER_ID>
```

### Step 5: Test P2P Transfer
```powershell
# Add file on Node1
set IPFS_PATH=./ipfs-network/node1
echo "Hello CodeVault!" > test.txt
ipfs add test.txt
# Output: added <CID> test.txt

# Get file on Node2
set IPFS_PATH=./ipfs-network/node2
ipfs get <CID>
```

---

## 📦 Install Dependencies

```powershell
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install

# Blockchain
cd blockchain
npm install

# Python Monitor
cd backend
pip install -r requirements.txt
```

---

## 🏃 Run the Application

### 1. Start Hardhat Local Blockchain
```powershell
cd blockchain
npx hardhat node
```

### 2. Deploy Smart Contract
```powershell
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```

### 3. Start Backend Server
```powershell
cd backend
npm start
```

### 4. Start Frontend
```powershell
cd frontend
npm start
```

### 5. Open Browser
Navigate to http://localhost:3000

---

## 📊 Phase 3: Performance Benchmarking

```powershell
cd backend
python monitor.py
```

This generates comparison graphs showing P2P vs centralized download performance.

---

## 🔗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend (3000)                    │
│         - Marketplace UI / MetaMask Integration              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Express Backend (3001)                     │
│              - File Metadata / IPFS Communication            │
└─────────────────────────────────────────────────────────────┘
                    │                       │
                    ▼                       ▼
┌───────────────────────────┐   ┌─────────────────────────────┐
│   Hardhat/Solidity        │   │     Private IPFS Swarm      │
│   Smart Contracts         │   │   Node1(5001) ←→ Node2(5002)│
│   (Access Control)        │   │                             │
└───────────────────────────┘   └─────────────────────────────┘
```

---

## 📁 Project Structure

```
codevault-p2p/
├── backend/
│   ├── server.js          # Express API server
│   ├── monitor.py         # Performance monitoring
│   ├── package.json
│   └── requirements.txt
├── blockchain/
│   ├── contracts/
│   │   └── Marketplace.sol
│   ├── scripts/
│   │   └── deploy.js
│   ├── hardhat.config.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── components/
│   │   └── ...
│   └── package.json
└── ipfs-network/
    ├── swarm.key
    ├── node1/
    └── node2/
```
