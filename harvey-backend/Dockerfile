# Harvey Backend Dockerfile
FROM node:18-alpine

# Install dependencies
RUN apk add --no-cache curl

# Create application directory
WORKDIR /app

# Copy dependency files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src/ ./src/

# Build the TypeScript application
RUN npm run build

# Create directory for uploads
RUN mkdir -p uploads

# Expose the port
EXPOSE 3000

# Configure non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

# Start command
CMD ["npm", "start"]
