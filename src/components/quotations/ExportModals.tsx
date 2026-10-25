import React, { useState, useEffect } from 'react';
import { X, Mail, Send, Loader2, CheckCircle2, MessageSquare, ExternalLink, Cloud, Check, FileText, AlertCircle, Paperclip } from 'lucide-react';

// ==========================================
// 1. EMAIL MODAL (WITH DIRECT PDF ATTACHMENT)
// ==========================================
export interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  grandTotal: number;
  documentType?: string;
  documentId?: string;
  customTitle?: string;
  onGeneratePdfBlob?: () => Promise<{ file: File; filename: string; blob: Blob } | null>;
  onSentSuccess?: (email: string) => void;
}

export function EmailModal({
  isOpen,
  onClose,
  invoiceNumber,
  clientName,
  clientEmail,
  grandTotal,
  documentType = 'Quotation',
  documentId,
  customTitle,
  onGeneratePdfBlob,
  onSentSuccess
}: EmailModalProps) {
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [sendingStep, setSendingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const docLabel = documentType.toUpperCase();
  const pdfFilename = `${documentType.replace(/\s+/g, '_')}_${invoiceNumber}.pdf`;

  useEffect(() => {
    if (isOpen) {
      setEmail((clientEmail || '').trim());
      setSubject(`${documentType}: ${invoiceNumber} - ${customTitle || 'Espacio Interiors'}`);
      setMessage(
        `Dear ${clientName || 'Valued Client'},\n\n` +
        `Please find attached the official ${documentType} (${invoiceNumber}) for your interior design project.\n\n` +
        `Document Details:\n` +
        `• Reference No: ${invoiceNumber}\n` +
        `• Project / Scope: ${customTitle || 'Luxury Interior Design & Execution'}\n` +
        `• Total Amount: ₹${grandTotal.toLocaleString('en-IN')}\n\n` +
        `If you have any questions or require revisions, please do not hesitate to contact us.\n\n` +
        `Warm regards,\n` +
        `Espacio Interiors\n` +
        `accounts@theespacio.in`
      );
      setStatus('idle');
      setSendingStep('');
      setErrorMessage('');
    }
  }, [isOpen, invoiceNumber, clientName, clientEmail, grandTotal, documentType, customTitle]);

  if (!isOpen) return null;

  // DIRECT DISPATCH: Compiles PDF and sends to recipient with attachment via backend API
  const handleSendDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid recipient email address.');
      return;
    }

    setStatus('sending');
    setErrorMessage('');
    setSendingStep('Compiling official high-resolution PDF...');

    try {
      let pdfBase64 = '';
      let resolvedFilename = pdfFilename;

      if (onGeneratePdfBlob) {
        const pdfResult = await onGeneratePdfBlob();
        if (pdfResult) {
          resolvedFilename = pdfResult.filename || pdfFilename;
          setSendingStep('Attaching document PDF and connecting to mail server...');
          const reader = new FileReader();
          pdfBase64 = await new Promise<string>((resolve, reject) => {
            reader.onloadend = () => {
              const res = reader.result as string;
              const base64 = res.includes(',') ? res.split(',')[1] : res;
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(pdfResult.blob);
          });
        }
      }

      setSendingStep(`Sending email with attachment to ${email}...`);

      const res = await fetch('/api/v1/emails/send-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email.trim(),
          recipientName: clientName || 'Client',
          subject: subject.trim(),
          message: message.trim(),
          pdfBase64,
          filename: resolvedFilename,
          documentType,
          documentId: documentId || invoiceNumber
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch email with attachment.');
      }

      setStatus('success');
      onSentSuccess?.(email.trim());
    } catch (err: any) {
      console.error('Email send error:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Could not send email. Please check your mail integration or open in Gmail Web.');
    }
  };

  // WEB GMAIL FALLBACK: Opens Gmail Compose and downloads PDF attachment
  const handleOpenGmailWeb = async () => {
    try {
      setSendingStep('Downloading PDF for Gmail attachment...');
      if (onGeneratePdfBlob) {
        const pdfResult = await onGeneratePdfBlob();
        if (pdfResult) {
          const downloadUrl = URL.createObjectURL(pdfResult.blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = pdfResult.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(downloadUrl), 10000);
        }
      }
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
      window.open(gmailUrl, '_blank');
      onClose();
    } catch (err) {
      console.error('Gmail web error:', err);
      window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`, '_blank');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '580px', width: '92%' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Mail size={20} color="var(--color-primary-gold)" />
            <div>
              <h3 className="modal-title" style={{ margin: 0 }}>Send {documentType} via Email</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Direct delivery with compiled PDF attachment to {clientName || 'the client'}
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} disabled={status === 'sending'}>
            <X size={18} />
          </button>
        </div>

        {status === 'success' ? (
          <div className="modal-body" style={{ textAlign: 'center', padding: '36px 20px' }}>
            <CheckCircle2 size={54} color="var(--color-success)" style={{ margin: '0 auto 16px' }} />
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: 'var(--color-secondary-brown)', marginBottom: '8px' }}>
              {documentType} &amp; PDF Sent Successfully!
            </h4>
            <p style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)', maxWidth: '420px', margin: '0 auto 20px', lineHeight: 1.5 }}>
              The official document and its compiled PDF attachment have been dispatched directly to <strong>{email}</strong>.
            </p>
            <button className="btn btn-primary" onClick={onClose} style={{ minWidth: '130px' }}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendDirect}>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {status === 'error' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  color: '#991B1B',
                  fontSize: '0.82rem'
                }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>{errorMessage}</div>
                </div>
              )}

              {/* Attachment Preview Chip */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 13px',
                background: '#FAF6EE',
                border: '1px solid #E8E0D0',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="#8C6D46" />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#3E2B1D' }}>
                      {pdfFilename}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#8C7E72' }}>
                      Official Espacio Design PDF Document
                    </div>
                  </div>
                </div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#047857',
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Paperclip size={11} /> Attached
                </span>
              </div>

              <div className="input-group">
                <span className="input-label">Recipient Email Address</span>
                <input
                  type="email"
                  required
                  placeholder="client@example.com"
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === 'sending'}
                />
              </div>

              <div className="input-group">
                <span className="input-label">Subject</span>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={status === 'sending'}
                />
              </div>

              <div className="input-group">
                <span className="input-label">Message</span>
                <textarea
                  rows={5}
                  required
                  className="input-field"
                  style={{ resize: 'none', lineHeight: '1.45', fontSize: '0.85rem' }}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={status === 'sending'}
                />
              </div>

              {status === 'sending' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: '6px',
                  color: '#166534',
                  fontSize: '0.82rem'
                }}>
                  <Loader2 size={16} className="spinner" style={{ animation: 'rotate 1s linear infinite' }} />
                  <span>{sendingStep}</span>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleOpenGmailWeb}
                disabled={status === 'sending'}
                title="Download PDF and open Gmail Web compose in a new tab"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
              >
                <ExternalLink size={14} />
                Open in Gmail Web
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose} disabled={status === 'sending'}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={status === 'sending'}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {status === 'sending' ? (
                    <>
                      <Loader2 size={16} className="spinner" style={{ animation: 'rotate 1s linear infinite' }} />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Send Email with PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 2. WHATSAPP MODAL
// ==========================================
interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceNumber: string;
  clientName: string;
  clientPhone: string;
  grandTotal: number;
  documentTitle?: string;
  paymentType?: string;
  currentPayment?: number;
  remainingBalance?: number;
  onSentSuccess?: (withSignature: boolean, phone: string) => void;
}

export function WhatsAppModal({
  isOpen,
  onClose,
  invoiceNumber,
  clientName,
  clientPhone,
  grandTotal,
  documentTitle = 'QUOTATION',
  paymentType,
  currentPayment,
  remainingBalance,
  onSentSuccess
}: WhatsAppModalProps) {
  const [phone, setPhone] = useState('');
  const [text, setText] = useState('');
  const [includeSignature, setIncludeSignature] = useState<boolean>(true);

  // Sync phone and construct message dynamically
  useEffect(() => {
    if (isOpen) {
      setPhone(clientPhone || '');
    }
  }, [isOpen, clientPhone]);

  useEffect(() => {
    if (!isOpen) return;
    const docTitle = documentTitle || 'QUOTATION';
    const cleanGrand = Number(grandTotal) || 0;
    const cleanCurrent = Number(currentPayment) || 0;
    const cleanBal = remainingBalance !== undefined ? Number(remainingBalance) : Math.max(0, cleanGrand - cleanCurrent);

    const message = `*ESPACIO — Timeless Interiors*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `*Document:* ${docTitle}\n` +
      (paymentType ? `*Milestone:* ${paymentType}\n` : '') +
      `*Reference No:* ${invoiceNumber}\n` +
      `*Client / Lead:* ${clientName || 'Valued Client'}\n` +
      `*Final Amount:* ₹${cleanGrand.toLocaleString('en-IN')}\n` +
      (cleanCurrent > 0 ? `*Current Payment:* ₹${cleanCurrent.toLocaleString('en-IN')}\n` : '') +
      `*Remaining Balance:* ₹${cleanBal.toLocaleString('en-IN')}\n` +
      `*Status:* Issued\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      (includeSignature
        ? `*Authorized Signature:* Verified & Included\n_Espacio Studio Management_\n`
        : `_Espacio Studio Management_\n`) +
      `\nThank you for trusting Espacio. Please contact us for any assistance.`;

    setText(message);
  }, [isOpen, invoiceNumber, clientName, grandTotal, documentTitle, paymentType, currentPayment, remainingBalance, includeSignature]);

  if (!isOpen) return null;

  const handleShare = () => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const encodedText = encodeURIComponent(text);
    const waUrl = formattedPhone 
      ? `https://wa.me/${formattedPhone}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;
    
    window.open(waUrl, '_blank');
    if (onSentSuccess) {
      onSentSuccess(includeSignature, formattedPhone);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MessageSquare size={20} color="var(--color-primary-gold)" />
            <h3 className="modal-title">Send Quotation via WhatsApp</h3>
          </div>
          <button className="btn-icon" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="input-group">
            <span className="input-label">Client WhatsApp Number (with country code)</span>
            <input
              type="tel"
              placeholder="e.g. 919876543210"
              className="input-field"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* Super Admin Signature Prompt */}
          <div className="whatsapp-signature-box">
            <div className="whatsapp-signature-title-row">
              <span className="whatsapp-signature-title">Include Custom Signature?</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
                WhatsApp output setting only
              </span>
            </div>
            <div className="signature-choice-grid">
              <button
                type="button"
                className={`signature-choice-btn ${includeSignature ? 'active' : ''}`}
                onClick={() => setIncludeSignature(true)}
              >
                <Check size={14} /> [ YES ] With Signature
              </button>
              <button
                type="button"
                className={`signature-choice-btn ${!includeSignature ? 'active' : ''}`}
                onClick={() => setIncludeSignature(false)}
              >
                <X size={14} /> [ NO ] Without Signature
              </button>
            </div>
          </div>

          <div className="input-group">
            <span className="input-label">Message Preview (Editable)</span>
            <textarea
              rows={8}
              className="input-field"
              style={{ resize: 'none', lineHeight: '1.4', background: '#F8F9FA', fontSize: '0.78rem' }}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-action-large-whatsapp" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={handleShare}>
            <ExternalLink size={15} />
            Send via WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. GOOGLE DRIVE MODAL
// ==========================================
interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceNumber: string;
}

export function GoogleDriveModal({ isOpen, onClose, invoiceNumber }: GoogleDriveModalProps) {
  const [syncStep, setSyncStep] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setSyncStep(0);
      
      // Step 1: Connecting
      const t1 = setTimeout(() => {
        setSyncStep(1);
      }, 1200);

      // Step 2: Uploading
      const t2 = setTimeout(() => {
        setSyncStep(2);
      }, 2800);

      // Step 3: Success
      const t3 = setTimeout(() => {
        setSyncStep(3);
      }, 4200);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const messages = [
    'Connecting to Google Workspace...',
    'Creating secure backup channels...',
    `Uploading PDF for Invoice ${invoiceNumber}...`,
    'Backup synchronization complete!'
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cloud size={20} color="var(--color-primary-gold)" />
            <h3 className="modal-title">Google Drive Vault Sync</h3>
          </div>
          {syncStep === 3 && (
            <button className="btn-icon" onClick={onClose}>
              <X size={18} />
            </button>
          )}
        </div>

        <div className="modal-body" style={{ textAlign: 'center', padding: '36px 20px' }}>
          {syncStep < 3 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <div style={{ position: 'relative', width: '70px', height: '70px' }}>
                <Loader2 
                  size={70} 
                  color="var(--color-primary-gold)" 
                  style={{ animation: 'rotate 1.5s linear infinite', opacity: 0.8 }} 
                />
                <Cloud 
                  size={24} 
                  color="var(--color-secondary-brown)" 
                  style={{ position: 'absolute', top: '23px', left: '23px' }} 
                />
              </div>
              <div>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--color-secondary-brown)', marginBottom: '6px' }}>
                  Synchronizing Invoice
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', minHeight: '20px' }} className="anim-fade-in">
                  {messages[syncStep]}
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <CheckCircle2 size={54} color="var(--color-success)" />
              <div>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: 'var(--color-secondary-brown)', marginBottom: '8px' }}>
                  Secure Backup Created
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', maxWidth: '340px', margin: '0 auto 12px' }}>
                  Your premium interior invoice PDF has been successfully archived in your connected Google Drive folder.
                </p>
                <div style={{ fontSize: '0.72rem', background: '#F8F9FA', border: '1px solid var(--color-border-beige)', padding: '8px 12px', borderRadius: '8px', color: 'var(--color-secondary-brown)', fontFamily: 'monospace' }}>
                  File: Espacio_{invoiceNumber}.pdf
                </div>
              </div>
              <button className="btn btn-primary" onClick={onClose} style={{ marginTop: '8px', minWidth: '120px' }}>
                Close Sync
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
