# Margin Trading Simulator

A full-stack web application for simulating monitoring margin trading positions with real-time market data.

## 🚀 Features

- **Real-time Market Data**: Live price updates using WebSocket connections
- **Portfolio Management**: Track positions, margins, and P&L
- **Risk Monitoring**: Automated margin level alerts and notifications  

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Interactive data visualization
- **WebSocket** - Real-time communication

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **PostgreSQL 17.4** - Database
- **Socket.io** - WebSocket implementation

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy and static file serving

## 📋 Prerequisites

- [Docker](https://docs.docker.com/get-docker/) 20.10+
- [Docker Compose](https://docs.docker.com/compose/install/) 2.0+
- Git

## 🏃‍♂️ Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/margin-trading-dashboard.git
cd margin-trading-dashboard
```

### 2. Set Up Environment Variables
```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your actual values
nano .env
```

**Required Environment Variables:**
```env
# Database
DB_PASSWORD=your-secure-password

# JWT Secret (minimum 32 characters)
JWT_SECRET=your-super-secret-jwt-key-here

# API Keys
ALPHA_VANTAGE_API_KEY=your-api-key
TWELVE_DATA_API_KEY=your-api-key
```

### 3. Start the Application
```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up --build -d
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **Database**: localhost:5432


### 5. Stop the Application
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: This will delete your database data)
docker-compose down -v
```

## 🔧 Development

### Running Individual Services

**Backend Only:**
```bash
cd backend
npm install
npm run migrate
npm run seed
npm run dev
```

**Frontend Only:**
```bash
cd frontend
npm install
npm start
```

### Database Operations

```bash
# Run migrations
docker-compose exec backend npm run migrate

# Seed database
docker-compose exec backend npm run seed

# Access database
docker-compose exec db psql -U margin_user -d margin_db
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Restart Services
```bash
# Restart all services
docker-compose restart

# Restart a specific service
docker-compose restart backend
```

### Update and Rebuild
```bash
# Rebuild services after code changes
docker-compose up --build

# Rebuild a specific service
docker-compose build backend
docker-compose up -d backend
```

