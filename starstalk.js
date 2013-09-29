(function() {
  var Balloon, Branch, Cloud, Collidable, Config, GFX, GraphicsHelper, Meteor, NotImplemented, Obstacle, Pegasus, Positional, Satellite, Sprite, Star, Starstalk, Thing, Vec, Viewport, game, lerp, makeImage, quadtree, withImage, withImages, world, _ref, _ref1, _ref2, _ref3, _ref4, _ref5,
    __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  lerp = function(a, b, t) {
    return a * (1 - t) + b * t;
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

  Config = {
    growthRate: 3,
    branchAngle: Math.PI / 3,
    branchAngleUpwardWeight: 0.1,
    branchDistance: 600,
    branchFibers: 3,
    branchWidth: 10,
    knotDistance: 50,
    knotDistanceWhileThrusting: 20,
    knotAngleJitter: Math.PI / 6,
    cloudProbability: 0.5,
    starSafetyDistance: 32,
    starNovaRadius: 32,
    starThrustRate: 6,
    starImage: makeImage('img/star-32.png'),
    starOffset: {
      x: 16,
      y: 16
    },
    cloudImage: makeImage('img/cloud-4-a.png'),
    cloudOffset: {
      x: 16,
      y: 16
    }
  };

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

    Vec.prototype.lengthSquared = function() {
      return this.x * this.x + this.y * this.y;
    };

    Vec.prototype.length = function() {
      return Math.sqrt(this.lengthSquared());
    };

    Vec.prototype.angle = function() {
      return Math.atan2(this.y, this.x);
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

    Viewport.prototype._setTransform = function() {
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
      return this._setTransform();
    };

    return Viewport;

  })();

  game = null;

  world = null;

  GFX = null;

  quadtree = Quadtree.create();

  quadtree.reset();

  Positional = (function(_super) {
    __extends(Positional, _super);

    function Positional() {
      _ref = Positional.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Positional.prototype.position = null;

    return Positional;

  })(Thing);

  Collidable = (function(_super) {
    __extends(Collidable, _super);

    Collidable.prototype.offset = {
      x: 0,
      y: 0
    };

    Collidable.prototype.dimensions = [0, 0];

    Collidable.prototype.aabb = null;

    function Collidable() {
      var h, ox, oy, w, _ref1, _ref2;
      _ref1 = this.dimensions, w = _ref1[0], h = _ref1[1];
      _ref2 = this.offset, ox = _ref2[0], oy = _ref2[1];
      this.box = {
        left: this.position.x - this.offset.x,
        top: this.position.y - this.offset.y,
        width: w,
        height: h,
        object: this
      };
      quadtree.insert(this.box);
    }

    Collidable.prototype.update = function() {
      this.box.left = this.position.x - this.offset.x;
      return this.box.top = this.position.y - this.offset.y;
    };

    return Collidable;

  })(Positional);

  Obstacle = (function(_super) {
    __extends(Obstacle, _super);

    function Obstacle() {
      _ref1 = Obstacle.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    return Obstacle;

  })(Collidable);

  Pegasus = (function(_super) {
    __extends(Pegasus, _super);

    function Pegasus() {
      _ref2 = Pegasus.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    return Pegasus;

  })(Obstacle);

  Satellite = (function(_super) {
    __extends(Satellite, _super);

    function Satellite() {
      _ref3 = Satellite.__super__.constructor.apply(this, arguments);
      return _ref3;
    }

    return Satellite;

  })(Obstacle);

  Balloon = (function(_super) {
    __extends(Balloon, _super);

    function Balloon() {
      _ref4 = Balloon.__super__.constructor.apply(this, arguments);
      return _ref4;
    }

    return Balloon;

  })(Obstacle);

  Meteor = (function(_super) {
    __extends(Meteor, _super);

    function Meteor() {
      _ref5 = Meteor.__super__.constructor.apply(this, arguments);
      return _ref5;
    }

    return Meteor;

  })(Obstacle);

  Star = (function(_super) {
    __extends(Star, _super);

    Star.all = [];

    Star.prototype.id = null;

    Star.prototype.radius = 16;

    Star.prototype.radius2 = 8;

    Star.prototype.dimensions = [32, 32];

    Star.prototype.offset = Config.starOffset;

    Star.prototype.attraction = null;

    function Star(position, branch) {
      var i, inc;
      this.position = position;
      this.branch = branch;
      Star.__super__.constructor.call(this);
      console.log('new star @', this.branch);
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

    Star.prototype.setBranch = function(branch) {
      this.branch = branch;
      return this.position = this.branch.tip;
    };

    Star.prototype.render = function() {
      var _this = this;
      return this.withTransform(function() {
        game.ctx.beginPath();
        GFX.drawLineString(_this.vertices);
        game.ctx.fillStyle = 'white';
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
        branchDistance: Config.branchDistance,
        knotDistance: Config.knotDistance,
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
      var branch, star, stars, _i, _j, _len, _len1, _ref6, _ref7;
      stars = [];
      if (this.star != null) {
        stars.push(this.star);
      }
      _ref6 = this.branches;
      for (_i = 0, _len = _ref6.length; _i < _len; _i++) {
        branch = _ref6[_i];
        _ref7 = branch.collectStars();
        for (_j = 0, _len1 = _ref7.length; _j < _len1; _j++) {
          star = _ref7[_j];
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
      return this.star = null;
    };

    Branch.prototype.doKnot = function() {
      this.knots.push(new Vec(this.tip));
      return this.angle += (Math.random() - 0.5) * Config.knotAngleJitter;
    };

    Branch.prototype.doStop = function() {
      this.status.isGrowing = false;
      this.status.isDead = true;
      if (this.star) {
        this.star.box.left = -9999;
      }
      return delete this.star;
    };

    Branch.prototype.handleInput = function(e) {};

    Branch.prototype.update = function() {
      var branch, diff, growth, _i, _len, _ref6, _results;
      if (this.status.isGrowing) {
        if (this.star.attraction != null) {
          this.status.knotDistance = Config.knotDistanceWhileThrusting;
          diff = new Vec(this.star.attraction);
          diff.sub(this.star.position);
          this.angle = lerp(this.angle, diff.angle(), 0.1);
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
        if (this.status.distanceTravelled > this.status.branchDistance) {
          return this.doFork();
        } else if (this.status.distanceTravelledKnot > this.status.knotDistance) {
          this.doKnot();
          return this.status.distanceTravelledKnot = 0;
        }
      } else {
        _ref6 = this.branches;
        _results = [];
        for (_i = 0, _len = _ref6.length; _i < _len; _i++) {
          branch = _ref6[_i];
          _results.push(branch.update());
        }
        return _results;
      }
    };

    Branch.prototype.render = function() {
      var branch, i, _i, _j, _len, _ref6, _ref7, _results;
      game.ctx.save();
      game.ctx.beginPath();
      game.ctx.translate(-Config.branchWidth * 3 / 4, 0);
      for (i = _i = 1, _ref6 = Config.branchFibers; 1 <= _ref6 ? _i <= _ref6 : _i >= _ref6; i = 1 <= _ref6 ? ++_i : --_i) {
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
        _ref7 = this.branches;
        _results = [];
        for (_j = 0, _len = _ref7.length; _j < _len; _j++) {
          branch = _ref7[_j];
          _results.push(branch.render());
        }
        return _results;
      }
    };

    return Branch;

  })(Thing);

  Cloud = (function(_super) {
    __extends(Cloud, _super);

    Cloud.prototype.dimensions = [128, 96];

    Cloud.prototype.offset = Config.cloudOffset;

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

    Cloud.make = function(reference) {
      var position, velocity;
      position = new Vec(reference);
      position.y -= game.height();
      position.x += Math.random() * game.width() - game.width();
      velocity = new Vec(Math.random() * 2, 0);
      return new Cloud(position, velocity);
    };

    return Cloud;

  })(Collidable);

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
      this.GFX = new GraphicsHelper(this.ctx);
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
        cloud: new Sprite(Config.cloudImage, Config.cloudOffset)
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
      this.startTasks();
      $(window).trigger('resize');
      this.stalk = new Branch(new Vec(0, 0), -Math.PI / 2);
      return this.doLoop();
    };

    Starstalk.prototype.doLoop = function() {
      var _this = this;
      return this.loopInterval = setInterval(function() {
        var cloud, star, thing, things, _i, _j, _k, _len, _len1, _len2, _ref6, _ref7;
        _this.view.clearScreen('#b5e0e2');
        _this.update();
        things = [_this.stalk];
        _ref6 = _this.stars;
        for (_i = 0, _len = _ref6.length; _i < _len; _i++) {
          star = _ref6[_i];
          things.push(star);
        }
        _ref7 = _this.clouds;
        for (_j = 0, _len1 = _ref7.length; _j < _len1; _j++) {
          cloud = _ref7[_j];
          things.push(cloud);
        }
        if (!_this.status.paused) {
          for (_k = 0, _len2 = things.length; _k < _len2; _k++) {
            thing = things[_k];
            thing.update();
            thing.render();
          }
        }
        _this.status.tailColorIndex += 1;
        _this.status.tailColorIndex %= _this.rainbowColors.length;
        return _this.render();
      }, parseInt(1000 / this.config.fps));
    };

    Starstalk.prototype.render = function() {
      this.ctx.font = "60px Arial";
      this.ctx.strokeStyle = '#333';
      this.ctx.save();
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.strokeText(parseInt(this.status.heightAchieved) + 'm', 50, 100);
      return this.ctx.restore();
    };

    Starstalk.prototype.update = function() {
      var a, b, cloud, clouds, collidable, deadStars, h, highestStar, hit, hits, i, newScrollY, obj, safeStars, star, stars, w, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref6, _ref7, _ref8, _results;
      _ref6 = this.view.dimensions(), w = _ref6[0], h = _ref6[1];
      stars = this.stalk.collectStars();
      this.stars = stars;
      highestStar = _.min(stars, function(s) {
        return s.position.y;
      });
      this.status.heightAchieved = -highestStar.position.y;
      newScrollY = -h / 2 - highestStar.position.y;
      if (newScrollY > this.view.scroll.y) {
        this.view.scroll.y = Math.max(0, newScrollY);
      }
      this.view.update();
      if (Math.random() < Config.cloudProbability / this.config.fps) {
        this.clouds.push(Cloud.make(highestStar.position));
      }
      _ref7 = this.clouds;
      for (cloud = _i = 0, _len = _ref7.length; _i < _len; cloud = ++_i) {
        i = _ref7[cloud];
        if (cloud.x > this.width()) {
          this.clouds.splice(i, 1);
        }
      }
      for (_j = 0, _len1 = stars.length; _j < _len1; _j++) {
        star = stars[_j];
        if (game.mouseDown) {
          star.setAttraction(game.view.screen2world(game.mouse));
        } else {
          star.setAttraction(null);
        }
      }
      collidable = [];
      for (_k = 0, _len2 = stars.length; _k < _len2; _k++) {
        star = stars[_k];
        collidable.push(star);
      }
      _ref8 = this.clouds;
      for (_l = 0, _len3 = _ref8.length; _l < _len3; _l++) {
        cloud = _ref8[_l];
        collidable.push(cloud);
      }
      _results = [];
      for (_m = 0, _len4 = collidable.length; _m < _len4; _m++) {
        obj = collidable[_m];
        hits = quadtree.getObjects(obj.box.left, obj.box.top, obj.box.width, obj.box.height);
        if (hits.length > 1) {
          deadStars = (function() {
            var _len5, _n, _results1;
            _results1 = [];
            for (_n = 0, _len5 = hits.length; _n < _len5; _n++) {
              hit = hits[_n];
              if (hit.object instanceof Star) {
                _results1.push(hit.object);
              }
            }
            return _results1;
          })();
          safeStars = [];
          clouds = (function() {
            var _len5, _n, _results1;
            _results1 = [];
            for (_n = 0, _len5 = hits.length; _n < _len5; _n++) {
              hit = hits[_n];
              if (hit.object instanceof Cloud) {
                _results1.push(hit.object);
              }
            }
            return _results1;
          })();
          if (deadStars.length === 2) {
            a = deadStars[0], b = deadStars[1];
            if (a.id === b.id) {
              console.warn('weird case', deadStars);
              safeStars = [a, b];
            } else if (a.branch.parent.id === b.branch.parent.id && a.branch.status.distanceTravelled < Config.starSafetyDistance) {
              safeStars = [a, b];
            }
          }
          _results.push((function() {
            var _len5, _n, _results1;
            _results1 = [];
            for (_n = 0, _len5 = deadStars.length; _n < _len5; _n++) {
              star = deadStars[_n];
              if (!(__indexOf.call(safeStars, star) >= 0)) {
                _results1.push(star.branch.doStop());
              }
            }
            return _results1;
          })());
        } else {
          _results.push(void 0);
        }
      }
      return _results;
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
        _this.$canvas.attr({
          width: $body.width(),
          height: $body.height()
        });
        return _this.view.clearScreen('pink');
      });
      $(document).on('keypress', function(e) {
        switch (e.charCode) {
          case 32:
            return _this.togglePause();
          case 115:
            return _this.scroll.x -= 3;
          case 119:
            return _this.scroll.x += 3;
        }
      });
      $(this.canvas).on('mousemove', function(e) {
        _this.mouse.x = e.offsetX;
        return _this.mouse.y = e.offsetY;
      });
      $(this.canvas).on('mousedown', function(e) {
        if (e.which === 1) {
          return _this.mouseDown = true;
        }
      });
      $(this.canvas).on('mouseup', function(e) {
        if (e.which === 1) {
          return _this.mouseDown = false;
        }
      });
      return $(document).on('keydown', function(e) {});
    };

    Starstalk.prototype.startTasks = function() {
      var _this = this;
      return setInterval(function() {
        var cloud, height, i, left, obj, r, rejected, top, width, _i, _j, _len, _len1, _ref6, _ref7;
        _ref6 = game.view.worldBounds(), left = _ref6.left, top = _ref6.top, width = _ref6.width, height = _ref6.height;
        console.log(game.view.worldBounds());
        rejected = quadtree.prune(left, top, width, height);
        for (_i = 0, _len = rejected.length; _i < _len; _i++) {
          r = rejected[_i];
          obj = r.object;
          if (obj instanceof Star) {
            obj.branch.doStop();
          } else if (obj instanceof Cloud) {
            _ref7 = game.clouds;
            for (cloud = _j = 0, _len1 = _ref7.length; _j < _len1; cloud = ++_j) {
              i = _ref7[cloud];
              if (obj === cloud) {
                game.clouds.splice(i, 1);
                console.log('killed cloud');
              }
            }
          }
        }
        if (rejected.length > 0) {
          return console.log('REJECTS', rejected);
        }
      }, 3000);
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
    world = game.world;
    return game.start();
  });

}).call(this);
