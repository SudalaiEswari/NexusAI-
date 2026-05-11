const pdfService = require('./services/pdfService');
const fs = require('fs');

async function testPDF() {
  try {
    console.log('Testing Analyst PDF...');
    const buf1 = await pdfService.generateAnalystPDF({
      question: 'Highest sales per month',
      sql: 'SELECT month, sales FROM monthly_sales',
      results: [{ month: 'Jan', sales: 1200 }, { month: 'Feb', sales: 1500 }],
      insights: 'Sales are rising steadily in Q1.'
    });
    fs.writeFileSync('direct_analyst.pdf', buf1);
    console.log('✅ Analyst PDF generated: direct_analyst.pdf');

    console.log('Testing Recruitment PDF...');
    const buf2 = await pdfService.generateCandidatePDF({
      name: 'Test Candidate',
      score: 95,
      status: 'Selected',
      applied_role: 'Senior Developer',
      experience: 5,
      skills: 'React, Node, AWS',
      email: 'test@example.com'
    }, 'Excellent fit for the team. High technical score.');
    fs.writeFileSync('direct_recruit.pdf', buf2);
    console.log('✅ Recruitment PDF generated: direct_recruit.pdf');

  } catch (e) {
    console.error('❌ PDF generation failed:', e);
  }
}

testPDF();
