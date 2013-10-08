
class PlayState extends GameState

	highestStar: null
	heightAchieved: 0

	view: null
	viewHUD: null
	quadtree: Quadtree.create(1000, 100000)
	multiplier: 1

	powerups: null
	obstacles: null
	clouds: null
	novae: null
	stars: null
	branches: null

	constructor: ->
		numRainbowColors = 256
		@rainbowColors = (tinycolor("hsv(#{p * 100 / numRainbowColors}%, 50%, 100%)").toRgbString() for p in [0..numRainbowColors])

		@powerups = []
		@obstacles = []
		@clouds = []
		@novae = []
		@stars = []
		@branches = []

	initialize: ->
		star = new Star (new Vec 0, 0), -Math.PI / 2
		@stars.push star
		branch = new Branch(new Vec 0, 0)
		branch.setStar(star)
		@branches.push branch

	enter: ->
		@view ?= new Viewport @game.canvas,
			scroll: new Vec 0, 0
			anchor: 'center'
		@viewHUD ?= new Viewport @game.canvas,
			scroll: new Vec 0, 0

	exit: ->

	update: (dt) ->
		@quadtree.reset()
		t.update(dt) for t in @novae
		t.update(dt) for t in @obstacles
		t.update(dt) for t in @powerups
		t.update(dt) for t in @clouds
		PlasmaCloud.update(dt)

		@addObstacles(dt)

		for star in @stars
			if @game.mouse.leftButton
				star.attraction = @view.screen2world @game.mouse.position
			else
				star.attraction = null
			star.update(dt)
			branch = star.branch
			if Config.autoFork and branch.forkable()
				star.tell 'fork'

		@handleCollision()
		@bringOutTheDead()
		@processQueue star for star in @stars

		$('body').css
			'background-position': "0 #{@heightAchieved / 10}px"

		if @stars.length > 0

			viewBottom = @view.worldQuad().bottom()

			for branch in @branches
				branch.update(dt)
				if not branch.star? and branch.highestAltitude < -viewBottom
					branch.die()

			@highestStar = _.min @stars, (s) -> s.position.y
			[w, h] = @view.dimensions()
			@heightAchieved = -@highestStar.position.y if -@highestStar?.position.y > @heightAchieved
			@view.scroll.y = Math.max 0, @heightAchieved

			@multiplier = @stars.length


	render: ->
		fillstroke = (ctx, x, y, text) ->
			ctx.fillText text, x, y
			ctx.strokeText text, x, y

		@view.clearScreen(@skyColor(@heightAchieved))
		@view.draw (ctx) =>
			t.render(ctx) for t in @novae
			t.render(ctx) for t in @branches
			t.render(ctx) for t in @stars
			t.render(ctx) for t in @obstacles
			t.render(ctx) for t in @clouds

			if Config.debugDraw
				for box in @quadtree.getObjects()
					ctx.beginPath()
					ctx.rect(box.left, box.top, box.width, box.height)
					ctx.strokeStyle = 'red'
					ctx.stroke()

		if @isActive()
			@viewHUD.draw (ctx) =>
				ctx.font = "60px #{Config.hudFont}"
				ctx.strokeStyle = '#aaa'
				ctx.fillStyle = '#eee'
				ctx.lineWidth = 1.5
				ctx.setTransform(1, 0, 0, 1, 0, 0)
				altitudeText = parseInt(@heightAchieved/1000) + 'km'
				ctx.fillText(altitudeText, 50, 100)
				ctx.strokeText(altitudeText, 50, 100)
				altitudeTextWidth = ctx.measureText(altitudeText).width

				if @multiplier > 0
					ctx.font = "30px #{Config.hudFont}"
					fillstroke ctx, 50 + altitudeTextWidth + 25, 100, "★x#{@multiplier}"


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


	addObstacles: (dt) ->

		viewQuad = @view.worldQuad()
		viewVolume = viewQuad.width() * viewQuad.height()
		# console.log viewQuad.bottom(), viewQuad.top()

		prob = (probFn, callback) =>
			if Math.random() < dt * probFn(@heightAchieved) then callback()

		randomSpotOffscreen = (objectHeight=0) =>
			x = _.random viewQuad.left(), viewQuad.right()
			y1 = viewQuad.top() - objectHeight
			y0 = y1 - 100
			y = Math.random() * (y1-y0) + y0
			new Vec x, y

		make = (klass, vel) =>
			new klass randomSpotOffscreen(klass.spriteImage.image.height), vel

		prob Config.probability.cloud, =>
			@powerups.push (new PlasmaCloud randomSpotOffscreen(PlasmaCloud.canvas.height), new Vec(_.random(0, 0.1), 0) )
		prob Config.probability.cloud, =>
			@clouds.push make Cloud, new Vec(_.random(2, 5), 0)
		prob Config.probability.balloon, =>
			@obstacles.push make Balloon, new Vec(_.random(-2, 2), 0)
		# prob Config.probability.balloon, =>
		# 	@obstacles.push new Balloon randomSpotOffscreen(), new Vec(_.random(-2, 2), 0)
		# prob Config.probability.balloon, =>
		# 	@obstacles.push new Balloon randomSpotOffscreen(), new Vec(_.random(-2, 2), 0)

	transition: ->
		if @stars.length == 0
			@game.pushState new GameOverState

	bringOutTheDead: ->
		deadStars = (t for t in @stars when t.isDead)
		deadBranches = (t for t in @branches when t.isDead)
		deadNovae = (t for t in @novae when t.isDead)
		@stars = _.difference @stars, deadStars
		@branches = _.difference @branches, deadBranches
		@novae = _.difference @novae, deadNovae

	handleCollision: (objects) ->
		alreadyHandled = []
		deathQuad = @deathQuad()
		for star in @stars when not star.isDead
			if not deathQuad.onQuad star.qbox.quad()
				@killStar star
			else if not star.isSafe()
				rawhits = star.qbox.getHits(@quadtree)
				hits = rawhits.filter (h) =>
					h.object != star and h.quad().onQuad star.qbox.quad() # and not (h.object instanceof Star and h.object.isDead)
				if hits.length > 0
					powerups = (hit.object for hit in hits when hit.object instanceof Powerup)
					obstacles = (hit.object for hit in hits when hit.object instanceof Obstacle)
					stargroup = (hit.object for hit in hits when hit.object instanceof Star)
					stargroup.push star
					if obstacles.length > 0
						@killStar s for s in stargroup
					else if powerups.length > 0
						for p in powerups
							for s in stargroup
								p.bless s
					else
						@mergeStars stargroup
		for ob in @obstacles
			for hit in ob.qbox.getHits(@quadtree)
				if hit.object instanceof Star and not hit.object.isDead and hit.quad().onQuad ob.qbox.quad()
					@killStar hit.object
		for p in @powerups
			for hit in p.qbox.getHits(@quadtree)
				if hit.object instanceof Star and not hit.object.isDead and hit.quad().onQuad p.qbox.quad()
					p.bless hit.object

	processQueue: (star) ->
		if star.queue.length > 0
			for cmd in star.queue
				switch cmd
					when 'fork'
						branch = star.branch
						left = new Branch branch
						right = new Branch branch
						newStar = new Star (new Vec branch.tip), star.angle
						left.setStar newStar
						right.setStar star
						newStar.angle -= Config.branchAngle
						star.angle += Config.branchAngle
						@stars.push newStar
						branch.stop()
						@branches.push left
						@branches.push right
			star.queue = []

			
	deathQuad: ->
		{x, y, w, h} = @view.worldQuad()
		x -= Config.autokillTolerance.x
		w += 2 * Config.autokillTolerance.x
		h += Config.autokillTolerance.y
		new Quad x, y, w, h

	killStar: (star) ->
		@novae.push new Nova star
		star.die()

	mergeStars: (stars) ->
		highest = _.max stars, (s) -> -s.position.y
		star.merge(highest) for star in _.without stars, highest

	novaProfiling: ->		
		if @novae.length > 0 and not window.profiling
			console.profile(Math.random())
			window.profiling = true
		else if window.profiling and @novae.length == 0
			console.profileEnd()
			window.profiling = false



