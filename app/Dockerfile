FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json ./
COPY server.js ./
RUN mkdir -p /logs && chown -R node:node /app /logs
USER node
EXPOSE 3000
CMD ["node", "server.js"]
