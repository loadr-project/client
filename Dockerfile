FROM alpine AS buildStage
WORKDIR /build

# Packages
RUN apk add python3 make npm g++

# Dependencies
COPY package.json /build/package.json
COPY package-lock.json /build/package-lock.json
RUN npm ci

# Build
COPY public /build/public
COPY src /build/src
COPY tsconfig.json /build/tsconfig.json
RUN npm run build

# Release
FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html
COPY --from=buildStage /build/build /usr/share/nginx/html

