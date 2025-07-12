#!/bin/bash

# Ultra Discord Bot - Local Testing Setup Script
# This script helps you set up the local testing environment

set -e

echo "🚀 Setting up Ultra Discord Bot for local testing..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first:"
    echo "   https://nodejs.org/en/download/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
# Discord Bot Configuration
DISCORD_BOT_TOKEN=your_discord_bot_token_here
APPLICATION_ID=your_application_id_here
GUILD_ID=your_guild_id_here

# Web Server Configuration
WEBSERVER_PORT=3000
CNAME=localhost
SIGNING_CNAME=https://discord.ultra.io/

# MongoDB Configuration (for local testing with Docker)
MONGODB_URL=mongodb://admin:password@localhost:27017/UltraUniqLinks?authSource=admin

# Bot Configuration
SINGLE_USER_REFRESH_INTERVAL_MS=50
DATABASE_NAME=UltraUniqLinks
EOF
    echo "✅ Created .env file"
    echo "⚠️  Please update the .env file with your Discord bot credentials"
else
    echo "✅ .env file already exists"
fi

# Install npm dependencies
echo "📦 Installing npm dependencies..."
npm install

# Start MongoDB
echo "🐳 Starting MongoDB..."
docker compose up -d mongodb

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
sleep 10

# Check if MongoDB is running
if docker compose ps mongodb | grep -q "Up"; then
    echo "✅ MongoDB is running"
else
    echo "❌ Failed to start MongoDB"
    echo "Check logs with: docker compose logs mongodb"
    exit 1
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update the .env file with your Discord bot credentials"
echo "2. Start the bot with: npm run dev"
echo "3. Or use Docker: docker compose up"
echo ""
echo "For detailed instructions, see: docs/LocalTestingSetup.md"
echo ""
echo "To stop MongoDB: docker compose down"
echo "To view logs: docker compose logs -f" 