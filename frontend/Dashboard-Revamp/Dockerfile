FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_AUTH_API_URL=https://api.deployhub.cloud/api/v1
ARG VITE_WS_URL=https://ws.deployhub.cloud
ARG VITE_RAZORPAY_KEY_ID
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
