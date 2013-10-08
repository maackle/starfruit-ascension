globals = {}

atmoscale = 1.0
Atmosphere = 
	noflyzone: 5000 * atmoscale
	tropopause: 12000 * atmoscale
	stratopause: 50000 * atmoscale
	mesopause: 80000 * atmoscale
	thermopause: 500000 * atmoscale

Config = 

	# GENERAL
	mainFont: 'Monoton'
	hudFont: 'Offside'
	debugDraw: yes 			# draw AABBs around Collidables
	autoFork: no 				# fork after branchDistanceMax

	
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

	mergeDrawTime: 0.5 			# how long to animate a star merge in seconds

	gameOverSlowdown: 0.2		# slowdown by this much on game over screen

	autokillTolerance:			# how far off the screen can a star go before being autokilled?
		x: 200
		y: 200

	probability:
		cloud: (height) ->
			# return 1
			if height < Atmosphere.noflyzone then 1
			else if height < Atmosphere.tropopause then 0.6
			else if height < Atmosphere.stratopause then 1.25
			else if height < Atmosphere.mesopause then 0.33
			else 0
		balloon: (height) ->
			if height < Atmosphere.noflyzone then 0
			else if height < Atmosphere.tropopause then 0.75
			else if height < Atmosphere.stratopause then 0.15
			else 0
		satellite: (height) ->
			if height > Atmosphere.stratopause then 0.75
			else 0
		cookie: (height) ->
			base = 0.2
			if height < Atmosphere.noflyzone then 0
			else if height > Atmosphere.stratopause then base
			else if height > Atmosphere.mesopause then base + (height - Atmosphere.mesopause) / Atmosphere.mesopause
			else 0.05

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