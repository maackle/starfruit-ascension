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


class Starstalk

	things: []
	clouds: []
	novae: []
	loopInterval: null

	config:
		fps: 30

	constructor: ({@$canvas}) ->
		@mouse = new Vec 0, 0
		@canvas = @$canvas.get(0)
		@ctx = @canvas.getContext '2d'
		@ctx.webkitImageSmoothingEnabled = @ctx.imageSmoothingEnabled = @ctx.mozImageSmoothingEnabled = @ctx.oImageSmoothingEnabled = false;
		@ctx.setTransform 1, 0, 0, 1, 0, 0
		@GFX = new GraphicsHelper @ctx
		@obstacles = []
		numRainbowColors = 256
		@rainbowColors = (tinycolor("hsv(#{p * 100 / numRainbowColors}%, 50%, 100%)").toRgbString() for p in [0..numRainbowColors])
		@status =
			paused: false
			tailColorIndex: 0  # for iterating over rainbowColors
			heightAchieved: 0
		@sprites = 
			star: new Sprite Config.starImage, Config.starOffset
			cloud: new Sprite Config.cloudImage
			balloon: new Sprite Config.balloonImage, balloonSpriteOffset
			satellite: new Sprite Config.satelliteImage
			cookie: new Sprite Config.cookieImage
		@view = new Viewport @canvas,
			scroll: new Vec 0, 0
			anchor:
				bottom: 20

	width: -> @canvas.width
	height: -> @canvas.height

	skyColor: (height) ->
		layers = Config.atmosphere.layers
		layerLo = layers[0]
		for layer in layers
			layerHi = layer
			if layerHi[0] > height then break
			layerLo = layer
		[heightLo, colorLo, alphaLo] = layerLo
		[heightHi, colorHi, alphaHi] = layerHi
		t = (height - heightLo) / (heightHi - heightLo)
		lo = colorLo.toRgb()
		hi = colorHi.toRgb()
		alpha = lerp(alphaLo, alphaHi, t)
		{r,g,b} = tinycolor(r: lerp(lo.r, hi.r, t), g: lerp(lo.g, hi.g, t), b: lerp(lo.b, hi.b, t)).toRgb()
		"rgba(#{r}, #{g}, #{b}, #{alpha})"


	start: ->
		@bindEvents()
		@startTasks()
		$(window).trigger 'resize'
		@stalk = new Branch(new Vec(0, 0), -Math.PI/2)
		@doLoop()

	doLoop: ->
		@loopInterval = setInterval =>
			if @status.gameOver
				{r,g,b} = tinycolor(@tailColor()).toRgb()
				@view.fillScreen("rgba(#{r},#{g},#{b},0.5)")
				for nova in game.novae
					nova.update(0.25)
					nova.render()
				@ctx.lineWidth = 1.5
				@ctx.fillStyle = '#222'
				@ctx.strokeStyle = '#222'
				@ctx.save()
				@ctx.setTransform(1, 0, 0, 1, 0, 0)
				lines = [
					{ text: "YOU ASCENDED", font: "70px #{Config.mainFont}", height: 70 }
					{ text: "#{parseInt(@status.heightAchieved)} meters", font: "100px #{Config.mainFont}", height: 100 }
					{ text: "click to begin anew", font: "80px #{Config.mainFont}", height: 100, color: 'white' }
				]
				y = 100
				for line in lines
					{text, font, height, color} = line
					if color?
						@ctx.strokeStyle = color
						@ctx.fillStyle = color
					@ctx.font = font
					{width} = @ctx.measureText(text)
					x = @canvas.width / 2 - width / 2
					y += height * 1.5
					# @ctx.fillText(text, x, y)
					@ctx.strokeText(text, x, y)

				@ctx.restore()
			else
				color = @skyColor(@status.heightAchieved)
				@view.clearScreen(color)
				quadtree.reset()
				@update()
				@handleObstacles()
				@applyInput()
				things = [@stalk]
				things.push star for star in @stars
				things.push cloud for cloud in @clouds
				things.push nova for nova in @novae
				things.push obstacle for obstacle in @obstacles
				if not @status.paused
					for thing in things
						thing.update()
						thing.render()
				@handleCollision()
				@render()
			@status.tailColorIndex += 1
			@status.tailColorIndex %= @rainbowColors.length
		, parseInt(1000 / @config.fps)

	render: ->
		@ctx.font = "60px #{Config.hudFont}"
		@ctx.strokeStyle = '#333'
		@ctx.fillStyle = '#eee'
		@ctx.lineWidth = 1.5
		@ctx.save()
		@ctx.setTransform(1, 0, 0, 1, 0, 0)
		@ctx.fillText(parseInt(@status.heightAchieved) + 'm', 50, 100)
		# @ctx.strokeText(parseInt(@status.heightAchieved) + 'm', 50, 100)
		@ctx.restore()

		if Config.debugDraw
			for box in quadtree.getObjects()
				@ctx.beginPath()
				@ctx.rect(box.left, box.top, box.width, box.height)
				@ctx.strokeStyle = 'red'
				@ctx.stroke()

	applyInput: ->
		for star in @stars
			if game.mouseDown
				star.setAttraction(game.view.screen2world game.mouse)
			else
				star.setAttraction(null)

	handleCollision: ->

		bounds = @view.worldBounds()
		collidable = []
		collidable.push star for star in @stars
		collidable.push o for o in @obstacles
		allDeadStars = []
		safeStarIDs = []
		for obj in collidable
			hits = _.uniq quadtree.getObjects(obj.box.left, obj.box.top, obj.box.width, obj.box.height), (hit) =>
				hit.object.constructor.name + hit.object.id
			if hits.length > 1
				deadStars = []
				deadStars.push hit.object for hit in hits when hit.object instanceof Star
				allDeadStars.push star for star in deadStars if star not in allDeadStars
		for star in allDeadStars when not (star.id in safeStarIDs) and not star.isSafe()
			star.branch.doStop()
		for star in @stars
			pos = new Vec star.position
			dist = pos.sub(@status.highestStar.position).length()
			if dist > @maxAbsoluteDistanceBeforeDeath()
				star.branch.doStop()
			else if star.position.x < bounds.left - Config.autokillOffscreenX or star.position.x > bounds.left + bounds.width + Config.autokillOffscreenX
				star.branch.doStop()

	maxAbsoluteDistanceBeforeDeath: ->
		Config.autokillDistanceRatio * Math.max(@canvas.width, @canvas.height)

	handleObstacles: ->
		height = @status.heightAchieved
		pos = @status.highestStar.position

		position = new Vec pos
		position.y -= game.height()
		position.x += Math.random() * game.width() - game.width()*2/3
		if Math.random() < Config.probability.cloud(height) / @config.fps
			velocity = new Vec Math.random() * 3, 0
			@clouds.push new Cloud position, velocity
		else if Math.random() < Config.probability.balloon(height) / @config.fps
			velocity = new Vec Math.random() * 2, 0
			@obstacles.push new Balloon position, velocity
		else if Math.random() < Config.probability.satellite(height) / @config.fps
			velocity = new Vec Math.random() * 4, 0
			@obstacles.push new Satellite position, velocity
		else if Math.random() < Config.probability.cookie(height) / @config.fps
			velocity = new Vec Math.random() * 4, 0
			@obstacles.push new Cookie position, velocity

		for i, cloud in @clouds
			if cloud.x > @width()
				@clouds.splice(i, 1)
		for i, obstacle in @obstacles
			if obstacle.x > @width()
				@obstacles.splice(i, 1)

	update: ->
		[w, h] = @view.dimensions()
		stars = @stalk.collectStars()
		@stars = stars
		if stars.length == 1
			highestStar = stars[0]
		else
			highestStar = _.min stars, (s) -> s.position.y
		newHeight = -highestStar.position.y
		@status.heightAchieved = newHeight if newHeight > @status.heightAchieved
		@status.highestStar = highestStar
		newScrollY = -h/2 - highestStar.position.y
		@view.scroll.y = Math.max 0, newScrollY if newScrollY > @view.scroll.y
		@view.update()
		$('body').css
			'background-position': "0 #{@status.heightAchieved / 10}px"

	togglePause: ->
		@status.paused = not @status.paused
		if @status.paused
			clearInterval @loopInterval
		else
			@doLoop()

	tailColor: (factor=1) ->
		return @rainbowColors[(@status.tailColorIndex * factor) % @rainbowColors.length]

	bindEvents: ->
		$(window).on 'resize', (e) =>
			$body = $('body')
			@$canvas.attr
				width: $body.width()
				height: $body.height()

		$(document).on 'keypress', (e) =>
			switch e.charCode
				when 32
					@togglePause()
				when 70 | 102
					@canvas.webkitRequestFullScreen()
					@canvas.mozRequestFullScreen()

		$(@canvas).on 'mousemove', (e) =>
			@mouse.x = e.offsetX or e.layerX
			@mouse.y = e.offsetY or e.layerY
		
		$(@canvas).on 'mousedown', (e) =>
			if e.which == 1
				@mouseDown = true
			else if e.which == 3
				# @status.highestStar.branch.doFork()
				# console.log Branch.growing()
				for branch in Branch.growing()
					# console.log branch
					branch.doFork() if branch.status.distanceTravelled > Config.branchDistanceMin


		$(@canvas).on 'mouseup', (e) =>
			if e.which == 1
				@mouseDown = false

		$(@canvas).on 'contextmenu', (e) =>
    		e.preventDefault()

		$(document).on 'keydown', (e) =>

	unbindEvents: ->
		$(window).off 'resize'
		$(document).off 'keypress keydown'
		$(@canvas).off 'mousemove mousedown mouseup contextmenu'

	showGameOver: ->
		@status.gameOver = true
		$(@canvas).on 'mousedown', (e) =>
			newGame()

	startTasks: ->
		# setInterval =>
		# 	@pruneTree()
		# , 10000

	pruneTree: ->
		{left, top, width, height} = game.view.worldBounds()
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

		rejectedStars = rejected.filter (r) -> r instanceof Star

newGame = ->
	if game?
		game.unbindEvents()
		clearInterval game.loopInterval

	game = new Starstalk 
		$canvas: $('#game')

	GFX = game.GFX
	world = game.world

	game.start()

# titleScreen = ->
# 	canvas = $('#game').get(0)
# 	ctx = canvas.getContext '2d'

# 	$('#game').on 'click' ->
# 		$(this).off 'click'

# 		newGame()


$ ->
	$body = $('body')

	newGame()