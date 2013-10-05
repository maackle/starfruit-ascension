'use strict'

M = {}

NotImplemented = {

}

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

class M.Image

	@_cache: {}
	loaded: false

	constructor: (o) ->
		if o instanceof Image
			im = o
		else
			hit = M.Image._cache[o]?
			if hit
				im = hit
			else
				im = new Image
				im.src = o
				im.onload = => @loaded = true
				M.image._cache[0] = im
		@image = im

class Sprite

	constructor: (@im, @offset) ->
		if not @offset?
			console.warn 'no offset set', this
			withImage @im, (im) =>
				@offset = 
					x: @im.width / 2
					y: @im.height / 2

	draw: (pos, angle) ->
		pos ?= Vec.zero
		withImage @im, (im) =>
			game.ctx.save()
			game.ctx.translate pos.x + 0*@offset.x, pos.y + 0*@offset.y
			game.ctx.rotate(angle)
			game.ctx.drawImage im, - @offset.x, - @offset.y
			game.ctx.restore()


class Thing

	angle: 0.0
	scale: 1.0
	position: null

	render: -> throw NotImplemented
	update: -> throw NotImplemented
	
	withTransform: (fn) ->
		game.ctx.save()
		game.ctx.translate @position.x, @position.y  # offset correction happens when drawing the sprite.
		game.ctx.rotate @angle
		game.ctx.scale @scale, @scale
		# game.ctx.translate -@offset.x, -@offset.y
		fn()
		game.ctx.restore()



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


# class Viewport
	
# 	constructor: (@canvas, {@anchor, @scroll, @scale}) ->
# 		@scale ?= 1
# 		@ctx = @canvas.getContext '2d'
# 		[w, h] = [@canvas.width, @canvas.height]
# 		@offset = [w/2, h/2]
	
# 	resetTransform: ->
# 		[w, h] = [@canvas.width, @canvas.height]
# 		@offset = [w/2, h/2]
# 		if @anchor.top?
# 			@offset[1] = @anchor.top
# 		if @anchor.right?
# 			@offset[0] = w - @anchor.right
# 		if @anchor.bottom?
# 			@offset[1] = h - @anchor.bottom
# 		if @anchor.left?
# 			@offset[0] = @anchor.left
# 		[ox, oy] = @offset
# 		@ctx.setTransform(@scale, 0, 0, @scale, ox + @scroll.x + 0.5, oy + @scroll.y + 0.5)

# 	clearScreen: (color) ->
# 		[w, h] = [@canvas.width, @canvas.height]
# 		@ctx.save()
# 		@ctx.setTransform(1, 0, 0, 1, 0, 0)
# 		@ctx.fillStyle = color
# 		@ctx.clearRect 0, 0, w, h
# 		@ctx.fillRect 0, 0, w, h
# 		@ctx.restore()

# 	fillScreen: (color) ->
# 		[w, h] = [@canvas.width, @canvas.height]
# 		@ctx.save()
# 		@ctx.setTransform(1, 0, 0, 1, 0, 0)
# 		@ctx.fillStyle = color
# 		@ctx.fillRect 0, 0, w, h
# 		@ctx.restore()
	
# 	dimensions: -> [@canvas.width, @canvas.height]
# 	worldDimensions: -> [@canvas.width, @canvas.height]

# 	worldBounds: ->
# 		[w,h] = @worldDimensions()
# 		[ox, oy] = @offset
# 		left: -(ox + @scroll.x + 0.5)
# 		top: -(oy + @scroll.y + 0.5)
# 		width: w
# 		height: h

# 	screen2world: (screen) ->
# 		[ox, oy] = @offset
# 		new Vec( screen.x - (ox + @scroll.x + 0.5), screen.y - (oy + @scroll.y + 0.5) )

# 	centerOn: (point) ->
# 		[w, h] = [@canvas.width, @canvas.height]

# 	update: ->
# 		@resetTransform()




# class Collidable extends Positional

# 	createBody: ->
# 		shape = new b2PolygonShape()
# 		console.log shape
# 		shape.set_m_radius( 0.5 )

# 		body.CreateFixture( circleShape, 1.0 )
# 		bodyDef = new b2BodyDef()
# 		bodyDef.set_type( b2_staticBody )
# 		@body = world.CreateBody( bodyDef )
# 		@b2position = new b2Vec2(@position.x, @position.y)

# 	update: ->
# 		@b2position.x = @position.x
# 		@b2position.y = @position.y
# 		@body.set_position(@b2position)




class ModuleOriginal

	@__keywords: ['extended', 'included']

	# from http://arcturo.github.io/library/coffeescript/03_classes.html
	@extend: (obj) ->
		for key, value of obj when key not in Moduler.__keywords
			@[key] = value

		obj.extended?.apply(@)
		this

	@include: (obj) ->
		for key, value of obj when key not in Moduler.__keywords
			# Assign properties to the prototype
			@::[key] = value

		obj.included?.apply(@)
		this
