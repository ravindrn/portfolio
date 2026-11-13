FROM node:20-alpine AS client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --omit=dev
COPY server ./
COPY --from=client /app/client/dist /app/client/dist
ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "src/index.js"]
