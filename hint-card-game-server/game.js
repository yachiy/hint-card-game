const ranks = [1, 1, 1, 2, 2, 3, 3, 4, 4, 5];
const rainbowRanks = [1, 2, 3, 4, 5];

class Game {
  constructor(gameId, hostId, displayName, useRainbow = false) {
    this.displayName = displayName;
    this.gameId = gameId;
    this.hostId = hostId;
    this.useRainbow = useRainbow;
    this.players = [];
    this.deck = [];
    this.discardPile = [];
    this.suits = ['red', 'green', 'blue', 'yellow', 'white'];
    if (this.useRainbow) {
      this.suits.push('rainbow');
    }
    this.playedCards = this.suits.reduce((acc, suit) => {
      acc[suit] = 0;
      return acc;
    }, {});
    this.hintTokens = 8;
    this.stormTokens = 3;
    this.currentPlayerId = null; // Game starts when enough players join
    this.hasStarted = false;
    this.isGameOver = false;
    this.isGameWon = false; // Add isGameWon property
    this.deckEmptyTurnsCounter = 0; // New: Counter for turns after deck is empty
    this.deckWasEmpty = false; // New: Flag if deck has become empty
    this.gameEndReason = null; // New: Reason for game ending (win, storm, deck_empty_turns)
    this.lastActivity = Date.now(); // Add lastActivity property
    this.lastAction = null; // Add lastAction property
  }

  // Update lastActivity on any player action
  _updateActivity() {
    this.lastActivity = Date.now();
  }

  addPlayer(playerId, playerName) {
    const existingPlayer = this.players.find(p => p.name === playerName);
    if (existingPlayer) {
        // If the reconnecting player was the current player, update currentPlayerId
        if (this.currentPlayerId === existingPlayer.id) {
            this.currentPlayerId = playerId; // Update to the new connection's ID
        }
        existingPlayer.id = playerId; // Update their connection ID
        this._updateActivity();
        return true; // Successfully reconnected
    }

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

    // Shuffle players to randomize turn order
    for (let i = this.players.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.players[i], this.players[j]] = [this.players[j], this.players[i]];
    }

    this.currentPlayerId = this.players[0].id; // First player in the shuffled list starts
    this.hasStarted = true;
    this._updateActivity(); // Update activity on game start
    return true;
  }

  createDeck() {
    const deck = [];
    let idCounter = 0;
    this.suits.forEach(suit => {
      if (suit === 'rainbow') {
        rainbowRanks.forEach(rank => {
          deck.push({ id: idCounter++, suit, rank });
        });
      } else {
        ranks.forEach(rank => {
          deck.push({ id: idCounter++, suit, rank });
        });
      }
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
      this.lastAction = `${player.name}が${cardToPlay.suit}の${cardToPlay.rank}をプレイしました。`;
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
      this.lastAction = `${player.name}が${cardToPlay.suit}の${cardToPlay.rank}をプレイしましたが、失敗しました。`;
      console.log(`[playCard] Card ${cardToPlay.id} played incorrectly. Storm tokens remaining: ${this.stormTokens}`);
      if (this.stormTokens === 0) {
        this.isGameOver = true;
        this.gameEndReason = 'storm'; // Set game end reason
        console.log('[playCard] Game over: Storm tokens reached 0. Setting isGameOver to true.');
      }
    }

    player.hand.splice(cardIndex, 1);
    if (this.deck.length > 0) {
      player.hand.push(this.deck.shift());
    } else if (this.deck.length === 0 && !this.deckWasEmpty) { // Only set if it just became empty
      this.deckWasEmpty = true;
      console.log('[playCard] Deck is now empty.');
    }

    this.nextTurn();
    this._updateActivity(); // Update activity on playCard
    this.checkWinCondition(); // Check for win condition after every card play
    return true;
  }

  checkWinCondition() {
    const allSuitsPlayed = this.suits.every(suit => this.playedCards[suit] === 5);
    if (allSuitsPlayed) {
      this.isGameOver = true;
      this.isGameWon = true; // Set isGameWon to true on win
      this.gameEndReason = 'win'; // Set game end reason
      console.log('[Game] Win condition met! Setting isGameOver to true and isGameWon to true.');
    }
  }

  giveHint(hintGiverId, hintTargetPlayerId, hintType, value) {
    if (this.hintTokens === 0 || !this.hasStarted || this.isGameOver || this.currentPlayerId !== hintGiverId) return false;

    const targetPlayer = this.players.find(p => p.id === hintTargetPlayerId);
    if (!targetPlayer) return false;

    // Validate that the hint is valid (i.e., at least one card matches)
    const hintIsValid = targetPlayer.hand.some(card => {
      if (hintType === 'suit') return card.suit === value;
      if (hintType === 'rank') return card.rank === value;
      return false;
    });

    if (!hintIsValid) {
      // Optional: Send an error message back to the user
      console.log(`[giveHint] Invalid hint from player ${hintGiverId}: No card matches the hint.`);
      return false; // Stop if the hint is not valid
    }

    this.hintTokens--;

    const hintGiver = this.players.find(p => p.id === hintGiverId);
    const hintReceiver = this.players.find(p => p.id === hintTargetPlayerId);
    this.lastAction = `${hintGiver.name}が${hintReceiver.name}に${hintType === 'suit' ? '色' : '数字'}のヒント（${value}）を出しました。`;

    targetPlayer.hand = targetPlayer.hand.map(card => {
      if (hintType === 'suit' && card.suit === value) {
        return { ...card, hintedSuit: true };
      } else if (hintType === 'rank' && card.rank === value) {
        return { ...card, hintedRank: true };
      }
      return card;
    });

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
    this.lastAction = `${player.name}がカードを1枚捨てました。`;
    if (this.hintTokens < 8) {
      this.hintTokens++;
    }

    player.hand.splice(cardIndex, 1);
    if (this.deck.length > 0) {
      player.hand.push(this.deck.shift());
    } else if (this.deck.length === 0 && !this.deckWasEmpty) { // Only set if it just became empty
      this.deckWasEmpty = true;
      console.log('[discardCard] Deck is now empty.');
    }

    this.nextTurn();
    this._updateActivity(); // Update activity on discardCard
    return true;
  }

  nextTurn() {
    const currentIndex = this.players.findIndex(p => p.id === this.currentPlayerId);
    const nextIndex = (currentIndex + 1) % this.players.length;
    this.currentPlayerId = this.players[nextIndex].id;

    // If deck is empty, increment turns counter
    if (this.deckWasEmpty) {
      this.deckEmptyTurnsCounter++;
      console.log(`[nextTurn] Deck empty turns counter: ${this.deckEmptyTurnsCounter}/${this.players.length}`);
      if (this.deckEmptyTurnsCounter >= this.players.length) {
        this.isGameOver = true;
        this.gameEndReason = 'deck_empty_turns'; // Set game end reason
        console.log('[nextTurn] Game over: Deck empty turns completed.');
      }
    }
  }

  getScore() {
    if (this.gameEndReason === 'storm') {
      return 0;
    }
    let score = 0;
    for (const suit in this.playedCards) {
      score += this.playedCards[suit];
    }
    return score;
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
      deckEmptyTurnsCounter: this.deckEmptyTurnsCounter, // Include in state
      deckWasEmpty: this.deckWasEmpty, // Include in state
      gameEndReason: this.gameEndReason, // Include in state
      score: this.getScore(), // Include score in state
      lastActivity: this.lastActivity, // Include lastActivity in state
      lastAction: this.lastAction, // Include lastAction in state
    };
  }
}

module.exports = Game;