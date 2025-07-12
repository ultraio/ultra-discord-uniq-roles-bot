# Local Testing Setup Guide

This guide will help you set up the Ultra Discord Bot for local testing with MongoDB.

## Prerequisites

- [NodeJS 16+](https://nodejs.org/en/download)
- [Docker](https://docs.docker.com/get-docker/) (for MongoDB)
- [Discord Bot Setup](./DiscordBotSetup.md)

## Quick Setup with Docker (Recommended)

### 1. Create Environment File

Create a `.env` file in the root directory with the following content:

```bash
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
```

### 2. Start MongoDB and Bot

```bash
# Start MongoDB and the bot
docker compose up -d

# View logs
docker compose logs -f
```

### 3. Stop Services

```bash
# Stop all services
docker compose down

# Stop and remove volumes (this will delete all data)
docker compose down -v
```

## Manual MongoDB Setup

If you prefer to run MongoDB manually:

### Option 1: Install MongoDB Locally

#### Ubuntu/Debian:
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package list
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### macOS (with Homebrew):
```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community
```

### Option 2: Use MongoDB Atlas (Cloud)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster
4. Create a database user
5. Get your connection string
6. Update your `.env` file with the Atlas connection string

## Environment Variables Explained

### Required Variables:

- **DISCORD_BOT_TOKEN**: Your Discord bot token from the Discord Developer Portal
- **APPLICATION_ID**: Your Discord application ID
- **GUILD_ID**: Your Discord server ID
- **MONGODB_URL**: MongoDB connection string
- **DATABASE_NAME**: Name of the database (default: UltraUniqLinks)

### Optional Variables:

- **WEBSERVER_PORT**: Port for the web server (default: 3000)
- **CNAME**: Your server's domain name (use localhost for local testing)
- **SIGNING_CNAME**: URL for the signing page (default: https://discord.ultra.io/)
- **SINGLE_USER_REFRESH_INTERVAL_MS**: Delay between user refreshes (default: 50)

## Testing the Setup

### 1. Check MongoDB Connection

```bash
# Connect to MongoDB (if using Docker)
docker exec -it ultra-discord-bot-mongodb mongosh -u admin -p password

# Or if using local MongoDB
mongosh
```

### 2. Start the Bot

```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Or start in production mode
npm run start
```

### 3. Test Discord Commands

Once the bot is running, try these commands in your Discord server:

- `/hello` - Should respond with a greeting
- `/link` - Should start the linking process

## Troubleshooting

### MongoDB Connection Issues

1. **Check if MongoDB is running:**
   ```bash
   # For Docker
   docker ps | grep mongodb
   
   # For local installation
   sudo systemctl status mongod
   ```

2. **Check MongoDB logs:**
   ```bash
   # For Docker
   docker compose logs mongodb
   
   # For local installation
   sudo journalctl -u mongod
   ```

3. **Test connection string:**
   ```bash
   # Test with mongosh
   mongosh "mongodb://admin:password@localhost:27017/UltraUniqLinks?authSource=admin"
   ```

### Bot Issues

1. **Check bot logs:**
   ```bash
   docker compose logs discord-bot
   ```

2. **Verify environment variables:**
   ```bash
   # Check if .env file exists and has correct values
   cat .env
   ```

3. **Check Discord bot permissions:**
   - Ensure the bot has the required permissions in your Discord server
   - Verify the bot token is correct
   - Check that the bot is invited to your server

## Next Steps

1. Set up your Discord bot following the [Discord Bot Setup Guide](./DiscordBotSetup.md)
2. Configure your environment variables
3. Test the basic commands
4. Set up factory and role bindings using the admin commands

For more information, see the [main README](../README.md) and other documentation files. 