# Car Service Tracking System

A comprehensive web application that tracks car services using QR codes and sends automated SMS reminders to customers. The system allows workshops to manage services efficiently while providing customers with an easy way to track their car maintenance.

## 🚗 Features

### Core Functionality
- **QR Code Service Logging**: Customers scan QR codes at service stations to log their services
- **Car Sticker QR Codes**: Physical stickers on cars with QR codes for service status checking
- **Automated SMS Reminders**: Sends reminders 1 month and 2 weeks before next service
- **Oil Type Tracking**: Different colored stickers for diesel (black) and super (blue) oil types
- **Service History**: Complete tracking of all services performed
- **Real-time Dashboard**: Analytics and statistics for workshop management

### User Roles
1. **Customers**: Scan QR codes, view service status, receive SMS reminders
2. **Mechanics**: Generate QR codes, manage services, view customer history
3. **Workshop Managers**: Analytics, reporting, and system management

### QR Code System
- **Service Station QR Codes**: Displayed at workshop stations for service logging
- **Car Sticker QR Codes**: Physical stickers on vehicles for status checking
- **Dual Functionality**: Same system handles both service logging and status checking

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js framework
- **SQLite** database for data storage
- **Twilio** for SMS notifications
- **QR Code generation** for station and sticker codes

### Frontend
- **React** with modern hooks and functional components
- **Tailwind CSS** for responsive, mobile-first design
- **QR Scanner** library for camera-based scanning
- **Lucide React** icons for consistent UI

## 📱 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Twilio account for SMS functionality (optional)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd car-service-tracker
```

### 2. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Environment Configuration
```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your configurations
```

Required environment variables:
```bash
# Twilio Configuration (for SMS)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 4. Initialize Database
The SQLite database will be created automatically when you start the server for the first time.

### 5. Start the Application
```bash
# Development mode (runs both backend and frontend)
npm run dev

# Or start them separately:
# Backend only
npm run server

# Frontend only (in another terminal)
npm run client
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📋 Usage Guide

### For Workshop Owners

1. **Setup Mechanics**
   - Go to Mechanics section
   - Add mechanic details (name, phone, workshop)

2. **Generate Service Station QR Codes**
   - Use QR Generator to create station QR codes
   - Print and display at service stations
   - Each station can have its own QR code

3. **Monitor Dashboard**
   - View service statistics
   - Track revenue and customer metrics
   - Monitor overdue services

### For Customers

1. **Service Logging (At Workshop)**
   - Scan QR code at service station
   - Enter phone number for SMS reminders
   - Select oil type (diesel/super)
   - Add service details (cost, mileage, notes)
   - System automatically schedules SMS reminders

2. **Service Status Checking (Car Sticker)**
   - Scan QR sticker on your car
   - View days until next service
   - See service history and mechanic contact
   - Get reminder information

### For Mechanics

1. **Service Management**
   - View customer service history
   - Update service details
   - Generate car stickers for customers
   - Access performance statistics

## 🏗️ System Architecture

### Database Schema
- **Customers**: Customer information and vehicle details
- **Mechanics**: Mechanic and workshop information
- **Services**: Service records and history
- **QR Codes**: QR code management for stations and stickers
- **SMS Reminders**: Automated reminder scheduling
- **Transactions**: Financial tracking

### API Endpoints
- `/api/qr/*` - QR code generation and scanning
- `/api/services/*` - Service management
- `/api/customers/*` - Customer management
- `/api/mechanics/*` - Mechanic management
- `/api/stats/*` - Analytics and reporting

## 📱 Mobile Optimization

The system is designed mobile-first with:
- Responsive design for all screen sizes
- Touch-friendly interface elements
- Camera access for QR code scanning
- PWA capabilities for app-like experience
- Optimized for phone usage while at service stations

## 🔔 SMS Reminder System

### Automated Scheduling
- **1st Reminder**: Sent 1 month before next service due
- **2nd Reminder**: Sent 2 weeks before next service due
- **Overdue Notifications**: Can be configured for overdue services

### Message Content
Includes:
- Customer name
- Oil type
- Mechanic contact information
- Workshop details
- Call-to-action for booking

## 🎨 QR Code Sticker System

### Sticker Colors
- **Black Stickers**: For diesel vehicles
- **Blue Stickers**: For super/premium fuel vehicles
- **Visual Identification**: Easy recognition of oil type

### Sticker Placement
- Recommended placement on windshield corner
- Weather-resistant materials
- Contains QR code linked to service history

## 🔒 Security Features

- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Rate limiting for API endpoints
- Secure SMS integration

## 📊 Analytics & Reporting

### Dashboard Metrics
- Total customers and services
- Revenue tracking (daily, monthly, yearly)
- Service type distribution
- Mechanic performance
- Overdue service alerts

### Export Capabilities
- Service data export
- Customer information export
- Revenue reports
- SMS reminder statistics

## 🚀 Production Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production database (PostgreSQL recommended)
3. Set up proper SSL certificates
4. Configure production SMS credentials
5. Set up file upload storage (AWS S3 or similar)

### Recommended Hosting
- **Backend**: Heroku, DigitalOcean, AWS
- **Frontend**: Netlify, Vercel, AWS S3 + CloudFront
- **Database**: PostgreSQL on cloud provider
- **File Storage**: AWS S3 or Google Cloud Storage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation

## 🗺️ Roadmap

### Upcoming Features
- [ ] Customer mobile app
- [ ] Workshop manager dashboard
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Integration with payment systems
- [ ] API for third-party integrations
- [ ] Advanced reporting tools

---

**Built with ❤️ for efficient car service management**
