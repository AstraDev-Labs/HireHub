# === BACKEND DOCKERFILE ===

# Use Node.js LTS (Long Term Support) image
FROM node:20-slim

# Create app directory
WORKDIR /usr/src/app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose the backend port
EXPOSE 5000

# Start the cluster mode to utilize all CPU cores and handle 10,000+ users
CMD [ "npm", "run", "start:cluster" ]
