(function() {
  var Branch, Config, GFX, GraphicsHelper, NotImplemented, Sprite, Starstalk, Thing, Vec, Viewport, game, makeImage, withImage, withImages,
    __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

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

  Config = {
    growthRate: 1,
    branchAngle: Math.PI / 6,
    branchDistance: 100,
    knotDistance: 25,
    knotAngleJitter: Math.PI / 36,
    starImage: makeImage('img/star-32.png')
  };

  game = null;

  GFX = null;

  NotImplemented = {};

  Vec = (function() {
    Vec.polar = function(r, t) {
      var x, y;
      x = Math.cos(t) * r;
      y = Math.sin(t) * r;
      return new Vec(x, y);
    };

    function Vec() {
      var v;
      if (arguments.length === 1) {
        v = arguments[0];
        this.x = v.x;
        this.y = v.y;
      } else if (arguments.length === 2) {
        this.x = arguments[0], this.y = arguments[1];
      }
    }

    Vec.prototype.add = function(v) {
      this.x += v.x;
      return this.y += v.y;
    };

    Vec.prototype.sub = function(v) {
      this.x -= v.x;
      return this.y -= v.y;
    };

    return Vec;

  })();

  Sprite = (function() {
    function Sprite(im, offset) {
      this.im = im;
      this.offset = offset;
      if (this.offset == null) {
        this.offset = {
          x: 0,
          y: 0
        };
      }
    }

    Sprite.prototype.draw = function(pos) {
      var _this = this;
      return withImage(this.im, function(im) {
        return game.ctx.drawImage(im, pos.x - _this.offset.x, pos.y - _this.offset.y);
      });
    };

    return Sprite;

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

  Branch = (function(_super) {
    __extends(Branch, _super);

    Branch.all = [];

    Branch.prototype.id = null;

    Branch.prototype.tip = null;

    function Branch(root, angle) {
      this.root = root;
      this.angle = angle;
      this.knots = [];
      this.branches = [];
      this.tip = new Vec(this.root);
      this.knots.push(this.root);
      Branch.all.push(this);
      this.id = Branch.all.length;
      this.status = {
        rate: Config.growthRate,
        branchAngle: Config.branchAngle,
        branchDistance: Config.branchDistance,
        knotDistance: Config.knotDistance,
        isGrowing: true,
        distanceTravelled: 0
      };
    }

    Branch.prototype.growthVector = function() {
      return Vec.polar(this.status.rate, this.angle);
    };

    Branch.prototype.doFork = function() {
      var left, newRoot, right;
      newRoot = new Vec(this.tip);
      left = new Branch(newRoot, this.angle + this.status.branchAngle);
      right = new Branch(newRoot, this.angle - this.status.branchAngle);
      this.branches = [left, right];
      return this.status.isGrowing = false;
    };

    Branch.prototype.doKnot = function() {
      this.knots.push(new Vec(this.tip));
      return this.angle += (Math.random() - 0.5) * Config.knotAngleJitter;
    };

    Branch.prototype.update = function() {
      var branch, _i, _len, _ref, _results;
      if (this.status.isGrowing) {
        this.status.distanceTravelled += this.status.rate;
        this.tip.add(this.growthVector());
        if (this.status.distanceTravelled > this.status.branchDistance) {
          return this.doFork();
        } else if (this.status.distanceTravelled > this.status.knotDistance) {
          return this.doKnot();
        }
      } else {
        _ref = this.branches;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          branch = _ref[_i];
          _results.push(branch.update());
        }
        return _results;
      }
    };

    Branch.prototype.render = function() {
      var branch, _i, _len, _ref, _results;
      GFX.drawLineString(this.knots, this.tip);
      if (this.status.isGrowing) {
        return game.sprites.star.draw(this.tip);
      } else {
        _ref = this.branches;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          branch = _ref[_i];
          _results.push(branch.render());
        }
        return _results;
      }
    };

    return Branch;

  })(Thing);

  GraphicsHelper = (function() {
    function GraphicsHelper(ctx) {
      this.ctx = ctx;
    }

    GraphicsHelper.prototype.drawLineString = function() {
      var more, points, vec, _i, _j, _len, _len1, _ref;
      points = arguments[0], more = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      this.ctx.beginPath();
      this.ctx.moveTo(points[0].x, points[0].y);
      _ref = points.slice(1);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        vec = _ref[_i];
        this.ctx.lineTo(vec.x, vec.y);
      }
      for (_j = 0, _len1 = more.length; _j < _len1; _j++) {
        vec = more[_j];
        this.ctx.lineTo(vec.x, vec.y);
      }
      return this.ctx.stroke();
    };

    GraphicsHelper.prototype.drawImage = function(im, pos, offset) {
      var _this = this;
      if (offset == null) {
        offset = {
          x: 0,
          y: 0
        };
      }
      return withImage(im, function(im) {
        return _this.ctx.drawImage(im, pos.x - offset.x, pos.y - offset.y);
      });
    };

    return GraphicsHelper;

  })();

  Viewport = (function() {
    function Viewport(canvas, _arg) {
      var h, w, _ref;
      this.canvas = canvas;
      this.anchor = _arg.anchor, this.scroll = _arg.scroll;
      this.ctx = this.canvas.getContext('2d');
      _ref = [this.canvas.width, this.canvas.height], w = _ref[0], h = _ref[1];
      this.offset = [w / 2, h / 2];
    }

    Viewport.prototype._setTransform = function() {
      var h, ox, oy, w, _ref, _ref1;
      _ref = [this.canvas.width, this.canvas.height], w = _ref[0], h = _ref[1];
      this.offset = [w / 2, h / 2];
      if (__indexOf.call(this.anchor, 'top') >= 0) {
        this.offset[1] = this.anchor.top;
      }
      if (__indexOf.call(this.anchor, 'right') >= 0) {
        this.offset[0] = w - this.anchor.right;
      }
      if (__indexOf.call(this.anchor, 'bottom') >= 0) {
        this.offset[1] = h - this.anchor.bottom;
      }
      if (__indexOf.call(this.anchor, 'left') >= 0) {
        this.offset[0] = this.anchor.left;
      }
      _ref1 = this.offset, ox = _ref1[0], oy = _ref1[1];
      return this.ctx.setTransform(1, 0, 0, 1, ox + this.scroll.x, oy + this.scroll.y);
    };

    Viewport.prototype.clearScreen = function(color) {
      var h, ox, oy, w, _ref, _ref1;
      _ref = [this.canvas.width, this.canvas.height], w = _ref[0], h = _ref[1];
      _ref1 = this.offset, ox = _ref1[0], oy = _ref1[1];
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.fillStyle = color;
      this.ctx.fillRect(0, 0, w, h);
      return this.ctx.restore();
    };

    Viewport.prototype.centerOn = function(point) {
      var h, w, _ref;
      return _ref = [this.canvas.width, this.canvas.height], w = _ref[0], h = _ref[1], _ref;
    };

    Viewport.prototype.update = function() {
      return this._setTransform();
    };

    return Viewport;

  })();

  Starstalk = (function() {
    Starstalk.prototype.things = [];

    Starstalk.prototype.loopInterval = null;

    Starstalk.prototype.config = {
      fps: 30
    };

    function Starstalk(_arg) {
      this.$canvas = _arg.$canvas;
      this.canvas = this.$canvas.get(0);
      this.ctx = this.canvas.getContext('2d');
      this.GFX = new GraphicsHelper(this.ctx);
      this.status = {
        paused: false
      };
      this.sprites = {
        star: new Sprite(Config.starImage, new Vec(15, 16))
      };
      this.view = new Viewport(this.canvas, {
        scroll: new Vec(0, 0),
        anchor: {
          bottom: 20
        }
      });
    }

    Starstalk.prototype.width = function() {
      return this.canvas.width;
    };

    Starstalk.prototype.height = function() {
      return this.canvas.height;
    };

    Starstalk.prototype.start = function() {
      this.bindEvents();
      $(window).trigger('resize');
      this.view.clearScreen('#b5e0e2');
      this.things.push(new Branch(new Vec(100, 100), -Math.PI / 2));
      return this.doLoop();
    };

    Starstalk.prototype.doLoop = function() {
      var _this = this;
      return this.loopInterval = setInterval(function() {
        var thing, _i, _len, _ref, _results;
        _this.view.clearScreen();
        _this.view.update();
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
      }, parseInt(1000 / this.config.fps));
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
        _this.$canvas.attr({
          width: $body.width(),
          height: $body.height()
        });
        return _this.view.clearScreen('pink');
      });
      return $(document).on('keypress', function(e) {
        console.debug('key', e.charCode);
        switch (e.charCode) {
          case 32:
            return _this.togglePause();
          case 115:
            return _this.scroll.x -= 3;
          case 119:
            return _this.scroll.x += 3;
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
    GFX = game.GFX;
    return game.start();
  });

}).call(this);
