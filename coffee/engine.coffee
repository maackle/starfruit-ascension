
class Quad

	x: null
	y: null
	w: null
	h: null

	constructor: ->
		if arguments.length == 4  # x, y, w, h
			[@x, @y, @w, @h] = arguments
		else throw 'unsupported Quad arguments'

	width: -> w
	height: -> h


class Viewport
	
	constructor: (@canvas, opts) ->
		{@anchor, @scroll, @scale} = opts
		@scale ?= 1
		@ctx = @canvas.getContext '2d'
		[w, h] = [@canvas.width, @canvas.height]
		@offset = [w/2, h/2]
	
	resetTransform: ->
		[w, h] = [@canvas.width, @canvas.height]
		@offset = [w/2, h/2]
		if @anchor.top?
			@offset[1] = @anchor.top
		if @anchor.right?
			@offset[0] = w - @anchor.right
		if @anchor.bottom?
			@offset[1] = h - @anchor.bottom
		if @anchor.left?
			@offset[0] = @anchor.left
		[ox, oy] = @offset
		@ctx.setTransform(@scale, 0, 0, @scale, ox + @scroll.x + 0.5, oy + @scroll.y + 0.5)

	clearScreen: (color) ->
		[w, h] = [@canvas.width, @canvas.height]
		@ctx.save()
		@ctx.setTransform(1, 0, 0, 1, 0, 0)
		@ctx.fillStyle = color
		@ctx.clearRect 0, 0, w, h
		@ctx.fillRect 0, 0, w, h
		@ctx.restore()

	fillScreen: (color) ->
		[w, h] = [@canvas.width, @canvas.height]
		@ctx.save()
		@ctx.setTransform(1, 0, 0, 1, 0, 0)
		@ctx.fillStyle = color
		@ctx.fillRect 0, 0, w, h
		@ctx.restore()

	dimensions: -> [@canvas.width, @canvas.height]
	
	worldBounds: ->  # TODO: scale + rotation
		# get rectangle that corresponds to the view, in world coordinates
		[w,h] = [@canvas.width, @canvas.height]
		[ox, oy] = @offset
		left: -(ox + @scroll.x + 0.5)
		top: -(oy + @scroll.y + 0.5)
		width: w
		height: h

	screen2world: (screen) ->  # TODO: scale + rotation
		[ox, oy] = @offset
		new Vec( screen.x - (ox + @scroll.x + 0.5), screen.y - (oy + @scroll.y + 0.5) )

	centerOn: (point) ->  # TODO
		[w, h] = [@canvas.width, @canvas.height]

	update: ->
		@resetTransform()


class GameState

	_boundEvents: []

	game: null  # this is set when being pushed onto a GameEngine and cleared when being popped
	parent: null  # which GameState called this?

	bind: (what, events, fn) -> 
		@_boundEvents.push [what, events, fn]

	_bindEvents: ->
		for e in @_boundEvents
			[what, events, fn] = e
			$(what).on events, fn

	_unbindEvents: ->
		for e in @_boundEvents
			[what, events, fn] = e
			$(what).off events

	enter: ->  # called when state is pushed on top

	exit: ->  # called when state is popped

	update: (dt) ->  # dt is execution time in seconds

	render: ->


class GameEngine

	canvas: null
	mouse: new Vec 0, 0

	config: {}
	states: []
	intervals:
		gameLoop: null

	constructor: (opts) ->
		@config = _.defaults opts,
			fps: 30
			fullscreen: true

		@canvas = opts.canvas ? throw 'no canvas supplied'

		@pushState opts.initialState

		@_bindEvents()
		
	start: ->
		if @_isValid()
			@intervals.gameLoop = setInterval => 
				@doLoop(1 / @config.fps)  # TODO record real fps
			, parseInt(1000 / @config.fps)
		else
			console.error 'failed to start game due to previous errors'

	stop: ->
		clearInterval @intervals.gameLoop

	currentState: -> 
		@states[@states.length - 1]

	pushState: (state) -> 
		state.game = this
		state.parent = @currentState()
		@states.push state
		state._bindEvents()
		state.enter()

	popState: -> 
		state = @states.pop()
		state.exit()
		state._unbindEvents()
		state.game = null
		state.parent = null
		state

	doLoop: (dt) ->
		state = @currentState()
		throw 'not a state' if not state instanceof GameState
		state.update(dt)
		state.render()

	_bindEvents: ->

		$(document).on 'keypress', (e) =>
			switch e.charCode
				when 32
					@togglePause()
				when 70 | 102
					@canvas.webkitRequestFullScreen()
					@canvas.mozRequestFullScreen()

		$(@canvas).on 'mousemove', (e) =>
			@mouse.x = e.offsetX or e.layerX
			@mouse.y = e.offsetY or e.layerY
		
		# prevent right click action
		$(@canvas).on 'contextmenu', (e) =>
    		e.preventDefault()

		$(window).on 'resize', (e) =>
			$body = $('body')
			$(@canvas).attr
				width: $body.width()
				height: $body.height()

		$(window).trigger 'resize'

	_isValid: ->
		@canvas?