import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import './PrintReceipt.css';

const TYPE_CONFIG = {
  receipt: { label: 'GOODS RECEIPT NOTE', icon: '📥', color: '#3b82f6' },
  delivery: { label: 'DELIVERY ORDER', icon: '📤', color: '#10b981' },
  transfer: { label: 'INTERNAL TRANSFER', icon: '🔄', color: '#f59e0b' },
  adjustment: { label: 'STOCK ADJUSTMENT', icon: '🔧', color: '#8b5cf6' }
};

export default function PrintReceipt({ move, type }) {
  if (!move) return null;

  const cfg = TYPE_CONFIG[type];
  const totalQty = move.lines?.reduce((s, l) => s + (l.demandQty || 0), 0) || 0;
  const totalDone = move.lines?.reduce((s, l) => s + (l.doneQty || l.demandQty || 0), 0) || 0;

  // Generate QR code data with receipt information
  const qrData = JSON.stringify({
    ref: move.reference,
    type: type,
    status: move.status,
    date: move.scheduledDate,
    warehouse: move.toWarehouse?.name || move.fromWarehouse?.name,
    totalQty: totalQty,
    url: `${window.location.origin}/${type}s/${move.id}`
  });

  return (
    <div className="print-receipt">
      {/* Header */}
      <div className="print-header">
        <div className="print-logo">
          <div className="print-logo-icon">📦</div>
          <div>
            <div className="print-company-name">CoreInventory</div>
            <div className="print-company-tagline">Inventory Management System</div>
          </div>
        </div>
        
        <div className="print-document-info">
          <div className="print-document-type" style={{ color: cfg.color }}>
            {cfg.icon} {cfg.label}
          </div>
          <div className="print-reference">{move.reference}</div>
          <div className="print-status">
            Status: <span className={`print-badge print-badge-${move.status}`}>{move.status.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Company Info */}
      <div className="print-company-details">
        <div>
          <strong>CoreInventory Ltd.</strong><br />
          123 Warehouse District<br />
          Industrial Area, City 12345<br />
          Phone: +1 (555) 123-4567<br />
          Email: info@coreinventory.com
        </div>
        <div className="print-document-dates">
          <div><strong>Date:</strong> {format(new Date(), 'dd MMM yyyy')}</div>
          {move.scheduledDate && (
            <div><strong>Scheduled:</strong> {format(new Date(move.scheduledDate), 'dd MMM yyyy')}</div>
          )}
          {move.validatedDate && (
            <div><strong>Validated:</strong> {format(new Date(move.validatedDate), 'dd MMM yyyy HH:mm')}</div>
          )}
        </div>
      </div>

      {/* Partner & Location Info */}
      <div className="print-info-grid">
        {move.partner && (
          <div className="print-info-box">
            <div className="print-info-label">
              {type === 'receipt' ? 'Supplier' : type === 'delivery' ? 'Customer' : 'Partner'}
            </div>
            <div className="print-info-value">{move.partner}</div>
          </div>
        )}
        
        {move.fromWarehouse && (
          <div className="print-info-box">
            <div className="print-info-label">From Location</div>
            <div className="print-info-value">
              {move.fromWarehouse.name}
              {move.fromLocation && <><br /><span style={{ fontSize: 13 }}>{move.fromLocation}</span></>}
            </div>
          </div>
        )}
        
        {move.toWarehouse && (
          <div className="print-info-box">
            <div className="print-info-label">To Location</div>
            <div className="print-info-value">
              {move.toWarehouse.name}
              {move.toLocation && <><br /><span style={{ fontSize: 13 }}>{move.toLocation}</span></>}
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      {move.notes && (
        <div className="print-notes">
          <strong>Notes:</strong> {move.notes}
        </div>
      )}

      {/* Product Lines Table */}
      <table className="print-table">
        <thead>
          <tr>
            <th style={{ width: '40px' }}>#</th>
            <th>Product Name</th>
            <th style={{ width: '120px' }}>SKU</th>
            <th style={{ width: '60px' }}>UOM</th>
            <th style={{ width: '80px', textAlign: 'right' }}>
              {type === 'adjustment' ? 'Expected' : 'Ordered'}
            </th>
            <th style={{ width: '80px', textAlign: 'right' }}>
              {type === 'adjustment' ? 'Counted' : 'Received'}
            </th>
            {type === 'adjustment' && (
              <th style={{ width: '80px', textAlign: 'right' }}>Variance</th>
            )}
          </tr>
        </thead>
        <tbody>
          {move.lines?.map((line, i) => {
            const doneAmount = typeof line.doneQty === 'number' ? line.doneQty : line.demandQty;
            const variance = doneAmount - line.demandQty;

            return (
              <tr key={i}>
                <td style={{ textAlign: 'center', color: '#666' }}>{i + 1}</td>
                <td style={{ fontWeight: 600 }}>
                  {line.productName || line.product?.name || '—'}
                </td>
                <td>
                  <code style={{ fontSize: 11 }}>{line.sku || line.product?.sku || '—'}</code>
                </td>
                <td style={{ textAlign: 'center' }}>{line.uom}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{line.demandQty}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                  {move.status === 'done' ? doneAmount : '—'}
                </td>
                {type === 'adjustment' && (
                  <td style={{ 
                    textAlign: 'right', 
                    fontWeight: 600,
                    color: variance !== 0 ? '#ef4444' : '#666'
                  }}>
                    {move.status === 'done' ? (variance > 0 ? `+${variance}` : variance) : '—'}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={type === 'adjustment' ? 4 : 4} style={{ textAlign: 'right', fontWeight: 700 }}>
              TOTAL:
            </td>
            <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 16 }}>{totalQty}</td>
            <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 16 }}>
              {move.status === 'done' ? totalDone : '—'}
            </td>
            {type === 'adjustment' && (
              <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 16 }}>
                {move.status === 'done' ? (totalDone - totalQty > 0 ? `+${totalDone - totalQty}` : totalDone - totalQty) : '—'}
              </td>
            )}
          </tr>
        </tfoot>
      </table>

      {/* Signature Section */}
      <div className="print-signatures">
        <div className="print-signature-box">
          <div className="print-signature-line"></div>
          <div className="print-signature-label">Prepared By</div>
          <div className="print-signature-date">Date: _______________</div>
        </div>
        
        <div className="print-signature-box">
          <div className="print-signature-line"></div>
          <div className="print-signature-label">Checked By</div>
          <div className="print-signature-date">Date: _______________</div>
        </div>
        
        <div className="print-signature-box">
          <div className="print-signature-line"></div>
          <div className="print-signature-label">Approved By</div>
          <div className="print-signature-date">Date: _______________</div>
        </div>
      </div>

      {/* Footer */}
      <div className="print-footer">
        <div>
          This is a computer-generated document. No signature is required.
        </div>
        <div>
          Page 1 of 1 | Printed on {format(new Date(), 'dd MMM yyyy HH:mm')}
        </div>
      </div>

      {/* QR Code */}
      <div className="print-qrcode">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 30 }}>
          <div style={{ textAlign: 'center' }}>
            <QRCodeSVG 
              value={qrData}
              size={120}
              level="H"
              includeMargin={true}
              style={{ border: '2px solid #000', padding: 8, background: 'white' }}
            />
            <div style={{ fontSize: 11, marginTop: 8, fontWeight: 600 }}>
              Scan to view details
            </div>
          </div>
          
          <div style={{ textAlign: 'left', fontSize: 11, lineHeight: 1.8 }}>
            <div><strong>Reference:</strong> {move.reference}</div>
            <div><strong>Type:</strong> {cfg.label}</div>
            <div><strong>Status:</strong> {move.status.toUpperCase()}</div>
            <div><strong>Total Items:</strong> {totalQty} units</div>
          </div>
        </div>
      </div>
    </div>
  );
}
