const express = require('express');
const { getDatabase } = require('../database/init');

const router = express.Router();

// Get all mechanics
router.get('/', (req, res) => {
  const db = getDatabase();
  
  db.all('SELECT * FROM mechanics ORDER BY name', [], (err, mechanics) => {
    if (err) {
      console.error('Error fetching mechanics:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(mechanics);
  });
});

// Get mechanic by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  
  db.get('SELECT * FROM mechanics WHERE id = ?', [id], (err, mechanic) => {
    if (err) {
      console.error('Error fetching mechanic:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!mechanic) {
      return res.status(404).json({ error: 'Mechanic not found' });
    }
    
    res.json(mechanic);
  });
});

// Create new mechanic
router.post('/', (req, res) => {
  const { name, phone, email, specialization, workshop_name } = req.body;
  const db = getDatabase();
  
  if (!name || !phone || !workshop_name) {
    return res.status(400).json({ error: 'Name, phone, and workshop name are required' });
  }
  
  db.run(
    `INSERT INTO mechanics (name, phone, email, specialization, workshop_name) 
     VALUES (?, ?, ?, ?, ?)`,
    [name, phone, email, specialization, workshop_name],
    function(err) {
      if (err) {
        console.error('Error creating mechanic:', err);
        return res.status(500).json({ error: 'Failed to create mechanic' });
      }
      
      res.status(201).json({
        id: this.lastID,
        name,
        phone,
        email,
        specialization,
        workshop_name,
        message: 'Mechanic created successfully'
      });
    }
  );
});

// Update mechanic
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, phone, email, specialization, workshop_name } = req.body;
  const db = getDatabase();
  
  db.run(
    'UPDATE mechanics SET name = ?, phone = ?, email = ?, specialization = ?, workshop_name = ? WHERE id = ?',
    [name, phone, email, specialization, workshop_name, id],
    function(err) {
      if (err) {
        console.error('Error updating mechanic:', err);
        return res.status(500).json({ error: 'Failed to update mechanic' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Mechanic not found' });
      }
      
      res.json({ message: 'Mechanic updated successfully' });
    }
  );
});

// Delete mechanic
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  
  // Check if mechanic has associated services
  db.get('SELECT COUNT(*) as count FROM services WHERE mechanic_id = ?', [id], (err, result) => {
    if (err) {
      console.error('Error checking mechanic services:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (result.count > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete mechanic with existing service records' 
      });
    }
    
    db.run('DELETE FROM mechanics WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Error deleting mechanic:', err);
        return res.status(500).json({ error: 'Failed to delete mechanic' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Mechanic not found' });
      }
      
      res.json({ message: 'Mechanic deleted successfully' });
    });
  });
});

// Get mechanic statistics
router.get('/:id/stats', (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  
  const queries = [
    // Total services performed
    'SELECT COUNT(*) as total_services FROM services WHERE mechanic_id = ?',
    
    // Total revenue generated
    'SELECT SUM(cost) as total_revenue FROM services WHERE mechanic_id = ? AND cost IS NOT NULL',
    
    // Services this month
    `SELECT COUNT(*) as services_this_month 
     FROM services 
     WHERE mechanic_id = ? 
     AND strftime('%Y-%m', service_date) = strftime('%Y-%m', 'now')`,
    
    // Average service cost
    'SELECT AVG(cost) as avg_service_cost FROM services WHERE mechanic_id = ? AND cost IS NOT NULL',
    
    // Oil type distribution
    `SELECT oil_type, COUNT(*) as count 
     FROM services 
     WHERE mechanic_id = ? 
     GROUP BY oil_type`,
     
    // Recent services
    `SELECT s.*, c.phone as customer_phone, c.name as customer_name 
     FROM services s 
     JOIN customers c ON s.customer_id = c.id 
     WHERE s.mechanic_id = ? 
     ORDER BY s.service_date DESC 
     LIMIT 5`
  ];
  
  let results = {};
  let completed = 0;
  
  // Execute first 4 queries (single value results)
  queries.slice(0, 4).forEach((query, index) => {
    db.get(query, [id], (err, result) => {
      if (err) {
        console.error(`Error in query ${index}:`, err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      Object.assign(results, result);
      completed++;
      
      if (completed === 6) { // Total queries
        res.json(results);
      }
    });
  });
  
  // Oil type distribution
  db.all(queries[4], [id], (err, oilTypes) => {
    if (err) {
      console.error('Error in oil type query:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    results.oil_type_distribution = oilTypes;
    completed++;
    
    if (completed === 6) {
      res.json(results);
    }
  });
  
  // Recent services
  db.all(queries[5], [id], (err, recentServices) => {
    if (err) {
      console.error('Error in recent services query:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    results.recent_services = recentServices;
    completed++;
    
    if (completed === 6) {
      res.json(results);
    }
  });
});

// Get mechanic's QR codes
router.get('/:id/qr-codes', (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  
  db.all(
    'SELECT * FROM qr_codes WHERE mechanic_id = ? ORDER BY created_at DESC',
    [id],
    (err, qrCodes) => {
      if (err) {
        console.error('Error fetching QR codes:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json(qrCodes);
    }
  );
});

module.exports = router;