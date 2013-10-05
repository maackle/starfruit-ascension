


class GameOverState extends GameState


class PlayState extends GameState

	view: null

	constructor: ->


	enter: ->
		console.log @game
		@view = new Viewport @game.canvas,
			anchor: 'center'

	exit: ->

	update: (dt) ->

	render: (dt) ->
		@view.clearScreen('blue')

		
$ ->
	states =
		play: new PlayState


	game = new GameEngine
		canvas: $('#game').get(0)
		initialState: states.play
		fps: 30

	game.start()