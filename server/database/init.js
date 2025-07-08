const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/car_service.db');

let db;

const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      console.log('Connected to SQLite database');
      
      // Create tables
      createTables()
        .then(resolve)
        .catch(reject);
    });
  });
};

const createTables = () => {
  return new Promise((resolve, reject) => {
    const queries = [
      // Mechanics table
      `CREATE TABLE IF NOT EXISTS mechanics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        specialization TEXT,
        workshop_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Customers table
      `CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT UNIQUE NOT NULL,
        name TEXT,
        car_make TEXT,
        car_model TEXT,
        car_year INTEGER,
        license_plate TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // QR Codes table
      `CREATE TABLE IF NOT EXISTS qr_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        qr_id TEXT UNIQUE NOT NULL,
        mechanic_id INTEGER,
        workshop_station TEXT,
        qr_code_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (mechanic_id) REFERENCES mechanics (id)
      )`,
      
      // Services table
      `CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        mechanic_id INTEGER,
        qr_id TEXT,
        service_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        oil_type TEXT CHECK(oil_type IN ('diesel', 'super')) NOT NULL,
        service_type TEXT DEFAULT 'oil_change',
        mileage INTEGER,
        next_service_date DATETIME,
        notes TEXT,
        cost DECIMAL(10, 2),
        status TEXT DEFAULT 'completed',
        reminder_sent_1month BOOLEAN DEFAULT FALSE,
        reminder_sent_2month BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers (id),
        FOREIGN KEY (mechanic_id) REFERENCES mechanics (id),
        FOREIGN KEY (qr_id) REFERENCES qr_codes (qr_id)
      )`,
      
      // Transactions table
      `CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_id INTEGER,
        customer_id INTEGER,
        amount DECIMAL(10, 2) NOT NULL,
        payment_method TEXT,
        transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        description TEXT,
        FOREIGN KEY (service_id) REFERENCES services (id),
        FOREIGN KEY (customer_id) REFERENCES customers (id)
      )`,
      
      // SMS Reminders table
      `CREATE TABLE IF NOT EXISTS sms_reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        service_id INTEGER,
        reminder_type TEXT CHECK(reminder_type IN ('1_month', '2_month')) NOT NULL,
        scheduled_date DATETIME NOT NULL,
        sent_date DATETIME,
        status TEXT DEFAULT 'pending',
        sms_sid TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers (id),
        FOREIGN KEY (service_id) REFERENCES services (id)
      )`
    ];
    
    let completed = 0;
    queries.forEach((query, index) => {
      db.run(query, (err) => {
        if (err) {
          console.error(`Error creating table ${index}:`, err);
          reject(err);
          return;
        }
        completed++;
        if (completed === queries.length) {
          console.log('All tables created successfully');
          insertSampleData().then(resolve).catch(reject);
        }
      });
    });
  });
};

const insertSampleData = () => {
  return new Promise((resolve, reject) => {
    // Insert sample mechanic
    const insertMechanic = `INSERT OR IGNORE INTO mechanics (name, phone, email, specialization, workshop_name) 
                           VALUES ('John Smith', '+1234567890', 'john@workshop.com', 'Oil Change Specialist', 'Quick Service Auto')`;
    
    db.run(insertMechanic, function(err) {
      if (err) {
        console.error('Error inserting sample mechanic:', err);
        reject(err);
        return;
      }
      console.log('Sample data inserted successfully');
      resolve();
    });
  });
};

const getDatabase = () => {
  return db;
};

module.exports = {
  initializeDatabase,
  getDatabase
};