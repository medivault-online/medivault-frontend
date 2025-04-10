FROM node:18-alpine

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy package files
COPY package*.json ./

# Remove husky prepare script (if any) and install deps
RUN npm pkg delete scripts.prepare && npm ci --legacy-peer-deps

# Copy the rest of the app
COPY . .

# Generate Prisma client & build the app
RUN npx prisma generate && npm run build

# Expose Next.js port
EXPOSE 3000

# Run app in production mode
CMD ["npm", "start"]

# Generate Prisma client and build
RUN npm install prisma @prisma/client && \
    npx prisma generate && \
    npm run build
