
class PlayState extends GameState

	highestStar: null
	altitude: 0
	score: 0

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
	intervals: null

	constructor: ->
		numRainbowColors = 256
		@rainbowColors = (tinycolor("hsv(#{p * 100 / numRainbowColors}%, 50%, 100%)").toRgbString() for p in [0..numRainbowColors])

		@powerups = []
		@obstacles = []
		@clouds = []
		@novae = []
		@stars = []
		@branches = []
		@intervals = {}

	initialize: ->
		star = new Star (new Vec 0, 0), -Math.PI / 2
		@stars.push star
		branch = new Branch(new Vec 0, 0)
		branch.setStar(star)
		@branches.push branch
		globals.quadtree = @quadtree  # TODO: no globals

	enter: ->
		html = """
		<div class="play-hud">
			<div class="altitude-container">
				<div class="label altitude-label">altitude</div>
				<div class="main altitude">40km</div>
			</div>
			<div class="score-container">
				<div class="label score-label">score</div>
				<div class="main score">2555</div>
			</div>
			<div class="multiplier-container">
				<div class="label multiplier-label"></div>
				<div class="multiplier"></div>
			</div>
		</div>
		"""
		$('#game-hud').html(html).show()
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

		$('#game-container').css
			'background-position': "0 #{@altitude / 10}px"

		if @stars.length > 0

			viewBottom = @view.worldQuad().bottom()

			for branch in @branches
				branch.update(dt)
				if not branch.star? and branch.highestAltitude < -viewBottom
					branch.die()

			@highestStar = _.min @stars, (s) -> s.position.y
			[w, h] = @view.dimensions()
			prevAltitude = @altitude
			@altitude = -@highestStar.position.y if -@highestStar?.position.y > @altitude
			@score += ((@altitude - prevAltitude) * @multiplier) / Config.metersPerPoint
			@view.scroll.y = Math.max 0, @altitude

			@prevMultiplier = @multiplier
			@multiplier = @stars.length


	render: ->
		fillstroke = (ctx, x, y, text) ->
			ctx.fillText text, x, y
			ctx.strokeText text, x, y

		@view.clearScreen(@skyColor(@altitude))
		@view.draw (ctx) =>
			t.render(ctx) for t in @novae
			t.render(ctx) for t in @branches
			t.render(ctx) for t in @stars
			t.render(ctx) for t in @obstacles
			t.render(ctx) for t in @powerups
			t.render(ctx) for t in @clouds

			if Config.debugDraw
				for box in @quadtree.getObjects()
					ctx.beginPath()
					ctx.rect(box.left, box.top, box.width, box.height)
					ctx.strokeStyle = 'red'
					ctx.stroke()

		if @isActive()
			@viewHUD.draw (ctx) =>
				altitudeText = parseInt(@altitude/1000) + 'km'
				scoreText = parseInt(@score)
				multiplierText = "★x#{@multiplier}"

				$('#game-hud').find('.altitude').text(altitudeText)
				$('#game-hud').find('.score').text(scoreText)
				$m = $('#game-hud').find('.multiplier').text(multiplierText)
				if @multiplier > @prevMultiplier 
					$m.css('font-size': 60)
					clearInterval(@intervals.multiplierGrow)
					@intervals.multiplierGrow = setTimeout =>
						do ($m) =>
							$m.animate('font-size': 40)
					, 1000


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
			if Math.random() < dt * probFn(@altitude) then callback()

		randomSpotOffscreen = (objectHeight=0) =>
			x = _.random viewQuad.left(), viewQuad.right()
			y1 = viewQuad.top() - objectHeight
			y0 = y1 - 100
			y = Math.random() * (y1-y0) + y0
			new Vec x, y

		make = (klass, vel) =>
			new klass randomSpotOffscreen(klass.spriteImage.image.height), vel

		prob Config.probability.cloud, =>
			@powerups.push (new PlasmaCloud randomSpotOffscreen(PlasmaCloud.canvas.height), new Vec(_.random(0, 2), 0) )
		prob Config.probability.cloud, =>
			@clouds.push make Cloud, new Vec(_.random(2, 5), 0)
		prob Config.probability.balloon, =>
			@obstacles.push make Balloon, new Vec(_.random(-2, 2), 0)
		prob Config.probability.satellite, =>
			@obstacles.push make Satellite, new Vec(_.random(-2, 2), 0)
		prob Config.probability.cookie, =>
			@obstacles.push make Cookie, new Vec(_.random(-2, 2), 0)

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
				@killStar star,
					quietly: true
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
						sound.play 'fork'
			star.queue = []

			
	deathQuad: ->
		{x, y, w, h} = @view.worldQuad()
		x -= Config.autokillTolerance.x
		w += 2 * Config.autokillTolerance.x
		h += Config.autokillTolerance.y
		new Quad x, y, w, h

	killStar: (star, {quietly}={}) ->
		@novae.push new Nova star
		star.die()
		if quietly
			sound.play 'mininova'
		else
			sound.play 'nova'

	mergeStars: (stars) ->
		highest = _.max stars, (s) -> -s.position.y
		star.merge(highest) for star in _.without stars, highest
		sound.play 'merge'

	novaProfiling: ->		
		if @novae.length > 0 and not window.profiling
			console.profile(Math.random())
			window.profiling = true
		else if window.profiling and @novae.length == 0
			console.profileEnd()
			window.profiling = false


