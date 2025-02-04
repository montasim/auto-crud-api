# First stage: Build
FROM node:23-alpine AS build

WORKDIR /usr/src/app

# Copy package.json first for better caching
COPY package*.json ./
RUN npm install --only=production

# Copy the rest of the app
COPY . .

# Run build step (if needed)
RUN npm run build || echo "No build step needed"

# Second stage: Production-ready image
FROM node:23-alpine
WORKDIR /usr/src/app

# Copy only required files from the build stage
COPY --from=build /usr/src/app .

# Use PM2 for better performance
RUN npm install pm2 -g

EXPOSE 5000
CMD ["pm2-runtime", "server.js"]
