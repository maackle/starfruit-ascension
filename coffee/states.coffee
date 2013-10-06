
class PlayState extends GameState

	tailColorIndex: 0
	heightAchieved: 0

	view: null
	viewHUD: null
	quadtree: Quadtree.create(1000, 100000)

	obstacles: []
	clouds: []
	novae: []
	stars: []

	constructor: ->
		numRainbowColors = 256
		@rainbowColors = (tinycolor("hsv(#{p * 100 / numRainbowColors}%, 50%, 100%)").toRgbString() for p in [0..numRainbowColors])
		@initialize()

	initialize: ->
		@obstacles.push new Cookie(new Vec(0,0), new Vec(1, 0))
		@obstacles.push new Satellite(new Vec(-100,0), new Vec(1, 0))
		@obstacles.push new Cloud(new Vec(-100,-100), new Vec(1, 0))
		@obstacles.push new Balloon(new Vec(-100,-100), new Vec(1, 0))

	enter: ->
		@view ?= new Viewport @game.canvas,
			scroll: new Vec 0, 0
			anchor: 'center'
		@viewHUD ?= new Viewport @game.canvas,
			scroll: new Vec 0, 0

	exit: ->

	update: (dt) ->
		@quadtree.reset()
		updateables = @novae.concat @obstacles.concat @clouds.concat @stars
		d.update(dt) for d in updateables

	render: ->
		@view.clearScreen('blue')
		@view.draw (ctx) =>
			renderables = @novae.concat @obstacles.concat @clouds.concat @stars
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




class GameOverState extends GameState
