# --- builder ---
FROM node:22-slim AS builder
WORKDIR /app

# better-sqlite3 build deps
RUN apt-get update && apt-get install -y --no-install-recommends \
        python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
# Use npm ci when lockfile present, else npm install
RUN if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi

COPY tsconfig.json next.config.ts next-env.d.ts ./
COPY src ./src

# Generate BAML client (best-effort; if BAML not installed, manual wrapper in src/lib/baml.ts is the source of truth)
RUN (npx --yes baml-cli generate || echo "baml-cli not available, skipping generation (wrapper in src/lib/baml.ts handles vision calls)")

# Build
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- runner ---
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3008

# better-sqlite3 needs libstdc++ at runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
        libstdc++6 ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# non-root user
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -m nodeuser

# Copy artifacts into a staging dir (avoids COPY-multi-source rules),
# then move the whole staged tree into /app.
RUN mkdir -p /out
COPY --from=builder /app/package.json /out/
COPY --from=builder /app/node_modules /out/node_modules
COPY --from=builder /app/.next /out/.next
COPY --from=builder /app/src /out/src
COPY --from=builder /app/public /out/public 2>/dev/null || true
# package-lock.json is optional (npm ci would need it; not strictly required for `next start`)
COPY --from=builder /app/package-lock.json /out/package-lock.json 2>/dev/null || true
COPY --from=builder /out/ /app/

# data directory is mounted as a volume, but ensure it exists for first run
RUN mkdir -p /app/data && chown -R nodeuser:nodejs /app/data

USER nodeuser
EXPOSE 3008

CMD ["npm", "start"]
