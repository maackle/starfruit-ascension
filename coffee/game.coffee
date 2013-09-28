game = null

NotImplemented = {

}

class vec

	constructor: (@x, @y) ->

	add: (v) ->
		new vec @x + v.x, @y + v.y
	sub: (v) ->
		new vec @x - v.x, @y - v.y

class Thing

	render: -> throw NotImplemented
	update: -> throw NotImplemented

class Star extends Thing

	@img = makeImage 'img/star-32.png'

	offset:
		x: 15
		y: 16

	constructor: (@pos) ->

	update: ->
		@pos.y -= 1

	render: ->
		withImage Star.img, (im) =>
			game.ctx.drawImage im, @pos.x - @offset.x, @pos.y - @offset.y


class Stalk extends Thing

	leaves: []

	constructor: ->

	update: ->

	render: ->
		# for leaf in @leaves
			


class Starstalk

	things: []
	loopInterval: null
	status:
		paused: false

	constructor: ({@$canvas}) ->
		@canvas = @$canvas.get(0)
		@ctx = @canvas.getContext '2d'

	width: -> @canvas.width
	height: -> @canvas.height

	clearScreen: (color) ->
		@ctx.fillStyle = color
		@ctx.fillRect 0, 0, @width(), @height()
	
	start: ->
		@bindEvents()
		$(window).trigger 'resize'
		@clearScreen('blue')
		@things.push new Star new vec @width()/2, @height()

		@doLoop()

	doLoop: ->
		@loopInterval = setInterval =>
			@clearScreen()
			if not @status.paused
				for thing in @things
					thing.update()
					thing.render()
		, 100

	togglePause: ->
		@status.paused = not @status.paused
		if @status.paused
			clearInterval @loopInterval
		else
			@doLoop()

	bindEvents: ->
		$(window).on 'resize', (e) =>
			$body = $('body')
			console.log 'resized', $body.width()
			@$canvas.attr
				width: $body.width()
				height: $body.height()
			@clearScreen('pink')

		$(document).on 'keypress', (e) =>
			switch e.charCode
				when 32 
					@togglePause()

$ ->
	$body = $('body')

	game = new Starstalk 
		$canvas: $('#game')

	game.start()
	