const express = require('express');
const { getDatabase } = require('../database/init');

const router = express.Router();

// Dashboard overview statistics
router.get('/dashboard', (req, res) => {
  const db = getDatabase();
  
  const queries = [
    // Total customers
    'SELECT COUNT(*) as total_customers FROM customers',
    
    // Total services
    'SELECT COUNT(*) as total_services FROM services',
    
    // Total revenue
    'SELECT SUM(cost) as total_revenue FROM services WHERE cost IS NOT NULL',
    
    // Services this month
    `SELECT COUNT(*) as services_this_month 
     FROM services 
     WHERE strftime('%Y-%m', service_date) = strftime('%Y-%m', 'now')`,
    
    // Revenue this month
    `SELECT SUM(cost) as revenue_this_month 
     FROM services 
     WHERE cost IS NOT NULL 
     AND strftime('%Y-%m', service_date) = strftime('%Y-%m', 'now')`,
    
    // Overdue services
    `SELECT COUNT(*) as overdue_services 
     FROM services 
     WHERE next_service_date < datetime('now')`,
    
    // Upcoming services (next 30 days)
    `SELECT COUNT(*) as upcoming_services 
     FROM services 
     WHERE next_service_date BETWEEN datetime('now') AND datetime('now', '+30 days')`,
    
    // Active mechanics
    'SELECT COUNT(*) as total_mechanics FROM mechanics'
  ];
  
  let results = {};
  let completed = 0;
  
  queries.forEach((query, index) => {
    db.get(query, [], (err, result) => {
      if (err) {
        console.error(`Error in dashboard query ${index}:`, err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      Object.assign(results, result);
      completed++;
      
      if (completed === queries.length) {
        res.json(results);
      }
    });
  });
});

// Revenue analytics
router.get('/revenue', (req, res) => {
  const { period = 'month' } = req.query;
  const db = getDatabase();
  
  let groupBy, dateFormat;
  switch (period) {
    case 'day':
      groupBy = "strftime('%Y-%m-%d', service_date)";
      dateFormat = '%Y-%m-%d';
      break;
    case 'week':
      groupBy = "strftime('%Y-%W', service_date)";
      dateFormat = '%Y-W%W';
      break;
    case 'year':
      groupBy = "strftime('%Y', service_date)";
      dateFormat = '%Y';
      break;
    default: // month
      groupBy = "strftime('%Y-%m', service_date)";
      dateFormat = '%Y-%m';
  }
  
  const query = `
    SELECT ${groupBy} as period,
           SUM(cost) as revenue,
           COUNT(*) as service_count,
           AVG(cost) as avg_cost
    FROM services 
    WHERE cost IS NOT NULL 
    AND service_date >= datetime('now', '-12 ${period}s')
    GROUP BY ${groupBy}
    ORDER BY period DESC
  `;
  
  db.all(query, [], (err, results) => {
    if (err) {
      console.error('Error fetching revenue data:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(results);
  });
});

// Service type distribution
router.get('/service-types', (req, res) => {
  const db = getDatabase();
  
  const query = `
    SELECT oil_type,
           COUNT(*) as count,
           SUM(cost) as total_revenue,
           AVG(cost) as avg_cost
    FROM services 
    WHERE cost IS NOT NULL
    GROUP BY oil_type
  `;
  
  db.all(query, [], (err, results) => {
    if (err) {
      console.error('Error fetching service type data:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(results);
  });
});

// Top customers by service count
router.get('/top-customers', (req, res) => {
  const { limit = 10 } = req.query;
  const db = getDatabase();
  
  const query = `
    SELECT c.id, c.phone, c.name, c.car_make, c.car_model,
           COUNT(s.id) as service_count,
           SUM(s.cost) as total_spent,
           MAX(s.service_date) as last_service
    FROM customers c
    JOIN services s ON c.id = s.customer_id
    WHERE s.cost IS NOT NULL
    GROUP BY c.id
    ORDER BY service_count DESC, total_spent DESC
    LIMIT ?
  `;
  
  db.all(query, [limit], (err, results) => {
    if (err) {
      console.error('Error fetching top customers:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(results);
  });
});

// Mechanic performance
router.get('/mechanics-performance', (req, res) => {
  const db = getDatabase();
  
  const query = `
    SELECT m.id, m.name, m.workshop_name,
           COUNT(s.id) as total_services,
           SUM(s.cost) as total_revenue,
           AVG(s.cost) as avg_service_cost,
           COUNT(CASE WHEN strftime('%Y-%m', s.service_date) = strftime('%Y-%m', 'now') THEN 1 END) as services_this_month
    FROM mechanics m
    LEFT JOIN services s ON m.id = s.mechanic_id AND s.cost IS NOT NULL
    GROUP BY m.id
    ORDER BY total_revenue DESC
  `;
  
  db.all(query, [], (err, results) => {
    if (err) {
      console.error('Error fetching mechanic performance:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(results);
  });
});

// Service trends (services per month for the last year)
router.get('/trends', (req, res) => {
  const db = getDatabase();
  
  const query = `
    SELECT strftime('%Y-%m', service_date) as month,
           COUNT(*) as service_count,
           COUNT(DISTINCT customer_id) as unique_customers,
           SUM(cost) as revenue
    FROM services
    WHERE service_date >= datetime('now', '-12 months')
    GROUP BY strftime('%Y-%m', service_date)
    ORDER BY month DESC
  `;
  
  db.all(query, [], (err, results) => {
    if (err) {
      console.error('Error fetching trend data:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(results);
  });
});

// Reminder statistics
router.get('/reminders', (req, res) => {
  const db = getDatabase();
  
  const queries = [
    // Total reminders scheduled
    'SELECT COUNT(*) as total_scheduled FROM sms_reminders',
    
    // Reminders sent
    'SELECT COUNT(*) as total_sent FROM sms_reminders WHERE status = "sent"',
    
    // Pending reminders
    'SELECT COUNT(*) as pending FROM sms_reminders WHERE status = "pending"',
    
    // Failed reminders
    'SELECT COUNT(*) as failed FROM sms_reminders WHERE status = "failed"',
    
    // Reminders by type
    `SELECT reminder_type, 
            COUNT(*) as count,
            COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_count
     FROM sms_reminders 
     GROUP BY reminder_type`,
     
    // Upcoming reminders (next 7 days)
    `SELECT COUNT(*) as upcoming_week
     FROM sms_reminders 
     WHERE status = 'pending' 
     AND scheduled_date BETWEEN datetime('now') AND datetime('now', '+7 days')`
  ];
  
  let results = {};
  let completed = 0;
  
  // Execute single value queries
  queries.slice(0, 4).concat([queries[5]]).forEach((query, index) => {
    db.get(query, [], (err, result) => {
      if (err) {
        console.error(`Error in reminder query ${index}:`, err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      Object.assign(results, result);
      completed++;
      
      if (completed === 6) {
        res.json(results);
      }
    });
  });
  
  // Reminders by type (returns array)
  db.all(queries[4], [], (err, reminderTypes) => {
    if (err) {
      console.error('Error in reminder type query:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    results.reminder_types = reminderTypes;
    completed++;
    
    if (completed === 6) {
      res.json(results);
    }
  });
});

// Export data for reporting
router.get('/export/:type', (req, res) => {
  const { type } = req.params;
  const { start_date, end_date } = req.query;
  const db = getDatabase();
  
  let query;
  let params = [];
  
  switch (type) {
    case 'services':
      query = `
        SELECT s.*, 
               c.phone as customer_phone, c.name as customer_name, 
               c.car_make, c.car_model, c.license_plate,
               m.name as mechanic_name, m.workshop_name
        FROM services s
        JOIN customers c ON s.customer_id = c.id
        JOIN mechanics m ON s.mechanic_id = m.id
      `;
      break;
      
    case 'customers':
      query = `
        SELECT c.*,
               COUNT(s.id) as total_services,
               SUM(s.cost) as total_spent
        FROM customers c
        LEFT JOIN services s ON c.id = s.customer_id
        GROUP BY c.id
      `;
      break;
      
    case 'revenue':
      query = `
        SELECT DATE(service_date) as date,
               COUNT(*) as services,
               SUM(cost) as revenue
        FROM services
        WHERE cost IS NOT NULL
        GROUP BY DATE(service_date)
      `;
      break;
      
    default:
      return res.status(400).json({ error: 'Invalid export type' });
  }
  
  if (start_date && end_date) {
    query += ` WHERE service_date BETWEEN ? AND ?`;
    params = [start_date, end_date];
  }
  
  query += ` ORDER BY created_at DESC`;
  
  db.all(query, params, (err, results) => {
    if (err) {
      console.error('Error exporting data:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(results);
  });
});

module.exports = router;