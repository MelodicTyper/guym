# Stage 1: Build the React frontend
FROM node:25.3.0 AS builder
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Setup the Node.js server
FROM node:25.3.0
WORKDIR /app
COPY server/package.json server/package-lock.json ./
RUN npm install
COPY server/ ./

# Copy the built frontend from the builder stage
COPY --from=builder /app/client/dist ./public

# The server will serve static files from this directory
ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"]
