FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG APP_ENV=production
RUN set -eux; \
    case "${APP_ENV}" in \
    production) ENV_SCRIPT="prod"; BUILD_CONFIG="production" ;; \
    development) ENV_SCRIPT="dev"; BUILD_CONFIG="development" ;; \
    staging) ENV_SCRIPT="staging"; BUILD_CONFIG="production" ;; \
    prod) ENV_SCRIPT="prod"; BUILD_CONFIG="production" ;; \
    dev) ENV_SCRIPT="dev"; BUILD_CONFIG="development" ;; \
    *) echo "Unsupported APP_ENV: ${APP_ENV}. Use production|development|staging|prod|dev"; exit 1 ;; \
    esac; \
    npm run set-env:${ENV_SCRIPT}; \
    npx ng build --configuration ${BUILD_CONFIG}

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/client/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]