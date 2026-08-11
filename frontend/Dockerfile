# Multi-stage Dockerfile for React/Vite Frontend
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Pass build arguments to Vite
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Serve via Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Custom Nginx config for React Router / SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
