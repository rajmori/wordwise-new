# Use official Node.js Alpine base image for production
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package configurations
COPY package*.json ./

# Install production-only dependencies
RUN npm ci --omit=dev

# Copy prisma configuration to generate local client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy the rest of the application files
COPY . .

# Expose HTTP port
EXPOSE 3000

# Set environment defaults
ENV PORT=3000
ENV NODE_ENV=production

# Boot command
CMD ["node", "server.js"]
