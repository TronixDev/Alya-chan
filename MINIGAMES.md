# 🎮 Interactive Minigames Collection

This directory contains a complete collection of interactive Discord minigames built with Seyfert Components v2. All games feature full interactivity with button collectors, real-time game state management, and comprehensive gameplay mechanics.

## 📁 Game List

### ✅ **Completed Games**

| Game | File | Description | Features |
|------|------|-------------|----------|
| 🔤 **Hangman** | `hangman.ts` | Word guessing game | Alphabet pagination, themed categories, emoji drawing |
| ✂️ **Rock Paper Scissors** | `rps.ts` | Multiplayer RPS | Challenge/accept system, simultaneous moves, play-again |
| 🧩 **Match Pairs** | `match-pairs.ts` | Memory card game | 5x5 grid, joker mechanics, pair matching |
| 💣 **Minesweeper** | `minesweeper.ts` | Mine detection game | 5x5 board, flood-fill, safe first click |
| 🎰 **Slots** | `slots.ts` | Slot machine | 3-phase spinning animation, win detection |
| 🐍 **Snake** | `snake.ts` | Classic snake game | Movement controls, collision detection, food system |
| ⭕ **Tic Tac Toe** | `tictactoe.ts` | 3x3 grid game | Multiplayer challenges, win detection |
| 🧠 **Trivia** | `trivia.ts` | Knowledge quiz | API integration, multiple categories, timer |

## 🎯 Game Features

### 🎲 **Hangman**
- **Interactive Alphabet**: Paginated A-L / M-Z button layout
- **Themed Categories**: Programming, animals, colors, food words
- **Visual Progression**: Emoji-based hangman drawing stages
- **Letter Tracking**: Shows guessed letters and remaining attempts

### ✂️ **Rock Paper Scissors**
- **Multiplayer System**: Challenge other users to play
- **Hidden Choices**: Players make simultaneous secret selections
- **Win Detection**: Proper RPS logic with tie handling
- **Replay Option**: Continue playing multiple rounds

### 🧩 **Match Pairs**
- **5x5 Grid**: 24 emoji pairs + 1 joker for dynamic gameplay
- **Memory Mechanics**: Progressive tile revelation system
- **Joker Logic**: Automatic pair matching for joker tiles
- **Score Tracking**: Turn counting and pair completion

### 💣 **Minesweeper**
- **5x5 Board**: Balanced difficulty with strategic mine placement
- **Flood Fill**: Automatic safe area revelation
- **Safe Start**: First click guaranteed mine-free
- **Number Hints**: Adjacent mine count indicators

### 🎰 **Slots**
- **Spinning Animation**: 3-phase visual slot machine experience
- **Symbol Reels**: Previous/current/next symbol display
- **Win Detection**: Matching symbol combinations
- **Spin Again**: Continuous play functionality

### 🐍 **Snake**
- **Directional Movement**: Up/down/left/right controls
- **Food System**: Random food placement and consumption
- **Collision Detection**: Wall and self-collision handling
- **Score Tracking**: Length-based scoring system

### ⭕ **Tic Tac Toe**
- **Challenge System**: Multiplayer game invitations
- **3x3 Interactive Grid**: Button-based move placement
- **Win Detection**: Horizontal, vertical, diagonal combinations
- **Turn Management**: Alternating player system

### 🧠 **Trivia**
- **API Integration**: Open Trivia Database with fallback questions
- **Multiple Categories**: 17 different knowledge categories
- **Difficulty Levels**: Easy, medium, hard options
- **Timed Gameplay**: 30-second answer countdown
- **Answer Feedback**: Correct/incorrect indication with explanations

## 🛠️ Technical Implementation

### **Framework**: Seyfert Components v2
- Modern Discord.js alternative with enhanced component system
- TypeScript-first development with strict type safety
- Component-based UI architecture

### **Interactive Systems**
- **Button Collectors**: User-filtered interaction handling
- **Game State Management**: Persistent game data across interactions
- **Timeout Handling**: Automatic game cleanup and status updates
- **Real-time Updates**: Live game state reflection in UI

### **Code Quality**
- **TypeScript Safety**: Comprehensive type checking and error handling
- **Modular Design**: Each game as independent SubCommand class
- **Error Recovery**: Graceful handling of API failures and edge cases
- **Performance Optimized**: Efficient collector management and cleanup

## 🎮 Usage Instructions

### **Installation**
All games are automatically available through the Seyfert command system. No additional setup required.

### **Command Syntax**
```
/minigame hangman
/minigame rps @opponent
/minigame match-pairs
/minigame minesweeper
/minigame slots
/minigame snake
/minigame tictactoe @opponent
/minigame trivia [category] [difficulty]
```

### **Game Controls**
- **Button Interactions**: All games use clickable buttons for input
- **User Filtering**: Only relevant players can interact with game buttons
- **Timeout Protection**: Games automatically end after inactivity periods
- **Visual Feedback**: Real-time status updates and result displays

## 🔧 Development Notes

### **Collector Pattern**
All games implement a consistent collector pattern:
```typescript
const collector = message.createComponentCollector({
    filter: (i: any) => i.user.id === expectedUser.id && i.customId.startsWith("game_"),
    idle: 300000, // 5 minutes
});
```

### **Game State Management**
Each game maintains its state through local variables and updates the UI accordingly:
```typescript
let gamePhase: "waiting" | "playing" | "ended" = "waiting";
let gameData: GameSpecificData = {};
```

### **Component Updates**
Games update their UI by regenerating components based on current state:
```typescript
await interaction.update({
    components: [getComponents(), ...getGameButtons()],
    flags: MessageFlags.IsComponentsV2,
});
```

## 🚀 Future Enhancements

### **Potential Additions**
- **Leaderboards**: Cross-game scoring system
- **Achievements**: Unlock badges for game milestones
- **Tournament Mode**: Multi-player competitive brackets
- **Customization**: User-configurable game settings
- **Statistics**: Personal game performance tracking

### **Technical Improvements**
- **Database Integration**: Persistent game statistics
- **Caching System**: Improved performance for repeated plays
- **Multi-language**: Localization support for international users
- **Accessibility**: Enhanced screen reader compatibility

---

*All games are fully functional and production-ready. Built with ❤️ using Seyfert Components v2.*
