
class SoundSystem 

	ctx: null
	sounds: null

	constructor: ->
		AudioContext = window.AudioContext or window.webkitAudioContext
		@ctx = new AudioContext()
		@sounds = {}

	play: (name) ->
		buffer = @sounds[name]
		source = @ctx.createBufferSource()
		source.buffer = buffer
		if name in ['nova', 'mininova']
			att = @ctx.createGainNode()
			att.gain.value = 0.5
			source.connect att
			att.connect @ctx.destination
		else
			source.connect @ctx.destination
		source.start 0

	load: (name, url, callback) ->
		xhr = new XMLHttpRequest()
		xhr.open("GET", url, true)
		xhr.responseType = "arraybuffer"
		xhr.onload = => 
			@ctx.decodeAudioData xhr.response, (buffer) =>
				@sounds[name] = buffer
				callback source if typeof callback is 'function'
			, =>
				console.error 'audio loading error', arguments
		xhr.send()

window.Scores =

	get: -> 
		all = $.parseJSON(localStorage.getItem('high_scores')) or []
		all = all.filter (a) -> a.version is VERSION
		all[0...Config.maxHighScores].sort (a,b) -> b.score - a.score

	clear: -> localStorage.removeItem('high_scores')

	add: (data) ->
		data.version = VERSION
		all = @get()
		all.push data
		all.sort (a,b) -> b.score - a.score
		localStorage.setItem('high_scores', JSON.stringify(all))


do ->
	globals.rainbowIndex = 0
	numRainbowColors = 256
	rainbowColors = 
		(tinycolor("hsv(#{p * 100 / numRainbowColors}%, 50%, 100%)").toRgbString() for p in [0..numRainbowColors])

	window.rainbow = (factor=1, alpha=1) ->
		color = rainbowColors[(globals.rainbowIndex * factor) % rainbowColors.length]
		if alpha < 1
			tc = tinycolor(color)
			tc.setAlpha(alpha)
			color = tc.toRgbString()
		color

	window.sound = new SoundSystem
	sound.load "fork", "snd/fork.wav"
	sound.load "merge", "snd/merge.wav"
	sound.load "nova", "snd/nova.wav"
	sound.load "mininova", "snd/mininova.wav"

$ ->
	states =
		play: new PlayState
		title: new TitleState
		gameover: new GameOverState

	Game = new GameEngine
		canvas: $('#game').get(0)
		initialState: states.title
		fps: 60
		preUpdate: ->
			globals.rainbowIndex += 1

	globals.rainbowIndex = 0

	Game.start()