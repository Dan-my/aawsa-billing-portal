# Dockerfile for a production Next.js app

# --- 1. Builder Stage ---
# This stage builds the application.
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies
# Using --prod to ensure we only install production dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Set build-time arguments for Supabase
# These are only needed during the build process
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

# Assign them to environment variables for the build command
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Build the Next.js application for production
RUN npm run build

# --- 2. Runner Stage ---
# This stage runs the built application.
FROM node:18-alpine AS runner

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy built assets from the builder stage
# Copy the public directory
COPY --from=builder /app/public ./public
# Copy the standalone Next.js server output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Copy the static assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Switch to the non-root user
USER nextjs

# Expose the port the app will run on
EXPOSE 3000

# Set the default command to start the app
# This will run the optimized Node.js server for Next.js
CMD ["node", "server.js"]
