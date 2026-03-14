import { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function CSVImport({ type, onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    
    // Read and preview first 5 rows
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(l => l.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1, 6).map(line => {
        const values = line.split(',').map(v => v.trim());
        return headers.reduce((obj, header, i) => {
          obj[header] = values[i] || '';
          return obj;
        }, {});
      });
      setPreview({ headers, rows });
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (!file) return;
    
    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const endpoint = type === 'products' ? '/products/import' : 
                      type === 'categories' ? '/products/categories/import' :
                      type === 'warehouses' ? '/warehouses/import' : null;
      
      if (!endpoint) {
        toast.error('Import not supported for this type');
        return;
      }

      const response = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setResult(response.data);
      toast.success(`Successfully imported ${response.data.success} ${type}`);
      
      if (onImported) {
        setTimeout(() => {
          onImported();
          onClose();
        }, 2000);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
      setResult({ success: 0, failed: 0, errors: [err.response?.data?.message || 'Import failed'] });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    let csvContent = '';
    
    if (type === 'products') {
      csvContent = 'Product Name,SKU,Category,UOM,Cost Price,Sale Price,Min Stock Level,Reorder Qty,Description,Warehouse,Location,Initial Quantity\n';
      csvContent += 'Sample Product,SMPL-001,Raw Materials,Units,10.00,15.00,50,200,Sample description,Main Warehouse,Rack A1,100\n';
    } else if (type === 'categories') {
      csvContent = 'Category Name,Description\n';
      csvContent += 'Raw Materials,Basic raw materials for production\n';
      csvContent += 'Finished Goods,Completed products ready for sale\n';
    } else if (type === 'warehouses') {
      csvContent = 'Warehouse Name,Code,Address,City,State,Postal Code,Country,Manager Name,Manager Email,Manager Phone\n';
      csvContent += 'Main Warehouse,WH-001,123 Industrial Ave,New York,NY,10001,USA,John Doe,john@example.com,555-0100\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_import_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3 className="modal-title">Import {type} from CSV</h3>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {!result ? (
            <>
              <div style={{ marginBottom: 20, padding: 14, background: 'var(--accent-dim)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Instructions:</strong>
                <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                  <li>Download the template CSV file below</li>
                  <li>Fill in your data following the column format</li>
                  <li>Upload the completed CSV file</li>
                  <li>Review the preview and click Import</li>
                </ul>
              </div>

              <div style={{ marginBottom: 20 }}>
                <button className="btn btn-secondary btn-sm" onClick={downloadTemplate}>
                  <FileText size={14} /> Download Template
                </button>
              </div>

              <div 
                style={{ 
                  border: '2px dashed var(--border)', 
                  borderRadius: 8, 
                  padding: 40, 
                  textAlign: 'center',
                  background: 'var(--bg-elevated)',
                  cursor: 'pointer',
                  marginBottom: 20
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  {file ? file.name : 'Click to select CSV file or drag and drop'}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  CSV files only
                </p>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept=".csv" 
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </div>

              {preview.rows && preview.rows.length > 0 && (
                <div>
                  <h4 style={{ fontSize: 14, marginBottom: 12, color: 'var(--text-primary)' }}>
                    Preview (first 5 rows)
                  </h4>
                  <div style={{ overflowX: 'auto', maxHeight: 300 }}>
                    <table style={{ fontSize: 12 }}>
                      <thead>
                        <tr>
                          {preview.headers.map((h, i) => (
                            <th key={i} style={{ whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.rows.map((row, i) => (
                          <tr key={i}>
                            {preview.headers.map((h, j) => (
                              <td key={j} style={{ whiteSpace: 'nowrap' }}>{row[h]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 20 }}>
              {result.success > 0 ? (
                <>
                  <CheckCircle size={60} style={{ color: 'var(--success)', marginBottom: 16 }} />
                  <h3 style={{ marginBottom: 8 }}>Import Successful!</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
                    Successfully imported {result.success} {type}
                    {result.failed > 0 && `, ${result.failed} failed`}
                  </p>
                </>
              ) : (
                <>
                  <AlertCircle size={60} style={{ color: 'var(--danger)', marginBottom: 16 }} />
                  <h3 style={{ marginBottom: 8 }}>Import Failed</h3>
                </>
              )}
              
              {result.errors && result.errors.length > 0 && (
                <div style={{ textAlign: 'left', marginTop: 20, padding: 14, background: 'var(--bg-elevated)', borderRadius: 8, maxHeight: 200, overflowY: 'auto' }}>
                  <strong style={{ fontSize: 13, color: 'var(--danger)' }}>Errors:</strong>
                  <ul style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                    {result.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && file && (
            <button 
              className="btn btn-primary" 
              onClick={handleImport}
              disabled={importing}
            >
              {importing ? 'Importing...' : 'Import CSV'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
