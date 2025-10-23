# Dewu Mock API

A mock API server for Dewu (得物) platform interfaces built with React and Express.js.

## Features

- Mock OAuth2 token generation and refresh endpoints
- Mock invoice management endpoints (list and handle)
- Mock merchant base info endpoint
- Interactive web interface for testing APIs
- Request signature validation
- Configurable mock data

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
# Option 1: Use the setup script
./setup-env.sh

# Option 2: Manual setup
cp .env.example .env.local
# Then edit .env.local with your Supabase credentials
```

### 3. Configure Supabase (Optional but recommended)
- Create a Supabase project
- Run the SQL from `supabase-setup.sql`
- Add your credentials to `.env.local`
- See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions

### 4. Start development server
```bash
npm run dev
```

### 5. Open your browser
- Frontend: http://localhost:5173
- API Server: http://localhost:3000
- API Documentation: http://localhost:3000 (when using standalone API)

## API Endpoints

### OAuth2
- `POST /api/v1/h5/passport/v1/oauth2/token` - Generate access token
- `POST /api/v1/h5/passport/v1/oauth2/refresh_token` - Refresh access token

### Invoice Management
- `POST /dop/api/v1/invoice/list` - Get invoice list
- `POST /dop/api/v1/invoice/handle` - Handle invoice operations

### Merchant Info
- `POST /dop/api/v1/common/merchant/base/info` - Get merchant base info

## Development

- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:server` - Start only the backend server
- `npm run dev:client` - Start only the frontend
- `npm run build` - Build for production
- `npm run test` - Run tests

## Configuration

### Environment Variables
- See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for detailed configuration guide
- Copy `.env.example` to `.env.local` and fill in your values
- Required: `SUPABASE_URL` and `SUPABASE_ANON_KEY` for database functionality

### Database Setup
- See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for Supabase configuration
- The API works with fallback mock data if Supabase is not configured

### Files Overview
- `.env.example` - Environment variables template (committed to Git)
- `.env.local` - Your local environment variables (ignored by Git)
- `supabase-setup.sql` - Database schema and initial data
- `setup-env.sh` - Quick setup script for environment variables