class GameOverState extends GameState

	initialize: ->
		_.delay =>
			@bind @game.canvas, 'click', (e) =>
				game = @game
				game.popState()  # this (GameOverState)
				game.popState()  # old (PlayState)
				game.pushState new PlayState
		, 1000

	enter: ->
		@view = @parent.viewHUD

	exit: ->

	update: (dt) ->
		t.update(dt * Config.gameOverSlowdown) for t in @parent.novae

	render: (ctx) ->
		@parent.render(ctx)
		{r,g,b} = tinycolor(rainbow()).toRgb()
		view = @view
		view.fillScreen("rgba(#{r},#{g},#{b},0.75)")
		view.draw (ctx) =>
			ctx.lineWidth = 1.5
			ctx.fillStyle = '#222'
			ctx.strokeStyle = '#222'
			lines = [
				{ text: "YOU ASCENDED", font: "70px #{Config.mainFont}", height: 70 }
				{ text: "#{parseInt(@parent.heightAchieved)} meters", font: "100px #{Config.mainFont}", height: 100 }
				{ text: "click to begin anew", font: "80px #{Config.mainFont}", height: 100, color: 'white' }
			]
			y = 100
			for line in lines
				{text, font, height, color} = line
				if color?
					ctx.strokeStyle = color
					ctx.fillStyle = color
				ctx.font = font
				{width} = ctx.measureText(text)
				x = view.width() / 2 - width / 2
				y += height * 1.5
				# ctx.fillText(text, x, y)
				ctx.strokeText(text, x, y)
