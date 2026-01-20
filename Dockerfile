# Stage 1: Build the React frontend
FROM node:20-alpine AS builder
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Setup the Node.js server
FROM node:20-alpine
WORKDIR /app
COPY server/package.json server/package-lock.json ./
RUN npm install --production
COPY server/ ./

# Copy the built frontend from the builder stage
COPY --from=builder /app/client/dist ./public

# The server will serve static files from this directory
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "index.js"]
