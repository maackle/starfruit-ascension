globals = {}

atmoscale = 1.0/2.0
Atmosphere = 
	noflyzone: 5000 * atmoscale
	tropopause: 18000 * atmoscale
	stratopause: 40000 * atmoscale
	mesopause: 75000 * atmoscale
	exopause: 100000 * atmoscale

Config = 

	# GENERAL
	mainFont: 'Monoton'
	hudFont: 'Offside'
	debugDraw: true 			# draw AABBs around Collidables

	
	# BRANCHES + STARS
	starSpeed: 15 				# normal speed
	starHyperSpeed: 18 			# speed while left mousedown
	autoFork: true 				# form after branchDistanceMax
	branchAngle: Math.PI / 3 	# deviation from path, radians
	branchAngleUpwardWeight: 0.1 # add a small component of upwards direction
	branchDistanceMin: 100 	# player can initiate fork after this tis distance
	branchDistanceMax: 300		# any branch longer than this will be forked
	branchFibers: 3 			# how many line strings to use to draw the branch
	branchWidth: 10 			# how wide, total, is the branch
	knotSpacing: 100 			# how far to travel before adding a knot
	knotSpacingWhileThrusting: 50
	knotAngleJitter: Math.PI / 24	# angular randomness to jostle the path

	starRadius: 16
	starInnerRadius: 8
	starNovaRadius: 32 				# how big to draw a dead star marker
	starNovaTime: 1.5 				# unused, time to animate star death in seconds
	starSafetyDistance: 128 		# how far a star can travel before it becomes collidable.  
									#	 used to prevent immediate annihilation of new branches


	# WINDOW
	autokillDistanceRatio: 1.25  # kill any stars that are further from the highest star by this ratio of "screen size"
	autokillOffscreenX: 600  	# kill any stars that are offscreen by this much in the X axis

	probability:
		cloud: (height) ->
			# return 1
			if height < Atmosphere.noflyzone then 0.66
			else if height < Atmosphere.tropopause then 0.5
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
			[Atmosphere.exopause,		(tinycolor '#0f1419'), 0.0],	# spaaaace
		]