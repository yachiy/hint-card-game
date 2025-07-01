const suits = ['red', 'green', 'blue', 'yellow', 'white'];
const ranks = [1, 1, 1, 2, 2, 3, 3, 4, 4, 5];

class Game {
  constructor(gameId) {
    this.gameId = gameId;
    this.players = [];
    this.deck = [];
    this.discardPile = [];
    this.playedCards = { red: 0, green: 0, blue: 0, yellow: 0, white: 0 };
    this.hintTokens = 8;
    this.stormTokens = 3;
    this.currentPlayerId = null; // Game starts when enough players join
    this.hasStarted = false;
  }

  addPlayer(playerId, playerName) {
    if (this.players.length >= 5) {
      return false; // Max 5 players
    }
    this.players.push({ id: playerId, name: playerName, hand: [] });
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
    if (!player || this.currentPlayerId !== playerId || !this.hasStarted) return false;

    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return false;

    const cardToPlay = player.hand[cardIndex];

    if (this.playedCards[cardToPlay.suit] === cardToPlay.rank - 1) {
      this.playedCards[cardToPlay.suit]++;
    } else {
      this.stormTokens--;
      this.discardPile.push(cardToPlay);
    }

    player.hand.splice(cardIndex, 1);
    if (this.deck.length > 0) {
      player.hand.push(this.deck.shift());
    }

    this.nextTurn();
    return true;
  }

  giveHint(hintTargetPlayerId, hintType, value) {
    if (this.hintTokens === 0 || !this.hasStarted) return false;

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
    return true;
  }

  discardCard(playerId, cardId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player || this.currentPlayerId !== playerId || !this.hasStarted) return false;

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
    };
  }
}

module.exports = Game;