# Debeliq Discord Bot

A Discord bot built with Discord.js and Discord Player for music playback and other features.

## Features

-   Music playback capabilities
-   Command-based interaction system
-   Event handling system
-   Docker support for easy deployment

## Prerequisites

-   Node.js (v16 or higher)
-   Python (for additional features)
-   Discord Bot Token
-   npm or yarn package manager

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/debeliq.git
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

-   Copy `config.json.example` to `config.json` (if available)
-   Add your Discord bot token to the configuration

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

## Project Structure

-   `commands/` - Bot command implementations
-   `events/` - Discord event handlers
-   `data/` - Data storage and management
-   `index.js` - Main bot entry point
-   `config.json` - Bot configuration
-   `Dockerfile` - Docker container configuration

## Dependencies

-   discord.js - Discord API wrapper
-   discord-player - Music playback functionality
-   bgutils-js - Utility functions
-   nodemon - Development auto-reload

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.
