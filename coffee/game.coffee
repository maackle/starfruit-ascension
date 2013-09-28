game = null
GFX = null

class Star extends Thing

	radius: 16
	radius2: 8

	constructor: (@position) ->
		@hasFocus = false
		@angle = 0
		inc = Math.PI * 2 / 10
		@vertices = (Vec.polar (if i % 2 == 0 then @radius else @radius2), i * inc for i in [0..10])

	withTransform: (fn) ->
		game.ctx.save()
		game.ctx.translate @position.x, @position.y
		game.ctx.rotate @angle
		fn()
		game.ctx.restore()

	update: ->


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
		if game.ctx.isPointInPath game.mouse.x, game.mouse.y
			@hasFocus = true
			@withTransform =>
				game.ctx.strokeStyle = 'red'
				game.ctx.stroke()
		else
			@hasFocus = false



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
		@star = new Star @tip
		@status =
			rate: Config.growthRate
			branchAngle: Config.branchAngle
			branchDistance: Config.branchDistance
			knotDistance: Config.knotDistance
			isGrowing: true
			distanceTravelled: 0
			distanceTravelledKnot: 0

	collectStars: ->
		stars = []
		stars.push @star if @star?
		for branch in @branches
			stars.push star for star in branch.collectStars()
		stars

	growthVector: ->
		Vec.polar @status.rate, @angle

	doFork: ->
		newRoot = new Vec @tip
		left = new Branch newRoot, @angle + @status.branchAngle
		right = new Branch newRoot, @angle - @status.branchAngle
		@branches = [left, right]
		@status.isGrowing = false
		@star = null

	doKnot: ->
		@knots.push (new Vec @tip)
		@angle += (Math.random() - 0.5) * Config.knotAngleJitter
		@angle = lerp(@angle, -Math.PI/2, Config.branchAngleUpwardWeight)

	handleInput: (e) ->

	update: ->
		if @status.isGrowing
			@status.distanceTravelled += @status.rate
			@status.distanceTravelledKnot += @status.rate
			@tip.add @growthVector()
			@star.angle = @growthVector().angle()
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
			game.ctx.strokeStyle = game.rainbowColors[i*2]
			game.ctx.strokeStyle = game.tailColor()
			game.ctx.stroke()
		game.ctx.restore()
		if @status.isGrowing
			@star.render()
		else
			for branch in @branches
				branch.render()

class Cloud

	constructor: (@position, @velocity) ->

	update: ->
		@position.add @velocity

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
		@sprites = 
			star: new Sprite Config.starImage, new Vec(15, 16)
			cloud: new Sprite Config.cloudImage, new Vec(15, 16)
		@view = new Viewport @canvas,
			scroll: new Vec 0, 0
			anchor:
				bottom: 20

	width: -> @canvas.width
	height: -> @canvas.height

	start: ->
		@bindEvents()
		$(window).trigger 'resize'
		@stalk = new Branch(new Vec(0, 0), -Math.PI/2)
		@clouds.push new Cloud(new Vec(-100, -100), new Vec(2, 0))
		@doLoop()

	doLoop: ->
		@loopInterval = setInterval =>
			@view.clearScreen('#b5e0e2')
			@update()
			things = [@stalk]
			things.push cloud for cloud in @clouds
			if not @status.paused
				for thing in things
					thing.update()
					thing.render()
			@status.tailColorIndex += 1
			@status.tailColorIndex %= @rainbowColors.length
		, parseInt(1000 / @config.fps)

	update: ->
		stars = @stalk.collectStars()
		highestStar = _.min stars, (s) -> s.position.y
		[w, h] = @view.dimensions()
		@view.scroll.y = Math.max 0, -h/2 - highestStar.position.y
		@view.update()
		if Math.random() < Config.cloudProbability / @config.fps
			@clouds.push Cloud.make(highestStar.position)
		for i, cloud in @clouds
			if cloud.x > @width()
				@clouds.splice(i, 1)


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

		$(document).on 'keydown', (e) =>


$ ->
	$body = $('body')

	game = new Starstalk 
		$canvas: $('#game')

	GFX = game.GFX

	game.start()
	