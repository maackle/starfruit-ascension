


class GameOverState extends GameState


$ ->
	states =
		play: new PlayState


	game = new GameEngine
		canvas: $('#game').get(0)
		initialState: states.play
		fps: 30

	game.start()