atmoscale = 1/3

Config = 
	growthRate: 10
	starThrustRate: 20

	branchAngle: Math.PI / 3
	branchAngleUpwardWeight: 0.1
	branchDistance: 2000
	branchFibers: 3
	branchWidth: 10

	knotDistance: 100
	knotDistanceWhileThrusting: 50
	knotAngleJitter: Math.PI / 48

	cloudProbability: 0.5

	starSafetyDistance: 128
	starNovaRadius: 32
	starNovaTime: 1

	starImage: makeImage 'img/star-32.png'
	cloudImage: makeImage 'img/cloud-4-a.png'

	starOffset:
		x: 16
		y: 16

	atmosphere:
		layers: [
			[atmoscale*0,		tinycolor '#b5e0e2'],
			[atmoscale*5000, 	tinycolor '#b5e0e2'],
			[atmoscale*12000,	tinycolor '#97b2c6'],	# tropopause
			[atmoscale*50000, 	tinycolor '#778b9b'],	# stratopause
			[atmoscale*80000, 	tinycolor '#37475b'],	# mesopause
			[atmoscale*100000,	tinycolor '#0f1419'],	# spaaaace
		]