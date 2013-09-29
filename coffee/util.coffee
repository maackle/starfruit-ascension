
lerp = (a,b,t) -> a*(1-t) + b*t

clampAngleSigned = (a) ->
	while a <= Math.PI
		a += 2*Math.PI
	while a >= Math.PI
		a -= 2*Math.PI
	a

# Ensures that image is loaded before running fn()
withImage = (im, fn) ->
	if im.complete
		fn(im)
	else
		existing = im.onload
		im.onload = (e) ->
			existing(e) if existing?
			fn(im)

withImages = (images, fn) ->
	numImages = images.length
	numLoaded = 0
	if numImages == 0
		fn()
	else
		for im in images
			withImage im, ->
				numLoaded++
				if numLoaded == numImages
					fn()

makeImage = (src, args...) ->
	# Create a new image with optional initial width and height and run a callback on it on load
	# The optional dimensions are for cases when you know the image width and height and need
	# access to them before the image finishes loading
	# usage: makeImage src, [dimensions], callback
	im = new Image()
	im.src = src
	if typeof args[0] == 'function'
		fn = args[0]
	else
		[dimensions, fn] = args
	if dimensions?
		im.width = dimensions[0]
		im.height = dimensions[1]
	if fn? and isFunc fn
		im.onload = ->
			fn(im)
	return im
