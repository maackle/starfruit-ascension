
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

	centerOn: (point) ->
		[w, h] = [@canvas.width, @canvas.height]

	update: ->
		@_setTransform()
