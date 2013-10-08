


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

	constructor: ({@position, @offset, dimensions, @object}) ->
		@offset ?= Vec.zero
		@update()
		[@width, @height] = dimensions

	update: ->
		{x, y} = @position
		@left = x - @offset.x
		@top = y - @offset.y

	quad: -> new Quad @left, @top, @width, @height

	getHits: (quadtree) ->
		quadtree.getObjects @left, @top, @width, @height


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

	isDead: false
	branch: null
	angle: -Math.PI / 2
	attraction: null

	timers: null

	constructor: (@position, @angle) ->
		@id = Star.nextID++
		@velocity = new Vec 0, 0
		@qbox = new QuadtreeBox
			position: @position
			dimensions: [Star.radius*2, Star.radius*2]
			offset: new Vec Star.radius, Star.radius
			object: this
		@timers = 
			merging: []

	speed: (dt) -> dt * (if @attraction? then Config.starHyperSpeed else Config.starSpeed)

	isSafe: -> @branch.distanceTravelled < Config.starSafetyDistance

	die: -> 
		@isDead = true
		@branch.star = null

	merge: (star) ->
		@branch.tip = new Vec star.position
		@branch.doKnot()
		@die()
		star.timers.merging.push Config.mergeDrawTime

	update: (dt) ->
		if @attraction?
			diff = new Vec @attraction
			diff.sub @position
			a = clampAngleSigned @angle
			da = clampAngleSigned(diff.angle() - a)
			@angle = lerp(0, da, 0.1) + a
		@velocity = Vec.polar @speed(dt), @angle
		@position.add @velocity
		for mergeTime, i in @timers.merging
			@timers.merging[i] -= dt
			if mergeTime < 0
				@timers.merging.splice i, 1
		super

	render: (ctx) ->
		@withTransform ctx, =>
			for mergeTime in @timers.merging
				t = mergeTime / Config.mergeDrawTime
				r = lerp(1, 3, t)
				ctx.save()
				ctx.scale r, r
				GFX.drawLineString ctx, Star.vertices, closed: true

				ctx.lineWidth = 1
				ctx.fill()
				ctx.restore()
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

	isDead: false
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
			@distanceTravelled += @star.velocity.length()
			if @distanceTravelled - @lastKnotDistance > @knotSpacing
				@doKnot()

	render: (ctx) ->
		ctx.beginPath()
		GFX.drawLineString ctx, @knots, more: [@tip]
		ctx.lineWidth = Config.branchWidth
		ctx.strokeStyle = rainbow()
		ctx.fillStyle = rainbow()
		ctx.stroke()
		ctx.lineWidth = 1

	doKnot: ->
		@knots.push new Vec @tip
		@star?.angle += (Math.random() - 0.5) * Config.knotAngleJitter
		@lastKnotDistance = @distanceTravelled
		@highestAltitude = -@tip.y if -@tip.y > @highestAltitude

	die: ->
		@isDead = true

	stop: ->
		@tip = new Vec @tip  # stop following the star
		@star = null

	forkable: ->  # if true, will be forked by PlayState
		@distanceTravelled > @forkDistance


class Nova extends Thing

	isDead: false

	constructor: (star) ->
		@position = new Vec star.position
		@angle = new Vec star.angle
		@scale = 1.0
		@time = 0

	update: (dt)->
		@scale += dt * Config.novaExplosionSpeed
		@time += dt
		if @radius() > Config.novaMaxRadius
			@die()

	radius: -> Star.radius * @scale

	die: -> @isDead = true

	render: (ctx) ->
		@withTransform ctx, =>
			GFX.drawLineString ctx, Star.vertices, closed: true
			ctx.lineWidth = Config.novaStrokeWidth * Star.radius / Math.pow(@radius(), 0.75)
			ctx.strokeStyle = rainbow(10)
			ctx.stroke()


class Obstacle extends Collidable

	constructor: (@position, @velocity) ->
		@velocity ?= new Vec 0, 0
		@angle = 0

	update: ->
		@position.add @velocity
		super


class Balloon extends Obstacle

	angAccel: Math.PI / 4

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

	update: (dt) ->
		super
		if @angle < 0
			@angVel += @angAccel * dt
		else
			@angVel -= @angAccel * dt
		@angle += @angVel * dt

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


Balloon.spriteImage = Config.images.balloon
Cloud.spriteImage = Config.images.cloud
Cookie.spriteImage = Config.images.cookie
Satellite.spriteImage = Config.images.satellite