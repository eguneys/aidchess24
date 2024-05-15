### Engine Play Challenges


- Maintain the evaluation above -2.
- Search every position for tactics. Notify the tactics, notify the threats. notify the single move continuations.
(Tactics won't be there if evaluation stays above -2.)
- Extra challenges, like Rosen Trophies
  - Get a knight vs bishop material imbalance.
  - Obtain the bishop pair.
  - Play a non-blunder queen move.
  - Play specific openings.
  - Get out of the opening.
  - Get into an endgame.
  - Gambit a pawn.
  - Accept a gambit.
  - Decline a gambit.


### Sixth Street

- You play an analysis game against the engine.
- You play both white and black, Then it's your turn. 
- You have 6 plies to play. You can play any line you like.
- Then it's engine's turn. It also has 6 plies.
- Engine will analyse your lines, and prefer to keep your accurate moves, and surely drop your inaccurate moves, and make a new move for each dropped move.
- Each accurate move you get a point. 4, 5 or 6 accurate moves you get bonus points. No accurate moves game ends.
- You can use your plies either as separate lines or a single line, whichever you feel is comfortable for you.
- Essentially you can be playing at most 6 games at once, against the engine.

- When an inaccurate move drops, it will automatically drop next moves that comes after it if there is any. So if you rely on a single line, and first move fails, game ends.


## Considerations

- Two player real time adaptation.

- Player doesn't choose a color. Essentially player will try to find a drawing line without blundering for both sides. This might come as easy, just exchanging pieces willingly might put you in a situation. 
- To make things interesting and combat this, engine might have a temper that doesn't so much prefer your moves but picks other random but accurate moves adding more diversity to the game.

- Occasionaly, user might want to show a losing line, by indicating the played move as a blunder and give a continuation. This might be incentivized somehow. Similarly user might want to indicate a line as a forcing line, like if a move is the only best move available.

- Single lines can give multiplier bonus for incentive.