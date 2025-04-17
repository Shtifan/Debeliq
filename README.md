# Debeliq Discord Bot

Debeliq is a discord bot that can play music, games and moderate your server.

## Prerequisites

-   Node.js
-   Python 3.8–3.11 (required for chess solver functionality)
-   FFmpeg (required for music playback)
-   Docker (required for execute command functionality)
-   Discord Bot Token

## Installation

1. Clone the repository:

```bash
git clone https://github.com/Shtifan/debeliq.git
cd debeliq
```

2. Install dependencies:

```bash
npm install
pip install -r requirements.txt
```

Or use the provided script:

```bash
npm run install:all
```

3. Configure the bot:

-   Copy `config.json.example` to `config.json`
-   Add your Discord bot token and client id to the configuration

## Usage

### Starting the Bot

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

### Updating Dependencies

Regular update:

```bash
npm run update
```

Force update (if needed):

```bash
npm run update:force
```

### Docker Deployment

Build the Docker image:

```bash
docker build -t debeliq .
```

Run the container:

```bash
docker run -d debeliq
```
