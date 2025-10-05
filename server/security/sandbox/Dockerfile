# Dockerfile for Security Testing Sandbox
FROM node:18-alpine

# Install build dependencies and security testing tools
RUN apk add --no-cache \
    gcc \
    g++ \
    make \
    python3-dev \
    musl-dev \
    linux-headers \
    libffi-dev \
    openssl-dev \
    python3 \
    py3-pip \
    py3-requests \
    py3-beautifulsoup4 \
    curl \
    wget \
    nmap \
    netcat-openbsd \
    openssl \
    git \
    bash \
    jq \
    sqlite \
    postgresql-client \
    mysql-client

# Create a virtual environment for additional Python packages
RUN python3 -m venv /opt/security-venv

# Upgrade pip in virtual environment
RUN /opt/security-venv/bin/pip install --upgrade pip

# Install Python security tools in virtual environment
RUN /opt/security-venv/bin/pip install --no-cache-dir \
    sqlmap \
    requests \
    beautifulsoup4

# Install pwntools and scapy separately (they're complex packages)
RUN /opt/security-venv/bin/pip install --no-cache-dir pwntools || echo "pwntools failed, continuing..."
RUN /opt/security-venv/bin/pip install --no-cache-dir scapy || echo "scapy failed, continuing..."

# Clean up build dependencies to reduce image size
RUN apk del gcc g++ make python3-dev musl-dev linux-headers libffi-dev openssl-dev

# Make virtual environment available in PATH
ENV PATH="/opt/security-venv/bin:$PATH"

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create directories for test results and logs
RUN mkdir -p /app/test-results /app/logs && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose testing port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3002/health || exit 1

# Default command
CMD ["node", "sandbox-server.js"]
