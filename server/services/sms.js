const twilio = require('twilio');
const { getDatabase } = require('../database/init');

// Twilio configuration (use environment variables in production)
const accountSid = process.env.TWILIO_ACCOUNT_SID || 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const authToken = process.env.TWILIO_AUTH_TOKEN || 'your_auth_token_here';
const fromNumber = process.env.TWILIO_PHONE_NUMBER || '+1234567890';

let client = null;

const getTwilioClient = () => {
  if (!client && accountSid.startsWith('AC') && authToken !== 'your_auth_token_here') {
    try {
      client = twilio(accountSid, authToken);
    } catch (error) {
      console.error('Failed to initialize Twilio client:', error.message);
      return null;
    }
  }
  return client;
};

const sendSMS = async (to, message) => {
  const twilioClient = getTwilioClient();
  
  if (!twilioClient) {
    console.log('SMS would be sent (Twilio not configured):', { to, message });
    return { success: true, sid: 'demo_' + Date.now(), demo: true };
  }
  
  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: fromNumber,
      to: to
    });
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('SMS sending error:', error);
    return { success: false, error: error.message };
  }
};

const sendServiceReminder = async (customerPhone, customerName, oilType, mechanicName, workshopName, daysUntil, reminderType) => {
  let message;
  
  if (reminderType === '1_month') {
    message = `Hi ${customerName || 'valued customer'}! Your ${oilType} oil change is due in about 1 month. `;
  } else {
    message = `Hi ${customerName || 'valued customer'}! Your ${oilType} oil change is due in about 2 weeks. `;
  }
  
  message += `Service by ${mechanicName} at ${workshopName}. Contact: ${mechanicName}. `;
  message += `Book your appointment soon to keep your car running smoothly!`;
  
  return await sendSMS(customerPhone, message);
};

const processScheduledReminders = async () => {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    // Get pending reminders that are due
    const query = `
      SELECT r.*, c.phone, c.name as customer_name,
             s.oil_type, 
             m.name as mechanic_name, m.workshop_name, m.phone as mechanic_phone
      FROM sms_reminders r
      JOIN customers c ON r.customer_id = c.id
      JOIN services s ON r.service_id = s.id
      JOIN mechanics m ON s.mechanic_id = m.id
      WHERE r.status = 'pending' 
      AND datetime(r.scheduled_date) <= datetime('now')
      ORDER BY r.scheduled_date ASC
      LIMIT 50
    `;
    
    db.all(query, [], async (err, reminders) => {
      if (err) {
        console.error('Error fetching scheduled reminders:', err);
        reject(err);
        return;
      }
      
      console.log(`Processing ${reminders.length} scheduled reminders`);
      let processed = 0;
      let sent = 0;
      let failed = 0;
      
      for (const reminder of reminders) {
        try {
          const result = await sendServiceReminder(
            reminder.phone,
            reminder.customer_name,
            reminder.oil_type,
            reminder.mechanic_name,
            reminder.workshop_name,
            0, // Days until - calculated based on reminder type
            reminder.reminder_type
          );
          
          if (result.success) {
            // Update reminder as sent
            db.run(
              'UPDATE sms_reminders SET status = ?, sent_date = datetime("now"), sms_sid = ? WHERE id = ?',
              ['sent', result.sid, reminder.id],
              (err) => {
                if (err) {
                  console.error('Error updating reminder status:', err);
                }
              }
            );
            sent++;
          } else {
            // Update reminder as failed
            db.run(
              'UPDATE sms_reminders SET status = ? WHERE id = ?',
              ['failed', reminder.id],
              (err) => {
                if (err) {
                  console.error('Error updating reminder status:', err);
                }
              }
            );
            failed++;
          }
        } catch (error) {
          console.error('Error processing reminder:', error);
          failed++;
        }
        
        processed++;
      }
      
      resolve({ processed, sent, failed });
    });
  });
};

const scheduleServiceReminders = (customerId, serviceId, customerPhone, nextServiceDate) => {
  const db = getDatabase();
  
  // Calculate reminder dates
  const nextService = new Date(nextServiceDate);
  
  // 1 month before (2 months from service date)
  const oneMonthBefore = new Date(nextService);
  oneMonthBefore.setMonth(oneMonthBefore.getMonth() - 1);
  
  // 2 weeks before (2.5 months from service date)
  const twoWeeksBefore = new Date(nextService);
  twoWeeksBefore.setDate(twoWeeksBefore.getDate() - 14);
  
  const reminders = [
    {
      type: '1_month',
      date: oneMonthBefore,
      description: '1 month before service'
    },
    {
      type: '2_month',
      date: twoWeeksBefore,
      description: '2 weeks before service'
    }
  ];
  
  reminders.forEach(reminder => {
    db.run(
      'INSERT INTO sms_reminders (customer_id, service_id, reminder_type, scheduled_date) VALUES (?, ?, ?, ?)',
      [customerId, serviceId, reminder.type, reminder.date.toISOString()],
      function(err) {
        if (err) {
          console.error('Error scheduling reminder:', err);
        } else {
          console.log(`Scheduled ${reminder.description} reminder for customer ${customerId}`);
        }
      }
    );
  });
};

const sendImmediateNotification = async (customerPhone, customerName, serviceDetails) => {
  const message = `Hi ${customerName || 'valued customer'}! Your ${serviceDetails.oilType} service has been completed. ` +
    `Next service due: ${new Date(serviceDetails.nextServiceDate).toLocaleDateString()}. ` +
    `Serviced by ${serviceDetails.mechanicName} at ${serviceDetails.workshopName}. Thank you!`;
  
  return await sendSMS(customerPhone, message);
};

// Start the reminder processing service (call this periodically)
const startReminderService = () => {
  console.log('Starting SMS reminder service...');
  
  // Process reminders every hour
  setInterval(async () => {
    try {
      const result = await processScheduledReminders();
      if (result.processed > 0) {
        console.log(`Reminder batch processed: ${result.sent} sent, ${result.failed} failed`);
      }
    } catch (error) {
      console.error('Error in reminder service:', error);
    }
  }, 60 * 60 * 1000); // 1 hour
  
  // Also process immediately on startup
  processScheduledReminders()
    .then(result => {
      console.log(`Initial reminder processing: ${result.sent} sent, ${result.failed} failed`);
    })
    .catch(error => {
      console.error('Error in initial reminder processing:', error);
    });
};

module.exports = {
  sendSMS,
  sendServiceReminder,
  processScheduledReminders,
  scheduleServiceReminders,
  sendImmediateNotification,
  startReminderService
};