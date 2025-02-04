# First stage: Build
FROM node:23-alpine AS build

WORKDIR /usr/src/app

# Copy package.json first for better caching
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production && npm cache clean --force

# Copy the rest of the app
COPY . .

# Run build step (if needed)
RUN npm run build || echo "No build step needed"

# Remove unnecessary files to reduce image size
RUN rm -rf node_modules && npm install --only=production

# Second stage: Production-ready image
FROM node:23-alpine AS production
WORKDIR /usr/src/app

# Copy only required files from the build stage
COPY --from=build /usr/src/app .

# Use PM2 for better performance
RUN npm install -g pm2 --omit=dev

EXPOSE 5000
CMD ["pm2-runtime", "server.js"]
