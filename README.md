# Case Intake System

A modern, AI-powered case intake system that automates the processing of personal injury cases from audio recordings to final decisions. Built with Next.js 15, TypeScript, and cutting-edge AI integration.

## 🎯 What This Does

This system takes audio recordings of client interviews and automatically:
1. **Transcribes** the audio using Deepgram
2. **Extracts** structured case data using OpenAI GPT-4
3. **Scores** the case using a sophisticated AI-powered algorithm
4. **Makes decisions** (Accept/Review/Decline) based on the score
5. **Manages** the entire case pipeline through a clean web interface

Perfect for law firms, insurance companies, or any organization that needs to process large volumes of case intake interviews efficiently.

## 🚀 Key Features

### **Smart Case Processing**
- **Audio Upload**: Drag-and-drop audio file uploads with validation
- **AI Transcription**: High-accuracy speech-to-text using Deepgram
- **Intelligent Extraction**: Automatically extracts client details, incident information, and case facts
- **Automated Scoring**: Sophisticated scoring algorithm that evaluates case strength
- **Decision Making**: AI-powered Accept/Review/Decline recommendations

### **Case Management**
- **Dashboard**: Overview of all cases with status tracking
- **Case Pipeline**: Visual progress through Upload → Transcribe → Extract → Score → Submit
- **Intake Forms**: Clean, user-friendly forms for manual data entry and corrections
- **Search & Filter**: Find cases by status, client name, or decision type

### **AI-Powered Intelligence**
- **Deterministic Processing**: Consistent results using fixed seeds and temperature settings
- **Smart Caching**: Process-wide memoization to avoid redundant AI calls
- **Feature Extraction**: Combines LLM and heuristic approaches for robust data extraction
- **Scoring Algorithm**: Multi-factor scoring system with case-type specific profiles

## 🏗️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, Shadcn UI components
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Lucia Auth v3 with Argon2 password hashing
- **AI Services**: OpenAI GPT-4, Deepgram speech-to-text
- **File Uploads**: UploadThing integration
- **Forms**: React Hook Form with Zod validation

## 🎮 How to Use

### **Getting Started**
1. **Sign Up**: Create an account with email and password
2. **Upload Audio**: Drag and drop an audio file of a client interview
3. **Wait for Processing**: The system automatically transcribes and extracts data
4. **Review & Edit**: Check the extracted data and make corrections if needed
5. **Score Case**: Let the AI score the case and provide a decision recommendation
6. **Submit Decision**: Finalize the case with Accept, Review, or Decline

### **Scoring System**
The AI scoring system evaluates cases based on:

**Liability Factors:**
- Clear liability (rear-end collisions, slip-and-fall with no warning signs)
- Police reports and witness presence
- Defendant identification and location details

**Treatment Factors:**
- Emergency room visits within 24 hours
- Multiple healthcare providers (physicians, chiropractors, PT)
- Pain levels and missed work days
- Treatment timing and delays

**Case-Specific Profiles:**
- **MVA Cases**: Focus on rear-end collisions and police reports
- **Premises Cases**: Emphasize warning signs and location identification
- **Dog Bite Cases**: Consider witness presence and property damage
- **Pedestrian/Bicycle Cases**: Boost police report weight, remove property damage penalty
- **Rideshare Cases**: Boost police report weight, maintain property damage penalty

**Universal Modifiers:**
- **Ped/Bike**: +6 points for pedestrian or bicycle cases
- **Crosswalk**: +4 points when incident occurred in crosswalk
- **Helmet**: -2 points penalty for cyclists without helmets
- **Rideshare**: +5 points for Uber/Lyft/TNC cases
- **Commercial Vehicle**: +6 points for semi-trucks, delivery vans, buses
- **Hit-and-Run**: -6 points when other driver fled scene
- **DUI Other Driver**: +4 points when other driver was intoxicated
- **UM/UIM Applicable**: +4 points for uninsured/underinsured motorist coverage
- **Airbag Deployed**: +3 points when airbags activated
- **Severe Damage Bonus**: +3 points for totaled vehicles

**Determinism:**
All modifiers use regex heuristics; LLM is optional, pinned to temp=0, seed=42, and coerced; tests run with SCORING_USE_LLM=false.

**Decision Thresholds:**
- **Score ≥ 70**: Accept
- **Score 40-69**: Review
- **Score < 40**: Decline

## 🛠️ Development Setup

### **Prerequisites**
- Node.js 18+ 
- PostgreSQL database
- OpenAI API key
- Deepgram API key
- UploadThing account

### **Installation**

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd case-intake
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/case_intake"
   
   # Authentication
   AUTH_SECRET="your-auth-secret-here"
   
   # AI Services
   OPENAI_API_KEY="your-openai-key"
   DEEPGRAM_API_KEY="your-deepgram-key"
   
   # File Uploads
   UPLOADTHING_SECRET="your-uploadthing-secret"
   UPLOADTHING_APP_ID="your-uploadthing-app-id"
   ```

3. **Database Setup**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Open in Browser**
   Navigate to `http://localhost:3000`

### **Available Scripts**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run test` - Run test suite

## 🎨 Design System

The application uses a consistent, modern design system:

### **Color Palette**
- **Primary**: Slate-based system (slate-50 to slate-900)
- **Accent**: Blue for interactive elements
- **Success**: Green for positive actions
- **Error**: Red for errors and warnings
- **Warning**: Amber for caution states

### **Layout Patterns**
- **Page Container**: `max-w-7xl mx-auto p-6`
- **Content Container**: `max-w-4xl mx-auto p-6`
- **Form Container**: `max-w-md mx-auto p-6`

### **Component Styling**
- **Cards**: Glass-morphism effect with backdrop blur
- **Buttons**: Consistent hover states and loading indicators
- **Forms**: Clean input styling with focus states
- **Status Indicators**: Color-coded status badges

## 🔧 Architecture Highlights

### **Feature-Based Organization**
```
src/
├── app/                    # Next.js App Router
├── components/             # Shared UI components
├── features/              # Feature modules
│   ├── auth/              # Authentication
│   ├── cases/             # Case management
│   ├── dashboard/         # Dashboard
│   └── upload/            # File uploads
├── lib/                   # Core utilities
│   ├── ai/                # AI scoring and extraction
│   ├── auth/              # Authentication logic
│   ├── database/          # Database queries
│   └── services/          # Business logic
└── schemas/               # Zod validation schemas
```

### **AI Integration**
- **Deterministic Processing**: Fixed seeds ensure consistent results
- **Hybrid Approach**: Combines LLM and heuristic extraction
- **Smart Caching**: Process-wide memoization for performance
- **Strict Validation**: JSON schema validation for AI responses

### **Database Design**
- **User Management**: Secure authentication with session management
- **Case Tracking**: Complete case lifecycle with status progression
- **Intake Data**: Structured storage of extracted case information
- **Scoring History**: Audit trail of scoring decisions and reasoning

## 🚀 Production Deployment

### **Environment Variables**
Ensure all required environment variables are set in production:
- Database connection string
- Authentication secrets
- AI service API keys
- File upload service credentials

### **Database Migration**
```bash
npx prisma migrate deploy
```

### **Build and Deploy**
```bash
npm run build
npm run start
```

## 🤝 Contributing

This is a take-home assignment project. The codebase demonstrates:
- Modern React/Next.js patterns
- TypeScript best practices
- AI integration techniques
- Database design and ORM usage
- Authentication and security
- UI/UX design principles

## 📝 License

This project is part of a take-home assignment and is for demonstration purposes.

---

**Built with ❤️ using Next.js, TypeScript, and AI**