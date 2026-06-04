export const generateDockerfile = ({
    projectType,
    version,
    installCommand,
    buildCommand,
    startCommand,
}) => {

    switch (projectType) {

        case "static":
            return `
FROM node:${version}

WORKDIR /app

COPY package*.json ./

RUN ${installCommand || "npm ci"}

COPY . .

ARG BUILD_CMD
ARG VITE_ENV_CONTENT

RUN echo "$VITE_ENV_CONTENT" > .env

RUN if [ -n "$BUILD_CMD" ]; then sh -c "$BUILD_CMD"; else ${buildCommand || "npm run build"}; fi
`;

        case "node":
            return `
FROM node:${version}-alpine

WORKDIR /app

COPY package*.json ./

RUN ${installCommand || "npm ci"}

COPY . .

ARG APP_PORT=3000
ENV PORT=$APP_PORT

EXPOSE $APP_PORT

ARG START_CMD="${startCommand || "node index.js"}"
ENV START_CMD=$START_CMD

CMD ["sh", "-c", "$START_CMD"]
`;

        case "python":
            return `
FROM python:${version}

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ARG APP_PORT=8000
ENV PORT=$APP_PORT

EXPOSE $APP_PORT

ARG START_CMD="${startCommand || "python app.py"}"
ENV START_CMD=$START_CMD

CMD ["sh", "-c", "$START_CMD"]
`;

        case "go":
            return `
FROM golang:${version} AS builder

WORKDIR /app

COPY . .

RUN go mod download

RUN ${buildCommand || "go build -o app ."}

FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/app .

ARG APP_PORT=8080
ENV PORT=$APP_PORT

EXPOSE $APP_PORT

CMD ["./app"]
`;

        case "java":
            return `
FROM maven:3.9-eclipse-temurin-${version} AS builder

WORKDIR /app

COPY . .

RUN ${buildCommand || "mvn clean package -DskipTests"}

FROM eclipse-temurin:${version}

WORKDIR /app

COPY --from=builder /app/target/*.jar app.jar

ARG APP_PORT=8080
ENV PORT=$APP_PORT

EXPOSE $APP_PORT

CMD ["java", "-jar", "app.jar"]
`;

        default:
            throw new Error(
                `Unsupported project type: ${projectType}`
            );
    }
};