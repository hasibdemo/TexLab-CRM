import React from 'react';
import { Quote } from '../../types';
import { companiesService } from '../../services/companiesService';
import { contactsService } from '../../services/contactsService';
import { settingsService } from '../../services/settingsService';
import Modal from '../common/Modal';
import { Printer, X, CheckCircle, Copy, ArrowRight } from 'lucide-react';

interface QuotePrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quote | null;
  onConvertToOrder?: (quote: Quote) => void;
  onDuplicateVersion?: (quote: Quote) => void;
}

export default function QuotePrintPreviewModal({
  isOpen,
  onClose,
  quote,
  onConvertToOrder,
  onDuplicateVersion,
}: QuotePrintPreviewModalProps) {
  if (!quote) return null;

  const company = companiesService.getCompanyById(quote.companyId);
  const contact = quote.contactId ? contactsService.getContactById(quote.contactId) : null;
  const settings = settingsService.getSettings();

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Document Preview - ${quote.quoteNumber}`} size="xl">
      <div className="space-y-4">
        {/* Action toolbar (hidden in print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200 print:hidden">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${
                quote.status === 'Accepted'
                  ? 'bg-emerald-100 text-emerald-800'
                  : quote.status === 'Sent'
                  ? 'bg-blue-100 text-blue-800'
                  : quote.status === 'Draft'
                  ? 'bg-gray-100 text-gray-700'
                  : quote.status === 'Rejected'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              Status: {quote.status}
            </span>
            {quote.version > 1 && (
              <span className="px-2 py-0.5 text-xs font-mono font-medium bg-purple-100 text-purple-800 rounded">
                Version {quote.version}
              </span>
            )}
            {quote.convertedToOrderId && (
              <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Converted to Order
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onDuplicateVersion && (
              <button
                type="button"
                onClick={() => onDuplicateVersion(quote)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-md shadow-xs transition"
              >
                <Copy className="w-3.5 h-3.5" />
                Duplicate as New Version
              </button>
            )}

            {onConvertToOrder && !quote.convertedToOrderId && (
              <button
                type="button"
                onClick={() => onConvertToOrder(quote)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md shadow-xs transition"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                Convert to Order
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md shadow-xs transition"
            >
              <Printer className="w-4 h-4" />
              Print / Save as PDF
            </button>
          </div>
        </div>

        {/* Printable Document Paper */}
        <div
          id="printable-quote-content"
          className="bg-white border border-gray-300 rounded-lg p-6 sm:p-10 shadow-sm text-gray-800 space-y-6 font-sans text-xs sm:text-sm print:border-none print:shadow-none print:p-0"
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b border-gray-300 pb-6">
            <div className="flex items-start gap-4">
              {/* Logo / Company Mark */}
              <div className="w-14 h-14 bg-blue-900 rounded-lg flex items-center justify-center text-white font-extrabold text-2xl tracking-tighter shrink-0 shadow-xs">
                TT
              </div>
              <div>
                <h1 className="text-xl font-bold text-blue-950 tracking-tight leading-tight">
                  {settings.companyName}
                </h1>
                <p className="text-xs text-gray-500 font-medium">{settings.tagline}</p>
                <div className="text-xs text-gray-600 mt-1 leading-snug">
                  <p>{settings.addressLine1}, {settings.addressLine2}</p>
                  <p>{settings.city}, {settings.country} {settings.postalCode ? `• ${settings.postalCode}` : ''}</p>
                  <p>Tax ID / TRN: <span className="font-mono">{settings.taxId}</span> • Tel: {settings.phone}</p>
                  <p>Email: {settings.email} • Web: {settings.website}</p>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="inline-block px-3 py-1 text-sm font-black uppercase tracking-wider bg-blue-50 text-blue-900 border border-blue-200 rounded">
                {quote.type === 'Proforma Invoice' ? 'PROFORMA INVOICE' : 'COMMERCIAL QUOTATION'}
              </span>
              <div className="mt-3 text-xs space-y-1 font-mono">
                <p>
                  <span className="text-gray-500 font-sans">Doc Ref:</span>{' '}
                  <strong className="text-blue-950 text-sm">{quote.quoteNumber}</strong>
                </p>
                <p>
                  <span className="text-gray-500 font-sans">Date:</span> {quote.date}
                </p>
                <p>
                  <span className="text-gray-500 font-sans">Valid Until:</span>{' '}
                  <span className="text-red-700 font-semibold">{quote.validityDate}</span>
                </p>
                <p>
                  <span className="text-gray-500 font-sans">Incoterm:</span>{' '}
                  <span className="font-bold">{quote.incoterm}</span> {quote.portOfDestination}
                </p>
              </div>
            </div>
          </div>

          {/* Parties Grid: Bill To & Logistics Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                CUSTOMER / CONSIGNEE:
              </h3>
              <p className="text-sm font-bold text-gray-950">{company?.name || 'Unnamed Company'}</p>
              {contact && (
                <p className="text-xs font-medium text-gray-700 mt-0.5">
                  Attn: {contact.name} ({contact.position})
                </p>
              )}
              <p className="text-xs text-gray-600 mt-1 whitespace-pre-line">
                {company?.address}
                <br />
                {company?.city}, {company?.country}
              </p>
              {contact && (
                <p className="text-xs text-gray-600 mt-1">
                  Email: {contact.email} • Tel: {contact.phone}
                </p>
              )}
            </div>

            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                SHIPPING & TRANSACTION SPECIFICATIONS:
              </h3>
              <div className="text-xs space-y-1 text-gray-700">
                <p>
                  <span className="text-gray-500">Port of Loading:</span> {quote.portOfLoading || 'Origin Container Terminal'}
                </p>
                <p>
                  <span className="text-gray-500">Destination Port:</span>{' '}
                  <strong>{quote.portOfDestination}</strong>
                </p>
                <p>
                  <span className="text-gray-500">Delivery Time:</span> {quote.deliveryTime}
                </p>
                <p>
                  <span className="text-gray-500">Payment Terms:</span>{' '}
                  <strong>{quote.paymentTerms}</strong>
                </p>
                <p>
                  <span className="text-gray-500">Currency of Settlement:</span>{' '}
                  <span className="font-bold font-mono">{quote.currency}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Itemized Line Items Table */}
          <div>
            <table className="w-full text-left border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-100 text-gray-700 text-xs uppercase tracking-wider border-b border-gray-200">
                  <th className="py-2.5 px-3 w-8 text-center font-bold">#</th>
                  <th className="py-2.5 px-3 font-bold">Description of Goods</th>
                  <th className="py-2.5 px-3 font-bold text-right">Quantity</th>
                  <th className="py-2.5 px-3 font-bold text-center">Unit</th>
                  <th className="py-2.5 px-3 font-bold text-right">Unit Price ({quote.currency})</th>
                  <th className="py-2.5 px-3 font-bold text-right">Amount ({quote.currency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-xs">
                {quote.lineItems.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-gray-50/50">
                    <td className="py-2.5 px-3 text-center text-gray-400 font-mono">{index + 1}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-gray-900">{item.productName}</div>
                      {item.description && (
                        <div className="text-gray-500 text-xs mt-0.5">{item.description}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium">
                      {item.quantity.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center text-gray-600 uppercase font-mono">
                      {item.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-gray-900">
                      {item.lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation Breakdown */}
          <div className="flex justify-end">
            <div className="w-full sm:w-80 space-y-2 text-xs border border-gray-200 bg-gray-50/50 p-4 rounded-lg">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span className="font-mono font-medium">
                  {quote.currency} {quote.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              {quote.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Special Discount:</span>
                  <span className="font-mono">
                    - {quote.currency}{' '}
                    {quote.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {quote.freightCharges > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Freight & Handling:</span>
                  <span className="font-mono">
                    + {quote.currency}{' '}
                    {quote.freightCharges.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-gray-300 flex justify-between font-extrabold text-sm text-blue-950">
                <span>GRAND TOTAL ({quote.incoterm}):</span>
                <span className="font-mono text-base">
                  {quote.currency} {quote.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Banking Instructions */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-lg p-4 text-xs">
            <h4 className="font-bold text-blue-950 uppercase tracking-wider mb-1">
              OFFICIAL BANK WIRE & REMITTANCE DETAILS:
            </h4>
            <p className="font-mono text-blue-900 font-medium whitespace-pre-wrap">{quote.bankDetails}</p>
          </div>

          {/* Terms & Conditions */}
          <div className="text-xs text-gray-600 space-y-1 border-t border-gray-200 pt-4">
            <h4 className="font-bold text-gray-800 uppercase tracking-wider">
              GENERAL TRADING TERMS & REMARKS:
            </h4>
            <div className="whitespace-pre-line text-xs font-sans text-gray-600 leading-relaxed">
              {quote.notesAndTerms}
            </div>
          </div>

          {/* Signatures & Execution */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-gray-300">
            <div className="space-y-12">
              <p className="text-xs font-bold text-gray-700 uppercase">
                ISSUED BY: {settings.companyName}
              </p>
              <div className="border-t border-gray-400 pt-1 text-xs text-gray-500">
                Authorized Signature & Company Stamp
                <br />
                <span className="text-gray-700 font-medium">{quote.createdBy}</span>
              </div>
            </div>

            <div className="space-y-12 text-right">
              <p className="text-xs font-bold text-gray-700 uppercase">
                ACCEPTED & CONFIRMED BY BUYER:
              </p>
              <div className="border-t border-gray-400 pt-1 text-xs text-gray-500">
                Authorized Signatory & Date
                <br />
                <span className="text-gray-700 font-medium">{company?.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal close bottom */}
        <div className="flex justify-end gap-3 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Close Preview
          </button>
        </div>
      </div>
    </Modal>
  );
}
