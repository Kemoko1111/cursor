const express = require('express');
const { getDatabase } = require('../database/init');

const router = express.Router();

// Get all customers
router.get('/', (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  const offset = (page - 1) * limit;
  const db = getDatabase();
  
  let whereClause = '';
  let params = [];
  
  if (search) {
    whereClause = ' WHERE phone LIKE ? OR name LIKE ? OR license_plate LIKE ?';
    params = [`%${search}%`, `%${search}%`, `%${search}%`];
  }
  
  params.push(limit, offset);
  
  const query = `
    SELECT * FROM customers 
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  
  db.all(query, params, (err, customers) => {
    if (err) {
      console.error('Error fetching customers:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM customers ${whereClause}`;
    db.get(countQuery, params.slice(0, -2), (err, countResult) => {
      if (err) {
        console.error('Error counting customers:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({
        customers,
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

// Get customer by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  
  db.get('SELECT * FROM customers WHERE id = ?', [id], (err, customer) => {
    if (err) {
      console.error('Error fetching customer:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(customer);
  });
});

// Get customer by phone
router.get('/phone/:phone', (req, res) => {
  const { phone } = req.params;
  const db = getDatabase();
  
  db.get('SELECT * FROM customers WHERE phone = ?', [phone], (err, customer) => {
    if (err) {
      console.error('Error fetching customer:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Get service history
    const serviceQuery = `
      SELECT s.*, m.name as mechanic_name, m.workshop_name
      FROM services s
      JOIN mechanics m ON s.mechanic_id = m.id
      WHERE s.customer_id = ?
      ORDER BY s.service_date DESC
    `;
    
    db.all(serviceQuery, [customer.id], (err, services) => {
      if (err) {
        console.error('Error fetching customer services:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({
        ...customer,
        services
      });
    });
  });
});

// Create new customer
router.post('/', (req, res) => {
  const { phone, name, car_make, car_model, car_year, license_plate } = req.body;
  const db = getDatabase();
  
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }
  
  db.run(
    `INSERT INTO customers (phone, name, car_make, car_model, car_year, license_plate) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [phone, name, car_make, car_model, car_year, license_plate],
    function(err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
          return res.status(409).json({ error: 'Customer with this phone already exists' });
        }
        console.error('Error creating customer:', err);
        return res.status(500).json({ error: 'Failed to create customer' });
      }
      
      res.status(201).json({
        id: this.lastID,
        phone,
        name,
        car_make,
        car_model,
        car_year,
        license_plate,
        message: 'Customer created successfully'
      });
    }
  );
});

// Update customer
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, car_make, car_model, car_year, license_plate } = req.body;
  const db = getDatabase();
  
  db.run(
    'UPDATE customers SET name = ?, car_make = ?, car_model = ?, car_year = ?, license_plate = ? WHERE id = ?',
    [name, car_make, car_model, car_year, license_plate, id],
    function(err) {
      if (err) {
        console.error('Error updating customer:', err);
        return res.status(500).json({ error: 'Failed to update customer' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      
      res.json({ message: 'Customer updated successfully' });
    }
  );
});

// Delete customer
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  
  db.run('DELETE FROM customers WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting customer:', err);
      return res.status(500).json({ error: 'Failed to delete customer' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json({ message: 'Customer deleted successfully' });
  });
});

// Get customer statistics
router.get('/:id/stats', (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  
  const queries = [
    'SELECT COUNT(*) as total_services FROM services WHERE customer_id = ?',
    'SELECT SUM(cost) as total_spent FROM services WHERE customer_id = ? AND cost IS NOT NULL',
    'SELECT MAX(service_date) as last_service FROM services WHERE customer_id = ?',
    'SELECT MIN(next_service_date) as next_service FROM services WHERE customer_id = ? AND next_service_date > datetime("now")'
  ];
  
  let results = {};
  let completed = 0;
  
  queries.forEach((query, index) => {
    db.get(query, [id], (err, result) => {
      if (err) {
        console.error(`Error in query ${index}:`, err);
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

module.exports = router;