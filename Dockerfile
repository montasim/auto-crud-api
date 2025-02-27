# First stage: Build
FROM node:23-alpine AS builder

WORKDIR /app

COPY . .

RUN npm install \
    && npm run build \
    && rm -rf /root/.npm \
    && rm -rf node_modules \
    && npm cache clean --force

# Second stage: Production-ready image
FROM node:23-alpine AS production
WORKDIR /app

COPY --from=builder /app/build .

RUN npm install --production --omit=dev --no-audit \
    && npm install -g pm2 --omit=dev

EXPOSE 5000
CMD ["pm2", "server.js"]