# LankaNest - University Boarding House Finder

A comprehensive platform connecting university students with verified landlords for seamless accommodation discovery and management.

## 🏗️ Tech Stack

### Backend

- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens, Google OAuth 2.0, Passport.js
- **Real-time Communication**: Socket.IO
- **Caching**: Redis for chat optimization and user sessions
- **File Storage**: AWS S3
- **Email Service**: Nodemailer with Zoho SMTP
- **Payment Integration**: PayHere payment gateway
- **Validation**: Express-validator
- **Security**: bcryptjs for password hashing, CORS middleware

### Frontend

- **Framework**: React 18 with Vite
- **State Management**: Zustand
- **UI Components**: Ant Design, Radix UI primitives
- **Styling**: Tailwind CSS with custom themes
- **Routing**: React Router DOM
- **Maps**: Mapbox GL for interactive maps
- **Charts**: Recharts for analytics visualization
- **Animations**: Framer Motion
- **HTTP Client**: Axios
- **Real-time**: Socket.IO client

### Machine Learning

- **Recommendation Engine**: Python FastAPI server
- **ML Libraries**: scikit-learn, pandas, numpy, Hugging Face Inference
- **Database**: PyMongo for MongoDB integration
- **Content-based Filtering**: Cosine similarity algorithms

### Development & Infrastructure

- **Concurrency**: Concurrently for development scripts
- **Process Management**: Node.js cron jobs
- **File Processing**: Multer for file uploads
- **Environment**: dotenv for configuration

## ✨ Core Features

### 🔐 Authentication & Authorization

- **Multi-role System**: Students, Landlords, and Administrators
- **Social Login**: Google OAuth integration
- **Email Verification**: 6-digit OTP system
- **Password Recovery**: Secure reset with time-limited tokens
- **Account Security**: Automatic flagging and suspension system

### 🏠 Property Management

- **Smart Listings**: Comprehensive property information with ELO rating system
- **Image Management**: Multiple photo uploads with AWS S3 storage
- **Location Services**: Interactive maps with university proximity calculations
- **Search & Filtering**: Advanced search by university, location, price range, and property type
- **Property Analytics**: View tracking, click-through rates, and engagement metrics

### 💬 Real-time Communication

- **Instant Messaging**: Socket.IO powered chat system
- **Redis Optimization**: Cached message delivery for performance
- **Online Status**: Real-time presence indicators
- **Read Receipts**: Message delivery and read confirmations
- **Background Notifications**: Push notifications for new messages

### 🔍 Advanced Search & Discovery

- **AI Recommendations**: Machine learning-powered property suggestions
- **University-based Search**: Filter properties by nearest university
- **Location-based Discovery**: Radius-based property search
- **Smart Filtering**: Price range, property type, gender preferences
- **Bookmarking System**: Save and manage favorite properties

### 💳 Subscription Management

- **Freemium Model**: Free plan with basic features, premium for unlimited access
- **Payment Integration**: PayHere gateway for Sri Lankan market
- **Automatic Billing**: 30-day subscription cycles with expiration notifications
- **Listing Limits**: Free plan restrictions with upgrade prompts
- **Analytics Access**: Premium users get advanced analytics

### 👥 User Experience

- **Verification System**: Landlord identity verification with NIC document upload
- **Review & Rating**: Student feedback system with spam detection
- **Schedule Visits**: Property viewing appointment system
- **Notification Center**: In-app notifications for important updates
- **Responsive Design**: Mobile-first approach with seamless desktop experience

### 📊 Analytics & Reporting

- **Admin Dashboard**: Comprehensive platform analytics
- **User Analytics**: Registration trends, activity patterns, demographic insights
- **Property Analytics**: Listing performance, view counts, engagement metrics
- **Communication Metrics**: Message volume, conversation analytics
- **Revenue Tracking**: Subscription analytics and payment monitoring

### 🛡️ Safety & Moderation

- **Content Moderation**: Automated spam detection for reviews
- **Report System**: Users can report inappropriate content
- **Account Flagging**: Automatic suspension for violations
- **Data Protection**: Secure handling of personal and financial information
- **Admin Controls**: Comprehensive moderation tools for platform oversight

### 📱 Mobile Optimization

- **Progressive Web App**: App-like experience on mobile devices
- **Touch-friendly Interface**: Optimized for mobile interactions
- **Performance**: Fast loading with optimized image delivery
- **Offline Capabilities**: Cached data for limited offline functionality

## 🎯 Key Technical Highlights

### Performance Optimization

- **Redis Caching**: Chat message caching for instant delivery
- **Database Optimization**: Efficient MongoDB queries with proper indexing
- **Image Optimization**: Compressed uploads with multiple size variants
- **Lazy Loading**: Component-level code splitting for faster initial loads

### Scalability Features

- **Microservices Architecture**: Separate recommendation server
- **Real-time Scaling**: Socket.IO with Redis adapter for horizontal scaling
- **Database Sharding**: Prepared for horizontal database scaling
- **CDN Integration**: AWS S3 for global content delivery

### Security Implementation

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Granular permissions system
- **Input Validation**: Comprehensive server-side validation
- **XSS Protection**: Sanitized user inputs and outputs
- **Rate Limiting**: API throttling to prevent abuse

### AI & Machine Learning

- **Content-based Filtering**: Property recommendations based on user preferences
- **Collaborative Filtering**: User behavior analysis for improved suggestions
- **Natural Language Processing**: Hugging Face Inference and local fallback models for review sentiment analysis
- **Ranking Algorithm**: ELO-based property ranking system

## 🚀 Developer Experience

- **Hot Reload**: Development setup with automatic refresh
- **Environment Management**: Separate configurations for development/production
- **Error Handling**: Comprehensive error logging and user feedback
- **API Documentation**: Well-structured REST API endpoints
- **Code Organization**: Modular architecture with clear separation of concerns

LankaNest represents a complete ecosystem for university accommodation management, combining modern web technologies with intelligent algorithms to create an efficient, secure, and user-friendly platform for the academic housing market.
