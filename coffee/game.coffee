game = null
world = null
GFX = null
quadtree = Quadtree.create()
quadtree.reset()

class Positional extends Thing

	position: null

class Collidable extends Positional

	offset:
		x: 0
		y: 0
	dimensions: [0, 0]
	aabb: null

	constructor: ->
		[w, h] = @dimensions
		[ox, oy] = @offset
		@box = 
			left: @position.x - @offset.x
			top: @position.y - @offset.y
			width: w
			height: h
			object: this
		quadtree.insert @box

	update: ->
		@box.left = @position.x - @offset.x
		@box.top = @position.y - @offset.y

class Obstacle extends Collidable

class Pegasus extends Obstacle
class Satellite extends Obstacle
class Balloon extends Obstacle
class Meteor extends Obstacle

class Star extends Collidable

	@all: []

	id: null
	radius: 16
	radius2: 8
	dimensions: [32, 32]
	offset: Config.starOffset
	attraction: null

	constructor: (@position, @branch) ->
		super()
		console.log 'new star @', @branch
		@hasFocus = false
		@angle = 0
		inc = Math.PI * 2 / 10
		@vertices = (Vec.polar (if i % 2 == 0 then @radius else @radius2), i * inc for i in [0..10])
		Star.all.push this
		@id = Star.all.length

	setAttraction: (vec) ->
		@attraction = vec

	withTransform: (fn) ->
		game.ctx.save()
		game.ctx.translate @position.x, @position.y
		game.ctx.rotate @angle
		fn()
		game.ctx.restore()

	update: ->
		super()


	setBranch: (branch) ->
		@branch = branch
		@position = @branch.tip

	render: ->
		# game.sprites.star.draw @position
		@withTransform =>
			game.ctx.beginPath()
			GFX.drawLineString @vertices
			game.ctx.fillStyle = 'white'
			game.ctx.strokeStyle = game.tailColor()
			game.ctx.lineWidth = 2
			game.ctx.fill()
			game.ctx.stroke()


class Branch extends Thing

	@all: []

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
			branchDistance: Config.branchDistance
			knotDistance: Config.knotDistance
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
		@star = null

	doKnot: ->
		@knots.push (new Vec @tip)
		@angle += (Math.random() - 0.5) * Config.knotAngleJitter

	doStop: ->
		@status.isGrowing = false
		@status.isDead = true
		@star.box.left = -9999 if @star  # mark it for pruning
		delete @star

	handleInput: (e) ->

	update: ->
		if @status.isGrowing
			if @star.attraction?
				@status.knotDistance = Config.knotDistanceWhileThrusting
				diff = new Vec @star.attraction
				diff.sub @star.position
				@angle = lerp(@angle, diff.angle(), 0.1)
				@status.rate = Config.starThrustRate
			else
				@status.knotDistance = Config.knotDistance
				@status.rate = Config.growthRate
			growth = @growthVector()
			@status.distanceTravelled += @status.rate
			@status.distanceTravelledKnot += @status.rate
			@tip.add growth
			@star.angle = growth.angle()
			
			if @status.distanceTravelled > @status.branchDistance
				@doFork()
			else if @status.distanceTravelledKnot > @status.knotDistance
				@doKnot()
				@status.distanceTravelledKnot = 0
		else
			for branch in @branches
				branch.update()

	render: ->
		game.ctx.save()
		game.ctx.beginPath()
		game.ctx.translate -Config.branchWidth*3/4, 0
		for i in [1..Config.branchFibers]
			game.ctx.lineWidth = Config.branchWidth
			game.ctx.translate Config.branchWidth/Config.branchFibers, 0
			game.ctx.beginPath()
			GFX.drawLineString @knots, @tip
			game.ctx.strokeStyle = game.tailColor()
			game.ctx.fillStyle = game.tailColor()
			game.ctx.stroke()
		game.ctx.restore()
		if @status.isGrowing
			
		else if @status.isDead
			game.ctx.beginPath()
			game.ctx.fillStyle = game.tailColor()
			game.ctx.arc(@tip.x, @tip.y, Config.starNovaRadius, 0, Math.PI*2, true)
			game.ctx.fill()
			# game.ctx.stroke()
		else
			for branch in @branches
				branch.render()

class Cloud extends Collidable

	dimensions: [128, 96]
	offset: Config.cloudOffset

	constructor: (@position, @velocity) ->
		super()

	update: ->
		@position.add @velocity
		super()

	render: ->
		game.sprites.cloud.draw @position

	@make: (reference) ->
		# referece is highestStar position or reference position
		position = new Vec reference
		position.y -= game.height()
		position.x += Math.random() * game.width() - game.width()
		velocity = new Vec Math.random() * 2, 0
		new Cloud position, velocity


