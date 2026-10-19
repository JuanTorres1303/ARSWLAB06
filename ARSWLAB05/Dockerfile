# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci || npm install
COPY . .
ARG VITE_API_BASE_URL
ARG VITE_WS_BASE
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL VITE_WS_BASE=$VITE_WS_BASE
RUN npm run build

# Server stage (static server)
FROM node:20-alpine
WORKDIR /app
RUN npm i -g serve
COPY --from=build /app/dist ./dist
EXPOSE 4173
CMD [ "serve", "-s", "dist", "-l", "4173" ]
