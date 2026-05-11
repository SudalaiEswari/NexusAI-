const PDFDocument = require('pdfkit');

/**
 * generateAnalystPDF — Creates a business analysis report
 */
async function generateAnalystPDF(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Header
      doc.fillColor('#00d4ff').fontSize(24).text('NEXUS AI', { align: 'right' });
      doc.fillColor('#444444').fontSize(10).text('Business Analysis Report', { align: 'right' });
      doc.moveDown(2);

      // Question
      doc.fillColor('#000000').fontSize(14).text('Search Query:', { underline: true });
      doc.fontSize(12).text(data.question || 'N/A');
      doc.moveDown();

      // SQL
      doc.fillColor('#333333').fontSize(10).text('Generated SQL:', { oblique: true });
      doc.fillColor('#006699').font('Courier').fontSize(9).text(data.sql || '-- No SQL generated');
      doc.font('Helvetica').moveDown(2);

      // Data Table (simple version)
      doc.fillColor('#000000').fontSize(14).text('Data Results:', { underline: true });
      doc.moveDown(0.5);
      
      if (data.results && data.results.length > 0) {
        const keys = Object.keys(data.results[0]);
        // Draw Table Header
        let y = doc.y;
        doc.fontSize(10).font('Helvetica-Bold');
        keys.forEach((key, i) => doc.text(key.toUpperCase(), 50 + (i * 100), y, { width: 90 }));
        doc.moveTo(50, y + 15).lineTo(550, y + 15).stroke();
        doc.moveDown(0.8);

        // Draw Rows (limit to first 15 for PDF)
        doc.font('Helvetica').fontSize(9);
        data.results.slice(0, 15).forEach(row => {
          y = doc.y;
          keys.forEach((key, i) => doc.text(String(row[key]), 50 + (i * 100), y, { width: 90 }));
          doc.moveDown(0.5);
        });
        if (data.results.length > 15) doc.text(`... and ${data.results.length - 15} more rows.`, { italic: true });
      } else {
        doc.text('No numeric results found.');
      }

      doc.moveDown(2);

      // Insights
      doc.fillColor('#000000').fontSize(14).text('AI Business Insights:', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).text(data.insights || 'No insights generated.');

      // Footer
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#999999').text(
          `Generated on ${new Date().toLocaleString()} | Page ${i + 1} of ${range.count}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * generateCandidatePDF — Creates a recruitment evaluation report
 */
async function generateCandidatePDF(candidate, evaluation) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Header
      doc.fillColor('#a855f7').fontSize(24).text('NEXUS AI', { align: 'right' });
      doc.fillColor('#444444').fontSize(10).text('Candidate Evaluation Report', { align: 'right' });
      doc.moveDown(2);

      // Score Section
      doc.rect(50, doc.y, 500, 80).fill('#f3f4f6').stroke('#e5e7eb');
      doc.fillColor('#a855f7').fontSize(36).text(String(candidate.score), 70, doc.y + 20, { continued: true });
      doc.fontSize(16).fillColor('#666666').text(' / 100', { continued: false });
      doc.fontSize(14).fillColor('#000000').text(candidate.status || 'Pending', 350, doc.y - 30, { align: 'right' });
      doc.moveDown(3);

      // Candidate Profile
      doc.fillColor('#000000').fontSize(18).text(candidate.name, { underline: true });
      doc.fontSize(12).text(`Applied Role: ${candidate.applied_role || 'N/A'}`);
      doc.text(`Experience: ${candidate.experience || 0} years`);
      doc.text(`Email: ${candidate.email || 'N/A'}`);
      doc.moveDown();

      // Skills
      doc.fontSize(14).text('Technical Skills:', { underline: true });
      doc.fontSize(11).text(candidate.skills || 'Not provided');
      doc.moveDown();

      // AI Evaluation
      doc.fontSize(14).text('Detailed AI Evaluation:', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).text(evaluation || 'No detailed evaluation available.');

      // Footer
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#999999').text(
          `Official Evaluation Report | ${new Date().toLocaleDateString()} | Page ${i + 1} of ${range.count}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateAnalystPDF, generateCandidatePDF };
