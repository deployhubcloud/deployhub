FROM node:24-alpine AS base

ARG SERVICE_PATH

WORKDIR /app


COPY shared ./shared

# Copy the whole service directory so any lockfile (package-lock.json or npm-shrinkwrap.json)
# is present when running `npm ci`. This avoids npm failing when a shrinkwrap is present
# but wasn't copied earlier. It trades a bit of cache efficiency for reliability.
COPY ${SERVICE_PATH} ./${SERVICE_PATH}

WORKDIR /app/${SERVICE_PATH}
RUN npm ci --omit=dev


WORKDIR /app
# The service was already copied above; no need to copy again.
# COPY ${SERVICE_PATH} ./${SERVICE_PATH}

WORKDIR /app/${SERVICE_PATH}

CMD ["npm", "start"]
