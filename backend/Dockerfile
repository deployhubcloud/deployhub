FROM node:24.15.0-alpine

ARG SERVICE_PATH

RUN apk --no-cache upgrade

WORKDIR /app

COPY shared ./shared

COPY ${SERVICE_PATH}/package*.json ./${SERVICE_PATH}/

WORKDIR /app/${SERVICE_PATH}
RUN npm ci --omit=dev

WORKDIR /app
COPY ${SERVICE_PATH} ./${SERVICE_PATH}

WORKDIR /app/${SERVICE_PATH}

CMD ["npm", "start"]