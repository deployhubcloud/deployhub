FROM node:24.15.0-alpine

ARG SERVICE_PATH

RUN apk --no-cache upgrade

RUN npm install -g npm@latest

RUN if [ "$SERVICE_PATH" = "services/build-service" ]; then \
      apk add --no-cache git; \
    fi

WORKDIR /app

COPY shared ./shared

COPY ${SERVICE_PATH}/package*.json ./${SERVICE_PATH}/

WORKDIR /app/${SERVICE_PATH}
RUN npm ci --omit=dev

WORKDIR /app
COPY ${SERVICE_PATH} ./${SERVICE_PATH}

WORKDIR /app/${SERVICE_PATH}

CMD ["npm", "start"]