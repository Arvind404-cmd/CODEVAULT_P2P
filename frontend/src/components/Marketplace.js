/* global BigInt */
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getAllFiles, checkFileAccess, purchaseFile, getFileCID, formatEther, formatAddress } from '../utils/web3';
import { downloadFromIPFS, getIPFSUrl } from '../utils/ipfs';

function Marketplace({ contract, account, onConnectWallet }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessMap, setAccessMap] = useState({});
  const [purchasing, setPurchasing] = useState(null);
  const [downloading, setDownloading] = useState(null);

  // Fetch files on mount
  useEffect(() => {
    fetchFiles();
  }, [contract]);

  // Check access for all files when account changes
  useEffect(() => {
    if (account && files.length > 0) {
      checkAccessForFiles();
    }
  }, [account, files]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      if (contract) {
        const fileList = await getAllFiles(contract);
        setFiles(fileList);
      } else {
        // Demo mode - show sample files
        setFiles([
          {
            id: 1,
            title: 'React Component Library',
            description: 'A collection of 50+ reusable React components with TypeScript support',
            price: BigInt('10000000000000000'), // 0.01 ETH
            seller: '0x0000000000000000000000000000000000000000',
            totalSales: 12,
            isActive: true
          },
          {
            id: 2,
            title: 'Python ML Starter Kit',
            description: 'Complete machine learning project template with TensorFlow and PyTorch examples',
            price: BigInt('20000000000000000'), // 0.02 ETH
            seller: '0x0000000000000000000000000000000000000000',
            totalSales: 8,
            isActive: true
          },
          {
            id: 3,
            title: 'Full-Stack Web App Template',
            description: 'Node.js + React + MongoDB boilerplate with authentication',
            price: BigInt('15000000000000000'), // 0.015 ETH
            seller: '0x0000000000000000000000000000000000000000',
            totalSales: 15,
            isActive: true
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const checkAccessForFiles = async () => {
    const newAccessMap = {};
    for (const file of files) {
      try {
        const hasAccess = await checkFileAccess(contract, file.id, account);
        newAccessMap[file.id] = hasAccess;
      } catch (error) {
        newAccessMap[file.id] = false;
      }
    }
    setAccessMap(newAccessMap);
  };

  const handlePurchase = async (file) => {
    if (!account) {
      toast.error('Please connect your wallet first');
      onConnectWallet();
      return;
    }

    if (!contract) {
      toast.error('Contract not available. Deploy the smart contract first.');
      return;
    }

    setPurchasing(file.id);
    try {
      await purchaseFile(contract, file.id, file.price);
      toast.success(`Successfully purchased ${file.title}!`);
      setAccessMap(prev => ({ ...prev, [file.id]: true }));
    } catch (error) {
      console.error('Purchase error:', error);
      if (error.code === 'ACTION_REJECTED') {
        toast.error('Transaction cancelled');
      } else {
        toast.error('Purchase failed: ' + (error.reason || error.message));
      }
    } finally {
      setPurchasing(null);
    }
  };

  const handleDownload = async (file) => {
    if (!contract) {
      toast.error('Contract not available');
      return;
    }

    setDownloading(file.id);
    try {
      const cid = await getFileCID(contract, file.id);
      
      // Show CID info since IPFS may not be running
      toast.success(
        `File CID: ${cid.slice(0, 20)}...`,
        { duration: 5000 }
      );
      
      // Try to open IPFS gateway
      const ipfsUrl = getIPFSUrl(cid);
      
      // Also try public IPFS gateway as fallback
      const publicGateway = `https://ipfs.io/ipfs/${cid}`;
      
      // Show download options
      const userChoice = window.confirm(
        `File CID: ${cid}\n\n` +
        `Choose OK to try local IPFS gateway (requires IPFS running)\n` +
        `Choose Cancel to try public IPFS gateway\n\n` +
        `Note: Sample files use demo CIDs and won't have actual content.`
      );
      
      if (userChoice) {
        window.open(ipfsUrl, '_blank');
      } else {
        window.open(publicGateway, '_blank');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed: ' + error.message);
    } finally {
      setDownloading(null);
    }
  };

  const getFileIcon = (title) => {
    if (title.toLowerCase().includes('react')) return '⚛️';
    if (title.toLowerCase().includes('python') || title.toLowerCase().includes('ml')) return '🐍';
    if (title.toLowerCase().includes('node') || title.toLowerCase().includes('web')) return '🌐';
    if (title.toLowerCase().includes('template')) return '📄';
    return '📁';
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">🛒 Marketplace</h1>
        <button className="btn btn-secondary" onClick={fetchFiles}>
          🔄 Refresh
        </button>
      </div>

      {!account && (
        <div style={{ 
          background: 'rgba(99, 102, 241, 0.1)', 
          border: '1px solid var(--primary)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
            Connect your wallet to purchase and download files
          </p>
          <button className="btn btn-primary" onClick={onConnectWallet}>
            🦊 Connect MetaMask
          </button>
        </div>
      )}

      {files.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h2 className="empty-state-title">No files available</h2>
          <p>Be the first to upload a file to the marketplace!</p>
        </div>
      ) : (
        <div className="file-grid">
          {files.map((file) => (
            <div key={file.id} className="file-card">
              <div className="file-preview">
                {getFileIcon(file.title)}
              </div>
              <div className="file-info">
                <h3 className="file-title">{file.title}</h3>
                <p className="file-description">{file.description}</p>
                <div className="file-meta">
                  <span className="file-price">
                    {formatEther(file.price)} ETH
                  </span>
                  <span className="file-sales">
                    {file.totalSales} sales
                  </span>
                </div>
                <div style={{ 
                  marginTop: '0.75rem', 
                  fontSize: '0.8rem', 
                  color: 'var(--text-muted)' 
                }}>
                  Seller: {formatAddress(file.seller)}
                </div>
                <div style={{ marginTop: '1rem' }}>
                  {accessMap[file.id] ? (
                    <button
                      className="btn btn-success"
                      style={{ width: '100%' }}
                      onClick={() => handleDownload(file)}
                      disabled={downloading === file.id}
                    >
                      {downloading === file.id ? '⏳ Downloading...' : '⬇️ Download'}
                    </button>
                  ) : account && account.toLowerCase() === file.seller.toLowerCase() ? (
                    <button className="btn btn-secondary" style={{ width: '100%' }} disabled>
                      ✅ Your File
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                      onClick={() => handlePurchase(file)}
                      disabled={purchasing === file.id || !account}
                    >
                      {purchasing === file.id ? '⏳ Processing...' : '🛒 Buy Now'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Marketplace;
