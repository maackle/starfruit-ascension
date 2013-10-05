


class QuadtreeBox

	left: null
	right: null

	position: null  # Vec
	offset: null  # Vec
	dimensions: []

	constructor: ({@position, @offset, @dimensions, @object}) ->
		@offset ?= Vec.zero
		@update()

	update: ->
		{x, y} = @position
		@left = x - @offset.x
		@top = y - @offset.y
		[w, h] = @dimensions
		@width = w
		@height = h


# class Collidable

# 	qbox: null
# 	isActiveCollider: true

# 	update: ->
# 		@qbox.left = @position.x - @offset.x
# 		@qbox.top = @position.y - @offset.y
# 		if @isActiveCollider
# 			quadtree.insert @qbox


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


class Obstacle

	constructor: (@position, @velocity) ->
		@velocity ?= new Vec 0, 0
		@angle = 0

	update: ->
		@position.add @velocity
		@qbox.update()
		globals.quadtree.insert @qbox


class Balloon extends Obstacle

	angAccel: 0.003

	constructor: ->
		super
		@angle = Math.random() * Math.PI / 4
		@angVel = Math.random() * 0.05
		@sprite = new Sprite
			image: Config.images.balloon
			offset: new Vec 44, 62

		topdim = [90, 126]
		dim = [75, 75]
		@qbox = new QuadtreeBox
			position: @position
			offset: new Vec(
				@sprite.offset.x - (topdim[0] - dim[0]) / 2,
				@sprite.offset.y - (topdim[1] - dim[1]) / 2
			)
			dimensions: dim
			object: this

	update: ->
		super
		if @angle < 0
			@angVel += @angAccel
		else
			@angVel -= @angAccel
		@angle += @angVel

	render: (ctx) ->  # assuming all Obstacles have Sprites
		@sprite.draw(position: @position, rotation: @angle)(ctx)


class Cloud

	constructor: (@position, @velocity) ->
		@velocity ?= new Vec 0, 0
		@sprite = new Sprite
			image: Config.images.cloud
			offset: new Vec 128/2, 90/2
		# @qbox = new QuadtreeBox
		# 	position: @position
		# 	offset: new Vec 128/2, 90/2
		# 	dimensions: [128, 90]
		# 	object: this

	update: ->
		@position.add @velocity

	render: (ctx) ->  # assuming all Obstacles have Sprites
		@sprite.draw(position: @position)(ctx)


class Cookie extends Obstacle

	constructor: ->
		super
		@angVel = Math.random() * 0.05
		@sprite = new Sprite
			image: Config.images.cookie
			offset: new Vec 90, 90
		@qbox = new QuadtreeBox
			position: @position
			offset: new Vec 70, 70
			dimensions: [140, 140]
			object: this

	update: ->
		@angle += @angVel
		super

	render: (ctx) ->  # assuming all Obstacles have Sprites
		@sprite.draw(position: @position, rotation: @angle)(ctx)

	

class Satellite extends Obstacle

	constructor: ->
		super
		@angVel = Math.random() * 0.05
		@sprite = new Sprite
			image: Config.images.satellite
			offset: new Vec 60, 60
		@qbox = new QuadtreeBox
			position: @position
			offset: new Vec 40, 40
			dimensions: [80, 80]
			object: this

	update: ->
		@angle += @angVel
		super

	render: (ctx) ->
		@sprite.draw(position: @position, rotation: @angle)(ctx)
