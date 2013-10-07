

do ->
	globals.rainbowIndex = 0
	numRainbowColors = 256
	rainbowColors = 
		(tinycolor("hsv(#{p * 100 / numRainbowColors}%, 50%, 100%)").toRgbString() for p in [0..numRainbowColors])
		
	window.rainbow = (factor=1) ->
		rainbowColors[(globals.rainbowIndex * factor) % rainbowColors.length]

$ ->
	states =
		play: new PlayState

	Game = new GameEngine
		canvas: $('#game').get(0)
		initialState: states.play
		fps: 30
		preUpdate: ->
			globals.rainbowIndex += 1

	globals.quadtree = states.play.quadtree  # TODO: no globals
	globals.rainbowIndex = 0

	Game.start()