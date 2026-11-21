
FROM node:22-alpine

# Create a non-root user.
RUN addgroup -S sandbox && \
    adduser -S -u 10001 -G sandbox sandbox

WORKDIR /workspace

# Only dependencies approved by our application.
COPY package.json ./package.json

RUN npm install \
    --ignore-scripts \
    --no-audit \
    --no-fund

# Fixed TypeScript configuration controlled by us.
COPY tsconfig.json ./tsconfig.json

RUN chown -R root:root /workspace && \
    chmod -R a-w /workspace

USER 10001:10001

CMD ["node", "--version"]
