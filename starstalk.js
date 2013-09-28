(function() {
  var NotImplemented, Stalk, Star, Starstalk, Thing, game, makeImage, vec, withImage, withImages,
    __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  withImage = function(im, fn) {
    var existing;
    if (im.complete) {
      return fn(im);
    } else {
      existing = im.onload;
      return im.onload = function(e) {
        if (existing != null) {
          existing(e);
        }
        return fn(im);
      };
    }
  };

  withImages = function(images, fn) {
    var im, numImages, numLoaded, _i, _len, _results;
    numImages = images.length;
    numLoaded = 0;
    if (numImages === 0) {
      return fn();
    } else {
      _results = [];
      for (_i = 0, _len = images.length; _i < _len; _i++) {
        im = images[_i];
        _results.push(withImage(im, function() {
          numLoaded++;
          if (numLoaded === numImages) {
            return fn();
          }
        }));
      }
      return _results;
    }
  };

  makeImage = function() {
    var args, dimensions, fn, im, src;
    src = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    im = new Image();
    im.src = src;
    if (typeof args[0] === 'function') {
      fn = args[0];
    } else {
      dimensions = args[0], fn = args[1];
    }
    if (dimensions != null) {
      im.width = dimensions[0];
      im.height = dimensions[1];
    }
    if ((fn != null) && isFunc(fn)) {
      im.onload = function() {
        return fn(im);
      };
    }
    return im;
  };

  game = null;

  NotImplemented = {};

  vec = (function() {
    function vec(x, y) {
      this.x = x;
      this.y = y;
    }

    vec.prototype.add = function(v) {
      return new vec(this.x + v.x, this.y + v.y);
    };

    vec.prototype.sub = function(v) {
      return new vec(this.x - v.x, this.y - v.y);
    };

    return vec;

  })();

  Thing = (function() {
    function Thing() {}

    Thing.prototype.render = function() {
      throw NotImplemented;
    };

    Thing.prototype.update = function() {
      throw NotImplemented;
    };

    return Thing;

  })();

  Star = (function(_super) {
    __extends(Star, _super);

    Star.img = makeImage('img/star-32.png');

    Star.prototype.offset = {
      x: 15,
      y: 16
    };

    function Star(pos) {
      this.pos = pos;
    }

    Star.prototype.update = function() {
      return this.pos.y -= 1;
    };

    Star.prototype.render = function() {
      var _this = this;
      return withImage(Star.img, function(im) {
        return game.ctx.drawImage(im, _this.pos.x - _this.offset.x, _this.pos.y - _this.offset.y);
      });
    };

    return Star;

  })(Thing);

  Stalk = (function(_super) {
    __extends(Stalk, _super);

    Stalk.prototype.leaves = [];

    function Stalk() {}

    Stalk.prototype.update = function() {};

    Stalk.prototype.render = function() {};

    return Stalk;

  })(Thing);

  Starstalk = (function() {
    Starstalk.prototype.things = [];

    Starstalk.prototype.loopInterval = null;

    Starstalk.prototype.status = {
      paused: false
    };

    function Starstalk(_arg) {
      this.$canvas = _arg.$canvas;
      this.canvas = this.$canvas.get(0);
      this.ctx = this.canvas.getContext('2d');
    }

    Starstalk.prototype.width = function() {
      return this.canvas.width;
    };

    Starstalk.prototype.height = function() {
      return this.canvas.height;
    };

    Starstalk.prototype.clearScreen = function(color) {
      this.ctx.fillStyle = color;
      return this.ctx.fillRect(0, 0, this.width(), this.height());
    };

    Starstalk.prototype.start = function() {
      this.bindEvents();
      $(window).trigger('resize');
      this.clearScreen('blue');
      this.things.push(new Star(new vec(this.width() / 2, this.height())));
      return this.doLoop();
    };

    Starstalk.prototype.doLoop = function() {
      var _this = this;
      return this.loopInterval = setInterval(function() {
        var thing, _i, _len, _ref, _results;
        _this.clearScreen();
        if (!_this.status.paused) {
          _ref = _this.things;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            thing = _ref[_i];
            thing.update();
            _results.push(thing.render());
          }
          return _results;
        }
      }, 100);
    };

    Starstalk.prototype.togglePause = function() {
      this.status.paused = !this.status.paused;
      if (this.status.paused) {
        return clearInterval(this.loopInterval);
      } else {
        return this.doLoop();
      }
    };

    Starstalk.prototype.bindEvents = function() {
      var _this = this;
      $(window).on('resize', function(e) {
        var $body;
        $body = $('body');
        console.log('resized', $body.width());
        _this.$canvas.attr({
          width: $body.width(),
          height: $body.height()
        });
        return _this.clearScreen('pink');
      });
      return $(document).on('keypress', function(e) {
        switch (e.charCode) {
          case 32:
            return _this.togglePause();
        }
      });
    };

    return Starstalk;

  })();

  $(function() {
    var $body;
    $body = $('body');
    game = new Starstalk({
      $canvas: $('#game')
    });
    return game.start();
  });

}).call(this);
