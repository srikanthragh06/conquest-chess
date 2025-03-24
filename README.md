# Conquest Chess

Conquest Chess is a multiplayer chess web application similar to Chess.com. I built it as a personal project to explore and dive into complex socket logic and scalable server architecture for a game like chess, where low latency and real-time synchronization are crucial.

## Features
- **Multiplayer Chess**: Play live games with friends or random opponents.
- **Matchmaking System**: Find opponents using first-come-first-serve matchmaking.
- **Lobby System**: Create and join lobbies through lobby link.
- **Guest Account**: Play games without registering.
- **Game History & Replays**: Review past games.
- **Move Validation & Time clock system**: Ensures legal moves and enforces time controls.


## Tech Stack
- **Frontend**: React with Vite
- **Backend**: Node.js with TypeScript
- **WebSocket Server**: Socket.io for real-time communication
- **Database**: PostgreSQL for persistent storage
- **State Management**: Redis for handling multiplayer game states and ensure scalable architecture

## Dev Setup  

### Prerequisites  
- Docker and Docker Compose

### Steps to Run Locally  

1. **Clone the repository**  
   ```sh
   git clone https://github.com/your-username/conquest-chess.git
   cd conquest-chess
   docker-compose up --build -d
    ```

## Live Demo  

🔗 [Conquest Chess](https://conquestchess.fun) 
