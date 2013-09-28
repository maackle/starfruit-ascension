game = null
GFX = null

NotImplemented = {

}

class Vec

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

	sub: (v) ->
		@x -= v.x
		@y -= v.y

class Sprite

	constructor: (@im, @offset) ->
		if not @offset?
			@offset = 
				x: 0
				y: 0

	draw: (pos) ->
		withImage @im, (im) =>
			game.ctx.drawImage im, pos.x - @offset.x, pos.y - @offset.y


class Thing

	render: -> throw NotImplemented
	update: -> throw NotImplemented


class Branch extends Thing

	@all: []

	id: null
	tip: null

	# root is a Vec
	constructor: (@root, @angle) ->

		@knots = []
		@branches = []
		@tip = new Vec @root
		@knots.push @root
		Branch.all.push this
		@id = Branch.all.length
		@status =
			rate: Config.growthRate
			branchAngle: Config.branchAngle
			branchDistance: Config.branchDistance
			knotDistance: Config.knotDistance
			isGrowing: true
			distanceTravelled: 0

	growthVector: ->
		Vec.polar @status.rate, @angle

	doFork: ->
		newRoot = new Vec @tip
		left = new Branch newRoot, @angle + @status.branchAngle
		right = new Branch newRoot, @angle - @status.branchAngle
		@branches = [left, right]
		@status.isGrowing = false

	doKnot: ->
		@knots.push new Vec @tip
		@angle += (Math.random() - 0.5) * Config.knotAngleJitter
		@angle = lerp(@angle, -Math.PI/2, Config.branchAngleUpwardWeight)

	update: ->
		if @status.isGrowing
			@status.distanceTravelled += @status.rate
			@tip.add @growthVector()
			if @status.distanceTravelled > @status.branchDistance
				@doFork()
			else if @status.distanceTravelled > @status.knotDistance
				@doKnot()
		else
			for branch in @branches
				branch.update()

	render: ->
		GFX.drawLineString @knots, @tip
		if @status.isGrowing
			game.sprites.star.draw @tip
		else
			for branch in @branches
				branch.render()

class GraphicsHelper

	constructor: (@ctx) ->

	drawLineString: (points, more...) ->
		@ctx.beginPath()
		@ctx.moveTo points[0].x, points[0].y
		for vec in points[1..]
			@ctx.lineTo vec.x, vec.y
		for vec in more
			@ctx.lineTo vec.x, vec.y
		@ctx.stroke()

	drawImage: (im, pos, offset) ->
		if not offset?
			offset = 
				x: 0
				y: 0
		withImage im, (im) =>
			@ctx.drawImage im, pos.x - offset.x, pos.y - offset.y

class Viewport
	
	constructor: (@canvas, {@anchor, @scroll}) ->
		@ctx = @canvas.getContext '2d'
		[w, h] = [@canvas.width, @canvas.height]
		@offset = [w/2, h/2]	
	
	_setTransform: ->
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
		@ctx.setTransform(1, 0, 0, 1, ox + @scroll.x, oy + @scroll.y)

	clearScreen: (color) ->
		[w, h] = [@canvas.width, @canvas.height]
		[ox, oy] = @offset
		@ctx.setTransform(1, 0, 0, 1, 0, 0)
		@ctx.fillStyle = color
		@ctx.fillRect 0, 0, w, h
		@ctx.restore()
	

	centerOn: (point) ->
		[w, h] = [@canvas.width, @canvas.height]

	update: ->
		@_setTransform()


class Starstalk

	things: []
	loopInterval: null

	config:
		fps: 30


	constructor: ({@$canvas}) ->
		@canvas = @$canvas.get(0)
		@ctx = @canvas.getContext '2d'
		@GFX = new GraphicsHelper @ctx
		@status =
			paused: false
		@sprites = 
			star: new Sprite Config.starImage, new Vec(15, 16)
		@view = new Viewport @canvas,
			scroll: new Vec 0, 0
			anchor:
				bottom: 20
		

	width: -> @canvas.width
	height: -> @canvas.height

	start: ->
		@bindEvents()
		$(window).trigger 'resize'
		@view.clearScreen('#b5e0e2')
		@things.push new Branch(new Vec(0, 0), -Math.PI/2)

		@doLoop()

	doLoop: ->
		@loopInterval = setInterval =>
			@view.clearScreen()
			@view.update()
			if not @status.paused
				for thing in @things
					thing.update()
					thing.render()
		, parseInt(1000 / @config.fps)

	togglePause: ->
		@status.paused = not @status.paused
		if @status.paused
			clearInterval @loopInterval
		else
			@doLoop()

	bindEvents: ->
		$(window).on 'resize', (e) =>
			$body = $('body')
			@$canvas.attr
				width: $body.width()
				height: $body.height()
			@view.clearScreen('pink')

		$(document).on 'keypress', (e) =>
			console.debug 'key', e.charCode

			switch e.charCode
				when 32 
					@togglePause()
				when 115
					@scroll.x -= 3
				when 119
					@scroll.x += 3

$ ->
	$body = $('body')

	game = new Starstalk 
		$canvas: $('#game')

	GFX = game.GFX

	game.start()
	