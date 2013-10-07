'use strict'

M = {}

NotImplemented = {

}

M.context = (ctx, fn) ->
	ctx.save()
	fn(ctx)
	ctx.restore()

class Module

	@__keywords: ['extended']

	@extend: (obj) ->
		for key, value of obj when key not in Module.__keywords
			this[key] = value
		for key, value of obj.Meta
			this::[key] = value
		obj.extended?.apply(this)

class Vec

	@immutable: ->
		v = new Vec arguments
		Object.freeze(v)

	@polar: (r, t) ->
		x = Math.cos(t) * r
		y = Math.sin(t) * r
		new Vec x, y

	constructor: ->
		if arguments.length == 1
			v = arguments[0]
			@x = v.x
			@y = v.y
		else if arguments.length == 2
			[@x, @y] = arguments

	add: (v) ->
		@x += v.x
		@y += v.y
		this

	sub: (v) ->
		@x -= v.x
		@y -= v.y
		this

	lengthSquared: ->
		return @x*@x + @y*@y

	length: ->
		Math.sqrt @lengthSquared()

	angle: ->
		return clampAngleSigned Math.atan2 @y, @x

Vec.zero = Vec.immutable 0, 0
Vec.one = Vec.immutable 1, 1


class Quad

	x: null
	y: null
	w: null
	h: null

	constructor: ->
		if arguments.length == 4  # x, y, w, h
			[@x, @y, @w, @h] = arguments
		else throw 'unsupported Quad arguments'

	left: -> @x
	top: -> @y
	bottom: -> @y + @h
	right: -> @x + @w
	width: -> @w
	height: -> @h

	object: ->
		left: @x
		top: @y
		bottom: @y + @h
		right: @x + @w
		width: @w
		height: @h

	onPoint: (vec) ->
		vec.x >= @x and vec.y >= @y and vec.x <= @x + @w and vec.y <= @y + @h

	onQuad: (q) ->
		not (@x > q.x+q.w || @x+@w < q.x || @y > q.y+q.h || @y+@h < q.y)

class ImageResource

	@_cache: {}
	image: null
	loaded: false

	constructor: (o) ->
		console.assert o?
		if o instanceof Image
			im = o
		else
			hit = ImageResource._cache[o]?
			if hit
				im = hit
			else
				im = new Image
				im.src = o
				im.onload = => @loaded = true
				ImageResource._cache[0] = im
		@image = im



class Thing

	angle: 0.0
	scale: 1.0
	position: null

	render: -> throw NotImplemented
	update: -> throw NotImplemented
	
	withTransform: (ctx, fn) ->
		ctx.save()
		ctx.translate @position.x, @position.y  # offset correction happens when drawing the sprite.
		ctx.rotate @angle
		ctx.scale @scale, @scale
		# ctx.translate -@offset.x, -@offset.y
		fn()
		ctx.restore()



GFX =
	drawLineString: (ctx, points, more...) ->
		ctx.moveTo points[0].x, points[0].y
		for vec in points[1..]
			ctx.lineTo vec.x, vec.y
		for vec in more
			ctx.lineTo vec.x, vec.y

	drawImage: (ctx, im, pos, offset) ->
		if not offset?
			offset = 
				x: 0
				y: 0
		withImage im, (im) =>
			ctx.drawImage im, pos.x - offset.x, pos.y - offset.y


class Sprite

	offset: null
	image: null

	constructor: ({@image, @offset}) ->

	draw: (transform) -> (ctx) =>
		{position, rotation, scale} = transform
		ctx.save()
		ctx.translate position.x, position.y if position?
		ctx.rotate rotation if rotation?
		ctx.scale scale if scale?
		ctx.drawImage @image.image, - @offset.x, - @offset.y
		ctx.restore()


class Viewport
	
	constructor: (@canvas, opts) ->
		{@anchor, @scroll, @scale} = opts
		@anchor ?= {}
		@scroll ?= new Vec 0, 0
		@scale ?= 1
		@ctx = @canvas.getContext '2d'
		[w, h] = [@canvas.width, @canvas.height]
		@offset = [w/2, h/2]

	draw: (fn) ->
		@ctx.save()
		@resetTransform()
		fn(@ctx)
		@ctx.restore()
	
	resetTransform: ->
		[w, h] = [@canvas.width, @canvas.height]
		if @anchor == 'center'
			@offset = [w/2, h/2]
		else
			@offset = [0, 0]
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
	
	worldQuad: ->  # TODO: scale + rotation
		# get rectangle that corresponds to the view, in world coordinates
		[w,h] = [@canvas.width, @canvas.height]
		[ox, oy] = @offset
		x = -(ox + @scroll.x + 0.5)
		y = -(oy + @scroll.y + 0.5)
		new Quad x, y, w, h

	screen2world: (screen) ->  # TODO: scale + rotation
		[ox, oy] = @offset
		new Vec( screen.x - (ox + @scroll.x + 0.5), screen.y - (oy + @scroll.y + 0.5) )

	centerOn: (point) ->  # TODO
		[w, h] = [@canvas.width, @canvas.height]

	update: ->
		@resetTransform()


class GameState

	_timesPushed: 0
	_boundEvents: null

	game: null  # this is set when being pushed onto a GameEngine and cleared when being popped
	parent: null  # which GameState called this?

	constructor: ->
		@_boundEvents = []

	bind: (what, events, fn) -> 
		@_boundEvents ?= []
		@_boundEvents.push [what, events, fn]

	_bindEvents: ->
		@_boundEvents ?= []
		for e in @_boundEvents
			[what, events, fn] = e
			$(what).on events, fn

	_unbindEvents: ->
		for e in @_boundEvents
			[what, events, fn] = e
			$(what).off events

	enter: (info) ->  # called when state is pushed on top

	exit: ->  # called when state is popped

	update: (dt) ->  # dt is execution time in seconds

	render: ->


class GameEngine

	canvas: null
	mouse: null

	config: null
	states: null
	intervals:
		gameLoop: null

	constructor: (opts) ->
		@states = []
		@mouse = new Vec 0, 0
		
		@config = _.defaults opts,
			fps: 30
			fullscreen: true

		{@preUpdate, @postUpdate, @preRender, @postRender} = opts

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
		@intervals.gameLoop = null

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
		# console.debug 'tick'
		state = @currentState()
		throw 'not a state' if not state instanceof GameState
		@preUpdate?()
		state.update(dt)
		@postUpdate?()
		@preRender?()
		state.render()
		@postRender?()

	togglePanic: ->
		if @intervals.gameLoop?
			@stop()
		else
			@start()

	_bindEvents: ->
		$(document).on 'keypress', (e) =>
			switch e.charCode
				when 32
					@togglePanic()
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