const express = require('express');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { getDatabase } = require('../database/init');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Generate QR code for service station
router.post('/generate-station', async (req, res) => {
  try {
    const { mechanicId, stationName } = req.body;
    const db = getDatabase();
    
    const qrId = uuidv4();
    const qrData = {
      type: 'service_station',
      qrId: qrId,
      mechanicId: mechanicId,
      station: stationName,
      url: `${req.protocol}://${req.get('host')}/service/${qrId}`
    };
    
    const qrCodePath = path.join(uploadsDir, `station_${qrId}.png`);
    await QRCode.toFile(qrCodePath, JSON.stringify(qrData));
    
    // Save QR code info to database
    db.run(
      'INSERT INTO qr_codes (qr_id, mechanic_id, workshop_station, qr_code_path) VALUES (?, ?, ?, ?)',
      [qrId, mechanicId, stationName, qrCodePath],
      function(err) {
        if (err) {
          console.error('Error saving QR code:', err);
          return res.status(500).json({ error: 'Failed to save QR code' });
        }
        
        res.json({
          qrId: qrId,
          qrCodeUrl: `/uploads/station_${qrId}.png`,
          stationName: stationName,
          scanUrl: qrData.url
        });
      }
    );
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Generate QR code for car sticker
router.post('/generate-sticker', async (req, res) => {
  try {
    const { customerId, oilType } = req.body;
    const db = getDatabase();
    
    const qrId = uuidv4();
    const qrData = {
      type: 'car_sticker',
      qrId: qrId,
      customerId: customerId,
      oilType: oilType,
      url: `${req.protocol}://${req.get('host')}/check/${qrId}`
    };
    
    const stickerColor = oilType === 'diesel' ? 'black' : 'blue';
    const qrCodePath = path.join(uploadsDir, `sticker_${qrId}_${stickerColor}.png`);
    await QRCode.toFile(qrCodePath, JSON.stringify(qrData));
    
    // Save QR code info to database
    db.run(
      'INSERT INTO qr_codes (qr_id, qr_code_path) VALUES (?, ?)',
      [qrId, qrCodePath],
      function(err) {
        if (err) {
          console.error('Error saving sticker QR code:', err);
          return res.status(500).json({ error: 'Failed to save sticker QR code' });
        }
        
        res.json({
          qrId: qrId,
          qrCodeUrl: `/uploads/sticker_${qrId}_${stickerColor}.png`,
          stickerColor: stickerColor,
          oilType: oilType,
          checkUrl: qrData.url
        });
      }
    );
  } catch (error) {
    console.error('Error generating sticker QR code:', error);
    res.status(500).json({ error: 'Failed to generate sticker QR code' });
  }
});

// Scan QR code and get service info
router.get('/scan/:qrId', (req, res) => {
  const { qrId } = req.params;
  const db = getDatabase();
  
  // Get QR code info
  db.get(
    `SELECT qr.*, m.name as mechanic_name, m.phone as mechanic_phone, 
            m.email as mechanic_email, m.workshop_name 
     FROM qr_codes qr 
     LEFT JOIN mechanics m ON qr.mechanic_id = m.id 
     WHERE qr.qr_id = ?`,
    [qrId],
    (err, qrInfo) => {
      if (err) {
        console.error('Error fetching QR info:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!qrInfo) {
        return res.status(404).json({ error: 'QR code not found' });
      }
      
      // Check if this is for service status check (sticker scan)
      if (qrInfo.workshop_station === null) {
        // This is a sticker scan - get latest service info
        db.get(
          `SELECT s.*, c.phone as customer_phone, c.name as customer_name,
                  c.car_make, c.car_model, c.license_plate,
                  m.name as mechanic_name, m.phone as mechanic_phone
           FROM services s
           JOIN customers c ON s.customer_id = c.id
           JOIN mechanics m ON s.mechanic_id = m.id
           WHERE s.qr_id = ?
           ORDER BY s.service_date DESC
           LIMIT 1`,
          [qrId],
          (err, serviceInfo) => {
            if (err) {
              console.error('Error fetching service info:', err);
              return res.status(500).json({ error: 'Database error' });
            }
            
            let daysUntilNextService = null;
            if (serviceInfo && serviceInfo.next_service_date) {
              const nextService = new Date(serviceInfo.next_service_date);
              const today = new Date();
              const diffTime = nextService - today;
              daysUntilNextService = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
            
            res.json({
              type: 'service_check',
              qrId: qrId,
              serviceInfo: serviceInfo,
              daysUntilNextService: daysUntilNextService,
              isOverdue: daysUntilNextService < 0
            });
          }
        );
      } else {
        // This is a service station scan
        res.json({
          type: 'service_station',
          qrId: qrId,
          stationInfo: {
            station: qrInfo.workshop_station,
            mechanic: {
              name: qrInfo.mechanic_name,
              phone: qrInfo.mechanic_phone,
              email: qrInfo.mechanic_email,
              workshop: qrInfo.workshop_name
            }
          }
        });
      }
    }
  );
});

// Log service after QR scan
router.post('/log-service', (req, res) => {
  const { qrId, customerPhone, oilType, mileage, cost, notes } = req.body;
  const db = getDatabase();
  
  // Get or create customer
  db.get('SELECT * FROM customers WHERE phone = ?', [customerPhone], (err, customer) => {
    if (err) {
      console.error('Error checking customer:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    const processService = (customerId) => {
      // Get QR code info to find mechanic
      db.get('SELECT * FROM qr_codes WHERE qr_id = ?', [qrId], (err, qrInfo) => {
        if (err) {
          console.error('Error fetching QR info:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        // Calculate next service date (3 months from now)
        const nextServiceDate = new Date();
        nextServiceDate.setMonth(nextServiceDate.getMonth() + 3);
        
        // Insert service record
        db.run(
          `INSERT INTO services (customer_id, mechanic_id, qr_id, oil_type, mileage, 
                                next_service_date, cost, notes) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [customerId, qrInfo.mechanic_id, qrId, oilType, mileage, nextServiceDate, cost, notes],
          function(err) {
            if (err) {
              console.error('Error inserting service:', err);
              return res.status(500).json({ error: 'Failed to log service' });
            }
            
            const serviceId = this.lastID;
            
            // Schedule SMS reminders
            const oneMonthDate = new Date();
            oneMonthDate.setMonth(oneMonthDate.getMonth() + 2); // 2 months from now (1 month before next service)
            
            const twoMonthDate = new Date();
            twoMonthDate.setMonth(twoMonthDate.getMonth() + 1); // 1 month from now (2 months before next service)
            
            // Insert reminder schedules
            const reminderQueries = [
              ['1_month', oneMonthDate],
              ['2_month', twoMonthDate]
            ];
            
            let remindersInserted = 0;
            reminderQueries.forEach(([type, date]) => {
              db.run(
                'INSERT INTO sms_reminders (customer_id, service_id, reminder_type, scheduled_date) VALUES (?, ?, ?, ?)',
                [customerId, serviceId, type, date],
                (err) => {
                  if (err) {
                    console.error('Error scheduling reminder:', err);
                  }
                  remindersInserted++;
                  if (remindersInserted === reminderQueries.length) {
                    res.json({
                      success: true,
                      serviceId: serviceId,
                      nextServiceDate: nextServiceDate,
                      message: 'Service logged successfully and reminders scheduled'
                    });
                  }
                }
              );
            });
          }
        );
      });
    };
    
    if (customer) {
      processService(customer.id);
    } else {
      // Create new customer
      db.run(
        'INSERT INTO customers (phone) VALUES (?)',
        [customerPhone],
        function(err) {
          if (err) {
            console.error('Error creating customer:', err);
            return res.status(500).json({ error: 'Failed to create customer' });
          }
          processService(this.lastID);
        }
      );
    }
  });
});

module.exports = router;