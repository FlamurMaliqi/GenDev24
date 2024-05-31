# Overview
This project is a web application built using Node.js and Express. It is designed to facilitate community-based betting on game outcomes. Users can register, join communities, place bets on upcoming games, and view leaderboards for their communities and globally.

# Features
1. User Management:

  - Registration: Users can register with a unique username.
  - Login Check: Users can check if they are already registered.
    
2. Community Management:

  - Create Community: Users can create new communities if they are not already part of five communities.
  - Join Community: Users can join existing communities if they are not already part of five communities.
  - View User Communities: Users can view the communities they belong to.
  - Sneak Peek: Users can get a preview of the leaderboard for communities they belong to.

3. Betting System:

  - Upcoming Games: View the next three upcoming games.
  - Place Bet: Users can place bets on upcoming games.
  - Update Game Results: Admins can update the result of a game.

4. Leaderboard:

  - Community Leaderboard: View the leaderboard for a specific community.
  - Global Leaderboard: View the global leaderboard.
5. Pinning Users:
  - Users can pin or unpin other users in a community.

# Setup and Installation
1. Clone the Repository:

```
git clone <repository-url>
cd <repository-directory>
```

Install Dependencies:

bash
Code kopieren
npm install
Database Setup:
Ensure you have SQLite installed. Create the necessary database and tables using the provided SQL scripts.

Run the Server:

bash
Code kopieren
node server.js
The server will start and be accessible at http://localhost:3000.

API Endpoints
User Endpoints
POST /check-user: Check if a user is registered.
POST /register-user: Register a new user.
Community Endpoints
POST /create-community: Create a new community.
POST /join-community: Join an existing community.
GET /api/user-communities: Get communities of a user.
GET /api/community: Get details of a specific community.
GET /api/user-community-sneak-previews: Get sneak previews of all user communities.
Betting Endpoints
GET /api/upcoming-games: Get upcoming games.
POST /api/place-bet: Place a bet on a game.
POST /api/update-game-result: Update the result of a game.
Leaderboard Endpoints
GET /api/community-leaderboard: Get leaderboard for a community.
GET /api/global-leaderboard: Get global leaderboard.
GET /api/community-sneak-peek: Get sneak peek of a community leaderboard.
Pinning Endpoints
POST /api/pin-user: Pin or unpin a user in a community.
Code Structure
server.js: Main application file setting up the Express server and defining routes.
database.js: Database configuration and setup using SQLite.
public/: Directory for static files.
game_schedule.csv: CSV file containing the schedule of games.
Optimizations and Improvements
Database Indexing: Ensure indexes on frequently queried columns to improve query performance.
Caching: Implement caching for frequently accessed data like leaderboards and upcoming games to reduce database load.
Input Validation: Enhance input validation and sanitation to improve security and data integrity.
Error Handling: Implement a more robust error handling mechanism to provide better feedback and logging.
Authentication: Add user authentication and authorization to secure endpoints and manage user access.
Possible Future Enhancements
Notification System: Notify users of upcoming games and bet results.
Admin Panel: A dedicated admin panel for managing communities, users, and game results.
Real-time Updates: Implement WebSocket or similar technology for real-time updates of leaderboards and game results.
Mobile Support: Create a responsive design or a mobile application for better accessibility on mobile devices.
This project provides a comprehensive platform for community-based betting with a focus on user engagement through communities and leaderboards. With further optimizations and enhancements, it can offer a robust and scalable solution for sports betting enthusiasts.






