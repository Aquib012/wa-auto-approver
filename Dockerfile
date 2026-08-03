FROM node:18-alpine

# Install Chromium dependencies
RUN apk add --no-cache \
    chromium \
    ca-certificates

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --production

# Copy bot code
COPY index.js watchdog.js ./
COPY roster-appscript.gs ./

# Create logs directory
RUN mkdir -p logs

# Expose port (for health checks)
EXPOSE 8080

# Set environment
ENV CHROMIUM_PATH=/usr/bin/chromium-browser
ENV HEADLESS=true

# Start the bot
CMD ["node", "index.js"]
