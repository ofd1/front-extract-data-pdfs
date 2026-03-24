FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
ARG VITE_JORNAL_API_URL
ARG VITE_BALANCETE_API_URL
ENV VITE_JORNAL_API_URL=$VITE_JORNAL_API_URL
ENV VITE_BALANCETE_API_URL=$VITE_BALANCETE_API_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 80
CMD ["sh", "-c", "export PORT=${PORT:-80} && envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
