/**
 * Seed demo expense data for presentation.
 * Run: npx tsx --env-file=.env scripts/seed-expenses.ts
 */
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/agrifuture",
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

async function seed() {
  // Find first user
  const { rows } = await pool.query("SELECT id FROM users ORDER BY created_at LIMIT 1");
  if (!rows[0]) { console.log("No users found — create an account first."); process.exit(1); }
  const userId = rows[0].id;
  console.log(`Seeding expenses for user: ${userId}`);

  // Check existing
  const { rows: existing } = await pool.query("SELECT COUNT(*) AS count FROM expenses WHERE user_id = $1", [userId]);
  if (Number(existing[0].count) > 5) {
    console.log(`User already has ${existing[0].count} expenses. Skipping.`);
    process.exit(0);
  }

  const entries = [
    // Nov 2025
    { date: '2025-11-05', category: 'Seeds', description: 'Wheat HD-2967 certified seeds 40kg', amount: 2800 },
    { date: '2025-11-08', category: 'Fertilizer', description: 'DAP 50kg bag', amount: 1350 },
    { date: '2025-11-12', category: 'Labor', description: 'Field preparation & sowing (4 workers × 2 days)', amount: 4800 },
    { date: '2025-11-20', category: 'Irrigation', description: 'Diesel for pump set — first irrigation', amount: 1200 },
    // Dec 2025
    { date: '2025-12-01', category: 'Pesticide', description: 'Sulfosulfuron herbicide 300ml', amount: 650 },
    { date: '2025-12-10', category: 'Fertilizer', description: 'Urea 45kg — first top dressing', amount: 540 },
    { date: '2025-12-18', category: 'Irrigation', description: 'Second irrigation cycle', amount: 1100 },
    // Jan 2026
    { date: '2026-01-05', category: 'Fertilizer', description: 'Urea 45kg — second top dressing', amount: 540 },
    { date: '2026-01-15', category: 'Irrigation', description: 'Third irrigation', amount: 1100 },
    { date: '2026-01-22', category: 'Labor', description: 'Weeding & field maintenance (3 workers)', amount: 2400 },
    // Feb 2026
    { date: '2026-02-05', category: 'Irrigation', description: 'Fourth irrigation + sprinkler repair', amount: 1800 },
    { date: '2026-02-15', category: 'Equipment', description: 'Sprayer nozzle replacement', amount: 350 },
    { date: '2026-02-20', category: 'Pesticide', description: 'Propiconazole fungicide for yellow rust', amount: 850 },
    // Mar 2026
    { date: '2026-03-01', category: 'Irrigation', description: 'Fifth irrigation', amount: 1100 },
    { date: '2026-03-10', category: 'Labor', description: 'Harvesting labor (6 workers × 3 days)', amount: 10800 },
    { date: '2026-03-15', category: 'Equipment', description: 'Combine harvester rental', amount: 4500 },
    { date: '2026-03-20', category: 'Other', description: 'Transport to mandi — 2 trips', amount: 1600 },
    // Revenue
    { date: '2026-03-22', category: 'Revenue', description: 'Wheat sold at mandi — 18 quintals @ ₹2,275/q', amount: 40950 },
    { date: '2026-03-25', category: 'Revenue', description: 'Wheat straw (bhusa) sold — 2 trolleys', amount: 6000 },
    // Apr 2026
    { date: '2026-04-01', category: 'Seeds', description: 'Moong dal summer seeds 8kg', amount: 1200 },
    { date: '2026-04-03', category: 'Fertilizer', description: 'SSP 25kg for summer pulse', amount: 450 },
    { date: '2026-04-05', category: 'Revenue', description: 'Government PM-KISAN installment', amount: 2000 },
  ];

  for (const e of entries) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await pool.query(
      `INSERT INTO expenses (id, user_id, date, category, description, amount, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, userId, e.date, e.category, e.description, e.amount, now]
    );
  }

  console.log(`✅ Seeded ${entries.length} expense entries.`);

  // Also seed some activity log entries
  const activities = [
    { action: 'login', detail: 'Password login via email' },
    { action: 'save_report', detail: 'Saved crop prediction for Vadodara' },
    { action: 'add_expense', detail: 'Added 5 expense entries' },
    { action: 'save_report', detail: 'Saved disease detection report' },
    { action: 'login', detail: 'Password login via email' },
    { action: 'add_expense', detail: 'Added revenue entry' },
  ];

  for (const a of activities) {
    await pool.query(
      `INSERT INTO activity_log (user_id, action, detail, ip) VALUES ($1, $2, $3, $4)`,
      [userId, a.action, a.detail, '127.0.0.1']
    );
  }
  console.log(`✅ Seeded ${activities.length} activity log entries.`);

  await pool.end();
}

seed().catch(err => { console.error(err); process.exit(1); });
