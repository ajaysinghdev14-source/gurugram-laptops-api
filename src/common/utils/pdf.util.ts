import PDFDocument from 'pdfkit';

export class PdfUtil {
  public static async generateOrderInvoice(
    customerName: string,
    orderId: string,
    totalAmount: string,
    shippingAddress: any,
    items: any[]
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // 1. Header
        doc.fillColor('#111111').fontSize(24).font('Helvetica-Bold').text('TechReborn', 50, 50);
        doc.fontSize(10).font('Helvetica').fillColor('#666666');
        doc.text('123 Tech Lane', 200, 50, { align: 'right' });
        doc.text('San Francisco, CA 94107', 200, 65, { align: 'right' });
        doc.text('support@techreborn.com', 200, 80, { align: 'right' });

        doc.moveTo(50, 110).lineTo(545, 110).lineWidth(1).strokeColor('#eeeeee').stroke();

        // 2. Billing & Shipping Info
        doc.fontSize(14).fillColor('#111111').font('Helvetica-Bold').text('INVOICE TO', 50, 140);
        doc.fontSize(10).font('Helvetica').fillColor('#444444');
        doc.text(customerName, 50, 160);
        doc.text(shippingAddress.address, 50, 175);
        doc.text(`${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}`, 50, 190);
        doc.text(`Phone: ${shippingAddress.phone}`, 50, 205);

        // 3. Order Details
        const shortOrderId = orderId?.split('-')[0]?.toUpperCase() || 'UNKNOWN';
        doc.fontSize(14).fillColor('#111111').font('Helvetica-Bold').text('ORDER DETAILS', 300, 140);
        doc.fontSize(10).font('Helvetica').fillColor('#444444');
        doc.text(`Order ID: #${shortOrderId}`, 300, 160);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 300, 175);
        doc.text(`Status: Paid`, 300, 190);

        // 4. Table Header
        let y = 260;
        doc.fillColor('#f8fafc').rect(50, y - 10, 495, 30).fill();
        
        doc.fillColor('#666666').font('Helvetica-Bold').fontSize(10);
        doc.text('ITEM', 60, y);
        doc.text('QTY', 330, y, { width: 50, align: 'center' });
        doc.text('PRICE', 400, y, { width: 60, align: 'right' });
        doc.text('TOTAL', 480, y, { width: 55, align: 'right' });
        
        y += 35;
        doc.font('Helvetica').fillColor('#333333');

        // 5. Items
        const formatInr = (amount: number) => {
          return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
          }).format(amount);
        };

        for (const item of items) {
          doc.text(item.productName, 60, y, { width: 260 });
          
          if (item.variantName) {
            doc.fontSize(8).fillColor('#888888').text(`Variant: ${item.variantName}`, 60, y + 15, { width: 260 });
            doc.fontSize(10).fillColor('#333333');
          }
          
          doc.text(item.quantity.toString(), 330, y, { width: 50, align: 'center' });
          doc.text(formatInr(Number(item.price)), 400, y, { width: 60, align: 'right' });
          doc.text(formatInr(Number(item.price) * item.quantity), 480, y, { width: 55, align: 'right' });
          
          y += 35;
          doc.moveTo(50, y - 10).lineTo(545, y - 10).lineWidth(1).strokeColor('#f1f5f9').stroke();
        }

        // 6. Total
        y += 10;
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#111111');
        doc.text('GRAND TOTAL:', 350, y, { width: 100, align: 'right' });
        doc.fillColor('#10b981').text(formatInr(Number(totalAmount)), 460, y, { width: 75, align: 'right' });

        // 7. Footer
        doc.font('Helvetica').fontSize(10).fillColor('#999999');
        doc.text(
          'Thank you for shopping with TechReborn! If you have any questions about this invoice, please contact support@techreborn.com.', 
          50, 
          750, 
          { align: 'center', width: 495 }
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
