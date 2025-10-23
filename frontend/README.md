# CV Builder Frontend

A modern React-based frontend application for the CV Builder platform. This application provides an intuitive user interface for creating, editing, and managing professional resumes and CVs.

## 🚀 Features

- **User Authentication**: Complete registration and login system
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Form Validation**: Real-time validation with react-hook-form
- **Type Safety**: Full TypeScript support
- **Modern UI**: Clean, professional interface with Lucide React icons
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Toast Notifications**: User-friendly notifications with react-hot-toast

## 🛠️ Technology Stack

- **React 18** - Modern React with concurrent features
- **TypeScript** - Type-safe JavaScript
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **React Hook Form** - Performant forms with validation
- **Axios** - HTTP client for API communication
- **React Hot Toast** - Toast notifications
- **Lucide React** - Beautiful icons

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
│   └── RegisterPage.tsx # User registration page
├── services/           # API services
│   └── api.ts         # Main API service
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication context
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── config/             # Configuration files
│   └── environment.ts  # Environment configuration
├── App.tsx             # Main App component
├── index.tsx           # Application entry point
└── index.css           # Global styles
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- CV Builder Backend API running on port 3000

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   REACT_APP_API_URL=http://localhost:3000/api
   REACT_APP_ENABLE_OAUTH=true
   REACT_APP_ENABLE_ANALYTICS=false
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3001`

## 📱 Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors

## 🔐 Authentication Flow

### Registration Process

1. **User fills registration form** with:
   - Username (3-30 characters, alphanumeric + underscore)
   - Email address (valid email format)
   - Password (8+ characters with strength requirements)
   - Contact number (optional, valid phone format)
   - Terms and conditions acceptance

2. **Real-time validation** provides immediate feedback:
   - Password strength indicator
   - Field-specific error messages
   - Form validation before submission

3. **API integration** handles:
   - User registration with backend
   - Token storage and management
   - Error handling and user feedback
   - Automatic redirect to dashboard

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

## 🎨 UI Components

### Form Components
- `form-input` - Styled input fields
- `form-label` - Form labels
- `form-error` - Error messages
- `form-help` - Help text

### Button Components
- `btn-primary` - Primary action buttons
- `btn-secondary` - Secondary buttons
- `btn-outline` - Outline buttons
- `btn-danger` - Danger/delete buttons

### Card Components
- `card` - Base card container
- `card-header` - Card header section
- `card-body` - Card content section
- `card-footer` - Card footer section

## 🔧 Configuration

### Tailwind CSS
Custom configuration includes:
- Brand colors (primary, secondary, success, error, warning)
- Custom fonts (Inter, Poppins)
- Extended spacing and border radius
- Custom animations and shadows
- Print styles for CV generation

### TypeScript
Configuration includes:
- Strict type checking
- Path mapping for clean imports
- React JSX support
- Modern ES features

## 🌐 API Integration

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/refresh` - Refresh token

### Error Handling
- Global error interceptor
- Automatic token refresh
- User-friendly error messages
- Toast notifications for feedback

## 📱 Responsive Design

The application is built with a mobile-first approach:
- **Mobile**: Optimized for phones (320px+)
- **Tablet**: Enhanced layout for tablets (768px+)
- **Desktop**: Full-featured desktop experience (1024px+)

## 🔒 Security Features

- JWT token management
- Automatic token refresh
- Secure token storage
- Input validation and sanitization
- XSS protection
- CSRF protection via SameSite cookies

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Variables for Production
```env
REACT_APP_API_URL=https://your-api-domain.com/api
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_PWA=true
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Vicky** - CV Builder Frontend Developer

---

## 🎯 Next Steps

The registration page is now complete! Next features to implement:

1. **Login Page** - User authentication
2. **Dashboard** - Main application interface
3. **CV Builder** - CV creation and editing
4. **CV Templates** - Multiple layout options
5. **CV Preview** - Real-time preview
6. **CV Export** - PDF download functionality
7. **User Profile** - Account management
8. **Settings** - Application preferences

The foundation is solid and ready for rapid development of additional features!



