import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { uploadFile } from '../utils/web3';
import { uploadToIPFS } from '../utils/ipfs';

function UploadModal({ contract, account, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: ''
  });
  const [file, setFile] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handlePreviewChange = (e) => {
    if (e.target.files[0]) {
      setPreviewFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!formData.title || !formData.description || !formData.price) {
      toast.error('Please fill in all fields');
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    if (!contract) {
      toast.error('Contract not available. Deploy the smart contract first.');
      return;
    }

    setUploading(true);
    try {
      // Step 1: Upload main file to IPFS
      setUploadProgress('Uploading file to IPFS...');
      const fileResult = await uploadToIPFS(file);
      if (!fileResult.success) {
        throw new Error('Failed to upload file to IPFS');
      }
      const fileCID = fileResult.cid;

      // Step 2: Upload preview image (if provided)
      let previewCID = '';
      if (previewFile) {
        setUploadProgress('Uploading preview...');
        const previewResult = await uploadToIPFS(previewFile);
        if (previewResult.success) {
          previewCID = previewResult.cid;
        }
      }

      // Step 3: Upload to blockchain
      setUploadProgress('Confirming on blockchain...');
      await uploadFile(
        contract,
        fileCID,
        formData.title,
        formData.description,
        previewCID,
        formData.price
      );

      onSuccess();
    } catch (error) {
      console.error('Upload error:', error);
      if (error.code === 'ACTION_REJECTED') {
        toast.error('Transaction cancelled');
      } else {
        toast.error('Upload failed: ' + (error.reason || error.message));
      }
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">📤 Upload New File</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              type="text"
              name="title"
              className="form-input"
              placeholder="e.g., React Component Library"
              value={formData.title}
              onChange={handleInputChange}
              disabled={uploading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea
              name="description"
              className="form-input form-textarea"
              placeholder="Describe what's included in this file..."
              value={formData.description}
              onChange={handleInputChange}
              disabled={uploading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Price (ETH) *</label>
            <input
              type="number"
              name="price"
              className="form-input"
              placeholder="0.01"
              step="0.001"
              min="0.001"
              value={formData.price}
              onChange={handleInputChange}
              disabled={uploading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">File *</label>
            <input
              type="file"
              className="form-input"
              onChange={handleFileChange}
              disabled={uploading}
              style={{ padding: '0.5rem' }}
            />
            {file && (
              <div style={{ 
                marginTop: '0.5rem', 
                fontSize: '0.85rem',
                color: 'var(--text-muted)'
              }}>
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Preview Image (Optional)</label>
            <input
              type="file"
              accept="image/*"
              className="form-input"
              onChange={handlePreviewChange}
              disabled={uploading}
              style={{ padding: '0.5rem' }}
            />
          </div>

          {uploadProgress && (
            <div style={{
              background: 'rgba(99, 102, 241, 0.1)',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              <div className="spinner" style={{ 
                margin: '0 auto 0.5rem',
                width: '24px',
                height: '24px'
              }}></div>
              {uploadProgress}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={uploading}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploading || !account}
              style={{ flex: 1 }}
            >
              {uploading ? '⏳ Uploading...' : '🚀 Upload & List'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UploadModal;
