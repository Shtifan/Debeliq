# Debeliq Discord Bot

Debeliq is a feature-rich Discord bot that provides music playback, fun games, moderation tools, and unique features like chess problem solving.

## Features

### 🎵 Music Commands

-   Play music from YouTube and other sources
-   Queue management and playback controls
-   Autoplay functionality
-   Advanced features like speed control and seeking

### 🎮 Games

-   Blackjack
-   Cows and Bulls
-   Slots
-   Split or Steal
-   Toto
-   And more!

### 🛡️ Moderation

-   Ban/Kick users
-   Timeout management
-   Message deletion
-   Server management tools

### 🔧 Other Features

-   Chess problem solver with AI
-   Code execution capability
-   Random number generation
-   Custom leaderboard system

## Prerequisites

-   Node.js (v16 or higher)
-   Python 3.8–3.11 (required for chess solver functionality)
-   FFmpeg (required for music playback)
-   Docker (required for code execution functionality)
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

## Configuration

Create a `.env` file with the following:

```properties
TOKEN=your_discord_bot_token_here
CLIENT_ID=your_discord_client_id_here
```

## Usage

### Starting the Bot

```bash
npm start
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

## Command Categories

### Music Commands

-   `/play` - Play a song or playlist
-   `/queue` - View the current queue
-   `/skip` - Skip the current track
-   `/stop` - Stop playback
-   And many more music control commands

### Game Commands

-   `/blackjack` - Start a game of blackjack
-   `/slots` - Play the slot machine
-   And other game commands

### Moderation Commands

-   `/ban` - Ban a user
-   `/kick` - Kick a user
-   `/timeout` - Timeout a user
-   `/delete` - Delete messages

### Other Commands

-   `/chess_solver` - Solve chess problems using AI
-   `/execute_code` - Execute code snippets
-   `/ping` - Check bot latency

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

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC License - See LICENSE file for details
