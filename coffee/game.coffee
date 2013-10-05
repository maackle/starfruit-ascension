game = null
world = null
GFX = null
quadtree = Quadtree.create(1000, 100000)
quadtree.reset()



class Collidable extends Thing

	position: null
	
	constructor: ->
		@angle = 0
		[w, h] = @dimensions
		@box = 
			left: @position.x - @offset.x
			top: @position.y - @offset.y
			width: w
			height: h
			object: this

	update: ->
		@box.left = @position.x - @offset.x
		@box.top = @position.y - @offset.y
		if @isActiveCollider
			quadtree.insert @box


class Obstacle extends Collidable

	isActiveCollider: true

	constructor: (@position, @velocity) ->
		@velocity ?= new Vec 0, 0
		@angle = 0
		super()

	update: ->
		@position.add @velocity
		super()

class Cookie extends Obstacle

	dimensions: [140, 140]
	offset: {x: 70, y: 70}

	constructor: (pos, vel) ->
		super(pos, vel)
		@angVel = Math.random() * 0.05

	update: ->
		@angle += @angVel
		super()

	render: ->
		game.sprites.cookie.draw(@position, @angle)

class Satellite extends Obstacle
	# dimensions: [120, 120]
	dimensions: [80, 80]
	offset: {x: 40, y: 40}

	constructor: (pos, vel) ->
		super(pos, vel)
		@angVel = Math.random() * 0.05

	update: ->
		@angle += @angVel
		super()

	render: ->
		game.sprites.satellite.draw(@position, @angle)

balloonTopDim = {x: 90, y: 126}
balloonAABBDim = {x: 75, y: 75}
balloonSpriteOffset = {x: 44, y: 62}
balloonAABBOffset = 
	x: balloonSpriteOffset.x - (balloonTopDim.x - balloonAABBDim.x)/2
	y: balloonSpriteOffset.y - (balloonTopDim.y - balloonAABBDim.y)/2

class Balloon extends Obstacle
	# dimensions: [90, 180]
	dimensions: [balloonAABBDim.x, balloonAABBDim.y]
	offset: balloonAABBOffset
	angAccel: 0.003

	constructor: (pos, vel) ->
		super(pos, vel)
		@angle = Math.random() * Math.PI / 4
		@angVel = Math.random() * 0.05

	update: ->
		super()
		if @angle < 0
			@angVel += @angAccel
		else
			@angVel -= @angAccel
		@angle += @angVel

	render: ->
		game.sprites.balloon.draw(@position, @angle)

class Cloud extends Collidable

	isActiveCollider: false
	dimensions: [128, 96]
	offset: 
		x: 128/2
		y: 96/2

	constructor: (@position, @velocity) ->
		@velocity ?= new Vec 0, 0
		super()

	update: ->
		@position.add @velocity
		super()

	render: ->
		game.sprites.cloud.draw @position

class Star extends Collidable

	@all: []

	id: null
	dimensions: [32, 32]
	offset: Config.starOffset
	attraction: null
	isActiveCollider: true

	constructor: (@position, @branch) ->
		super()
		@hasFocus = false
		@angle = 0
		Star.all.push this
		@id = Star.all.length

	setAttraction: (vec) ->
		@attraction = vec

	update: ->
		super()

	isSafe: ->
		@branch.status.distanceTravelled < Config.starSafetyDistance

	setBranch: (branch) ->
		@branch.star = null
		@branch = branch
		@position = @branch.tip
		@branch.star = this

	withTransform: (fn) ->
		game.ctx.save()
		game.ctx.translate @position.x, @position.y  # offset correction happens when drawing the sprite.
		game.ctx.rotate @angle
		# game.ctx.translate -@offset.x, -@offset.y
		fn()
		game.ctx.restore()
	render: ->
		@withTransform =>
			game.ctx.beginPath()
			GFX.drawLineString Star.vertices
			if @isSafe()
				game.ctx.strokeStyle = game.tailColor(3)
				game.ctx.fillStyle = game.tailColor(12)
			else
				game.ctx.strokeStyle = game.tailColor()
				game.ctx.fillStyle = 'white'
			game.ctx.lineWidth = 2
			game.ctx.fill()
			game.ctx.stroke()

Star.radius = 16
Star.radius2 = 8
Star.vertices = (Vec.polar (if i % 2 == 0 then Star.radius else Star.radius2), i * (Math.PI * 2 / 10) for i in [0..10])

