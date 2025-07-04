const suits = ['red', 'green', 'blue', 'yellow', 'white'];
const ranks = [1, 1, 1, 2, 2, 3, 3, 4, 4, 5];

class Game {
  constructor(gameId, hostId, displayName) {
    this.displayName = displayName;
    this.gameId = gameId;
    this.hostId = hostId;
    this.players = [];
    this.deck = [];
    this.discardPile = [];
    this.playedCards = { red: 0, green: 0, blue: 0, yellow: 0, white: 0 };
    this.hintTokens = 8;
    this.stormTokens = 3;
    this.currentPlayerId = null; // Game starts when enough players join
    this.hasStarted = false;
    this.isGameOver = false;
    this.isGameWon = false; // Add isGameWon property
    this.lastActivity = Date.now(); // Add lastActivity property
  }

  // Update lastActivity on any player action
  _updateActivity() {
    this.lastActivity = Date.now();
  }

  addPlayer(playerId, playerName) {
    if (this.players.length >= 5) {
      return false; // Max 5 players
    }
    if (this.hasStarted) {
      return false; // Cannot join a game that has already started
    }
    this.players.push({ id: playerId, name: playerName, hand: [] });
    this._updateActivity(); // Update activity on player join
    return true;
  }

  startGame() {
    if (this.hasStarted) return false;
    if (this.players.length < 2) return false; // Min 2 players

    this.deck = this.createDeck();
    this.shuffleDeck();
    this.dealInitialHands();
    this.currentPlayerId = this.players[0].id;
    this.hasStarted = true;
    this._updateActivity(); // Update activity on game start
    return true;
  }

  createDeck() {
    const deck = [];
    let idCounter = 0;
    suits.forEach(suit => {
      ranks.forEach(rank => {
        deck.push({ id: idCounter++, suit, rank });
      });
    });
    return deck;
  }

  shuffleDeck() {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  dealInitialHands() {
    const cardsPerPlayer = this.players.length <= 3 ? 5 : 4;

    this.players.forEach(player => {
      for (let i = 0; i < cardsPerPlayer; i++) {
        const card = this.deck.shift();
        if (card) {
          player.hand.push(card);
        }
      }
    });
  }

  playCard(playerId, cardId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player || this.currentPlayerId !== playerId || !this.hasStarted || this.isGameOver) return false;

    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return false;

    const cardToPlay = player.hand[cardIndex];
    console.log(`[playCard] Player ${playerId} attempting to play card:`, cardToPlay);

    if (this.playedCards[cardToPlay.suit] === cardToPlay.rank - 1) {
      this.playedCards[cardToPlay.suit]++;
      console.log(`[playCard] Card ${cardToPlay.id} played successfully. New playedCards:`, this.playedCards);
      // Bonus: If a 5 card is played, restore a hint token
      if (cardToPlay.rank === 5) {
        if (this.hintTokens < 8) {
          this.hintTokens++;
          console.log(`[playCard] Bonus: 5 card played. Hint token restored. Current hint tokens: ${this.hintTokens}`);
        }
      }
    } else {
      this.stormTokens--;
      this.discardPile.push(cardToPlay);
      console.log(`[playCard] Card ${cardToPlay.id} played incorrectly. Storm tokens remaining: ${this.stormTokens}`);
      if (this.stormTokens === 0) {
        this.isGameOver = true;
        console.log('[playCard] Game over: Storm tokens reached 0. Setting isGameOver to true.');
      }
    }

    player.hand.splice(cardIndex, 1);
    if (this.deck.length > 0) {
      player.hand.push(this.deck.shift());
    }

    this.nextTurn();
    this._updateActivity(); // Update activity on playCard
    this.checkWinCondition(); // Check for win condition after every card play
    return true;
  }

  checkWinCondition() {
    const allSuitsPlayed = suits.every(suit => this.playedCards[suit] === 5);
    if (allSuitsPlayed) {
      this.isGameOver = true;
      this.isGameWon = true; // Set isGameWon to true on win
      console.log('[Game] Win condition met! Setting isGameOver to true and isGameWon to true.');
    }
  }

  giveHint(hintTargetPlayerId, hintType, value) {
    if (this.hintTokens === 0 || !this.hasStarted || this.isGameOver) return false;

    this.hintTokens--;

    const targetPlayer = this.players.find(p => p.id === hintTargetPlayerId);
    if (targetPlayer) {
      targetPlayer.hand = targetPlayer.hand.map(card => {
        if (hintType === 'suit' && card.suit === value) {
          return { ...card, hintedSuit: true };
        } else if (hintType === 'rank' && card.rank === value) {
          return { ...card, hintedRank: true };
        }
        return card;
      });
    }

    this.nextTurn();
    this._updateActivity(); // Update activity on giveHint
    return true;
  }

  discardCard(playerId, cardId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player || this.currentPlayerId !== playerId || !this.hasStarted || this.isGameOver) return false;

    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return false;

    const cardToDiscard = player.hand[cardIndex];

    this.discardPile.push(cardToDiscard);
    if (this.hintTokens < 8) {
      this.hintTokens++;
    }

    player.hand.splice(cardIndex, 1);
    if (this.deck.length > 0) {
      player.hand.push(this.deck.shift());
    }

    this.nextTurn();
    this._updateActivity(); // Update activity on discardCard
    return true;
  }

  nextTurn() {
    const currentIndex = this.players.findIndex(p => p.id === this.currentPlayerId);
    const nextIndex = (currentIndex + 1) % this.players.length;
    this.currentPlayerId = this.players[nextIndex].id;
  }

  getState() {
    return {
      gameId: this.gameId,
      players: this.players,
      deckSize: this.deck.length,
      discardPile: this.discardPile,
      playedCards: this.playedCards,
      hintTokens: this.hintTokens,
      stormTokens: this.stormTokens,
      currentPlayerId: this.currentPlayerId,
      hasStarted: this.hasStarted,
      hostId: this.hostId,
      displayName: this.displayName,
      isGameOver: this.isGameOver,
      isGameWon: this.isGameWon, // Include isGameWon in state
      lastActivity: this.lastActivity, // Include lastActivity in state
    };
  }
}

module.exports = Game;
