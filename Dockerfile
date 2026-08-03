FROM node:18-bookworm-slim

# Install Chromium dependencies
RUN apt-get update && apt-get install -y \
    chromium-browser \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --production

COPY index.js watchdog.js roster-appscript.gs ./
RUN mkdir -p logs

EXPOSE 8080
ENV CHROMIUM_PATH=/usr/bin/chromium-browser
ENV HEADLESS=true

CMD ["node", "index.js"]
