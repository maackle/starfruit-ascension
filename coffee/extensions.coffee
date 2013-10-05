
do ->
	p = Object.getPrototypeOf(document.createElement('canvas').getContext('2d'))
	p.withTransform = (applyTransform) ->
		this.save()
		applyTransform()
		# do stuff...
		this.restore()