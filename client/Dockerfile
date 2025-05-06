# Use official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy project files
COPY . .

# Build Next.js app
RUN npm run build

# Expose port (default for Next.js)
EXPOSE 3000

# Start Next.js app
CMD ["npm", "start"]