class Starstalk

	things: []
	clouds: []
	loopInterval: null

	config:
		fps: 30

	constructor: ({@$canvas}) ->
		@mouse = new Vec 0, 0
		@canvas = @$canvas.get(0)
		@ctx = @canvas.getContext '2d'
		@ctx.webkitImageSmoothingEnabled = @ctx.imageSmoothingEnabled = @ctx.mozImageSmoothingEnabled = @ctx.oImageSmoothingEnabled = false;
		@GFX = new GraphicsHelper @ctx
		numRainbowColors = 256
		@rainbowColors = (tinycolor("hsv(#{p * 100 / numRainbowColors}%, 50%, 100%)").toRgbString() for p in [0..numRainbowColors])
		@status =
			paused: false
			tailColorIndex: 0  # for iterating over rainbowColors
			heightAchieved: 0
		@sprites = 
			star: new Sprite Config.starImage, Config.starOffset
			cloud: new Sprite Config.cloudImage, Config.cloudOffset
		@view = new Viewport @canvas,
			scroll: new Vec 0, 0
			anchor:
				bottom: 20

	width: -> @canvas.width
	height: -> @canvas.height

	start: ->
		@bindEvents()
		@startTasks()
		$(window).trigger 'resize'
		@stalk = new Branch(new Vec(0, 0), -Math.PI/2)
		@doLoop()

	doLoop: ->
		@loopInterval = setInterval =>
			@view.clearScreen('#b5e0e2')
			@update()
			things = [@stalk]
			things.push star for star in @stars
			things.push cloud for cloud in @clouds
			if not @status.paused
				for thing in things
					thing.update()
					thing.render()
			@status.tailColorIndex += 1
			@status.tailColorIndex %= @rainbowColors.length
			@render()
		, parseInt(1000 / @config.fps)

	render: ->
		@ctx.font = "60px Arial"
		@ctx.strokeStyle = '#333'
		@ctx.save()
		@ctx.setTransform(1, 0, 0, 1, 0, 0)
		@ctx.strokeText(parseInt(@status.heightAchieved) + 'm', 50, 100)
		@ctx.restore()

	update: ->
		[w, h] = @view.dimensions()
		stars = @stalk.collectStars()
		@stars = stars
		highestStar = _.min stars, (s) -> s.position.y
		@status.heightAchieved = -highestStar.position.y
		newScrollY = -h/2 - highestStar.position.y
		@view.scroll.y = Math.max 0, newScrollY if newScrollY > @view.scroll.y
		@view.update()
		if Math.random() < Config.cloudProbability / @config.fps
			@clouds.push Cloud.make(highestStar.position)
		for i, cloud in @clouds
			if cloud.x > @width()
				@clouds.splice(i, 1)

		for star in stars
			if game.mouseDown
				star.setAttraction(game.view.screen2world game.mouse)
			else
				star.setAttraction(null)

		collidable = []
		collidable.push star for star in stars
		collidable.push cloud for cloud in @clouds
		for obj in collidable
			hits = quadtree.getObjects(obj.box.left, obj.box.top, obj.box.width, obj.box.height)
			if hits.length > 1
				deadStars = (hit.object for hit in hits when hit.object instanceof Star)
				safeStars = []
				clouds = (hit.object for hit in hits when hit.object instanceof Cloud)
				if deadStars.length == 2
					[a, b] = deadStars
					if a.id == b.id
						# one weird condition i don't understand
						console.warn 'weird case', deadStars
						safeStars = [a, b]
					else if a.branch.parent.id == b.branch.parent.id and a.branch.status.distanceTravelled < Config.starSafetyDistance
						safeStars = [a, b]

				for star in deadStars when not (star in safeStars)
					star.branch.doStop()

	togglePause: ->
		@status.paused = not @status.paused
		if @status.paused
			clearInterval @loopInterval
		else
			@doLoop()

	tailColor: ->
		return @rainbowColors[@status.tailColorIndex]

	bindEvents: ->
		$(window).on 'resize', (e) =>
			$body = $('body')
			@$canvas.attr
				width: $body.width()
				height: $body.height()
			@view.clearScreen('pink')

		$(document).on 'keypress', (e) =>
			switch e.charCode
				when 32
					@togglePause()
				when 115
					@scroll.x -= 3
				when 119
					@scroll.x += 3

		$(@canvas).on 'mousemove', (e) =>
			@mouse.x = e.offsetX
			@mouse.y = e.offsetY
		
		$(@canvas).on 'mousedown', (e) =>
			if e.which == 1
				@mouseDown = true

		$(@canvas).on 'mouseup', (e) =>
			if e.which == 1
				@mouseDown = false


		$(document).on 'keydown', (e) =>

	startTasks: ->
		setInterval =>
			{left, top, width, height} = game.view.worldBounds()
			console.log game.view.worldBounds()
			rejected = quadtree.prune(left, top, width, height)
			for r in rejected
				obj = r.object
				if obj instanceof Star
					obj.branch.doStop()
				else if obj instanceof Cloud
					for i, cloud in game.clouds
						# console.log obj, cloud
						if obj == cloud
							game.clouds.splice(i, 1)
							console.log 'killed cloud'

			console.log 'REJECTS', rejected if rejected.length > 0
		, 3000


$ ->
	$body = $('body')

	game = new Starstalk 
		$canvas: $('#game')

	GFX = game.GFX
	world = game.world

	game.start()
	