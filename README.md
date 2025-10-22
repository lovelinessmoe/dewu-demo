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

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Start development server:
```bash
npm run dev
```

4. Open your browser:
- Frontend: http://localhost:5173
- API Server: http://localhost:3000

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

See `.env.example` for available environment variables.