class InfoState extends GameState

	enter: -> 

	exit: ->

	update: (dt) ->
		$('#game-container').css
			'background-position': "0 #{@runTime * 100}px"

	render: (ctx) ->
		{r,g,b} = tinycolor(rainbow(2)).toRgb()
		hyper = tinycolor(rainbow(4)).toRgb()
		$('.rainbow').css
			color: "rgba(#{r},#{g},#{b},0.75)"
		$('.rainbow-hyper').css
			color: "rgba(#{hyper.r},#{hyper.g},#{hyper.b},0.9)"



class TitleState extends InfoState

	initialize: ->
		@bind @game.canvas, 'click', (e) =>
			@game.pushState new PlayState

	enter: ->

		@view = new Viewport @game.canvas,
			scroll: new Vec 0, 0
		@view.clearScreen()
		html = """
	<h1 class="title rainbow" style="margin-top: 10%">
		STARFRUIT:
		ASCENSION
	</h1>
	<div class="blink white" style="margin: 5% auto 5%">click to play</div>

		"""
		scoreRows = ''
		scores = Scores.get()[0..10]
		for line in scores
			{score, altitude, name} = line
			km = parseInt(altitude / 1000)
			nameClass = 'anonymous' if not name
			scoreRows += """
				<tr>
					<td class="name #{nameClass}">#{name or 'ANONYMOUS'}</td>
					<td class="altitude">#{km} km</td>
					<td class="score">#{score}</td></tr>
			"""
		if scoreRows isnt ''
			html += """
			<table class="white" style="margin: 100px auto 50px">
				<thead>
					<tr><th colspan="3"><h2>TOP PLAYERS</h2></th></tr>
					<tr style="font-size: 15px;">
						<th>name</th>
						<th>altitude</th>
						<th>score</th>
					</tr>
					</thead>
				<tbody>#{scoreRows}</tbody>
			</table>
			"""

		$('#game-hud').html(html).show()
		$('#game-hud').find('tbody tr:first-child').addClass('top-score')
		$('#game-hud').find('tbody tr:first-child .score').addClass('rainbow')
		$('.blink').each (i, el) ->
			elem = $(el)
			setInterval ->
				if (elem.css('visibility') == 'hidden')
					elem.css('visibility', 'visible')
				else
					elem.css('visibility', 'hidden')
			, 500


	exit: ->

	update: (dt) ->
		super

	render: (ctx) ->
		view = @view
		# view.fillScreen("rgba(#{r},#{g},#{b},0.75)")
		super

class GameOverState extends InfoState

	newRecord: false
	intervals: null

	constructor: ->
		@intervals = []

	initialize: ->
		

	enter: ->
		@view = @parent.viewHUD
		score = parseInt(@parent.score)
		altitude = @parent.altitude
		scores = Scores.get()
		if scores.length >= Config.maxHighScores
			lowest = scores[Config.maxHighScores - 1]
		else
			lowest = 0
		@newRecord = score > lowest
		html = """
			<div class="game-over">
				<h1 class="rainbow stroke-white" style="margin-top: 10%">GAME OVER</h1>
				<div class="stats">

				</div>
				<div class="controls">
					<div class="button restart">PLAY AGAIN</div>
					<div class="button exit">VIEW SCOREBOARD</div>
				</div>
			</div>
		"""
		lines = [
			"YOU ASCENDED",
			"#{parseInt(altitude/1000)} kilometers",
			"FINAL SCORE",
			score,
		]
		delay = 500
		for line, i in lines
			do (line, i) => 
				@intervals.push setTimeout =>
					$("""<div class="stat">#{line}</div>""").appendTo('.game-over .stats').animate
						top: 100*i
					, 1000
				, (i+1)*delay
		setTimeout =>
			$('#game-hud').find('.controls').show()
			@bind '#game-hud .button.restart', 'click', (e) =>
				game = @game
				game.popState()  # this (GameOverState)
				game.popState()  # old (PlayState)
				game.pushState new PlayState
			@bind '#game-hud .button.exit', 'click', (e) =>
				game = @game
				game.popState()  # this (GameOverState)
				game.popState()  # old (PlayState)
				game.pushState new TitleState
			@bind '#game-hud .button', 'mouseover', (e) =>
				$(e.currentTarget).addClass('rainbow-hyper')
			@bind '#game-hud .button', 'mouseout', (e) =>
				$(e.currentTarget).removeClass('rainbow-hyper').css
					'color': 'inherit'
			if @newRecord
				Scores.add
					score: parseInt(score)
					altitude: parseInt(altitude)
					name: prompt("you set a new record!  what is your name, skillful player?")
		, 100

		$('#game-hud').html(html).show()


	exit: ->
		clearInterval(i) for i in @intervals

	update: (dt) ->
		t.update(dt * Config.gameOverSlowdown) for t in @parent.novae

	render: (ctx) ->
		@parent.render(ctx)
		{r,g,b} = tinycolor(rainbow()).toRgb()
		view = @view
		view.fillScreen("rgba(#{r},#{g},#{b},0.75)")
		super
			
