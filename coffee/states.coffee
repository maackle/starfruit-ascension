
class PlayState extends GameState

	highestStar: null
	heightAchieved: 0

	view: null
	viewHUD: null
	quadtree: Quadtree.create(1000, 100000)

	obstacles: []
	clouds: []
	novae: []
	stars: []
	branches: []

	constructor: ->
		numRainbowColors = 256
		@rainbowColors = (tinycolor("hsv(#{p * 100 / numRainbowColors}%, 50%, 100%)").toRgbString() for p in [0..numRainbowColors])
		@initialize()

	initialize: ->
		@obstacles.push new Cookie(new Vec(0,0), new Vec(1, 0))
		@obstacles.push new Satellite(new Vec(-100,0), new Vec(1, 0))
		@obstacles.push new Cloud(new Vec(-100,-100), new Vec(1, 0))
		@obstacles.push new Balloon(new Vec(-100,-100), new Vec(1, 0))
		star = new Star(new Vec 0, 0)
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
		t.update(dt) for t in @clouds
		
		for star in @stars
			star.update(dt)
			branch = star.branch
			if Config.autoFork and branch.forkable()
				left = new Branch branch
				right = new Branch branch
				newStar = new Star new Vec branch.tip
				left.setStar newStar
				right.setStar star
				newStar.angle -= Config.branchAngle
				star.angle += Config.branchAngle
				@stars.push newStar
				branch.stop()
				@branches = @collectBranches()

		for branch in @branches
			branch.update(dt)

		@highestStar = _.min @stars, (s) -> s.position.y
		
		[w, h] = @view.dimensions()
		@heightAchieved = -@highestStar.position.y if -@highestStar.position.y > @heightAchieved
		@view.scroll.y = Math.max 0, @heightAchieved


	render: ->
		@view.clearScreen('blue')
		@view.draw (ctx) =>
			renderables = @novae.concat @obstacles.concat @clouds.concat @stars.concat @branches
			r.render(ctx) for r in renderables

			if Config.debugDraw
				for box in @quadtree.getObjects()
					ctx.beginPath()
					ctx.rect(box.left, box.top, box.width, box.height)
					ctx.strokeStyle = 'red'
					ctx.stroke()

		@viewHUD.draw (ctx) =>
			ctx.font = "60px #{Config.hudFont}"
			ctx.strokeStyle = '#aaa'
			ctx.fillStyle = '#eee'
			ctx.lineWidth = 1.5
			ctx.setTransform(1, 0, 0, 1, 0, 0)
			ctx.fillText(parseInt(@heightAchieved) + 'm', 50, 100)
			ctx.strokeText(parseInt(@heightAchieved) + 'm', 50, 100)

	collectBranches: ->
		visited = []

		level = (branches) ->
			if branches.length == 0
				[]
			else
				parents = []
				parents.push branch.parent for branch in branches when branch.parent not in parents
				branches.concat level(_.compact(parents))

		leaves = (star.branch for star in @stars)
		branches = level(leaves)
		branches



class GameOverState extends GameState
