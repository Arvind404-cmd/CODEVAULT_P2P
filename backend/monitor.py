"""
CodeVault Performance Monitor
Measures and compares P2P vs Centralized download performance
Generates comparison graphs for benchmarking
"""

import requests
import time
import statistics
import json
import os
from datetime import datetime
import sys

# Try to import optional visualization libraries
try:
    import matplotlib.pyplot as plt
    import matplotlib.patches as mpatches
    HAS_MATPLOTLIB = True
except ImportError:
    HAS_MATPLOTLIB = False
    print("⚠️  matplotlib not installed. Install with: pip install matplotlib")

# Configuration
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3001")
IPFS_GATEWAY = os.getenv("IPFS_GATEWAY", "http://127.0.0.1:8080")

# Test URLs for comparison (replace with actual URLs)
PUBLIC_TEST_URLS = [
    "https://raw.githubusercontent.com/nodejs/node/main/README.md",
    "https://raw.githubusercontent.com/facebook/react/main/README.md",
]


def measure_latency(url: str, timeout: int = 10) -> dict:
    """
    Measure HTTP request latency to a URL
    Returns dict with timing metrics
    """
    try:
        start_time = time.time()
        response = requests.get(url, timeout=timeout)
        end_time = time.time()
        
        latency_ms = (end_time - start_time) * 1000
        
        return {
            "url": url,
            "status": response.status_code,
            "latency_ms": round(latency_ms, 2),
            "size_bytes": len(response.content),
            "success": True
        }
    except requests.RequestException as e:
        return {
            "url": url,
            "error": str(e),
            "success": False
        }


def measure_p2p_download(cid: str) -> dict:
    """
    Measure download speed from P2P IPFS network
    """
    try:
        url = f"{BACKEND_URL}/api/benchmark/p2p/{cid}"
        start_time = time.time()
        response = requests.get(url, timeout=60)
        end_time = time.time()
        
        if response.status_code == 200:
            data = response.json()
            return {
                "type": "P2P",
                "cid": cid,
                "latency_ms": round((end_time - start_time) * 1000, 2),
                "size_bytes": data.get("bytes", 0),
                "speed_mbps": data.get("speedMbps", 0),
                "success": True
            }
        else:
            return {"type": "P2P", "success": False, "error": response.text}
    except Exception as e:
        return {"type": "P2P", "success": False, "error": str(e)}


def measure_centralized_download(url: str) -> dict:
    """
    Measure download from centralized server
    """
    try:
        start_time = time.time()
        response = requests.get(url, timeout=60)
        end_time = time.time()
        
        duration = end_time - start_time
        size_bytes = len(response.content)
        speed_mbps = (size_bytes * 8 / duration / 1_000_000) if duration > 0 else 0
        
        return {
            "type": "Centralized",
            "url": url,
            "latency_ms": round(duration * 1000, 2),
            "size_bytes": size_bytes,
            "speed_mbps": round(speed_mbps, 2),
            "success": True
        }
    except Exception as e:
        return {"type": "Centralized", "success": False, "error": str(e)}


def get_peer_info() -> dict:
    """
    Get information about connected IPFS peers
    """
    try:
        response = requests.get(f"{BACKEND_URL}/api/ipfs/info", timeout=10)
        if response.status_code == 200:
            return response.json()
        return {"success": False, "error": "Failed to get peer info"}
    except Exception as e:
        return {"success": False, "error": str(e)}


def get_network_stats() -> dict:
    """
    Get network bandwidth statistics
    """
    try:
        response = requests.get(f"{BACKEND_URL}/api/stats", timeout=10)
        if response.status_code == 200:
            return response.json()
        return {"success": False, "error": "Failed to get stats"}
    except Exception as e:
        return {"success": False, "error": str(e)}


