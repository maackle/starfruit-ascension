atmoscale = 1
Atmosphere = 
	tropopause: 12000 * atmoscale
	stratopause: 40000 * atmoscale
	mesopause: 75000 * atmoscale
	exopause: 100000 * atmoscale

Config = 
	growthRate: 15
	starThrustRate: 18

	autoFork: true
	debugDraw: false

	branchAngle: Math.PI / 3
	branchAngleUpwardWeight: 0.1
	branchDistanceMin: 1500
	branchDistanceMax: 3000
	branchFibers: 3
	branchWidth: 10

	knotDistance: 100
	knotDistanceWhileThrusting: 50
	knotAngleJitter: Math.PI / 24

	probability:
		cloud: (height) ->
			if height < Atmosphere.tropopause then 0.5
			else if height < Atmosphere.stratopause then 1.25
			else if height < Atmosphere.mesopause then 0.33
			else 0
		balloon: (height) ->
			if height < Atmosphere.stratopause then 0.55
			else 0
		satellite: (height) ->
			if height > Atmosphere.stratopause then 0.75
			else 0

	starSafetyDistance: 128
	starNovaRadius: 32
	starNovaTime: 1

	starImage: makeImage 'img/star-32.png'
	cloudImage: makeImage 'img/cloud-4-a.png'
	balloonImage: makeImage 'img/balloon.png'
	satelliteImage: makeImage 'img/satellite.png'

	starOffset:
		x: 16
		y: 16

	atmosphere:
		layers: [
			[atmoscale*0,		(tinycolor '#b5e0e2'), 1],
			[atmoscale*5000, 	(tinycolor '#b5e0e2'), 1],
			[Atmosphere.tropopause,		(tinycolor '#97b2c6'), 0.95],	# tropopause
			[Atmosphere.stratopause, 	(tinycolor '#778b9b'), 0.9],	# stratopause
			[Atmosphere.mesopause, 		(tinycolor '#37475b'), 0.7],	# mesopause
			[Atmosphere.exoopause,		(tinycolor '#0f1419'), 0.0],	# spaaaace
		]