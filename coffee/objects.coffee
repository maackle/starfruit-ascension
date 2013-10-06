


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


class QuadtreeBox

	left: null
	right: null

	position: null  # Vec
	offset: null  # Vec
	dimensions: null

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


class Collidable extends Thing

	qbox: null
	isActiveCollider: true

	update: ->
		@qbox.update()
		if @isActiveCollider
			globals.quadtree.insert @qbox


class Star extends Collidable

	@nextID: 1
	id: null

	branch: null
	angle: -Math.PI / 2 + 0.1

	constructor: (@position) ->
		@id = Star.nextID++
		@qbox = new QuadtreeBox
			position: @position
			dimensions: [Star.radius*2, Star.radius*2]
			offset: new Vec Star.radius, Star.radius
			object: this

	attraction: -> null

	speed: -> Config.starSpeed

	velocity: -> Vec.polar @speed(), @angle

	isSafe: -> @branch.distanceTravelled < Config.starSafetyDistance

	update: ->
		if @attraction()
			diff = new Vec @attraction()
			diff.sub @position
			a = clampAngleSigned @angle
			da = clampAngleSigned(diff.angle() - a)
			@angle = lerp(0, da, 0.1) + a
		# console.log 'befo', @position.x, @position.y
		@position.add @velocity()
		# console.log 'afta', @position.x, @position.y
		super

	render: (ctx) ->
		@withTransform ctx, =>
			ctx.beginPath()
			GFX.drawLineString ctx, Star.vertices
			if @isSafe()
				ctx.strokeStyle = rainbow(3)
				ctx.fillStyle = rainbow(12)
			else
				ctx.strokeStyle = rainbow()
				ctx.fillStyle = 'white'
			ctx.lineWidth = 2
			ctx.fill()
			ctx.stroke()

Star.radius = Config.starRadius
Star.radius2 = Config.starInnerRadius
Star.vertices = (Vec.polar (if i % 2 == 0 then Star.radius else Star.radius2), i * (Math.PI * 2 / 10) for i in [0..10])


class Branch extends Thing

	@nextID: 1

	highestAltitude: 0
	forkDistance: Config.branchDistanceMax
	knotSpacing: Config.knotSpacing
	distanceTravelled: 0
	lastKnotDistance: 0  # distance of last knot from root

	root: null
	star: null
	tip: null
	knots: null

	isGrowing: -> @star?

	constructor: (@parent) ->
		@id = Branch.nextID++
		if @parent instanceof Branch
			@root = new Vec @parent.tip
		else
			@root = new Vec @parent
			@parent = null
		@tip = new Vec @root
		@knots = []
		@doKnot()

	setStar: (star) ->
		star.branch?.star = null
		star.branch = this
		@star = star
		@tip = @star.position

	update: (dt) ->
		if @star?
			@distanceTravelled += @star.velocity().length()
			
			if @distanceTravelled - @lastKnotDistance > @knotSpacing
				@doKnot()	

			if @markForNoGrow
				@markForNoGrow = false
				@star = null

	render: (ctx) ->
		ctx.beginPath()
		GFX.drawLineString ctx, @knots, @tip
		ctx.strokeStyle = "rgb(0, #{@id * 64}, 0)"
		ctx.fillStyle = rainbow()
		ctx.stroke()

	doKnot: ->
		@knots.push new Vec @tip
		@angle += (Math.random() - 0.5) * Config.knotAngleJitter
		@lastKnotDistance = @distanceTravelled
		@highestAltitude = -@tip.y if -@tip.y > @highestAltitude

	forkable: ->  # if true, will be forked by PlayState
		@distanceTravelled > @forkDistance


class Obstacle extends Collidable

	constructor: (@position, @velocity) ->
		@velocity ?= new Vec 0, 0
		@angle = 0

	update: ->
		@position.add @velocity
		super


class Balloon extends Obstacle

	angAccel: 0.001

	constructor: ->
		super
		@angle = Math.random() * Math.PI / 4
		@angVel = Math.random() * 0.02
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
