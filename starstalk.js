(function() {
  var Atmosphere, Balloon, Branch, Cloud, Collidable, Config, Cookie, GFX, GraphicsHelper, NotImplemented, Obstacle, Satellite, Sprite, Star, Starstalk, Thing, Vec, Viewport, atmoscale, balloonAABBDim, balloonAABBOffset, balloonSpriteOffset, balloonTopDim, clampAngleSigned, game, lerp, makeImage, newGame, quadtree, withImage, withImages, world,
    __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  lerp = function(a, b, t) {
    return a * (1 - t) + b * t;
  };

  clampAngleSigned = function(a) {
    while (a <= Math.PI) {
      a += 2 * Math.PI;
    }
    while (a >= Math.PI) {
      a -= 2 * Math.PI;
    }
    return a;
  };

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

  atmoscale = 1;

  Atmosphere = {
    tropopause: 12000 * atmoscale,
    stratopause: 40000 * atmoscale,
    mesopause: 75000 * atmoscale,
    exopause: 100000 * atmoscale
  };

  Config = {
    growthRate: 15,
    starThrustRate: 18,
    autoFork: true,
    debugDraw: false,
    branchAngle: Math.PI / 3,
    branchAngleUpwardWeight: 0.1,
    branchDistanceMin: 1500,
    branchDistanceMax: 3000,
    branchFibers: 3,
    branchWidth: 10,
    autokillDistanceRatio: 1.5,
    autokillOffscreenX: 600,
    knotDistance: 100,
    knotDistanceWhileThrusting: 50,
    knotAngleJitter: Math.PI / 24,
    probability: {
      cloud: function(height) {
        if (height < Atmosphere.tropopause) {
          return 0.5;
        } else if (height < Atmosphere.stratopause) {
          return 1.25;
        } else if (height < Atmosphere.mesopause) {
          return 0.33;
        } else {
          return 0;
        }
      },
      balloon: function(height) {
        if (height < Atmosphere.stratopause) {
          return 0.55;
        } else {
          return 0;
        }
      },
      satellite: function(height) {
        if (height > Atmosphere.stratopause) {
          return 0.75;
        } else {
          return 0;
        }
      },
      cookie: function(height) {
        var base;
        base = 0.2;
        if (height > Atmosphere.stratopause) {
          return base;
        } else if (height > Atmosphere.mesopause) {
          return base + (height - Atmosphere.mesopause) / Atmosphere.mesopause;
        } else {
          return 0.05;
        }
      }
    },
    starSafetyDistance: 128,
    starNovaRadius: 32,
    starNovaTime: 1,
    starImage: makeImage('img/star-32.png'),
    cloudImage: makeImage('img/cloud-4-a.png'),
    balloonImage: makeImage('img/balloon.png'),
    satelliteImage: makeImage('img/satellite.png'),
    cookieImage: makeImage('img/cookie.png'),
    starOffset: {
      x: 16,
      y: 16
    },
    atmosphere: {
      layers: [[atmoscale * 0, tinycolor('#b5e0e2'), 1], [atmoscale * 5000, tinycolor('#b5e0e2'), 1], [Atmosphere.tropopause, tinycolor('#97b2c6'), 0.95], [Atmosphere.stratopause, tinycolor('#778b9b'), 0.9], [Atmosphere.mesopause, tinycolor('#37475b'), 0.7], [Atmosphere.exopause, tinycolor('#0f1419'), 0.0]]
    }
  };

  NotImplemented = {};

  Vec = (function() {
    Vec.zero = {
      x: 0,
      y: 0
    };

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
      this.y += v.y;
      return this;
    };

    Vec.prototype.sub = function(v) {
      this.x -= v.x;
      this.y -= v.y;
      return this;
    };

    Vec.prototype.lengthSquared = function() {
      return this.x * this.x + this.y * this.y;
    };

    Vec.prototype.length = function() {
      return Math.sqrt(this.lengthSquared());
    };

    Vec.prototype.angle = function() {
      return clampAngleSigned(Math.atan2(this.y, this.x));
    };

    return Vec;

  })();

  Sprite = (function() {
    function Sprite(im, offset) {
      var _this = this;
      this.im = im;
      this.offset = offset;
      if (this.offset == null) {
        console.warn('no offset set', this);
        withImage(this.im, function(im) {
          return _this.offset = {
            x: _this.im.width / 2,
            y: _this.im.height / 2
          };
        });
      }
    }

    Sprite.prototype.draw = function(pos, angle) {
      var _this = this;
      if (pos == null) {
        pos = Vec.zero;
      }
      return withImage(this.im, function(im) {
        game.ctx.save();
        game.ctx.translate(pos.x + 0 * _this.offset.x, pos.y + 0 * _this.offset.y);
        game.ctx.rotate(angle);
        game.ctx.drawImage(im, -_this.offset.x, -_this.offset.y);
        return game.ctx.restore();
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

  GraphicsHelper = (function() {
    function GraphicsHelper(ctx) {
      this.ctx = ctx;
    }

    GraphicsHelper.prototype.drawLineString = function() {
      var more, points, vec, _i, _j, _len, _len1, _ref, _results;
      points = arguments[0], more = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      this.ctx.moveTo(points[0].x, points[0].y);
      _ref = points.slice(1);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        vec = _ref[_i];
        this.ctx.lineTo(vec.x, vec.y);
      }
      _results = [];
      for (_j = 0, _len1 = more.length; _j < _len1; _j++) {
        vec = more[_j];
        _results.push(this.ctx.lineTo(vec.x, vec.y));
      }
      return _results;
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
      this.anchor = _arg.anchor, this.scroll = _arg.scroll, this.scale = _arg.scale;
      if (this.scale == null) {
        this.scale = 1;
      }
      this.ctx = this.canvas.getContext('2d');
      _ref = [this.canvas.width, this.canvas.height], w = _ref[0], h = _ref[1];
      this.offset = [w / 2, h / 2];
    }

    Viewport.prototype.resetTransform = function() {
      var h, ox, oy, w, _ref, _ref1;
      _ref = [this.canvas.width, this.canvas.height], w = _ref[0], h = _ref[1];
      this.offset = [w / 2, h / 2];
      if (this.anchor.top != null) {
        this.offset[1] = this.anchor.top;
      }
      if (this.anchor.right != null) {
        this.offset[0] = w - this.anchor.right;
      }
      if (this.anchor.bottom != null) {
        this.offset[1] = h - this.anchor.bottom;
      }
      if (this.anchor.left != null) {
        this.offset[0] = this.anchor.left;
      }
      _ref1 = this.offset, ox = _ref1[0], oy = _ref1[1];
      return this.ctx.setTransform(this.scale, 0, 0, this.scale, ox + this.scroll.x + 0.5, oy + this.scroll.y + 0.5);
    };

    Viewport.prototype.clearScreen = function(color) {
      var h, ox, oy, w, _ref, _ref1;
      _ref = [this.canvas.width, this.canvas.height], w = _ref[0], h = _ref[1];
      _ref1 = this.offset, ox = _ref1[0], oy = _ref1[1];
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.fillStyle = color;
      this.ctx.clearRect(0, 0, w, h);
      this.ctx.fillRect(0, 0, w, h);
      return this.ctx.restore();
    };

    Viewport.prototype.dimensions = function() {
      return [this.canvas.width, this.canvas.height];
    };

    Viewport.prototype.worldDimensions = function() {
      return [this.canvas.width, this.canvas.height];
    };

    Viewport.prototype.worldBounds = function() {
      var h, ox, oy, w, _ref, _ref1;
      _ref = this.worldDimensions(), w = _ref[0], h = _ref[1];
      _ref1 = this.offset, ox = _ref1[0], oy = _ref1[1];
      return {
        left: -(ox + this.scroll.x + 0.5),
        top: -(oy + this.scroll.y + 0.5),
        width: w,
        height: h
      };
    };

    Viewport.prototype.screen2world = function(screen) {
      var ox, oy, _ref;
      _ref = this.offset, ox = _ref[0], oy = _ref[1];
      return new Vec(screen.x - (ox + this.scroll.x + 0.5), screen.y - (oy + this.scroll.y + 0.5));
    };

    Viewport.prototype.centerOn = function(point) {
      var h, w, _ref;
      return _ref = [this.canvas.width, this.canvas.height], w = _ref[0], h = _ref[1], _ref;
    };

    Viewport.prototype.update = function() {
      return this.resetTransform();
    };

    return Viewport;

  })();

  game = null;

  world = null;

  GFX = null;

  quadtree = Quadtree.create(1000, 100000);

  quadtree.reset();

  Collidable = (function(_super) {
    __extends(Collidable, _super);

    Collidable.prototype.position = null;

    function Collidable() {
      var h, w, _ref;
      this.angle = 0;
      _ref = this.dimensions, w = _ref[0], h = _ref[1];
      this.box = {
        left: this.position.x - this.offset.x,
        top: this.position.y - this.offset.y,
        width: w,
        height: h,
        object: this
      };
    }

    Collidable.prototype.update = function() {
      this.box.left = this.position.x - this.offset.x;
      this.box.top = this.position.y - this.offset.y;
      if (this.isActiveCollider) {
        return quadtree.insert(this.box);
      }
    };

    Collidable.prototype.withTransform = function(fn) {
      game.ctx.save();
      game.ctx.translate(this.position.x, this.position.y);
      game.ctx.rotate(this.angle);
      fn();
      return game.ctx.restore();
    };

    return Collidable;

  })(Thing);

  Obstacle = (function(_super) {
    __extends(Obstacle, _super);

    Obstacle.prototype.isActiveCollider = true;

    function Obstacle(position, velocity) {
      this.position = position;
      this.velocity = velocity;
      this.angle = 0;
      Obstacle.__super__.constructor.call(this);
    }

    Obstacle.prototype.update = function() {
      this.position.add(this.velocity);
      return Obstacle.__super__.update.call(this);
    };

    return Obstacle;

  })(Collidable);

  Cookie = (function(_super) {
    __extends(Cookie, _super);

    Cookie.prototype.dimensions = [140, 140];

    Cookie.prototype.offset = {
      x: 70,
      y: 70
    };

    function Cookie(pos, vel) {
      Cookie.__super__.constructor.call(this, pos, vel);
      this.angVel = Math.random() * 0.05;
    }

    Cookie.prototype.update = function() {
      this.angle += this.angVel;
      return Cookie.__super__.update.call(this);
    };

    Cookie.prototype.render = function() {
      return game.sprites.cookie.draw(this.position, this.angle);
    };

    return Cookie;

  })(Obstacle);

  Satellite = (function(_super) {
    __extends(Satellite, _super);

    Satellite.prototype.dimensions = [80, 80];

    Satellite.prototype.offset = {
      x: 40,
      y: 40
    };

    function Satellite(pos, vel) {
      Satellite.__super__.constructor.call(this, pos, vel);
      this.angVel = Math.random() * 0.05;
    }

    Satellite.prototype.update = function() {
      this.angle += this.angVel;
      return Satellite.__super__.update.call(this);
    };

    Satellite.prototype.render = function() {
      return game.sprites.satellite.draw(this.position, this.angle);
    };

    return Satellite;

  })(Obstacle);

  balloonTopDim = {
    x: 90,
    y: 126
  };

  balloonAABBDim = {
    x: 75,
    y: 75
  };

  balloonSpriteOffset = {
    x: 44,
    y: 62
  };

  balloonAABBOffset = {
    x: balloonSpriteOffset.x - (balloonTopDim.x - balloonAABBDim.x) / 2,
    y: balloonSpriteOffset.y - (balloonTopDim.y - balloonAABBDim.y) / 2
  };

  Balloon = (function(_super) {
    __extends(Balloon, _super);

    Balloon.prototype.dimensions = [balloonAABBDim.x, balloonAABBDim.y];

    Balloon.prototype.offset = balloonAABBOffset;

    Balloon.prototype.angAccel = 0.003;

    function Balloon(pos, vel) {
      Balloon.__super__.constructor.call(this, pos, vel);
      this.angle = Math.random() * Math.PI / 4;
      this.angVel = Math.random() * 0.05;
    }

    Balloon.prototype.update = function() {
      Balloon.__super__.update.call(this);
      if (this.angle < 0) {
        this.angVel += this.angAccel;
      } else {
        this.angVel -= this.angAccel;
      }
      return this.angle += this.angVel;
    };

    Balloon.prototype.render = function() {
      return game.sprites.balloon.draw(this.position, this.angle);
    };

    return Balloon;

  })(Obstacle);

  Cloud = (function(_super) {
    __extends(Cloud, _super);

    Cloud.prototype.isActiveCollider = false;

    Cloud.prototype.dimensions = [128, 96];

    Cloud.prototype.offset = {
      x: 128 / 2,
      y: 96 / 2
    };

    function Cloud(position, velocity) {
      this.position = position;
      this.velocity = velocity;
      Cloud.__super__.constructor.call(this);
    }

    Cloud.prototype.update = function() {
      this.position.add(this.velocity);
      return Cloud.__super__.update.call(this);
    };

    Cloud.prototype.render = function() {
      return game.sprites.cloud.draw(this.position);
    };

    return Cloud;

  })(Collidable);

  Star = (function(_super) {
    __extends(Star, _super);

    Star.all = [];

    Star.prototype.id = null;

    Star.prototype.radius = 16;

    Star.prototype.radius2 = 8;

    Star.prototype.dimensions = [32, 32];

    Star.prototype.offset = Config.starOffset;

    Star.prototype.attraction = null;

    Star.prototype.isActiveCollider = true;

    function Star(position, branch) {
      var i, inc;
      this.position = position;
      this.branch = branch;
      Star.__super__.constructor.call(this);
      this.hasFocus = false;
      this.angle = 0;
      inc = Math.PI * 2 / 10;
      this.vertices = (function() {
        var _i, _results;
        _results = [];
        for (i = _i = 0; _i <= 10; i = ++_i) {
          _results.push(Vec.polar((i % 2 === 0 ? this.radius : this.radius2), i * inc));
        }
        return _results;
      }).call(this);
      Star.all.push(this);
      this.id = Star.all.length;
    }

    Star.prototype.setAttraction = function(vec) {
      return this.attraction = vec;
    };

    Star.prototype.withTransform = function(fn) {
      game.ctx.save();
      game.ctx.translate(this.position.x, this.position.y);
      game.ctx.rotate(this.angle);
      fn();
      return game.ctx.restore();
    };

    Star.prototype.update = function() {
      return Star.__super__.update.call(this);
    };

    Star.prototype.isSafe = function() {
      return this.branch.status.distanceTravelled < Config.starSafetyDistance;
    };

    Star.prototype.setBranch = function(branch) {
      this.branch.star = null;
      this.branch = branch;
      this.position = this.branch.tip;
      return this.branch.star = this;
    };

    Star.prototype.render = function() {
      var _this = this;
      return this.withTransform(function() {
        game.ctx.beginPath();
        GFX.drawLineString(_this.vertices);
        if (_this.isSafe()) {
          game.ctx.fillStyle = 'black';
        } else {
          game.ctx.fillStyle = 'white';
        }
        game.ctx.strokeStyle = game.tailColor();
        game.ctx.lineWidth = 2;
        game.ctx.fill();
        return game.ctx.stroke();
      });
    };

    return Star;

  })(Collidable);

  Branch = (function(_super) {
    __extends(Branch, _super);

    Branch.all = [];

    Branch.growing = function() {
      var _this = this;
      return this.all.filter(function(b) {
        return b.status.isGrowing;
      });
    };

    Branch.prototype.id = null;

    Branch.prototype.tip = null;

    function Branch(parent, angle, _arg) {
      var keepStar;
      this.parent = parent;
      this.angle = angle;
      keepStar = (_arg != null ? _arg : {}).keepStar;
      if (this.parent instanceof Branch) {
        this.root = new Vec(this.parent.tip);
      } else {
        this.root = new Vec(this.parent);
        this.parent = null;
      }
      this.knots = [];
      this.branches = [];
      this.tip = new Vec(this.root);
      this.knots.push(this.root);
      Branch.all.push(this);
      this.id = Branch.all.length;
      this.status = {
        rate: Config.growthRate,
        branchAngle: Config.branchAngle,
        branchDistance: Config.branchDistanceMax,
        knotDistance: Config.knotDistance,
        deadTime: 0,
        isGrowing: true,
        distanceTravelled: 0,
        distanceTravelledKnot: 0
      };
      if (keepStar) {
        this.star = this.parent.star;
        this.star.setBranch(this);
      } else {
        this.star = new Star(this.tip, this);
      }
    }

    Branch.prototype.collectStars = function() {
      var branch, star, stars, _i, _j, _len, _len1, _ref, _ref1;
      stars = [];
      if (this.star != null) {
        stars.push(this.star);
      }
      _ref = this.branches;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        branch = _ref[_i];
        _ref1 = branch.collectStars();
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          star = _ref1[_j];
          stars.push(star);
        }
      }
      return stars;
    };

    Branch.prototype.growthVector = function() {
      var velocity;
      velocity = Vec.polar(this.status.rate, this.angle);
      return velocity;
    };

    Branch.prototype.doFork = function() {
      var left, right;
      left = new Branch(this, this.angle + this.status.branchAngle, {
        keepStar: false
      });
      right = new Branch(this, this.angle - this.status.branchAngle, {
        keepStar: true
      });
      this.branches = [left, right];
      this.status.isGrowing = false;
      return this.status.markForNoGrow = true;
    };

    Branch.prototype.doKnot = function() {
      this.knots.push(new Vec(this.tip));
      return this.angle += (Math.random() - 0.5) * Config.knotAngleJitter;
    };

    Branch.prototype.doStop = function() {
      this.status.isGrowing = false;
      this.status.isDead = true;
      game.stars = _.without(game.stars, this.star);
      delete this.star;
      if (game.stars.length === 0) {
        return game.showGameOver();
      }
    };

    Branch.prototype.handleInput = function(e) {};

    Branch.prototype.update = function() {
      var a, branch, da, diff, growth, _i, _len, _ref, _results;
      if (this.status.isGrowing) {
        if (this.star.attraction != null) {
          this.status.knotDistance = Config.knotDistanceWhileThrusting;
          diff = new Vec(this.star.attraction);
          diff.sub(this.star.position);
          a = clampAngleSigned(this.angle);
          da = clampAngleSigned(diff.angle() - a);
          this.angle = lerp(0, da, 0.1) + a;
          this.status.rate = Config.starThrustRate;
        } else {
          this.status.knotDistance = Config.knotDistance;
          this.status.rate = Config.growthRate;
        }
        growth = this.growthVector();
        this.status.distanceTravelled += this.status.rate;
        this.status.distanceTravelledKnot += this.status.rate;
        this.tip.add(growth);
        this.star.angle = growth.angle();
        if (Config.autoFork && this.status.distanceTravelled > this.status.branchDistance) {
          this.doFork();
        } else if (this.status.distanceTravelledKnot > this.status.knotDistance) {
          this.doKnot();
          this.status.distanceTravelledKnot = 0;
        }
        if (this.status.markForNoGrow) {
          this.status.markForNoGrow = false;
          return this.star = null;
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
      var branch, i, _i, _j, _len, _ref, _ref1, _results;
      game.ctx.save();
      game.ctx.beginPath();
      game.ctx.translate(-Config.branchWidth * 3 / 4, 0);
      for (i = _i = 1, _ref = Config.branchFibers; 1 <= _ref ? _i <= _ref : _i >= _ref; i = 1 <= _ref ? ++_i : --_i) {
        game.ctx.lineWidth = Config.branchWidth;
        game.ctx.translate(Config.branchWidth / Config.branchFibers, 0);
        game.ctx.beginPath();
        GFX.drawLineString(this.knots, this.tip);
        game.ctx.strokeStyle = game.tailColor();
        game.ctx.fillStyle = game.tailColor();
        game.ctx.stroke();
      }
      game.ctx.restore();
      if (this.status.isGrowing) {

      } else if (this.status.isDead) {
        game.ctx.beginPath();
        game.ctx.fillStyle = game.tailColor();
        game.ctx.arc(this.tip.x, this.tip.y, Config.starNovaRadius, 0, Math.PI * 2, true);
        return game.ctx.fill();
      } else {
        _ref1 = this.branches;
        _results = [];
        for (_j = 0, _len = _ref1.length; _j < _len; _j++) {
          branch = _ref1[_j];
          _results.push(branch.render());
        }
        return _results;
      }
    };

    return Branch;

  })(Thing);

  Starstalk = (function() {
    Starstalk.prototype.things = [];

    Starstalk.prototype.clouds = [];

    Starstalk.prototype.loopInterval = null;

    Starstalk.prototype.config = {
      fps: 30
    };

    function Starstalk(_arg) {
      var numRainbowColors, p;
      this.$canvas = _arg.$canvas;
      this.mouse = new Vec(0, 0);
      this.canvas = this.$canvas.get(0);
      this.ctx = this.canvas.getContext('2d');
      this.ctx.webkitImageSmoothingEnabled = this.ctx.imageSmoothingEnabled = this.ctx.mozImageSmoothingEnabled = this.ctx.oImageSmoothingEnabled = false;
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.GFX = new GraphicsHelper(this.ctx);
      this.obstacles = [];
      numRainbowColors = 256;
      this.rainbowColors = (function() {
        var _i, _results;
        _results = [];
        for (p = _i = 0; 0 <= numRainbowColors ? _i <= numRainbowColors : _i >= numRainbowColors; p = 0 <= numRainbowColors ? ++_i : --_i) {
          _results.push(tinycolor("hsv(" + (p * 100 / numRainbowColors) + "%, 50%, 100%)").toRgbString());
        }
        return _results;
      })();
      this.status = {
        paused: false,
        tailColorIndex: 0,
        heightAchieved: 0
      };
      this.sprites = {
        star: new Sprite(Config.starImage, Config.starOffset),
        cloud: new Sprite(Config.cloudImage),
        balloon: new Sprite(Config.balloonImage, balloonSpriteOffset),
        satellite: new Sprite(Config.satelliteImage),
        cookie: new Sprite(Config.cookieImage)
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

    Starstalk.prototype.skyColor = function(height) {
      var alpha, alphaHi, alphaLo, b, colorHi, colorLo, g, heightHi, heightLo, hi, layer, layerHi, layerLo, layers, lo, r, t, _i, _len, _ref;
      layers = Config.atmosphere.layers;
      layerLo = layers[0];
      for (_i = 0, _len = layers.length; _i < _len; _i++) {
        layer = layers[_i];
        layerHi = layer;
        if (layerHi[0] > height) {
          break;
        }
        layerLo = layer;
      }
      heightLo = layerLo[0], colorLo = layerLo[1], alphaLo = layerLo[2];
      heightHi = layerHi[0], colorHi = layerHi[1], alphaHi = layerHi[2];
      t = (height - heightLo) / (heightHi - heightLo);
      lo = colorLo.toRgb();
      hi = colorHi.toRgb();
      alpha = lerp(alphaLo, alphaHi, t);
      _ref = tinycolor({
        r: lerp(lo.r, hi.r, t),
        g: lerp(lo.g, hi.g, t),
        b: lerp(lo.b, hi.b, t)
      }).toRgb(), r = _ref.r, g = _ref.g, b = _ref.b;
      return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
    };

    Starstalk.prototype.start = function() {
      this.bindEvents();
      this.startTasks();
      $(window).trigger('resize');
      this.stalk = new Branch(new Vec(0, 0), -Math.PI / 2);
      return this.doLoop();
    };

    Starstalk.prototype.doLoop = function() {
      var _this = this;
      return this.loopInterval = setInterval(function() {
        var cloud, color, font, height, line, lines, obstacle, star, text, thing, things, width, x, y, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1, _ref2;
        if (_this.status.gameOver) {
          _this.view.clearScreen(_this.tailColor());
          _this.ctx.strokeStyle = '#333';
          _this.ctx.fillStyle = '#333';
          _this.ctx.lineWidth = 2;
          _this.ctx.save();
          _this.ctx.setTransform(1, 0, 0, 1, 0, 0);
          lines = [
            {
              text: "YOU ASCENDED",
              font: "60px Arial",
              height: 60
            }, {
              text: "" + (parseInt(_this.status.heightAchieved)) + " meters",
              font: "80px Arial",
              height: 80
            }, {
              text: "click to begin anew",
              font: "60px Arial",
              height: 80,
              color: 'white'
            }
          ];
          y = 100;
          for (_i = 0, _len = lines.length; _i < _len; _i++) {
            line = lines[_i];
            text = line.text, font = line.font, height = line.height, color = line.color;
            if (color != null) {
              _this.ctx.strokeStyle = color;
              _this.ctx.fillStyle = color;
            }
            _this.ctx.font = font;
            width = _this.ctx.measureText(text).width;
            x = _this.canvas.width / 2 - width / 2;
            y += height * 1.5;
            _this.ctx.fillText(text, x, y);
            _this.ctx.strokeText(text, x, y);
          }
          _this.ctx.restore();
        } else {
          color = _this.skyColor(_this.status.heightAchieved);
          _this.view.clearScreen(color);
          quadtree.reset();
          _this.update();
          _this.handleObstacles();
          _this.applyInput();
          things = [_this.stalk];
          _ref = _this.stars;
          for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
            star = _ref[_j];
            things.push(star);
          }
          _ref1 = _this.clouds;
          for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
            cloud = _ref1[_k];
            things.push(cloud);
          }
          _ref2 = _this.obstacles;
          for (_l = 0, _len3 = _ref2.length; _l < _len3; _l++) {
            obstacle = _ref2[_l];
            things.push(obstacle);
          }
          if (!_this.status.paused) {
            for (_m = 0, _len4 = things.length; _m < _len4; _m++) {
              thing = things[_m];
              thing.update();
              thing.render();
            }
          }
          _this.handleCollision();
          _this.render();
        }
        _this.status.tailColorIndex += 1;
        return _this.status.tailColorIndex %= _this.rainbowColors.length;
      }, parseInt(1000 / this.config.fps));
    };

    Starstalk.prototype.render = function() {
      var box, _i, _len, _ref, _results;
      this.ctx.font = "60px Arial";
      this.ctx.strokeStyle = '#333';
      this.ctx.fillStyle = '#eee';
      this.ctx.lineWidth = 2;
      this.ctx.save();
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.fillText(parseInt(this.status.heightAchieved) + 'm', 50, 100);
      this.ctx.strokeText(parseInt(this.status.heightAchieved) + 'm', 50, 100);
      this.ctx.restore();
      if (Config.debugDraw) {
        _ref = quadtree.getObjects();
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          box = _ref[_i];
          this.ctx.beginPath();
          this.ctx.rect(box.left, box.top, box.width, box.height);
          this.ctx.strokeStyle = 'red';
          _results.push(this.ctx.stroke());
        }
        return _results;
      }
    };

    Starstalk.prototype.applyInput = function() {
      var star, _i, _len, _ref, _results;
      _ref = this.stars;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        star = _ref[_i];
        if (game.mouseDown) {
          _results.push(star.setAttraction(game.view.screen2world(game.mouse)));
        } else {
          _results.push(star.setAttraction(null));
        }
      }
      return _results;
    };

    Starstalk.prototype.handleCollision = function() {
      var allDeadStars, bounds, collidable, deadStars, dist, hit, hits, o, obj, pos, safeStarIDs, star, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _len6, _m, _n, _o, _ref, _ref1, _ref2, _ref3, _results,
        _this = this;
      bounds = this.view.worldBounds();
      collidable = [];
      _ref = this.stars;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        star = _ref[_i];
        collidable.push(star);
      }
      _ref1 = this.obstacles;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        o = _ref1[_j];
        collidable.push(o);
      }
      allDeadStars = [];
      safeStarIDs = [];
      for (_k = 0, _len2 = collidable.length; _k < _len2; _k++) {
        obj = collidable[_k];
        hits = _.uniq(quadtree.getObjects(obj.box.left, obj.box.top, obj.box.width, obj.box.height), function(hit) {
          return hit.object.constructor.name + hit.object.id;
        });
        if (hits.length > 1) {
          deadStars = [];
          for (_l = 0, _len3 = hits.length; _l < _len3; _l++) {
            hit = hits[_l];
            if (hit.object instanceof Star) {
              deadStars.push(hit.object);
            }
          }
          if (__indexOf.call(allDeadStars, star) < 0) {
            for (_m = 0, _len4 = deadStars.length; _m < _len4; _m++) {
              star = deadStars[_m];
              allDeadStars.push(star);
            }
          }
        }
      }
      for (_n = 0, _len5 = allDeadStars.length; _n < _len5; _n++) {
        star = allDeadStars[_n];
        if (!(_ref2 = star.id, __indexOf.call(safeStarIDs, _ref2) >= 0) && !star.isSafe()) {
          star.branch.doStop();
        }
      }
      _ref3 = this.stars;
      _results = [];
      for (_o = 0, _len6 = _ref3.length; _o < _len6; _o++) {
        star = _ref3[_o];
        pos = new Vec(star.position);
        dist = pos.sub(this.status.highestStar.position).length();
        if (dist > this.maxAbsoluteDistanceBeforeDeath()) {
          console.log('death by distance', dist);
          _results.push(star.branch.doStop());
        } else if (star.position.x < bounds.left - Config.autokillOffscreenX || star.position.x > bounds.left + bounds.width + Config.autokillOffscreenX) {
          console.log('death by X');
          _results.push(star.branch.doStop());
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Starstalk.prototype.maxAbsoluteDistanceBeforeDeath = function() {
      return Config.autokillDistanceRatio * Math.max(this.canvas.width, this.canvas.height);
    };

    Starstalk.prototype.handleObstacles = function() {
      var cloud, height, i, obstacle, pos, position, velocity, _i, _j, _len, _len1, _ref, _ref1, _results;
      height = this.status.heightAchieved;
      pos = this.status.highestStar.position;
      position = new Vec(pos);
      position.y -= game.height();
      position.x += Math.random() * game.width() - game.width() * 2 / 3;
      if (Math.random() < Config.probability.cloud(height) / this.config.fps) {
        velocity = new Vec(Math.random() * 3, 0);
        this.clouds.push(new Cloud(position, velocity));
      } else if (Math.random() < Config.probability.balloon(height) / this.config.fps) {
        velocity = new Vec(Math.random() * 2, 0);
        this.obstacles.push(new Balloon(position, velocity));
      } else if (Math.random() < Config.probability.satellite(height) / this.config.fps) {
        velocity = new Vec(Math.random() * 4, 0);
        this.obstacles.push(new Satellite(position, velocity));
      } else if (Math.random() < Config.probability.cookie(height) / this.config.fps) {
        velocity = new Vec(Math.random() * 4, 0);
        this.obstacles.push(new Cookie(position, velocity));
      }
      _ref = this.clouds;
      for (cloud = _i = 0, _len = _ref.length; _i < _len; cloud = ++_i) {
        i = _ref[cloud];
        if (cloud.x > this.width()) {
          this.clouds.splice(i, 1);
        }
      }
      _ref1 = this.obstacles;
      _results = [];
      for (obstacle = _j = 0, _len1 = _ref1.length; _j < _len1; obstacle = ++_j) {
        i = _ref1[obstacle];
        if (obstacle.x > this.width()) {
          _results.push(this.obstacles.splice(i, 1));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Starstalk.prototype.update = function() {
      var h, highestStar, newHeight, newScrollY, stars, w, _ref;
      _ref = this.view.dimensions(), w = _ref[0], h = _ref[1];
      stars = this.stalk.collectStars();
      this.stars = stars;
      highestStar = _.min(stars, function(s) {
        return s.position.y;
      });
      newHeight = -highestStar.position.y;
      if (newHeight > this.status.heightAchieved) {
        this.status.heightAchieved = newHeight;
      }
      this.status.highestStar = highestStar;
      newScrollY = -h / 2 - highestStar.position.y;
      if (newScrollY > this.view.scroll.y) {
        this.view.scroll.y = Math.max(0, newScrollY);
      }
      this.view.update();
      return $('body').css({
        'background-position': "0 " + (this.status.heightAchieved / 10) + "px"
      });
    };

    Starstalk.prototype.togglePause = function() {
      this.status.paused = !this.status.paused;
      if (this.status.paused) {
        return clearInterval(this.loopInterval);
      } else {
        return this.doLoop();
      }
    };

    Starstalk.prototype.tailColor = function() {
      return this.rainbowColors[this.status.tailColorIndex];
    };

    Starstalk.prototype.bindEvents = function() {
      var _this = this;
      $(window).on('resize', function(e) {
        var $body;
        $body = $('body');
        return _this.$canvas.attr({
          width: $body.width(),
          height: $body.height()
        });
      });
      $(document).on('keypress', function(e) {
        switch (e.charCode) {
          case 32:
            return _this.togglePause();
          case 70 | 102:
            _this.canvas.webkitRequestFullScreen();
            return _this.canvas.mozRequestFullScreen();
        }
      });
      $(this.canvas).on('mousemove', function(e) {
        _this.mouse.x = e.offsetX;
        return _this.mouse.y = e.offsetY;
      });
      $(this.canvas).on('mousedown', function(e) {
        var branch, _i, _len, _ref, _results;
        if (e.which === 1) {
          return _this.mouseDown = true;
        } else if (e.which === 3) {
          _ref = Branch.growing();
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            branch = _ref[_i];
            if (branch.status.distanceTravelled > Config.branchDistanceMin) {
              _results.push(branch.doFork());
            } else {
              _results.push(void 0);
            }
          }
          return _results;
        }
      });
      $(this.canvas).on('mouseup', function(e) {
        if (e.which === 1) {
          return _this.mouseDown = false;
        }
      });
      $(this.canvas).on('contextmenu', function(e) {
        return e.preventDefault();
      });
      return $(document).on('keydown', function(e) {});
    };

    Starstalk.prototype.unbindEvents = function() {
      $(window).off('resize');
      $(document).off('keypress keydown');
      return $(this.canvas).off('mousemove mousedown mouseup contextmenu');
    };

    Starstalk.prototype.showGameOver = function() {
      var _this = this;
      this.status.gameOver = true;
      return $(this.canvas).on('mousedown', function(e) {
        return newGame();
      });
    };

    Starstalk.prototype.startTasks = function() {};

    Starstalk.prototype.pruneTree = function() {
      var cloud, height, i, left, obj, r, rejected, rejectedStars, top, width, _i, _j, _len, _len1, _ref, _ref1;
      _ref = game.view.worldBounds(), left = _ref.left, top = _ref.top, width = _ref.width, height = _ref.height;
      rejected = quadtree.prune(left, top, width, height);
      for (_i = 0, _len = rejected.length; _i < _len; _i++) {
        r = rejected[_i];
        obj = r.object;
        if (obj instanceof Star) {
          obj.branch.doStop();
        } else if (obj instanceof Cloud) {
          _ref1 = game.clouds;
          for (cloud = _j = 0, _len1 = _ref1.length; _j < _len1; cloud = ++_j) {
            i = _ref1[cloud];
            if (obj === cloud) {
              game.clouds.splice(i, 1);
              console.log('killed cloud');
            }
          }
        }
      }
      return rejectedStars = rejected.filter(function(r) {
        return r instanceof Star;
      });
    };

    return Starstalk;

  })();

  newGame = function() {
    if (game != null) {
      game.unbindEvents();
      clearInterval(game.loopInterval);
    }
    game = new Starstalk({
      $canvas: $('#game')
    });
    GFX = game.GFX;
    world = game.world;
    return game.start();
  };

  $(function() {
    var $body;
    $body = $('body');
    return newGame();
  });

}).call(this);
