
Config = 
	growthRate: 3
	branchAngle: Math.PI / 3
	branchAngleUpwardWeight: 0.1
	branchDistance: 600
	branchFibers: 3
	branchWidth: 10
	knotDistance: 50
	knotDistanceWhileThrusting: 20
	knotAngleJitter: Math.PI / 6

	cloudProbability: 0.5

	starSafetyDistance: 32
	starNovaRadius: 32
	starThrustRate: 6

	starImage: makeImage 'img/star-32.png'
	starOffset:
		x: 16
		y: 16
	cloudImage: makeImage 'img/cloud-4-a.png'
	cloudOffset:
		x: 16
		y: 16