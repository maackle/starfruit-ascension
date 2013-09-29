atmoscale = 1.0/2.0
Atmosphere = 
	noflyzone: 5000 * atmoscale
	tropopause: 18000 * atmoscale
	stratopause: 40000 * atmoscale
	mesopause: 75000 * atmoscale
	exopause: 100000 * atmoscale

Config = 
	mainFont: 'Monoton'
	hudFont: 'Offside'
	growthRate: 15 				# normal speed
	starThrustRate: 18 			# speed while left mousedown

	autoFork: true 				# form after branchDistanceMax
	debugDraw: false 			# draw AABBs around Collidables

	branchAngle: Math.PI / 3 	# deviation from path, radians
	branchAngleUpwardWeight: 0.1 # add a small component of upwards direction
	branchDistanceMin: 1500 	# player can initiate fork after this tis distance
	branchDistanceMax: 3000		# any branch longer than this will be forked
	branchFibers: 3 			# how many line strings to use to draw the branch
	branchWidth: 10 			# how wide, total, is the branch

	autokillDistanceRatio: 1.25  # kill any stars that are further from the highest star by this ratio of "screen size"
	autokillOffscreenX: 600  	# kill any stars that are offscreen by this much in the X axis

	knotDistance: 100 				# how many pixels to travel before adding a knot
	knotDistanceWhileThrusting: 50
	knotAngleJitter: Math.PI / 24	# angular randomness to jostle the path

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

	starNovaRadius: 32 				# how big to draw a dead star marker
	starNovaTime: 1.5 				# unused, time to animate star death in seconds
	starSafetyDistance: 128 		# how far a star can travel before it becomes collidable.  
									#	 used to prevent immediate annihilation of new branches

	starImage: makeImage 'img/star-32.png'
	cloudImage: makeImage 'img/cloud-4-a.png'
	balloonImage: makeImage 'img/balloon.png'
	satelliteImage: makeImage 'img/satellite.png'
	cookieImage: makeImage 'img/cookie.png'

	starOffset:
		x: 16
		y: 16

	atmosphere:
		layers: [
			[atmoscale*0,		(tinycolor '#b5e0e2'), 1],
			[Atmosphere.noflyzone,	 	(tinycolor '#b5e0e2'), 1],
			[Atmosphere.tropopause,		(tinycolor '#97b2c6'), 0.95],	# tropopause
			[Atmosphere.stratopause, 	(tinycolor '#778b9b'), 0.9],	# stratopause
			[Atmosphere.mesopause, 		(tinycolor '#37475b'), 0.7],	# mesopause
			[Atmosphere.exopause,		(tinycolor '#0f1419'), 0.0],	# spaaaace
		]