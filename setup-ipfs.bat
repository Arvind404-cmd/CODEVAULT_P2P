@echo off
echo ========================================
echo   CodeVault - IPFS Setup (Single PC)
echo ========================================
echo.

REM Check if IPFS is installed
where ipfs >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: IPFS (Kubo) is not installed!
    echo.
    echo Please download and install Kubo from:
    echo https://docs.ipfs.tech/install/command-line/#windows
    echo.
    pause
    exit /b 1
)

echo IPFS is installed. Setting up two nodes...
echo.

REM Create directories
if not exist "ipfs-network\node1" mkdir ipfs-network\node1
if not exist "ipfs-network\node2" mkdir ipfs-network\node2

echo ========================================
echo   Initializing Node 1 (Port 5001)
echo ========================================
set IPFS_PATH=%CD%\ipfs-network\node1
ipfs init 2>nul
ipfs config Addresses.API /ip4/127.0.0.1/tcp/5001
ipfs config Addresses.Gateway /ip4/127.0.0.1/tcp/8080
ipfs config Addresses.Swarm --json "[\"/ip4/0.0.0.0/tcp/4001\", \"/ip4/0.0.0.0/udp/4001/quic-v1\"]"

echo.
echo ========================================
echo   Initializing Node 2 (Port 5002)
echo ========================================
set IPFS_PATH=%CD%\ipfs-network\node2
ipfs init 2>nul
ipfs config Addresses.API /ip4/127.0.0.1/tcp/5002
ipfs config Addresses.Gateway /ip4/127.0.0.1/tcp/8081
ipfs config Addresses.Swarm --json "[\"/ip4/0.0.0.0/tcp/4002\", \"/ip4/0.0.0.0/udp/4002/quic-v1\"]"

REM Copy swarm key to both nodes
if exist "ipfs-network\swarm.key" (
    echo.
    echo Copying swarm.key to both nodes...
    copy ipfs-network\swarm.key ipfs-network\node1\swarm.key >nul
    copy ipfs-network\swarm.key ipfs-network\node2\swarm.key >nul
    echo Private network configured!
)

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo To start the nodes, open two terminals and run:
echo.
echo Terminal 1 (Node 1):
echo   set IPFS_PATH=%CD%\ipfs-network\node1
echo   ipfs daemon
echo.
echo Terminal 2 (Node 2):
echo   set IPFS_PATH=%CD%\ipfs-network\node2
echo   ipfs daemon
echo.
echo To connect Node 2 to Node 1:
echo   set IPFS_PATH=%CD%\ipfs-network\node2
echo   ipfs swarm connect /ip4/127.0.0.1/tcp/4001/p2p/[NODE1_PEER_ID]
echo.
pause
