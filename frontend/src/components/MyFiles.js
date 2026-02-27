import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { formatEther, formatAddress } from '../utils/web3';
import { getFileCID } from '../utils/web3';
import { getIPFSUrl } from '../utils/ipfs';

function MyFiles({ contract, account, onUpload }) {
  const [activeTab, setActiveTab] = useState('purchases');
  const [purchases, setPurchases] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (contract && account) {
      fetchUserFiles();
    }
  }, [contract, account]);

  const fetchUserFiles = async () => {
    setLoading(true);
    try {
      // Get user's purchases
      const purchaseIds = await contract.getUserPurchases(account);
      const purchasedFiles = [];
      for (const id of purchaseIds) {
        const file = await contract.getFile(id);
        purchasedFiles.push({
          id: Number(id),
          title: file.title,
          description: file.description,
          price: file.price,
          seller: file.seller
        });
      }
      setPurchases(purchasedFiles);

      // Get user's listings
      const listingIds = await contract.getUserListings(account);
      const listedFiles = [];
      for (const id of listingIds) {
        const file = await contract.getFile(id);
        listedFiles.push({
          id: Number(id),
          title: file.title,
          description: file.description,
          price: file.price,
          totalSales: Number(file.totalSales),
          isActive: file.isActive
        });
      }
      setListings(listedFiles);
    } catch (error) {
      console.error('Error fetching user files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file) => {
    try {
      const cid = await getFileCID(contract, file.id);
      window.open(getIPFSUrl(cid), '_blank');
      toast.success('Download started!');
    } catch (error) {
      toast.error('Download failed');
    }
  };

  if (!account) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔒</div>
        <h2 className="empty-state-title">Connect Your Wallet</h2>
        <p>Please connect your MetaMask wallet to view your files</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚙️</div>
        <h2 className="empty-state-title">Contract Not Deployed</h2>
        <p>Deploy the smart contract first by running:</p>
        <pre style={{ 
          marginTop: '1rem',
          background: 'var(--surface)',
          padding: '1rem',
          borderRadius: '8px'
        }}>
          cd blockchain && npm run deploy
        </pre>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">📁 My Files</h1>
        <button className="btn btn-primary" onClick={onUpload}>
          ➕ Upload New File
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'purchases' ? 'active' : ''}`}
          onClick={() => setActiveTab('purchases')}
        >
          🛒 Purchased ({purchases.length})
        </button>
        <button
          className={`tab ${activeTab === 'listings' ? 'active' : ''}`}
          onClick={() => setActiveTab('listings')}
        >
          📤 My Listings ({listings.length})
        </button>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          {/* Purchases Tab */}
          {activeTab === 'purchases' && (
            <div>
              {purchases.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🛍️</div>
                  <h2 className="empty-state-title">No Purchases Yet</h2>
                  <p>Browse the marketplace to find files to purchase</p>
                </div>
              ) : (
                <div className="file-grid">
                  {purchases.map((file) => (
                    <div key={file.id} className="file-card">
                      <div className="file-preview">📄</div>
                      <div className="file-info">
                        <h3 className="file-title">{file.title}</h3>
                        <p className="file-description">{file.description}</p>
                        <div style={{ 
                          fontSize: '0.85rem', 
                          color: 'var(--text-muted)',
                          marginBottom: '1rem'
                        }}>
                          Purchased from: {formatAddress(file.seller)}
                        </div>
                        <button
                          className="btn btn-success"
                          style={{ width: '100%' }}
                          onClick={() => handleDownload(file)}
                        >
                          ⬇️ Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Listings Tab */}
          {activeTab === 'listings' && (
            <div>
              {listings.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📤</div>
                  <h2 className="empty-state-title">No Listings Yet</h2>
                  <p>Upload your first file to start selling!</p>
                  <button 
                    className="btn btn-primary" 
                    style={{ marginTop: '1rem' }}
                    onClick={onUpload}
                  >
                    ➕ Upload File
                  </button>
                </div>
              ) : (
                <div className="file-grid">
                  {listings.map((file) => (
                    <div key={file.id} className="file-card">
                      <div className="file-preview">📄</div>
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
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <span style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '50%', 
                            background: file.isActive ? 'var(--success)' : 'var(--error)'
                          }}></span>
                          <span style={{ 
                            fontSize: '0.85rem',
                            color: 'var(--text-muted)'
                          }}>
                            {file.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div style={{ 
                          marginTop: '1rem',
                          background: 'rgba(16, 185, 129, 0.1)',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          textAlign: 'center'
                        }}>
                          <div style={{ 
                            fontSize: '1.25rem', 
                            fontWeight: '700',
                            color: 'var(--secondary)'
                          }}>
                            {(Number(formatEther(file.price)) * file.totalSales).toFixed(4)} ETH
                          </div>
                          <div style={{ 
                            fontSize: '0.8rem',
                            color: 'var(--text-muted)'
                          }}>
                            Total Earnings
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default MyFiles;
