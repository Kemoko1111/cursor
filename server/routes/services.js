const express = require('express');
const { getDatabase } = require('../database/init');

const router = express.Router();

// Get all services with pagination
router.get('/', (req, res) => {
  const { page = 1, limit = 10, status, oil_type } = req.query;
  const offset = (page - 1) * limit;
  const db = getDatabase();
  
  let whereClause = '';
  let params = [];
  
  if (status) {
    whereClause += ' WHERE s.status = ?';
    params.push(status);
  }
  
  if (oil_type) {
    whereClause += whereClause ? ' AND s.oil_type = ?' : ' WHERE s.oil_type = ?';
    params.push(oil_type);
  }
  
  params.push(limit, offset);
  
  const query = `
    SELECT s.*, 
           c.phone as customer_phone, c.name as customer_name, 
           c.car_make, c.car_model, c.license_plate,
           m.name as mechanic_name, m.workshop_name
    FROM services s
    JOIN customers c ON s.customer_id = c.id
    JOIN mechanics m ON s.mechanic_id = m.id
    ${whereClause}
    ORDER BY s.service_date DESC
    LIMIT ? OFFSET ?
  `;
  
  db.all(query, params, (err, services) => {
    if (err) {
      console.error('Error fetching services:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM services s ${whereClause}`;
    db.get(countQuery, params.slice(0, -2), (err, countResult) => {
      if (err) {
        console.error('Error counting services:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({
        services,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          pages: Math.ceil(countResult.total / limit)
        }
      });
    });
  });
});

// Get service by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  
  const query = `
    SELECT s.*, 
           c.phone as customer_phone, c.name as customer_name, 
           c.car_make, c.car_model, c.license_plate,
           m.name as mechanic_name, m.phone as mechanic_phone, 
           m.email as mechanic_email, m.workshop_name
    FROM services s
    JOIN customers c ON s.customer_id = c.id
    JOIN mechanics m ON s.mechanic_id = m.id
    WHERE s.id = ?
  `;
  
  db.get(query, [id], (err, service) => {
    if (err) {
      console.error('Error fetching service:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json(service);
  });
});

// Get customer service history
router.get('/customer/:phone', (req, res) => {
  const { phone } = req.params;
  const db = getDatabase();
  
  const query = `
    SELECT s.*, 
           m.name as mechanic_name, m.workshop_name
    FROM services s
    JOIN customers c ON s.customer_id = c.id
    JOIN mechanics m ON s.mechanic_id = m.id
    WHERE c.phone = ?
    ORDER BY s.service_date DESC
  `;
  
  db.all(query, [phone], (err, services) => {
    if (err) {
      console.error('Error fetching customer services:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(services);
  });
});

// Update service
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { status, notes, cost, mileage } = req.body;
  const db = getDatabase();
  
  db.run(
    'UPDATE services SET status = ?, notes = ?, cost = ?, mileage = ? WHERE id = ?',
    [status, notes, cost, mileage, id],
    function(err) {
      if (err) {
        console.error('Error updating service:', err);
        return res.status(500).json({ error: 'Failed to update service' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Service not found' });
      }
      
      res.json({ message: 'Service updated successfully' });
    }
  );
});

// Delete service
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  
  db.run('DELETE FROM services WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting service:', err);
      return res.status(500).json({ error: 'Failed to delete service' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json({ message: 'Service deleted successfully' });
  });
});

// Get overdue services
router.get('/status/overdue', (req, res) => {
  const db = getDatabase();
  
  const query = `
    SELECT s.*, 
           c.phone as customer_phone, c.name as customer_name, 
           c.car_make, c.car_model, c.license_plate,
           m.name as mechanic_name, m.workshop_name
    FROM services s
    JOIN customers c ON s.customer_id = c.id
    JOIN mechanics m ON s.mechanic_id = m.id
    WHERE s.next_service_date < datetime('now')
    ORDER BY s.next_service_date ASC
  `;
  
  db.all(query, [], (err, services) => {
    if (err) {
      console.error('Error fetching overdue services:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(services);
  });
});

// Get upcoming services (due in next 30 days)
router.get('/status/upcoming', (req, res) => {
  const db = getDatabase();
  
  const query = `
    SELECT s.*, 
           c.phone as customer_phone, c.name as customer_name, 
           c.car_make, c.car_model, c.license_plate,
           m.name as mechanic_name, m.workshop_name
    FROM services s
    JOIN customers c ON s.customer_id = c.id
    JOIN mechanics m ON s.mechanic_id = m.id
    WHERE s.next_service_date BETWEEN datetime('now') AND datetime('now', '+30 days')
    ORDER BY s.next_service_date ASC
  `;
  
  db.all(query, [], (err, services) => {
    if (err) {
      console.error('Error fetching upcoming services:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(services);
  });
});

module.exports = router;