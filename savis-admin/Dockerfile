FROM node:26-alpine AS base
WORKDIR /app
RUN apk upgrade --no-cache
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS development
COPY . .
CMD ["npm", "run", "dev", "--", "--host"]

FROM base AS build
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.31-alpine AS production
USER root
RUN apk upgrade --no-cache
USER nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health || exit 1
CMD ["nginx", "-g", "daemon off;"]
