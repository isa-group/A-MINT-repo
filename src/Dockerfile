FROM python:3.12-slim

# Set environment variables
ENV DISPLAY=:99
ENV PYTHONPATH=/app
ENV PORT=8000

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    wget \
    gnupg \
    unzip \
    xvfb \
    libxi6 \
    libgconf-2-4 \
    && rm -rf /var/lib/apt/lists/*

# Install Chrome
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Create app directory and set permissions
WORKDIR /app
RUN mkdir -p /app/chromedriver

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create necessary directories
RUN mkdir -p /app/logs /app/output /app/prompts /app/prompts/plans /app/prompts/features /app/prompts/add_ons

# Copy application code and prompts
COPY src/amint /app/src/amint
COPY src/amint/prompts /app/prompts

# Create non-root user
RUN useradd -m appuser && \
    chown -R appuser:appuser /app && \
    chmod -R 755 /app/prompts

# Switch to non-root user
USER appuser

# Set ChromeDriver path
ENV PATH="/app/chromedriver:${PATH}"

# Run the application
CMD ["uvicorn", "src.amint.api.main:app", "--host", "0.0.0.0", "--port", "8000"] 