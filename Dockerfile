# Use Node.js image
FROM node:20-alpine AS builder

# Declare build arguments and environment variables
ARG MONGODB_URI
ENV MONGODB_URI=${MONGODB_URI}

ARG NEXTAUTH_SECRET
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}

ARG NEXTAUTH_URL
ENV NEXTAUTH_URL=${NEXTAUTH_URL}

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the prisma directory and other necessary files
COPY . .
COPY prisma ./prisma

# Generate Prisma Client
RUN ls -la /app/prisma
RUN npx prisma generate --schema=/app/prisma/schema.prisma

# Build the application
RUN npm run build

# Use a lightweight image for production
FROM node:20-alpine AS runner
WORKDIR /app

# Copy built files and node_modules
COPY --from=builder /app ./

# Expose the port and start the application
EXPOSE 3000
CMD ["npm", "run", "start"]