
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

	lengthSquared: ->
		return @x*@x + @y*@y

	length: ->
		Math.sqrt @lengthSquared()

	angle: ->
		return Math.atan2 @y, @x

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


class GraphicsHelper

	constructor: (@ctx) ->

	drawLineString: (points, more...) ->
		@ctx.moveTo points[0].x, points[0].y
		for vec in points[1..]
			@ctx.lineTo vec.x, vec.y
		for vec in more
			@ctx.lineTo vec.x, vec.y

	drawImage: (im, pos, offset) ->
		if not offset?
			offset = 
				x: 0
				y: 0
		withImage im, (im) =>
			@ctx.drawImage im, pos.x - offset.x, pos.y - offset.y


class Viewport
	
	constructor: (@canvas, {@anchor, @scroll, @scale}) ->
		@scale ?= 1
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
		@ctx.setTransform(@scale, 0, 0, @scale, ox + @scroll.x + 0.5, oy + @scroll.y + 0.5)

	clearScreen: (color) ->
		[w, h] = [@canvas.width, @canvas.height]
		[ox, oy] = @offset
		@ctx.setTransform(1, 0, 0, 1, 0, 0)
		@ctx.fillStyle = color
		@ctx.fillRect 0, 0, w, h
		@ctx.restore()
	
	dimensions: -> [@canvas.width, @canvas.height]
	worldDimensions: -> [@canvas.width, @canvas.height]

	worldBounds: ->
		[w,h] = @worldDimensions()
		[ox, oy] = @offset
		left: -(ox + @scroll.x + 0.5)
		top: -(oy + @scroll.y + 0.5)
		width: w
		height: h

	screen2world: (screen) ->
		[ox, oy] = @offset
		new Vec( screen.x - (ox + @scroll.x + 0.5), screen.y - (oy + @scroll.y + 0.5) )

	centerOn: (point) ->
		[w, h] = [@canvas.width, @canvas.height]

	update: ->
		@_setTransform()




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
