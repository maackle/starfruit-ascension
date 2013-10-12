globals = {}

atmoscale = 1.0
Atmosphere = 
	noflyzone: 5000 * atmoscale
	tropopause: 12000 * atmoscale
	stratopause: 50000 * atmoscale
	mesopause: 80000 * atmoscale
	thermopause: 500000 * atmoscale

VERSION = 0.1

Config = 

	# GENERAL
	mainFont: 'Monoton'
	hudFont: 'Offside'
	debugDraw: no 			# draw AABBs around Collidables
	autoFork: no 				# fork after branchDistanceMax

	maxHighScores: 8 		# limit number of high scores saved
	metersPerPoint: 100
	
	# BRANCHES + STARS
	starSpeed: 550 				# normal speed
	starHyperSpeed: 700 			# speed while left mousedown
	branchAngle: Math.PI / 5 	# deviation from path, radians
	branchAngleUpwardWeight: 0.1 	# adds a small component of upwards direction
	# branchDistanceMin: 100 	# player can initiate fork after this tis distance
	branchDistanceMax: 2000		# any branch longer than this will be forked
	branchFibers: 3 			# how many line strings to use to draw the branch
	branchWidth: 14 			# how wide, total, is the branch
	knotSpacing: 45 			# how far to travel before adding a knot
	knotSpacingWhileThrusting: 50
	knotAngleJitter: Math.PI / 256	# angular randomness to jostle the path

	starRadius: 16
	starInnerRadius: 8
	starSafetyDistance: 128 		# how far a star can travel before it becomes collidable.  
									#	 used to prevent immediate annihilation of new branches

	novaStrokeWidth: 8
	novaMaxRadius: 2000 		# when to kill a nova
	novaExplosionSpeed: 200 	# pixels per second

	obstaclesPerPlasmaCloud: 8 # only one plasma cloud shows up for this many obstacles

	mergeDrawTime: 0.5 			# how long to animate a star merge in seconds

	gameOverSlowdown: 0.2		# slowdown by this much on game over screen

	autokillTolerance:			# how far off the screen can a star go before being autokilled?
		x: 200
		y: 200

	probability: do =>
		NF = Atmosphere.noflyzone
		T = Atmosphere.tropopause
		S = Atmosphere.stratopause
		M = Atmosphere.mesopause
		plasma: (height) ->
			0.05
		cloud: (height) ->
			# return 1
			if height < NF then 1
			else if height < T then 0.6
			else if height < S then 1.25
			else if height < M then 0.33
			else 0
		balloon: (height) ->
			if height < NF then 0
			else if height < T then 0.8
			else if height < S then lerp(0.8, 0.4, (height-T)/S)
			else 0
		satellite: (height) ->
			if height < T then 0
			else if height < S then lerp(0.1, 4.0, (height-T)/S)
			else 4.0
		cookie: (height) ->
			base = 0.25
			if height < NF then 0
		
			else if height < S then base
			else base + (height - S) / S

	images:
		star: new ImageResource 'img/star-32.png'
		cloud: new ImageResource 'img/cloud-4-a.png'
		balloon: new ImageResource 'img/balloon.png'
		satellite: new ImageResource 'img/satellite.png'
		cookie: new ImageResource 'img/cookie.png'

	atmosphere:
		layers: [
			[atmoscale*0,		(tinycolor '#b5e0e2'), 1],
			[Atmosphere.noflyzone,	 	(tinycolor '#b5e0e2'), 1],
			[Atmosphere.tropopause,		(tinycolor '#97b2c6'), 0.95],	# tropopause
			[Atmosphere.stratopause, 	(tinycolor '#778b9b'), 0.9],	# stratopause
			[Atmosphere.mesopause, 		(tinycolor '#37475b'), 0.7],	# mesopause
			[Atmosphere.thermopause,		(tinycolor '#0f1419'), 0.0],	# spaaaace
			[9999999999,				(tinycolor '#000'), 0.0],	# spaaaace
		]