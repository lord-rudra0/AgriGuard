# Agricultural Monitoring System

A full-stack agricultural monitoring application with real-time sensor data, AI-powered insights, and comprehensive farm management features.

## Features

- 🌱 Real-time sensor monitoring (temperature, humidity, CO2, light, soil moisture)
- 🤖 AI-powered agricultural assistant using Google Gemini
- 📊 Analytics and reporting dashboard
- 🔔 Real-time alerts and notifications
- 👥 User management and authentication
- 📅 Farm calendar and scheduling
- 📧 Email reports and notifications
- 📱 Responsive design for mobile and desktop

## Tech Stack

### Frontend
- React 18 with Vite
- Tailwind CSS for styling
- Socket.IO for real-time communication
- Axios for API calls
- React Router for navigation
- Recharts for data visualization

### Backend
- Node.js with Express
- MongoDB with Mongoose
- Socket.IO for real-time features
- JWT for authentication
- Google Gemini AI integration
- Nodemailer for email functionality
- Multer for file uploads

## Deployment on Vercel

This project is configured for deployment on Vercel with both frontend and backend services.

### Prerequisites

1. **MongoDB Database**: Set up a MongoDB Atlas cluster or use any MongoDB service
2. **Google Gemini API Key**: Get an API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
3. **SMTP Configuration**: For email functionality (optional)

### Environment Variables

Set these environment variables in your Vercel project settings:

#### Required Variables
- `MONGO_URI`: Your MongoDB connection string
- `JWT_SECRET`: A secure random string for JWT token signing
- `GEMINI_API_KEY`: Your Google Gemini API key

#### Optional Variables
- `FRONTEND_URL`: Your frontend domain (for CORS)
- `GEMINI_MODEL`: Gemini model to use (default: gemini-1.5-flash)
- `SMTP_HOST`: SMTP server host
- `SMTP_PORT`: SMTP server port (default: 587)
- `SMTP_USER`: SMTP username
- `SMTP_PASS`: SMTP password
- `SMTP_FROM`: From email address

### Deployment Steps

1. **Connect to Vercel**:
   - Install Vercel CLI: `npm i -g vercel`
   - Login: `vercel login`

2. **Deploy the Project**:
   ```bash
   vercel
   ```

3. **Set Environment Variables**:
   - Go to your Vercel dashboard
   - Navigate to your project settings
   - Add all required environment variables

4. **Redeploy**:
   ```bash
   vercel --prod
   ```

### Project Structure

```
├── frontend/                 # React frontend application
│   ├── src/
│   ├── package.json
│   └── vercel.json
├── backend/                  # Node.js backend API
│   ├── src/
│   ├── package.json
│   └── vercel.json
├── vercel.json              # Root Vercel configuration
└── env.example              # Environment variables template
```

### API Endpoints

The backend provides the following API endpoints:

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `GET /api/sensors/data` - Get sensor data
- `POST /api/chat/ai` - AI chat endpoint
- `POST /api/gemini/chat` - Gemini AI endpoint
- `GET /api/reports/analytics` - Analytics data
- `POST /api/alerts` - Create alerts
- `GET /api/settings` - User settings

### Real-time Features

The application uses Socket.IO for real-time features:
- Live sensor data updates
- Real-time alerts and notifications
- User presence tracking
- Phase change notifications

### Security Features

- JWT-based authentication
- CORS protection
- Rate limiting
- Helmet.js security headers
- Input validation and sanitization

## Development

### Local Development

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd project
   ```

2. **Install dependencies**:
   ```bash
   # Frontend
   cd frontend
   npm install
   
   # Backend
   cd ../backend
   npm install
   ```

3. **Set up environment variables**:
   - Copy `env.example` to `.env` in the backend directory
   - Fill in your actual values

4. **Start development servers**:
   ```bash
   # Backend (from backend directory)
   npm run dev
   
   # Frontend (from frontend directory)
   npm run dev
   ```

### Environment Variables for Development

Create a `.env` file in the backend directory with:

```env
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
GEMINI_API_KEY=your-gemini-api-key
NODE_ENV=development
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
