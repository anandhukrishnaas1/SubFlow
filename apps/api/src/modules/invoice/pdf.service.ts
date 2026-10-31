import { Injectable, Logger } from '@nestjs/common';
const PDFDocument = require('pdfkit');

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  async generateInvoicePdf(invoice: any, items: any[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Header
        doc.fontSize(24).font('Helvetica-Bold').fillColor('#0f172a').text('SubFlow', 40, 40);
        doc.fontSize(10).font('Helvetica').fillColor('#64748b').text('Subscription Management Platform', 40, 68);

        // Invoice Badge
        doc.fontSize(18).font('Helvetica-Bold').fillColor('#2563eb').text('INVOICE', 400, 40, { align: 'right' });
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text(`#${invoice.number}`, 400, 64, { align: 'right' });
        doc.fontSize(9).font('Helvetica').fillColor('#64748b').text(`Status: ${(invoice.status || 'UNPAID').toUpperCase()}`, 400, 78, { align: 'right' });

        doc.moveTo(40, 100).lineTo(555, 100).strokeColor('#e2e8f0').stroke();

        // Customer & Invoice Details
        let y = 115;
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#334155').text('Billed To:', 40, y);
        doc.fontSize(10).font('Helvetica').fillColor('#0f172a').text(invoice.customerName || 'Valued Customer', 40, y + 15);
        doc.fontSize(9).font('Helvetica').fillColor('#64748b').text(invoice.customerEmail || '', 40, y + 30);

        doc.fontSize(10).font('Helvetica-Bold').fillColor('#334155').text('Invoice Details:', 350, y);
        doc.fontSize(9).font('Helvetica').fillColor('#64748b').text(`Issue Date: ${invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : 'N/A'}`, 350, y + 15);
        doc.fontSize(9).font('Helvetica').fillColor('#64748b').text(`Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}`, 350, y + 28);
        if (invoice.subscriptionNumber) {
          doc.fontSize(9).font('Helvetica').fillColor('#64748b').text(`Subscription: ${invoice.subscriptionNumber}`, 350, y + 41);
        }

        // Table Header
        y = 185;
        doc.rect(40, y, 515, 24).fill('#f8fafc');
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#475569');
        doc.text('DESCRIPTION', 50, y + 7);
        doc.text('QTY', 320, y + 7, { width: 40, align: 'center' });
        doc.text('UNIT PRICE', 380, y + 7, { width: 70, align: 'right' });
        doc.text('AMOUNT', 470, y + 7, { width: 75, align: 'right' });

        y += 28;
        doc.font('Helvetica').fontSize(9).fillColor('#1e293b');

        (items || []).forEach((item) => {
          const name = item.productName || item.description || 'Service Item';
          const qty = item.quantity || 1;
          const price = Number(item.unitPrice || 0).toFixed(2);
          const total = Number(item.total || 0).toFixed(2);

          doc.text(name, 50, y);
          doc.text(qty.toString(), 320, y, { width: 40, align: 'center' });
          doc.text(`$${price}`, 380, y, { width: 70, align: 'right' });
          doc.text(`$${total}`, 470, y, { width: 75, align: 'right' });
          y += 20;
        });

        // Totals
        y += 10;
        doc.moveTo(350, y).lineTo(555, y).strokeColor('#e2e8f0').stroke();
        y += 10;

        doc.fontSize(9).font('Helvetica').fillColor('#64748b').text('Subtotal:', 350, y);
        doc.font('Helvetica-Bold').fillColor('#0f172a').text(`$${Number(invoice.subtotal || 0).toFixed(2)}`, 450, y, { width: 95, align: 'right' });
        y += 16;

        if (invoice.taxAmount > 0) {
          doc.fontSize(9).font('Helvetica').fillColor('#64748b').text('Tax:', 350, y);
          doc.font('Helvetica-Bold').fillColor('#0f172a').text(`$${Number(invoice.taxAmount || 0).toFixed(2)}`, 450, y, { width: 95, align: 'right' });
          y += 16;
        }

        if (invoice.discountAmount > 0) {
          doc.fontSize(9).font('Helvetica').fillColor('#16a34a').text('Discount:', 350, y);
          doc.font('Helvetica-Bold').fillColor('#16a34a').text(`-$${Number(invoice.discountAmount || 0).toFixed(2)}`, 450, y, { width: 95, align: 'right' });
          y += 16;
        }

        doc.moveTo(350, y).lineTo(555, y).strokeColor('#cbd5e1').stroke();
        y += 8;

        doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a').text('Total Due:', 350, y);
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#2563eb').text(`$${Number(invoice.total || 0).toFixed(2)}`, 450, y, { width: 95, align: 'right' });

        // Footer
        doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text('Thank you for choosing SubFlow. For questions regarding this invoice, contact billing@subflow.io', 40, 750, { align: 'center', width: 515 });

        doc.end();
      } catch (err) {
        this.logger.error(`Error generating PDF: ${err.message}`);
        reject(err);
      }
    });
  }
}
