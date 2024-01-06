# Use a base image that supports apt-get (e.g., debian)
FROM debian:latest

# Update the package list and install essential packages
RUN apt-get update && \
    apt-get install -y \
    build-essential \
    python3 \
    python3-pip \
    python3-dev \
    rustc \
    curl

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
RUN apt-get install -y nodejs

# Set working directory
WORKDIR /app

# Copy your application files to the container
COPY . .

# Install npm dependencies
RUN npm install

# Command to run your application
CMD ["node", "index.js"]

# docker build -t debeliq .
# docker run debeliq