class Branch extends Thing

	@all: []
	@growing: ->
		@all.filter (b) => b.status.isGrowing

	id: null
	tip: null

	# root is a Vec
	constructor: (@parent, @angle, {keepStar}={}) ->
		if @parent instanceof Branch
			@root = new Vec @parent.tip
		else
			@root = new Vec @parent
			@parent = null
		@knots = []
		@branches = []
		@tip = new Vec @root
		@knots.push @root
		Branch.all.push this
		@id = Branch.all.length
		@status =
			rate: Config.growthRate
			branchAngle: Config.branchAngle
			branchDistance: Config.branchDistanceMax
			knotDistance: Config.knotDistance
			deadTime: 0
			isGrowing: true
			distanceTravelled: 0
			distanceTravelledKnot: 0
		if keepStar
			@star = @parent.star
			@star.setBranch this
		else 
			@star = new Star @tip, this

	collectStars: ->
		stars = []
		stars.push @star if @star?
		for branch in @branches
			stars.push star for star in branch.collectStars()
		stars

	growthVector: ->
		velocity = Vec.polar @status.rate, @angle
		velocity

	doFork: ->
		left = new Branch this, @angle + @status.branchAngle,
			keepStar: false
		right = new Branch this, @angle - @status.branchAngle,
			keepStar: true
		@branches = [left, right]
		@status.isGrowing = false
		@status.markForNoGrow = true

	doKnot: ->
		@knots.push (new Vec @tip)
		@angle += (Math.random() - 0.5) * Config.knotAngleJitter

	doStop: ->
		@status.isGrowing = false
		@status.isDead = true
		game.stars = _.without game.stars, @star
		game.novae.push new Nova( (new Vec @star.position), @star.angle)
		delete @star
		if game.stars.length == 0
			game.showGameOver()

	handleInput: (e) ->

	update: ->
		if @status.isGrowing
			if @star.attraction?
				@status.knotDistance = Config.knotDistanceWhileThrusting
				diff = new Vec @star.attraction
				diff.sub @star.position
				a = clampAngleSigned @angle
				da = clampAngleSigned(diff.angle() - a)
				@angle = lerp(0, da, 0.1) + a
				@status.rate = Config.starThrustRate
			else
				@status.knotDistance = Config.knotDistance
				@status.rate = Config.growthRate
			growth = @growthVector()
			@status.distanceTravelled += @status.rate
			@status.distanceTravelledKnot += @status.rate
			@tip.add growth
			@star.angle = growth.angle()
			
			if Config.autoFork and @status.distanceTravelled > @status.branchDistance
				@doFork()
			else if @status.distanceTravelledKnot > @status.knotDistance
				@doKnot()
				@status.distanceTravelledKnot = 0

			if @status.markForNoGrow
				@status.markForNoGrow = false
				@star = null
		else
			for branch in @branches
				branch.update()

	render: ->
		game.ctx.save()
		game.ctx.beginPath()
		game.ctx.translate -Config.branchWidth*3/4, 0
		for i in [1..Config.branchFibers]
			game.ctx.lineWidth = Config.branchWidth
			game.ctx.translate Config.branchWidth / Config.branchFibers, 0
			game.ctx.beginPath()
			GFX.drawLineString @knots, @tip
			game.ctx.strokeStyle = game.tailColor()
			game.ctx.fillStyle = game.tailColor()
			game.ctx.stroke()
		game.ctx.restore()
		if @status.isGrowing
			
		else if @status.isDead
			# @withTransform
			game.ctx.beginPath()
			game.ctx.fillStyle = game.tailColor()
			game.ctx.arc(@tip.x, @tip.y, Config.starNovaRadius, 0, Math.PI*2, true)
			game.ctx.fill()
			# game.ctx.stroke()
		else
			for branch in @branches
				branch.render()


class Nova extends Thing

	constructor: (@position, @angle) ->
		@scale = 1.0
		@time = 0

	update: (speedMod=1)->
		@scale += 10 * speedMod
		@time += 1 / game.config.fps * speedMod
		if @time > Config.starNovaTime
			@die()

	die: ->
		game.novae = _.without game.novae, this

	render: ->
		@withTransform =>
			game.ctx.beginPath()
			game.ctx.lineWidth = 2
			GFX.drawLineString Star.vertices
			game.ctx.strokeStyle = game.tailColor(10)
			game.ctx.stroke()
