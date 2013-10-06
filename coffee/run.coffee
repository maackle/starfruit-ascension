



$ ->
	states =
		play: new PlayState

	globals.quadtree = states.play.quadtree  # TODO: no globals

	game = new GameEngine
		canvas: $('#game').get(0)
		initialState: states.play
		fps: 30

	game.start()