# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=24-alpine
ARG NGINX_VERSION=1.27-alpine

# ============================================================
# STAGE 1: base — shared dependency install
# ============================================================
FROM node:${NODE_VERSION} AS base
WORKDIR /build
RUN apk add --no-cache build-base
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# ============================================================
# STAGE 2: test — run unit suite
# ============================================================
FROM base AS test
COPY . .
RUN make test-c99-core && \
    find test -maxdepth 1 -name "*.test.js" ! -name "softmmu-system.test.js" -print | sort | xargs node --test

# ============================================================
# STAGE 2B: stress — run unit and benchmark gates
# ============================================================
FROM test AS stress
ARG TARGETARCH
RUN if [ "$TARGETARCH" = "amd64" ]; then \
      node scripts/stress-suite.js && node scripts/stress-parallel.js; \
    else \
      echo "Skipping native nanosecond SLA stress under emulated ${TARGETARCH}; C99 and filtered JS conformance already passed."; \
    fi

# ============================================================
# STAGE 3: builder — production build
# ============================================================
FROM base AS builder
COPY . .
RUN npm run build

# ============================================================
# STAGE 4: runtime — nginx with COOP/COEP
# ============================================================
FROM nginx:${NGINX_VERSION} AS runtime

RUN addgroup -S omi && adduser -S -G omi omi

COPY --from=builder /build/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN touch /var/run/nginx.pid && \
    chown -R omi:omi /var/cache/nginx /var/run/nginx.pid /usr/share/nginx/html

EXPOSE 80

LABEL org.opencontainers.image.title="OMI Portal"
LABEL org.opencontainers.image.description="Omicron Object Model — CIDR-v0 browser projection surface"
LABEL org.opencontainers.image.url="https://github.com/anomalyco/omi-portal"
LABEL org.opencontainers.image.source="https://github.com/anomalyco/omi-portal"
LABEL org.opencontainers.image.licenses="MIT"
LABEL omi.service-bus="::1..::8"
LABEL omi.context-root="ffff-127--/48"
LABEL omi.remote-root="::/128"

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

USER omi
CMD ["nginx", "-g", "daemon off;"]
