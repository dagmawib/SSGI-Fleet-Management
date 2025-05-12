# Use official Node.js image (Debian-based, not Alpine, for Next.js native modules)
FROM node:20-bullseye

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# Copy project files
COPY . .

# Build Next.js app
RUN npm run build

# Expose port (default for Next.js)
EXPOSE 3000

# Start Next.js app
CMD ["npm", "start"]