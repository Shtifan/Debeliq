# Debeliq Discord Bot

A Discord bot built with Discord.js and Discord Player for music playback and other features.

## Features

- Music
- Games
- Moderation

## Prerequisites

-   Node.js (v16 or higher)
-   Python 3.8–3.11 (required for chess solver functionality)
-   FFmpeg (required for music playback)
-   Docker (required for execute command functionality)
-   Discord Bot Token

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
