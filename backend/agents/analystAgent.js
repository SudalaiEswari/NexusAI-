// agents/analystAgent.js — SQL + insights + chart data

const db = require('../db/database');
const { callAI } = require('../services/aiService');

const DB_SCHEMA = `
SQLite tables:
- sales(id, product, region, amount, quantity, sale_date, salesperson)
- customers(id, name, email, phone, company, plan, joined_on)
- tickets(id, ticket_id, customer, issue, status, priority, created_at)
- candidates(id, name, skills, experience, score, status, applied_role, applied_on)
Products: 'Laptop Pro X1','Wireless Mouse','Monitor 27"','Keyboard Pro','Webcam HD','USB Hub 7-Port'
Regions: North, South, East, West
`;

const SQL_PROMPT = `You are a SQLite expert. ${DB_SCHEMA}
Generate ONLY the raw SQL SELECT query — no markdown, no explanation. Limit 50 rows.`;

const INSIGHT_PROMPT = `You are a senior business analyst. Given SQL results, generate a concise business insight with:
- Brief summary paragraph
- 4-5 bullet points with emojis and specific numbers
- One actionable recommendation
Be specific with numbers from the data provided.`;

async function analyzeQuery(question, lang = 'en') {
  const sql = await callAI(SQL_PROMPT, question, 'en'); // Always generate SQL in English
  const cleanSQL = sql.replace(/```sql|```/g, '').trim();

  let results = [];
  let sqlError = null;
  try {
    results = db.prepare(cleanSQL).all();
  } catch (err) {
    sqlError = err.message;
    results = db.prepare(`
      SELECT product, COUNT(*) as orders, ROUND(SUM(amount*quantity),2) as revenue
      FROM sales GROUP BY product ORDER BY revenue DESC
    `).all();
  }

  const insights = await callAI(
    INSIGHT_PROMPT,
    `Question: "${question}"\nSQL: ${cleanSQL}\nData (${results.length} rows): ${JSON.stringify(results.slice(0, 20))}`,
    lang
  );

  // Build chart data from results
  const chartData = buildChartData(results, cleanSQL, question);

  return { success: true, question, sql: cleanSQL, sqlError, results, rowCount: results.length, insights, chartData };
}

/** Build Chart.js compatible data from query results */
function buildChartData(results, sql, question) {
  if (!results || results.length === 0) return null;
  const keys = Object.keys(results[0]);

  // Detect label key (first non-numeric column) and value key (first numeric)
  const labelKey = keys.find(k => typeof results[0][k] === 'string') || keys[0];
  const valueKey = keys.find(k => typeof results[0][k] === 'number') || keys[1];

  if (!labelKey || !valueKey) return null;

  const COLORS = [
    '#00d4ff','#a855f7','#22c55e','#ff6b35','#f59e0b',
    '#ec4899','#06b6d4','#8b5cf6','#10b981','#f97316'
  ];

  const labels = results.slice(0, 10).map(r => String(r[labelKey]).substring(0, 20));
  const values = results.slice(0, 10).map(r => Number(r[valueKey]) || 0);

  // Choose chart type based on query content
  const ql = question.toLowerCase();
  const chartType = ql.includes('trend') || ql.includes('monthly') || ql.includes('over time')
    ? 'line'
    : results.length <= 5 ? 'doughnut' : 'bar';

  return {
    type: chartType,
    labels,
    datasets: [{
      label: valueKey.replace(/_/g, ' '),
      data: values,
      backgroundColor: chartType === 'doughnut'
        ? COLORS.slice(0, labels.length)
        : COLORS[0] + '99',
      borderColor: chartType === 'doughnut'
        ? COLORS.slice(0, labels.length)
        : COLORS[0],
      borderWidth: 2,
      borderRadius: chartType === 'bar' ? 6 : 0,
    }]
  };
}

// Pre-built dashboard chart: revenue by product
function getRevenueByProductChart() {
  const rows = db.prepare(`SELECT product, ROUND(SUM(amount*quantity),0) as revenue FROM sales GROUP BY product ORDER BY revenue DESC`).all();
  return buildChartData(rows, 'revenue by product bar chart', 'What is revenue by product?');
}

// Pre-built dashboard chart: sales by region (pie/doughnut)
function getSalesByRegionChart() {
  const rows = db.prepare(`SELECT region, ROUND(SUM(amount*quantity),0) as revenue FROM sales GROUP BY region ORDER BY revenue DESC`).all();
  const r = buildChartData(rows, 'regional', 'region sales doughnut');
  if (r) r.type = 'doughnut';
  return r;
}

// Monthly trend chart
function getMonthlySalesChart() {
  const rows = db.prepare(`
    SELECT strftime('%Y-%m', sale_date) as month, ROUND(SUM(amount*quantity),0) as revenue
    FROM sales GROUP BY month ORDER BY month
  `).all();
  const r = buildChartData(rows, 'trend monthly', 'monthly trend line');
  if (r) r.type = 'line';
  return r;
}

function getStats() {
  return {
    totalRevenue: db.prepare(`SELECT ROUND(SUM(amount*quantity),2) as v FROM sales`).get().v,
    totalOrders:  db.prepare(`SELECT COUNT(*) as v FROM sales`).get().v,
    topProduct:   db.prepare(`SELECT product FROM sales GROUP BY product ORDER BY SUM(amount*quantity) DESC LIMIT 1`).get()?.product,
    topRegion:    db.prepare(`SELECT region FROM sales GROUP BY region ORDER BY SUM(amount*quantity) DESC LIMIT 1`).get()?.region,
  };
}

module.exports = { analyzeQuery, getStats, getRevenueByProductChart, getSalesByRegionChart, getMonthlySalesChart };