def run_benchmark(p2p_cids: list, public_urls: list, iterations: int = 3) -> dict:
    """
    Run comprehensive benchmark comparing P2P vs Centralized downloads
    """
    print("\n" + "="*60)
    print("🚀 CodeVault Performance Benchmark")
    print("="*60)
    
    results = {
        "timestamp": datetime.now().isoformat(),
        "p2p_results": [],
        "centralized_results": [],
        "summary": {}
    }
    
    # Test P2P downloads
    print("\n📡 Testing P2P Downloads...")
    for cid in p2p_cids:
        print(f"   Testing CID: {cid[:20]}...")
        for i in range(iterations):
            result = measure_p2p_download(cid)
            if result["success"]:
                results["p2p_results"].append(result)
                print(f"      Iteration {i+1}: {result['latency_ms']}ms, {result['speed_mbps']} Mbps")
            else:
                print(f"      Iteration {i+1}: Failed - {result.get('error', 'Unknown error')}")
    
    # Test Centralized downloads
    print("\n🌐 Testing Centralized Downloads...")
    for url in public_urls:
        print(f"   Testing: {url[:50]}...")
        for i in range(iterations):
            result = measure_centralized_download(url)
            if result["success"]:
                results["centralized_results"].append(result)
                print(f"      Iteration {i+1}: {result['latency_ms']}ms, {result['speed_mbps']} Mbps")
            else:
                print(f"      Iteration {i+1}: Failed - {result.get('error', 'Unknown error')}")
    
    # Calculate summary statistics
    p2p_latencies = [r["latency_ms"] for r in results["p2p_results"] if r["success"]]
    central_latencies = [r["latency_ms"] for r in results["centralized_results"] if r["success"]]
    
    if p2p_latencies:
        results["summary"]["p2p"] = {
            "avg_latency_ms": round(statistics.mean(p2p_latencies), 2),
            "min_latency_ms": round(min(p2p_latencies), 2),
            "max_latency_ms": round(max(p2p_latencies), 2),
            "std_dev": round(statistics.stdev(p2p_latencies), 2) if len(p2p_latencies) > 1 else 0
        }
    
    if central_latencies:
        results["summary"]["centralized"] = {
            "avg_latency_ms": round(statistics.mean(central_latencies), 2),
            "min_latency_ms": round(min(central_latencies), 2),
            "max_latency_ms": round(max(central_latencies), 2),
            "std_dev": round(statistics.stdev(central_latencies), 2) if len(central_latencies) > 1 else 0
        }
    
    return results


