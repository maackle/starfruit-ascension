(function() {
  var Atmosphere, Balloon, Branch, Cloud, Collidable, Config, Cookie, GFX, GameEngine, GameOverState, GameState, M, Module, ModuleOriginal, NotImplemented, Nova, Obstacle, PlayState, Quad, Satellite, Sprite, Star, Thing, Vec, Viewport, atmoscale, balloonAABBDim, balloonAABBOffset, balloonSpriteOffset, balloonTopDim, clampAngleSigned, game, i, lerp, makeImage, quadtree, withImage, withImages, world, _ref,
    __slice = [].slice,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

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

  atmoscale = 1.0 / 2.0;

  Atmosphere = {
    noflyzone: 5000 * atmoscale,
    tropopause: 18000 * atmoscale,
    stratopause: 40000 * atmoscale,
    mesopause: 75000 * atmoscale,
    exopause: 100000 * atmoscale
  };

  Config = {
    mainFont: 'Monoton',
    hudFont: 'Offside',
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
    autokillDistanceRatio: 1.25,
    autokillOffscreenX: 600,
    knotDistance: 100,
    knotDistanceWhileThrusting: 50,
    knotAngleJitter: Math.PI / 24,
    probability: {
      cloud: function(height) {
        if (height < Atmosphere.noflyzone) {
          return 0.66;
        } else if (height < Atmosphere.tropopause) {
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
        if (height < Atmosphere.noflyzone) {
          return 0;
        } else if (height < Atmosphere.tropopause) {
          return 0.75;
        } else if (height < Atmosphere.stratopause) {
          return 0.15;
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
        if (height < Atmosphere.noflyzone) {
          return 0;
        } else if (height > Atmosphere.stratopause) {
          return base;
        } else if (height > Atmosphere.mesopause) {
          return base + (height - Atmosphere.mesopause) / Atmosphere.mesopause;
        } else {
          return 0.05;
        }
      }
    },
    starNovaRadius: 32,
    starNovaTime: 1.5,
    starSafetyDistance: 128,
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
      layers: [[atmoscale * 0, tinycolor('#b5e0e2'), 1], [Atmosphere.noflyzone, tinycolor('#b5e0e2'), 1], [Atmosphere.tropopause, tinycolor('#97b2c6'), 0.95], [Atmosphere.stratopause, tinycolor('#778b9b'), 0.9], [Atmosphere.mesopause, tinycolor('#37475b'), 0.7], [Atmosphere.exopause, tinycolor('#0f1419'), 0.0]]
    }
  };

  'use strict';

  M = {};

  NotImplemented = {};

  Module = (function() {
    function Module() {}

    Module.__keywords = ['extended'];

    Module.extend = function(obj) {
      var key, value, _ref, _ref1;
      for (key in obj) {
        value = obj[key];
        if (__indexOf.call(Module.__keywords, key) < 0) {
          this[key] = value;
        }
      }
      _ref = obj.Meta;
      for (key in _ref) {
        value = _ref[key];
        this.prototype[key] = value;
      }
      return (_ref1 = obj.extended) != null ? _ref1.apply(this) : void 0;
    };

    return Module;

  })();

  Vec = (function() {
    Vec.immutable = function() {
      var v;
      v = new Vec(arguments);
      return Object.freeze(v);
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

  Vec.zero = Vec.immutable(0, 0);

  Vec.one = Vec.immutable(1, 1);

  M.Image = (function() {
    Image._cache = {};

    Image.prototype.loaded = false;

    function Image(o) {
      var hit, im,
        _this = this;
      if (o instanceof Image) {
        im = o;
      } else {
        hit = M.Image._cache[o] != null;
        if (hit) {
          im = hit;
        } else {
          im = new Image;
          im.src = o;
          im.onload = function() {
            return _this.loaded = true;
          };
          M.image._cache[0] = im;
        }
      }
      this.image = im;
    }

    return Image;

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

    Thing.prototype.angle = 0.0;

    Thing.prototype.scale = 1.0;

    Thing.prototype.position = null;

    Thing.prototype.render = function() {
      throw NotImplemented;
    };

    Thing.prototype.update = function() {
      throw NotImplemented;
    };

    Thing.prototype.withTransform = function(fn) {
      game.ctx.save();
      game.ctx.translate(this.position.x, this.position.y);
      game.ctx.rotate(this.angle);
      game.ctx.scale(this.scale, this.scale);
      fn();
      return game.ctx.restore();
    };

    return Thing;

  })();

  GFX = {
    drawLineString: function() {
      var ctx, more, points, vec, _i, _j, _len, _len1, _ref, _results;
      ctx = arguments[0], points = arguments[1], more = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      ctx.moveTo(points[0].x, points[0].y);
      _ref = points.slice(1);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        vec = _ref[_i];
        ctx.lineTo(vec.x, vec.y);
      }
      _results = [];
      for (_j = 0, _len1 = more.length; _j < _len1; _j++) {
        vec = more[_j];
        _results.push(ctx.lineTo(vec.x, vec.y));
      }
      return _results;
    },
    drawImage: function(ctx, im, pos, offset) {
      var _this = this;
      if (offset == null) {
        offset = {
          x: 0,
          y: 0
        };
      }
      return withImage(im, function(im) {
        return ctx.drawImage(im, pos.x - offset.x, pos.y - offset.y);
      });
    }
  };

  ModuleOriginal = (function() {
    function ModuleOriginal() {}

    ModuleOriginal.__keywords = ['extended', 'included'];

    ModuleOriginal.extend = function(obj) {
      var key, value, _ref;
      for (key in obj) {
        value = obj[key];
        if (__indexOf.call(Moduler.__keywords, key) < 0) {
          this[key] = value;
        }
      }
      if ((_ref = obj.extended) != null) {
        _ref.apply(this);
      }
      return this;
    };

    ModuleOriginal.include = function(obj) {
      var key, value, _ref;
      for (key in obj) {
        value = obj[key];
        if (__indexOf.call(Moduler.__keywords, key) < 0) {
          this.prototype[key] = value;
        }
      }
      if ((_ref = obj.included) != null) {
        _ref.apply(this);
      }
      return this;
    };

    return ModuleOriginal;

  })();

  (function() {
    'use strict';
    var B2Body, B2World, Mixin;
    Mixin = (function() {
      function Mixin() {}

      return Mixin;

    })();
    B2World = (function() {
      function B2World() {}

      B2World.prototype.world = null;

      return B2World;

    })();
    return B2Body = (function() {
      function B2Body() {}

      B2Body.prototype.body = null;

      return B2Body;

    })();
  })();

  Quad = (function() {
    Quad.prototype.x = null;

    Quad.prototype.y = null;

    Quad.prototype.w = null;

    Quad.prototype.h = null;

    function Quad() {
      if (arguments.length === 4) {
        this.x = arguments[0], this.y = arguments[1], this.w = arguments[2], this.h = arguments[3];
      } else {
        throw 'unsupported Quad arguments';
      }
    }

    Quad.prototype.width = function() {
      return w;
    };

    Quad.prototype.height = function() {
      return h;
    };

    return Quad;

  })();

  Viewport = (function() {
    function Viewport(canvas, opts) {
      var h, w, _ref;
      this.canvas = canvas;
      this.anchor = opts.anchor, this.scroll = opts.scroll, this.scale = opts.scale;
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
      var h, w, _ref;
      _ref = [this.canvas.width, this.canvas.height], w = _ref[0], h = _ref[1];
      this.ctx.save();
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.fillStyle = color;
      this.ctx.clearRect(0, 0, w, h);
      this.ctx.fillRect(0, 0, w, h);
      return this.ctx.restore();
    };

    Viewport.prototype.fillScreen = function(color) {
      var h, w, _ref;
      _ref = [this.canvas.width, this.canvas.height], w = _ref[0], h = _ref[1];
      this.ctx.save();
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.fillStyle = color;
      this.ctx.fillRect(0, 0, w, h);
      return this.ctx.restore();
    };

    Viewport.prototype.dimensions = function() {
      return [this.canvas.width, this.canvas.height];
    };

    Viewport.prototype.worldBounds = function() {
      var h, ox, oy, w, _ref, _ref1;
      _ref = [this.canvas.width, this.canvas.height], w = _ref[0], h = _ref[1];
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

  GameState = (function() {
    function GameState() {}

    GameState.prototype._boundEvents = [];

    GameState.prototype.game = null;

    GameState.prototype.parent = null;

    GameState.prototype.bind = function(what, events, fn) {
      return this._boundEvents.push([what, events, fn]);
    };

    GameState.prototype._bindEvents = function() {
      var e, events, fn, what, _i, _len, _ref, _results;
      _ref = this._boundEvents;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        e = _ref[_i];
        what = e[0], events = e[1], fn = e[2];
        _results.push($(what).on(events, fn));
      }
      return _results;
    };

    GameState.prototype._unbindEvents = function() {
      var e, events, fn, what, _i, _len, _ref, _results;
      _ref = this._boundEvents;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        e = _ref[_i];
        what = e[0], events = e[1], fn = e[2];
        _results.push($(what).off(events));
      }
      return _results;
    };

    GameState.prototype.enter = function() {};

    GameState.prototype.exit = function() {};

    GameState.prototype.update = function(dt) {};

    GameState.prototype.render = function() {};

    return GameState;

  })();

  GameEngine = (function() {
    GameEngine.prototype.canvas = null;

    GameEngine.prototype.mouse = new Vec(0, 0);

    GameEngine.prototype.config = {};

    GameEngine.prototype.states = [];

    GameEngine.prototype.intervals = {
      gameLoop: null
    };

    function GameEngine(opts) {
      var _ref;
      this.config = _.defaults(opts, {
        fps: 30,
        fullscreen: true
      });
      this.canvas = (function() {
        if ((_ref = opts.canvas) != null) {
          return _ref;
        } else {
          throw 'no canvas supplied';
        }
      })();
      this.pushState(opts.initialState);
      this._bindEvents();
    }

    GameEngine.prototype.start = function() {
      var _this = this;
      if (this._isValid()) {
        return this.intervals.gameLoop = setInterval(function() {
          return _this.doLoop(1 / _this.config.fps);
        }, parseInt(1000 / this.config.fps));
      } else {
        return console.error('failed to start game due to previous errors');
      }
    };

    GameEngine.prototype.stop = function() {
      return clearInterval(this.intervals.gameLoop);
    };

    GameEngine.prototype.currentState = function() {
      return this.states[this.states.length - 1];
    };

    GameEngine.prototype.pushState = function(state) {
      state.game = this;
      state.parent = this.currentState();
      this.states.push(state);
      state._bindEvents();
      return state.enter();
    };

    GameEngine.prototype.popState = function() {
      var state;
      state = this.states.pop();
      state.exit();
      state._unbindEvents();
      state.game = null;
      state.parent = null;
      return state;
    };

    GameEngine.prototype.doLoop = function(dt) {
      var state;
      state = this.currentState();
      if (!state instanceof GameState) {
        throw 'not a state';
      }
      state.update(dt);
      return state.render();
    };

    GameEngine.prototype._bindEvents = function() {
      var _this = this;
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
        _this.mouse.x = e.offsetX || e.layerX;
        return _this.mouse.y = e.offsetY || e.layerY;
      });
      $(this.canvas).on('contextmenu', function(e) {
        return e.preventDefault();
      });
      $(window).on('resize', function(e) {
        var $body;
        $body = $('body');
        return $(_this.canvas).attr({
          width: $body.width(),
          height: $body.height()
        });
      });
      return $(window).trigger('resize');
    };

    GameEngine.prototype._isValid = function() {
      return this.canvas != null;
    };

    return GameEngine;

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

    return Collidable;

  })(Thing);

  Obstacle = (function(_super) {
    __extends(Obstacle, _super);

    Obstacle.prototype.isActiveCollider = true;

    function Obstacle(position, velocity) {
      this.position = position;
      this.velocity = velocity;
      if (this.velocity == null) {
        this.velocity = new Vec(0, 0);
      }
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
      if (this.velocity == null) {
        this.velocity = new Vec(0, 0);
      }
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

    Star.prototype.dimensions = [32, 32];

    Star.prototype.offset = Config.starOffset;

    Star.prototype.attraction = null;

    Star.prototype.isActiveCollider = true;

    function Star(position, branch) {
      this.position = position;
      this.branch = branch;
      Star.__super__.constructor.call(this);
      this.hasFocus = false;
      this.angle = 0;
      Star.all.push(this);
      this.id = Star.all.length;
    }

    Star.prototype.setAttraction = function(vec) {
      return this.attraction = vec;
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

    Star.prototype.withTransform = function(fn) {
      game.ctx.save();
      game.ctx.translate(this.position.x, this.position.y);
      game.ctx.rotate(this.angle);
      fn();
      return game.ctx.restore();
    };

    Star.prototype.render = function() {
      var _this = this;
      return this.withTransform(function() {
        game.ctx.beginPath();
        GFX.drawLineString(Star.vertices);
        if (_this.isSafe()) {
          game.ctx.strokeStyle = game.tailColor(3);
          game.ctx.fillStyle = game.tailColor(12);
        } else {
          game.ctx.strokeStyle = game.tailColor();
          game.ctx.fillStyle = 'white';
        }
        game.ctx.lineWidth = 2;
        game.ctx.fill();
        return game.ctx.stroke();
      });
    };

    return Star;

  })(Collidable);

  Star.radius = 16;

  Star.radius2 = 8;

  Star.vertices = (function() {
    var _i, _results;
    _results = [];
    for (i = _i = 0; _i <= 10; i = ++_i) {
      _results.push(Vec.polar((i % 2 === 0 ? Star.radius : Star.radius2), i * (Math.PI * 2 / 10)));
    }
    return _results;
  })();

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
      game.novae.push(new Nova(new Vec(this.star.position), this.star.angle));
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
      var branch, _i, _j, _len, _ref, _ref1, _results;
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

  Nova = (function(_super) {
    __extends(Nova, _super);

    function Nova(position, angle) {
      this.position = position;
      this.angle = angle;
      this.scale = 1.0;
      this.time = 0;
    }

    Nova.prototype.update = function(speedMod) {
      if (speedMod == null) {
        speedMod = 1;
      }
      this.scale += 10 * speedMod;
      this.time += 1 / game.config.fps * speedMod;
      if (this.time > Config.starNovaTime) {
        return this.die();
      }
    };

    Nova.prototype.die = function() {
      return game.novae = _.without(game.novae, this);
    };

    Nova.prototype.render = function() {
      var _this = this;
      return this.withTransform(function() {
        game.ctx.beginPath();
        game.ctx.lineWidth = 2;
        GFX.drawLineString(Star.vertices);
        game.ctx.strokeStyle = game.tailColor(10);
        return game.ctx.stroke();
      });
    };

    return Nova;

  })(Thing);

  GameOverState = (function(_super) {
    __extends(GameOverState, _super);

    function GameOverState() {
      _ref = GameOverState.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    return GameOverState;

  })(GameState);

  PlayState = (function(_super) {
    __extends(PlayState, _super);

    PlayState.prototype.view = null;

    function PlayState() {}

    PlayState.prototype.enter = function() {
      console.log(this.game);
      return this.view = new Viewport(this.game.canvas, {
        anchor: 'center'
      });
    };

    PlayState.prototype.exit = function() {};

    PlayState.prototype.update = function(dt) {};

    PlayState.prototype.render = function(dt) {
      return this.view.clearScreen('blue');
    };

    return PlayState;

  })(GameState);

  $(function() {
    var states;
    states = {
      play: new PlayState
    };
    game = new GameEngine({
      canvas: $('#game').get(0),
      initialState: states.play,
      fps: 30
    });
    return game.start();
  });

}).call(this);