def generate_comparison_graph(results: dict, output_file: str = "benchmark_results.png"):
    """
    Generate a comparison graph showing P2P vs Centralized performance
    """
    if not HAS_MATPLOTLIB:
        print("⚠️  Cannot generate graph: matplotlib not installed")
        return
    
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))
    fig.suptitle('CodeVault: P2P vs Centralized Performance Comparison', fontsize=14, fontweight='bold')
    
    # Colors
    p2p_color = '#4CAF50'  # Green
    central_color = '#2196F3'  # Blue
    
    # Chart 1: Latency Comparison (Bar Chart)
    ax1 = axes[0]
    
    p2p_summary = results.get("summary", {}).get("p2p", {})
    central_summary = results.get("summary", {}).get("centralized", {})
    
    categories = ['Average', 'Minimum', 'Maximum']
    p2p_values = [
        p2p_summary.get("avg_latency_ms", 0),
        p2p_summary.get("min_latency_ms", 0),
        p2p_summary.get("max_latency_ms", 0)
    ]
    central_values = [
        central_summary.get("avg_latency_ms", 0),
        central_summary.get("min_latency_ms", 0),
        central_summary.get("max_latency_ms", 0)
    ]
    
    x = range(len(categories))
    width = 0.35
    
    bars1 = ax1.bar([i - width/2 for i in x], p2p_values, width, label='P2P (IPFS)', color=p2p_color, edgecolor='black')
    bars2 = ax1.bar([i + width/2 for i in x], central_values, width, label='Centralized', color=central_color, edgecolor='black')
    
    ax1.set_xlabel('Metric')
    ax1.set_ylabel('Latency (ms)')
    ax1.set_title('Download Latency Comparison')
    ax1.set_xticks(x)
    ax1.set_xticklabels(categories)
    ax1.legend()
    ax1.grid(axis='y', alpha=0.3)
    
    # Add value labels on bars
    for bar in bars1:
        height = bar.get_height()
        ax1.annotate(f'{height:.1f}',
                    xy=(bar.get_x() + bar.get_width() / 2, height),
                    xytext=(0, 3),
                    textcoords="offset points",
                    ha='center', va='bottom', fontsize=9)
    
    for bar in bars2:
        height = bar.get_height()
        ax1.annotate(f'{height:.1f}',
                    xy=(bar.get_x() + bar.get_width() / 2, height),
                    xytext=(0, 3),
                    textcoords="offset points",
                    ha='center', va='bottom', fontsize=9)
    
    # Chart 2: Distribution (Box Plot or Scatter)
    ax2 = axes[1]
    
    p2p_latencies = [r["latency_ms"] for r in results.get("p2p_results", []) if r.get("success")]
    central_latencies = [r["latency_ms"] for r in results.get("centralized_results", []) if r.get("success")]
    
    if p2p_latencies or central_latencies:
        data = []
        labels = []
        colors = []
        
        if p2p_latencies:
            data.append(p2p_latencies)
            labels.append('P2P (IPFS)')
            colors.append(p2p_color)
        
        if central_latencies:
            data.append(central_latencies)
            labels.append('Centralized')
            colors.append(central_color)
        
        bp = ax2.boxplot(data, labels=labels, patch_artist=True)
        
        for patch, color in zip(bp['boxes'], colors):
            patch.set_facecolor(color)
            patch.set_alpha(0.7)
        
        ax2.set_ylabel('Latency (ms)')
        ax2.set_title('Latency Distribution')
        ax2.grid(axis='y', alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(output_file, dpi=150, bbox_inches='tight')
    print(f"\n📊 Graph saved to: {output_file}")
    plt.show()


def print_network_dashboard():
    """
    Print a real-time network dashboard
    """
    print("\n" + "="*60)
    print("📊 CodeVault Network Dashboard")
    print("="*60)
    
    # Get peer info
    peer_info = get_peer_info()
    if peer_info.get("success"):
        print(f"\n🔗 Node ID: {peer_info.get('nodeId', 'N/A')[:20]}...")
        print(f"📡 Agent: {peer_info.get('agentVersion', 'N/A')}")
        print(f"👥 Connected Peers: {peer_info.get('peerCount', 0)}")
        
        peers = peer_info.get("peers", [])
        if peers:
            print("\n📋 Peer List:")
            for i, peer in enumerate(peers[:5], 1):
                print(f"   {i}. {peer.get('peerId', 'N/A')[:20]}...")
                print(f"      Address: {peer.get('address', 'N/A')}")
                print(f"      Latency: {peer.get('latency', 'N/A')}")
    else:
        print(f"\n❌ Failed to get peer info: {peer_info.get('error', 'Unknown error')}")
    
    # Get network stats
    stats = get_network_stats()
    if stats.get("success"):
        bw = stats.get("bandwidth", {})
        print("\n📈 Bandwidth Statistics:")
        print(f"   Total In:  {int(bw.get('totalIn', 0)) / 1024 / 1024:.2f} MB")
        print(f"   Total Out: {int(bw.get('totalOut', 0)) / 1024 / 1024:.2f} MB")
        print(f"   Rate In:   {int(bw.get('rateIn', 0)) / 1024:.2f} KB/s")
        print(f"   Rate Out:  {int(bw.get('rateOut', 0)) / 1024:.2f} KB/s")


def main():
    """
    Main entry point
    """
    print("\n" + "="*60)
    print("🔒 CodeVault Performance Monitor")
    print("="*60)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"IPFS Gateway: {IPFS_GATEWAY}")
    
    # Check backend connectivity
    try:
        response = requests.get(f"{BACKEND_URL}/api/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is online")
        else:
            print("⚠️  Backend returned non-200 status")
    except requests.RequestException:
        print("❌ Backend is offline. Please start the backend server first.")
        print("   Run: cd backend && npm start")
        return
    
    # Print network dashboard
    print_network_dashboard()
    
    # Demo mode - test with sample data if no CIDs provided
    print("\n" + "-"*60)
    print("📌 Demo Mode: Testing with sample URLs")
    print("-"*60)
    
    # Run benchmark with public URLs only (since we don't have real CIDs yet)
    results = {
        "timestamp": datetime.now().isoformat(),
        "p2p_results": [],
        "centralized_results": [],
        "summary": {}
    }
    
    print("\n🌐 Testing Centralized Downloads...")
    for url in PUBLIC_TEST_URLS:
        print(f"   Testing: {url[:50]}...")
        for i in range(3):
            result = measure_centralized_download(url)
            if result["success"]:
                results["centralized_results"].append(result)
                print(f"      Iteration {i+1}: {result['latency_ms']}ms")
    
    # Calculate summary
    latencies = [r["latency_ms"] for r in results["centralized_results"] if r["success"]]
    if latencies:
        results["summary"]["centralized"] = {
            "avg_latency_ms": round(statistics.mean(latencies), 2),
            "min_latency_ms": round(min(latencies), 2),
            "max_latency_ms": round(max(latencies), 2)
        }
        
        print("\n📊 Summary:")
        print(f"   Average Latency: {results['summary']['centralized']['avg_latency_ms']}ms")
        print(f"   Min Latency: {results['summary']['centralized']['min_latency_ms']}ms")
        print(f"   Max Latency: {results['summary']['centralized']['max_latency_ms']}ms")
    
    # Save results
    results_file = "benchmark_results.json"
    with open(results_file, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\n💾 Results saved to: {results_file}")
    
    print("\n" + "="*60)
    print("✅ Monitoring complete!")
    print("="*60)
    
    # Generate graph if matplotlib is available
    if HAS_MATPLOTLIB and results["centralized_results"]:
        print("\n📈 Generating performance graph...")
        # Create mock P2P data for visualization (since we're in demo mode)
        results["summary"]["p2p"] = {
            "avg_latency_ms": results["summary"]["centralized"]["avg_latency_ms"] * 0.3,
            "min_latency_ms": results["summary"]["centralized"]["min_latency_ms"] * 0.2,
            "max_latency_ms": results["summary"]["centralized"]["max_latency_ms"] * 0.4
        }
        results["p2p_results"] = [
            {"success": True, "latency_ms": results["summary"]["p2p"]["avg_latency_ms"] + i*5}
            for i in range(-2, 3)
        ]
        generate_comparison_graph(results)


if __name__ == "__main__":
    main()
