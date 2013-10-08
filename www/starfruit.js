(function() {
  var Atmosphere, Balloon, Branch, Cloud, Collidable, Config, Cookie, GFX, GameEngine, GameOverState, GameState, ImageResource, M, Module, NotImplemented, Nova, Obstacle, PlayState, Quad, QuadtreeBox, Satellite, Sprite, Star, Thing, Vec, Viewport, atmoscale, clampAngleSigned, globals, i, lerp, makeImage, withImage, withImages, _ref, _ref1,
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

  'use strict';

  M = {};

  NotImplemented = {};

  M.context = function(ctx, fn) {
    ctx.save();
    fn(ctx);
    return ctx.restore();
  };

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

    Quad.prototype.left = function() {
      return this.x;
    };

    Quad.prototype.top = function() {
      return this.y;
    };

    Quad.prototype.bottom = function() {
      return this.y + this.h;
    };

    Quad.prototype.right = function() {
      return this.x + this.w;
    };

    Quad.prototype.width = function() {
      return this.w;
    };

    Quad.prototype.height = function() {
      return this.h;
    };

    Quad.prototype.object = function() {
      return {
        left: this.x,
        top: this.y,
        bottom: this.y + this.h,
        right: this.x + this.w,
        width: this.w,
        height: this.h
      };
    };

    Quad.prototype.onPoint = function(vec) {
      return vec.x >= this.x && vec.y >= this.y && vec.x <= this.x + this.w && vec.y <= this.y + this.h;
    };

    Quad.prototype.onQuad = function(q) {
      var intersects;
      intersects = !(this.x > q.x + q.w || this.x + this.w < q.x || this.y > q.y + q.h || this.y + this.h < q.y);
      return intersects;
    };

    return Quad;

  })();

  ImageResource = (function() {
    ImageResource._cache = {};

    ImageResource.prototype.image = null;

    ImageResource.prototype.loaded = false;

    function ImageResource(o) {
      var hit, im,
        _this = this;
      console.assert(o != null);
      if (o instanceof Image) {
        im = o;
      } else {
        hit = ImageResource._cache[o] != null;
        if (hit) {
          im = hit;
        } else {
          im = new Image;
          im.src = o;
          im.onload = function() {
            return _this.loaded = true;
          };
          ImageResource._cache[0] = im;
        }
      }
      this.image = im;
    }

    return ImageResource;

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

    Thing.prototype.withTransform = function(ctx, fn) {
      ctx.save();
      ctx.translate(this.position.x, this.position.y);
      ctx.rotate(this.angle);
      ctx.scale(this.scale, this.scale);
      fn();
      return ctx.restore();
    };

    return Thing;

  })();

  GFX = {
    drawLineString: function(ctx, points, opts) {
      var closed, more, vec, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2, _results;
      if (opts == null) {
        opts = {};
      }
      _ref = _.defaults(opts, {
        closed: false,
        more: []
      }), closed = _ref.closed, more = _ref.more;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      _ref1 = points.slice(1);
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        vec = _ref1[_i];
        ctx.lineTo(vec.x, vec.y);
      }
      if (closed) {
        _ref2 = points.slice(0, 2);
        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
          vec = _ref2[_j];
          ctx.lineTo(vec.x, vec.y);
        }
      }
      _results = [];
      for (_k = 0, _len2 = more.length; _k < _len2; _k++) {
        vec = more[_k];
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

  Sprite = (function() {
    Sprite.prototype.offset = null;

    Sprite.prototype.image = null;

    function Sprite(_arg) {
      this.image = _arg.image, this.offset = _arg.offset;
    }

    Sprite.prototype.draw = function(transform) {
      var _this = this;
      return function(ctx) {
        var position, rotation, scale;
        position = transform.position, rotation = transform.rotation, scale = transform.scale;
        ctx.save();
        if (position != null) {
          ctx.translate(position.x, position.y);
        }
        if (rotation != null) {
          ctx.rotate(rotation);
        }
        if (scale != null) {
          ctx.scale(scale);
        }
        ctx.drawImage(_this.image.image, -_this.offset.x, -_this.offset.y);
        return ctx.restore();
      };
    };

    return Sprite;

  })();

  Viewport = (function() {
    function Viewport(canvas, opts) {
      var h, w, _ref;
      this.canvas = canvas;
      this.anchor = opts.anchor, this.scroll = opts.scroll, this.scale = opts.scale;
      if (this.anchor == null) {
        this.anchor = {};
      }
      if (this.scroll == null) {
        this.scroll = new Vec(0, 0);
      }
      if (this.scale == null) {
        this.scale = 1;
      }
      this.ctx = this.canvas.getContext('2d');
      _ref = [this.canvas.width, this.canvas.height], w = _ref[0], h = _ref[1];
      this.offset = [w / 2, h / 2];
    }

    Viewport.prototype.draw = function(fn) {
      this.ctx.save();
      this.resetTransform();
      fn(this.ctx);
      return this.ctx.restore();
    };

    Viewport.prototype.resetTransform = function() {
      var h, ox, oy, w, _ref, _ref1;
      _ref = [this.canvas.width, this.canvas.height], w = _ref[0], h = _ref[1];
      if (this.anchor === 'center') {
        this.offset = [w / 2, h / 2];
      } else {
        this.offset = [0, 0];
      }
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

    Viewport.prototype.width = function() {
      return this.canvas.width;
    };

    Viewport.prototype.height = function() {
      return this.canvas.height;
    };

    Viewport.prototype.dimensions = function() {
      return [this.canvas.width, this.canvas.height];
    };

    Viewport.prototype.worldQuad = function() {
      var h, ox, oy, w, x, y, _ref, _ref1;
      _ref = [this.canvas.width, this.canvas.height], w = _ref[0], h = _ref[1];
      _ref1 = this.offset, ox = _ref1[0], oy = _ref1[1];
      x = -(ox + this.scroll.x + 0.5);
      y = -(oy + this.scroll.y + 0.5);
      return new Quad(x, y, w, h);
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
    GameState.prototype._isInitialized = false;

    GameState.prototype._boundEvents = null;

    GameState.prototype.game = null;

    GameState.prototype.parent = null;

    function GameState() {
      this._boundEvents = [];
    }

    GameState.prototype.bind = function(what, events, fn) {
      var ee;
      if (this._boundEvents == null) {
        this._boundEvents = [];
      }
      ee = {
        what: what,
        events: events,
        fn: fn
      };
      if (this.isActive()) {
        this._bindEvent(ee);
      }
      return this._boundEvents.push(ee);
    };

    GameState.prototype._bindEvent = function(ee) {
      var events, fn, what;
      ee.bound = true;
      what = ee.what, events = ee.events, fn = ee.fn;
      return $(what).on(events, fn);
    };

    GameState.prototype._unbindEvent = function(ee) {
      var events, fn, what;
      ee.bound = false;
      what = ee.what, events = ee.events, fn = ee.fn;
      return $(what).off(events);
    };

    GameState.prototype._bindEvents = function() {
      var ee, _i, _len, _ref, _results;
      if (this._boundEvents == null) {
        this._boundEvents = [];
      }
      _ref = this._boundEvents;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ee = _ref[_i];
        if (ee.bound === false) {
          _results.push(this._bindEvent(ee));
        }
      }
      return _results;
    };

    GameState.prototype._unbindEvents = function() {
      var ee, _i, _len, _ref, _results;
      _ref = this._boundEvents;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ee = _ref[_i];
        if (ee.bound === true) {
          _results.push(this._unbindEvent(ee));
        }
      }
      return _results;
    };

    GameState.prototype.isActive = function() {
      return this.game != null;
    };

    GameState.prototype.enter = function(info) {};

    GameState.prototype.exit = function() {};

    GameState.prototype.update = function(dt) {};

    GameState.prototype.render = function() {};

    return GameState;

  })();

  GameEngine = (function() {
    GameEngine.prototype.canvas = null;

    GameEngine.prototype.mouse = {};

    GameEngine.prototype.config = null;

    GameEngine.prototype.states = null;

    GameEngine.prototype.intervals = {
      gameLoop: null
    };

    function GameEngine(opts) {
      var _ref;
      this.states = [];
      this.mouse = {
        position: new Vec(0, 0),
        leftButton: false,
        rightButton: false
      };
      this.config = _.defaults(opts, {
        fps: 30,
        fullscreen: true
      });
      this.preUpdate = opts.preUpdate, this.postUpdate = opts.postUpdate, this.preRender = opts.preRender, this.postRender = opts.postRender;
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
      clearInterval(this.intervals.gameLoop);
      return this.intervals.gameLoop = null;
    };

    GameEngine.prototype.currentState = function() {
      return this.states[this.states.length - 1];
    };

    GameEngine.prototype._switchState = function(old, noob) {
      if (old) {
        old.exit();
        old._unbindEvents();
        old.game = null;
        old.parent = null;
      }
      if (noob) {
        noob.game = this;
        noob.parent = old || null;
        noob._bindEvents();
        noob.enter();
        if (!noob._isInitialized) {
          if (typeof noob.initialize === "function") {
            noob.initialize(game);
          }
          return noob._isInitialized = true;
        }
      }
    };

    GameEngine.prototype.pushState = function(state) {
      this._switchState(this.currentState(), state);
      return this.states.push(state);
    };

    GameEngine.prototype.popState = function() {
      var old;
      old = this.states.pop();
      this._switchState(old, this.currentState());
      return old;
    };

    GameEngine.prototype.doLoop = function(dt) {
      var state;
      state = this.currentState();
      if (!state instanceof GameState) {
        throw 'not a state';
      }
      if (typeof this.preUpdate === "function") {
        this.preUpdate();
      }
      state.update(dt);
      if (typeof this.postUpdate === "function") {
        this.postUpdate();
      }
      if (typeof this.preRender === "function") {
        this.preRender();
      }
      state.render();
      if (typeof this.postRender === "function") {
        this.postRender();
      }
      return typeof state.transition === "function" ? state.transition() : void 0;
    };

    GameEngine.prototype.togglePanic = function() {
      if (this.intervals.gameLoop != null) {
        return this.stop();
      } else {
        return this.start();
      }
    };

    GameEngine.prototype._bindEvents = function() {
      var _this = this;
      $(document).on('keypress', function(e) {
        switch (e.charCode) {
          case 32:
            return _this.togglePanic();
          case 70 | 102:
            _this.canvas.webkitRequestFullScreen();
            return _this.canvas.mozRequestFullScreen();
        }
      });
      $(this.canvas).on('touchmove mousemove', function(e) {
        e.preventDefault();
        _this.mouse.position.x = e.offsetX || e.layerX;
        return _this.mouse.position.y = e.offsetY || e.layerY;
      }).on('touchstart mousedown', function(e) {
        e.preventDefault();
        switch (e.which) {
          case 1:
            return _this.mouse.leftButton = true;
          case 3:
            return _this.mouse.rightButton = true;
        }
      }).on('touchend mouseup', function(e) {
        e.preventDefault();
        switch (e.which) {
          case 1:
            return _this.mouse.leftButton = false;
          case 3:
            return _this.mouse.rightButton = false;
        }
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

  globals = {};

  atmoscale = 1.0;

  Atmosphere = {
    noflyzone: 5000 * atmoscale,
    tropopause: 12000 * atmoscale,
    stratopause: 50000 * atmoscale,
    mesopause: 80000 * atmoscale,
    thermopause: 500000 * atmoscale
  };

  Config = {
    mainFont: 'Monoton',
    hudFont: 'Offside',
    debugDraw: false,
    starSpeed: 550,
    starHyperSpeed: 700,
    autoFork: true,
    branchAngle: Math.PI / 4,
    branchAngleUpwardWeight: 0.1,
    branchDistanceMax: 2000,
    branchFibers: 3,
    branchWidth: 14,
    knotSpacing: 45,
    knotSpacingWhileThrusting: 50,
    knotAngleJitter: Math.PI / 256,
    starRadius: 16,
    starInnerRadius: 8,
    starSafetyDistance: 128,
    novaStrokeWidth: 8,
    novaMaxRadius: 2000,
    novaExplosionSpeed: 200,
    mergeDrawTime: 0.5,
    gameOverSlowdown: 0.2,
    autokillTolerance: {
      x: 200,
      y: 200
    },
    probability: {
      cloud: function(height) {
        if (height < Atmosphere.noflyzone) {
          return 1;
        } else if (height < Atmosphere.tropopause) {
          return 0.6;
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
    images: {
      star: new ImageResource('img/star-32.png'),
      cloud: new ImageResource('img/cloud-4-a.png'),
      balloon: new ImageResource('img/balloon.png'),
      satellite: new ImageResource('img/satellite.png'),
      cookie: new ImageResource('img/cookie.png')
    },
    atmosphere: {
      layers: [[atmoscale * 0, tinycolor('#b5e0e2'), 1], [Atmosphere.noflyzone, tinycolor('#b5e0e2'), 1], [Atmosphere.tropopause, tinycolor('#97b2c6'), 0.95], [Atmosphere.stratopause, tinycolor('#778b9b'), 0.9], [Atmosphere.mesopause, tinycolor('#37475b'), 0.7], [Atmosphere.thermopause, tinycolor('#0f1419'), 0.0], [9999999999, tinycolor('#000'), 0.0]]
    }
  };

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

    Thing.prototype.withTransform = function(ctx, fn) {
      ctx.save();
      ctx.translate(this.position.x, this.position.y);
      ctx.rotate(this.angle);
      ctx.scale(this.scale, this.scale);
      fn();
      return ctx.restore();
    };

    return Thing;

  })();

  QuadtreeBox = (function() {
    QuadtreeBox.prototype.left = null;

    QuadtreeBox.prototype.right = null;

    QuadtreeBox.prototype.position = null;

    QuadtreeBox.prototype.offset = null;

    QuadtreeBox.prototype.dimensions = null;

    function QuadtreeBox(_arg) {
      var dimensions;
      this.position = _arg.position, this.offset = _arg.offset, dimensions = _arg.dimensions, this.object = _arg.object;
      if (this.offset == null) {
        this.offset = Vec.zero;
      }
      this.update();
      this.width = dimensions[0], this.height = dimensions[1];
    }

    QuadtreeBox.prototype.update = function() {
      var x, y, _ref;
      _ref = this.position, x = _ref.x, y = _ref.y;
      this.left = x - this.offset.x;
      return this.top = y - this.offset.y;
    };

    QuadtreeBox.prototype.quad = function() {
      return new Quad(this.left, this.top, this.width, this.height);
    };

    QuadtreeBox.prototype.getHits = function(quadtree) {
      return quadtree.getObjects(this.left, this.top, this.width, this.height);
    };

    return QuadtreeBox;

  })();

  Collidable = (function(_super) {
    __extends(Collidable, _super);

    function Collidable() {
      _ref = Collidable.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Collidable.prototype.qbox = null;

    Collidable.prototype.isActiveCollider = true;

    Collidable.prototype.update = function() {
      this.qbox.update();
      if (this.isActiveCollider) {
        return globals.quadtree.insert(this.qbox);
      }
    };

    return Collidable;

  })(Thing);

  Star = (function(_super) {
    __extends(Star, _super);

    Star.nextID = 1;

    Star.prototype.id = null;

    Star.prototype.isDead = false;

    Star.prototype.branch = null;

    Star.prototype.angle = -Math.PI / 2;

    Star.prototype.attraction = null;

    Star.prototype.timers = null;

    function Star(position, angle) {
      this.position = position;
      this.angle = angle;
      this.id = Star.nextID++;
      this.velocity = new Vec(0, 0);
      this.qbox = new QuadtreeBox({
        position: this.position,
        dimensions: [Star.radius * 2, Star.radius * 2],
        offset: new Vec(Star.radius, Star.radius),
        object: this
      });
      this.timers = {
        merging: []
      };
    }

    Star.prototype.speed = function(dt) {
      return dt * (this.attraction != null ? Config.starHyperSpeed : Config.starSpeed);
    };

    Star.prototype.isSafe = function() {
      return this.branch.distanceTravelled < Config.starSafetyDistance;
    };

    Star.prototype.die = function() {
      this.isDead = true;
      return this.branch.star = null;
    };

    Star.prototype.merge = function(star) {
      this.branch.tip = new Vec(star.position);
      this.branch.doKnot();
      this.die();
      return star.timers.merging.push(Config.mergeDrawTime);
    };

    Star.prototype.update = function(dt) {
      var a, da, diff, i, mergeTime, _i, _len, _ref1;
      if (this.attraction != null) {
        diff = new Vec(this.attraction);
        diff.sub(this.position);
        a = clampAngleSigned(this.angle);
        da = clampAngleSigned(diff.angle() - a);
        this.angle = lerp(0, da, 0.1) + a;
      }
      this.velocity = Vec.polar(this.speed(dt), this.angle);
      this.position.add(this.velocity);
      _ref1 = this.timers.merging;
      for (i = _i = 0, _len = _ref1.length; _i < _len; i = ++_i) {
        mergeTime = _ref1[i];
        this.timers.merging[i] -= dt;
        if (mergeTime < 0) {
          this.timers.merging.splice(i, 1);
        }
      }
      return Star.__super__.update.apply(this, arguments);
    };

    Star.prototype.render = function(ctx) {
      var _this = this;
      return this.withTransform(ctx, function() {
        var mergeTime, r, t, _i, _len, _ref1;
        _ref1 = _this.timers.merging;
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          mergeTime = _ref1[_i];
          t = mergeTime / Config.mergeDrawTime;
          r = lerp(1, 3, t);
          ctx.save();
          ctx.scale(r, r);
          GFX.drawLineString(ctx, Star.vertices, {
            closed: true
          });
          ctx.lineWidth = 1;
          ctx.fill();
          ctx.restore();
        }
        GFX.drawLineString(ctx, Star.vertices);
        if (_this.isSafe()) {
          ctx.strokeStyle = rainbow(3);
          ctx.fillStyle = rainbow(12);
        } else {
          ctx.strokeStyle = rainbow();
          ctx.fillStyle = 'white';
        }
        ctx.lineWidth = 2;
        ctx.fill();
        return ctx.stroke();
      });
    };

    return Star;

  })(Collidable);

  Star.radius = Config.starRadius;

  Star.radius2 = Config.starInnerRadius;

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

    Branch.nextID = 1;

    Branch.prototype.isDead = false;

    Branch.prototype.highestAltitude = 0;

    Branch.prototype.forkDistance = Config.branchDistanceMax;

    Branch.prototype.knotSpacing = Config.knotSpacing;

    Branch.prototype.distanceTravelled = 0;

    Branch.prototype.lastKnotDistance = 0;

    Branch.prototype.root = null;

    Branch.prototype.star = null;

    Branch.prototype.tip = null;

    Branch.prototype.knots = null;

    Branch.prototype.isGrowing = function() {
      return this.star != null;
    };

    function Branch(parent) {
      this.parent = parent;
      this.id = Branch.nextID++;
      if (this.parent instanceof Branch) {
        this.root = new Vec(this.parent.tip);
      } else {
        this.root = new Vec(this.parent);
        this.parent = null;
      }
      this.tip = new Vec(this.root);
      this.knots = [];
      this.doKnot();
    }

    Branch.prototype.setStar = function(star) {
      var _ref1;
      if ((_ref1 = star.branch) != null) {
        _ref1.star = null;
      }
      star.branch = this;
      this.star = star;
      return this.tip = this.star.position;
    };

    Branch.prototype.update = function(dt) {
      if (this.star != null) {
        this.distanceTravelled += this.star.velocity.length();
        if (this.distanceTravelled - this.lastKnotDistance > this.knotSpacing) {
          return this.doKnot();
        }
      }
    };

    Branch.prototype.render = function(ctx) {
      ctx.beginPath();
      GFX.drawLineString(ctx, this.knots, {
        more: [this.tip]
      });
      ctx.lineWidth = Config.branchWidth;
      ctx.strokeStyle = rainbow();
      ctx.fillStyle = rainbow();
      ctx.stroke();
      return ctx.lineWidth = 1;
    };

    Branch.prototype.doKnot = function() {
      var _ref1;
      this.knots.push(new Vec(this.tip));
      if ((_ref1 = this.star) != null) {
        _ref1.angle += (Math.random() - 0.5) * Config.knotAngleJitter;
      }
      this.lastKnotDistance = this.distanceTravelled;
      if (-this.tip.y > this.highestAltitude) {
        return this.highestAltitude = -this.tip.y;
      }
    };

    Branch.prototype.die = function() {
      return this.isDead = true;
    };

    Branch.prototype.stop = function() {
      this.tip = new Vec(this.tip);
      return this.star = null;
    };

    Branch.prototype.forkable = function() {
      return this.distanceTravelled > this.forkDistance;
    };

    return Branch;

  })(Thing);

  Nova = (function(_super) {
    __extends(Nova, _super);

    Nova.prototype.isDead = false;

    function Nova(star) {
      this.position = new Vec(star.position);
      this.angle = new Vec(star.angle);
      this.scale = 1.0;
      this.time = 0;
    }

    Nova.prototype.update = function(dt) {
      this.scale += dt * Config.novaExplosionSpeed;
      this.time += dt;
      if (this.radius() > Config.novaMaxRadius) {
        return this.die();
      }
    };

    Nova.prototype.radius = function() {
      return Star.radius * this.scale;
    };

    Nova.prototype.die = function() {
      return this.isDead = true;
    };

    Nova.prototype.render = function(ctx) {
      var _this = this;
      return this.withTransform(ctx, function() {
        GFX.drawLineString(ctx, Star.vertices, {
          closed: true
        });
        ctx.lineWidth = Config.novaStrokeWidth * Star.radius / Math.pow(_this.radius(), 0.75);
        ctx.strokeStyle = rainbow(10);
        return ctx.stroke();
      });
    };

    return Nova;

  })(Thing);

  Obstacle = (function(_super) {
    __extends(Obstacle, _super);

    function Obstacle(position, velocity) {
      this.position = position;
      this.velocity = velocity;
      if (this.velocity == null) {
        this.velocity = new Vec(0, 0);
      }
      this.angle = 0;
    }

    Obstacle.prototype.update = function() {
      this.position.add(this.velocity);
      return Obstacle.__super__.update.apply(this, arguments);
    };

    return Obstacle;

  })(Collidable);

  Balloon = (function(_super) {
    __extends(Balloon, _super);

    Balloon.prototype.angAccel = Math.PI / 4;

    function Balloon() {
      var dim, topdim;
      Balloon.__super__.constructor.apply(this, arguments);
      this.angle = Math.random() * Math.PI / 4;
      this.angVel = Math.random() * 0.02;
      this.sprite = new Sprite({
        image: Config.images.balloon,
        offset: new Vec(44, 62)
      });
      topdim = [90, 126];
      dim = [75, 75];
      this.qbox = new QuadtreeBox({
        position: this.position,
        offset: new Vec(this.sprite.offset.x - (topdim[0] - dim[0]) / 2, this.sprite.offset.y - (topdim[1] - dim[1]) / 2),
        dimensions: dim,
        object: this
      });
    }

    Balloon.prototype.update = function(dt) {
      Balloon.__super__.update.apply(this, arguments);
      if (this.angle < 0) {
        this.angVel += this.angAccel * dt;
      } else {
        this.angVel -= this.angAccel * dt;
      }
      return this.angle += this.angVel * dt;
    };

    Balloon.prototype.render = function(ctx) {
      return this.sprite.draw({
        position: this.position,
        rotation: this.angle
      })(ctx);
    };

    return Balloon;

  })(Obstacle);

  Cloud = (function() {
    function Cloud(position, velocity) {
      this.position = position;
      this.velocity = velocity;
      if (this.velocity == null) {
        this.velocity = new Vec(0, 0);
      }
      this.sprite = new Sprite({
        image: Config.images.cloud,
        offset: new Vec(128 / 2, 90 / 2)
      });
    }

    Cloud.prototype.update = function() {
      return this.position.add(this.velocity);
    };

    Cloud.prototype.render = function(ctx) {
      return this.sprite.draw({
        position: this.position
      })(ctx);
    };

    return Cloud;

  })();

  Cookie = (function(_super) {
    __extends(Cookie, _super);

    function Cookie() {
      Cookie.__super__.constructor.apply(this, arguments);
      this.angVel = Math.random() * 0.05;
      this.sprite = new Sprite({
        image: Config.images.cookie,
        offset: new Vec(90, 90)
      });
      this.qbox = new QuadtreeBox({
        position: this.position,
        offset: new Vec(70, 70),
        dimensions: [140, 140],
        object: this
      });
    }

    Cookie.prototype.update = function() {
      this.angle += this.angVel;
      return Cookie.__super__.update.apply(this, arguments);
    };

    Cookie.prototype.render = function(ctx) {
      return this.sprite.draw({
        position: this.position,
        rotation: this.angle
      })(ctx);
    };

    return Cookie;

  })(Obstacle);

  Satellite = (function(_super) {
    __extends(Satellite, _super);

    function Satellite() {
      Satellite.__super__.constructor.apply(this, arguments);
      this.angVel = Math.random() * 0.05;
      this.sprite = new Sprite({
        image: Config.images.satellite,
        offset: new Vec(60, 60)
      });
      this.qbox = new QuadtreeBox({
        position: this.position,
        offset: new Vec(40, 40),
        dimensions: [80, 80],
        object: this
      });
    }

    Satellite.prototype.update = function() {
      this.angle += this.angVel;
      return Satellite.__super__.update.apply(this, arguments);
    };

    Satellite.prototype.render = function(ctx) {
      return this.sprite.draw({
        position: this.position,
        rotation: this.angle
      })(ctx);
    };

    return Satellite;

  })(Obstacle);

  Balloon.spriteImage = Config.images.balloon;

  Cloud.spriteImage = Config.images.cloud;

  Cookie.spriteImage = Config.images.cookie;

  Satellite.spriteImage = Config.images.satellite;

  PlayState = (function(_super) {
    __extends(PlayState, _super);

    PlayState.prototype.highestStar = null;

    PlayState.prototype.heightAchieved = 0;

    PlayState.prototype.view = null;

    PlayState.prototype.viewHUD = null;

    PlayState.prototype.quadtree = Quadtree.create(1000, 100000);

    PlayState.prototype.multiplier = 1;

    PlayState.prototype.obstacles = null;

    PlayState.prototype.clouds = null;

    PlayState.prototype.novae = null;

    PlayState.prototype.stars = null;

    PlayState.prototype.branches = null;

    function PlayState() {
      var numRainbowColors, p;
      numRainbowColors = 256;
      this.rainbowColors = (function() {
        var _i, _results;
        _results = [];
        for (p = _i = 0; 0 <= numRainbowColors ? _i <= numRainbowColors : _i >= numRainbowColors; p = 0 <= numRainbowColors ? ++_i : --_i) {
          _results.push(tinycolor("hsv(" + (p * 100 / numRainbowColors) + "%, 50%, 100%)").toRgbString());
        }
        return _results;
      })();
      this.obstacles = [];
      this.clouds = [];
      this.novae = [];
      this.stars = [];
      this.branches = [];
    }

    PlayState.prototype.initialize = function() {
      var branch, star;
      star = new Star(new Vec(0, 0), -Math.PI / 2);
      this.stars.push(star);
      branch = new Branch(new Vec(0, 0));
      branch.setStar(star);
      return this.branches.push(branch);
    };

    PlayState.prototype.enter = function() {
      if (this.view == null) {
        this.view = new Viewport(this.game.canvas, {
          scroll: new Vec(0, 0),
          anchor: 'center'
        });
      }
      return this.viewHUD != null ? this.viewHUD : this.viewHUD = new Viewport(this.game.canvas, {
        scroll: new Vec(0, 0)
      });
    };

    PlayState.prototype.exit = function() {};

    PlayState.prototype.update = function(dt) {
      var branch, h, left, newStar, right, star, t, viewBottom, w, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
      this.quadtree.reset();
      _ref1 = this.novae;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        t = _ref1[_i];
        t.update(dt);
      }
      _ref2 = this.obstacles;
      for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
        t = _ref2[_j];
        t.update(dt);
      }
      _ref3 = this.clouds;
      for (_k = 0, _len2 = _ref3.length; _k < _len2; _k++) {
        t = _ref3[_k];
        t.update(dt);
      }
      this.addObstacles(dt);
      _ref4 = this.stars;
      for (_l = 0, _len3 = _ref4.length; _l < _len3; _l++) {
        star = _ref4[_l];
        if (this.game.mouse.leftButton) {
          star.attraction = this.view.screen2world(this.game.mouse.position);
        } else {
          star.attraction = null;
        }
        star.update(dt);
        branch = star.branch;
        if (Config.autoFork && branch.forkable()) {
          left = new Branch(branch);
          right = new Branch(branch);
          newStar = new Star(new Vec(branch.tip), star.angle);
          left.setStar(newStar);
          right.setStar(star);
          newStar.angle -= Config.branchAngle;
          star.angle += Config.branchAngle;
          this.stars.push(newStar);
          branch.stop();
          this.branches.push(left);
          this.branches.push(right);
        }
      }
      this.handleCollision();
      this.bringOutTheDead();
      $('body').css({
        'background-position': "0 " + (this.heightAchieved / 10) + "px"
      });
      if (this.stars.length > 0) {
        viewBottom = this.view.worldQuad().bottom();
        _ref5 = this.branches;
        for (_m = 0, _len4 = _ref5.length; _m < _len4; _m++) {
          branch = _ref5[_m];
          branch.update(dt);
          if ((branch.star == null) && branch.highestAltitude < -viewBottom) {
            branch.die();
          }
        }
        this.highestStar = _.min(this.stars, function(s) {
          return s.position.y;
        });
        _ref6 = this.view.dimensions(), w = _ref6[0], h = _ref6[1];
        if (-((_ref7 = this.highestStar) != null ? _ref7.position.y : void 0) > this.heightAchieved) {
          this.heightAchieved = -this.highestStar.position.y;
        }
        this.view.scroll.y = Math.max(0, this.heightAchieved);
        return this.multiplier = this.stars.length;
      }
    };

    PlayState.prototype.render = function() {
      var fillstroke,
        _this = this;
      fillstroke = function(ctx, x, y, text) {
        ctx.fillText(text, x, y);
        return ctx.strokeText(text, x, y);
      };
      this.view.clearScreen(this.skyColor(this.heightAchieved));
      this.view.draw(function(ctx) {
        var box, t, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _m, _n, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _results;
        _ref1 = _this.novae;
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          t = _ref1[_i];
          t.render(ctx);
        }
        _ref2 = _this.branches;
        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
          t = _ref2[_j];
          t.render(ctx);
        }
        _ref3 = _this.stars;
        for (_k = 0, _len2 = _ref3.length; _k < _len2; _k++) {
          t = _ref3[_k];
          t.render(ctx);
        }
        _ref4 = _this.obstacles;
        for (_l = 0, _len3 = _ref4.length; _l < _len3; _l++) {
          t = _ref4[_l];
          t.render(ctx);
        }
        _ref5 = _this.clouds;
        for (_m = 0, _len4 = _ref5.length; _m < _len4; _m++) {
          t = _ref5[_m];
          t.render(ctx);
        }
        if (Config.debugDraw) {
          _ref6 = _this.quadtree.getObjects();
          _results = [];
          for (_n = 0, _len5 = _ref6.length; _n < _len5; _n++) {
            box = _ref6[_n];
            ctx.beginPath();
            ctx.rect(box.left, box.top, box.width, box.height);
            ctx.strokeStyle = 'red';
            _results.push(ctx.stroke());
          }
          return _results;
        }
      });
      if (this.isActive()) {
        return this.viewHUD.draw(function(ctx) {
          var altitudeText, altitudeTextWidth;
          ctx.font = "60px " + Config.hudFont;
          ctx.strokeStyle = '#aaa';
          ctx.fillStyle = '#eee';
          ctx.lineWidth = 1.5;
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          altitudeText = parseInt(_this.heightAchieved / 1000) + 'km';
          ctx.fillText(altitudeText, 50, 100);
          ctx.strokeText(altitudeText, 50, 100);
          altitudeTextWidth = ctx.measureText(altitudeText).width;
          if (_this.multiplier > 0) {
            ctx.font = "30px " + Config.hudFont;
            return fillstroke(ctx, 50 + altitudeTextWidth + 25, 100, "★x" + _this.multiplier);
          }
        });
      }
    };

    PlayState.prototype.skyColor = function(height) {
      var alpha, alphaHi, alphaLo, b, colorHi, colorLo, g, heightHi, heightLo, hi, layer, layerHi, layerLo, layers, lo, r, t, _i, _len, _ref1;
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
      _ref1 = tinycolor({
        r: lerp(lo.r, hi.r, t),
        g: lerp(lo.g, hi.g, t),
        b: lerp(lo.b, hi.b, t)
      }).toRgb(), r = _ref1.r, g = _ref1.g, b = _ref1.b;
      return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
    };

    PlayState.prototype.addObstacles = function(dt) {
      var make, prob, randomSpotOffscreen, viewQuad, viewVolume,
        _this = this;
      viewQuad = this.view.worldQuad();
      viewVolume = viewQuad.width() * viewQuad.height();
      prob = function(probFn, callback) {
        if (Math.random() < dt * probFn(_this.heightAchieved)) {
          return callback();
        }
      };
      randomSpotOffscreen = function(objectHeight) {
        var x, y, y0, y1;
        if (objectHeight == null) {
          objectHeight = 0;
        }
        x = _.random(viewQuad.left(), viewQuad.right());
        y1 = viewQuad.top() - objectHeight;
        y0 = y1 - 100;
        y = Math.random() * (y1 - y0) + y0;
        return new Vec(x, y);
      };
      make = function(klass, vel) {
        return new klass(randomSpotOffscreen(klass.spriteImage.image.height), vel);
      };
      prob(Config.probability.cloud, function() {
        return _this.clouds.push(make(Cloud, new Vec(_.random(2, 5), 0)));
      });
      return prob(Config.probability.balloon, function() {
        return _this.obstacles.push(make(Balloon, new Vec(_.random(-2, 2), 0)));
      });
    };

    PlayState.prototype.transition = function() {
      if (this.stars.length === 0) {
        return this.game.pushState(new GameOverState);
      }
    };

    PlayState.prototype.bringOutTheDead = function() {
      var deadBranches, deadNovae, deadStars, t;
      deadStars = (function() {
        var _i, _len, _ref1, _results;
        _ref1 = this.stars;
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          t = _ref1[_i];
          if (t.isDead) {
            _results.push(t);
          }
        }
        return _results;
      }).call(this);
      deadBranches = (function() {
        var _i, _len, _ref1, _results;
        _ref1 = this.branches;
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          t = _ref1[_i];
          if (t.isDead) {
            _results.push(t);
          }
        }
        return _results;
      }).call(this);
      deadNovae = (function() {
        var _i, _len, _ref1, _results;
        _ref1 = this.novae;
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          t = _ref1[_i];
          if (t.isDead) {
            _results.push(t);
          }
        }
        return _results;
      }).call(this);
      this.stars = _.difference(this.stars, deadStars);
      this.branches = _.difference(this.branches, deadBranches);
      return this.novae = _.difference(this.novae, deadNovae);
    };

    PlayState.prototype.handleCollision = function(objects) {
      var alreadyHandled, deathQuad, hit, hits, ob, obstacles, rawhits, s, star, stargroup, _i, _j, _k, _len, _len1, _len2, _ref1, _ref2, _results,
        _this = this;
      alreadyHandled = [];
      deathQuad = this.deathQuad();
      _ref1 = this.stars;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        star = _ref1[_i];
        if (!star.isDead) {
          if (!deathQuad.onQuad(star.qbox.quad())) {
            this.killStar(star);
          } else if (!star.isSafe()) {
            rawhits = star.qbox.getHits(this.quadtree);
            hits = rawhits.filter(function(h) {
              return h.object !== star && h.quad().onQuad(star.qbox.quad());
            });
            if (hits.length > 0) {
              obstacles = (function() {
                var _j, _len1, _results;
                _results = [];
                for (_j = 0, _len1 = hits.length; _j < _len1; _j++) {
                  hit = hits[_j];
                  if (!(hit.object instanceof Star)) {
                    _results.push(hit.object);
                  }
                }
                return _results;
              })();
              stargroup = (function() {
                var _j, _len1, _results;
                _results = [];
                for (_j = 0, _len1 = hits.length; _j < _len1; _j++) {
                  hit = hits[_j];
                  if (hit.object instanceof Star) {
                    _results.push(hit.object);
                  }
                }
                return _results;
              })();
              stargroup.push(star);
              console.log(stargroup, obstacles);
              if (obstacles.length > 0) {
                for (_j = 0, _len1 = stargroup.length; _j < _len1; _j++) {
                  s = stargroup[_j];
                  this.killStar(s);
                }
              } else {
                this.mergeStars(stargroup);
              }
            }
          }
        }
      }
      _ref2 = this.obstacles;
      _results = [];
      for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
        ob = _ref2[_k];
        _results.push((function() {
          var _l, _len3, _ref3, _results1;
          _ref3 = ob.qbox.getHits(this.quadtree);
          _results1 = [];
          for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
            hit = _ref3[_l];
            if (hit.object instanceof Star && !hit.object.isDead && hit.quad().onQuad(ob.qbox.quad())) {
              _results1.push(this.killStar(hit.object));
            } else {
              _results1.push(void 0);
            }
          }
          return _results1;
        }).call(this));
      }
      return _results;
    };

    PlayState.prototype.deathQuad = function() {
      var h, w, x, y, _ref1;
      _ref1 = this.view.worldQuad(), x = _ref1.x, y = _ref1.y, w = _ref1.w, h = _ref1.h;
      x -= Config.autokillTolerance.x;
      w += 2 * Config.autokillTolerance.x;
      h += Config.autokillTolerance.y;
      return new Quad(x, y, w, h);
    };

    PlayState.prototype.killStar = function(star) {
      this.novae.push(new Nova(star));
      return star.die();
    };

    PlayState.prototype.mergeStars = function(stars) {
      var highest, star, _i, _len, _ref1, _results;
      highest = _.max(stars, function(s) {
        return -s.position.y;
      });
      console.log('merge', highest);
      _ref1 = _.without(stars, highest);
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        star = _ref1[_i];
        _results.push(star.merge(highest));
      }
      return _results;
    };

    PlayState.prototype.novaProfiling = function() {
      if (this.novae.length > 0 && !window.profiling) {
        console.profile(Math.random());
        return window.profiling = true;
      } else if (window.profiling && this.novae.length === 0) {
        console.profileEnd();
        return window.profiling = false;
      }
    };

    return PlayState;

  })(GameState);

  GameOverState = (function(_super) {
    __extends(GameOverState, _super);

    function GameOverState() {
      _ref1 = GameOverState.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    GameOverState.prototype.initialize = function() {
      var _this = this;
      return _.delay(function() {
        return _this.bind(_this.game.canvas, 'click', function(e) {
          var game;
          game = _this.game;
          game.popState();
          game.popState();
          return game.pushState(new PlayState);
        });
      }, 1000);
    };

    GameOverState.prototype.enter = function() {
      return this.view = this.parent.viewHUD;
    };

    GameOverState.prototype.exit = function() {};

    GameOverState.prototype.update = function(dt) {
      var t, _i, _len, _ref2, _results;
      _ref2 = this.parent.novae;
      _results = [];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        t = _ref2[_i];
        _results.push(t.update(dt * Config.gameOverSlowdown));
      }
      return _results;
    };

    GameOverState.prototype.render = function(ctx) {
      var b, g, r, view, _ref2,
        _this = this;
      this.parent.render(ctx);
      _ref2 = tinycolor(rainbow()).toRgb(), r = _ref2.r, g = _ref2.g, b = _ref2.b;
      view = this.view;
      view.fillScreen("rgba(" + r + "," + g + "," + b + ",0.75)");
      return view.draw(function(ctx) {
        var color, font, height, line, lines, text, width, x, y, _i, _len, _results;
        ctx.lineWidth = 1.5;
        ctx.fillStyle = '#222';
        ctx.strokeStyle = '#222';
        lines = [
          {
            text: "YOU ASCENDED",
            font: "70px " + Config.mainFont,
            height: 70
          }, {
            text: "" + (parseInt(_this.parent.heightAchieved)) + " meters",
            font: "100px " + Config.mainFont,
            height: 100
          }, {
            text: "click to begin anew",
            font: "80px " + Config.mainFont,
            height: 100,
            color: 'white'
          }
        ];
        y = 100;
        _results = [];
        for (_i = 0, _len = lines.length; _i < _len; _i++) {
          line = lines[_i];
          text = line.text, font = line.font, height = line.height, color = line.color;
          if (color != null) {
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
          }
          ctx.font = font;
          width = ctx.measureText(text).width;
          x = view.width() / 2 - width / 2;
          y += height * 1.5;
          _results.push(ctx.strokeText(text, x, y));
        }
        return _results;
      });
    };

    return GameOverState;

  })(GameState);

  (function() {
    var numRainbowColors, p, rainbowColors;
    globals.rainbowIndex = 0;
    numRainbowColors = 256;
    rainbowColors = (function() {
      var _i, _results;
      _results = [];
      for (p = _i = 0; 0 <= numRainbowColors ? _i <= numRainbowColors : _i >= numRainbowColors; p = 0 <= numRainbowColors ? ++_i : --_i) {
        _results.push(tinycolor("hsv(" + (p * 100 / numRainbowColors) + "%, 50%, 100%)").toRgbString());
      }
      return _results;
    })();
    return window.rainbow = function(factor) {
      if (factor == null) {
        factor = 1;
      }
      return rainbowColors[(globals.rainbowIndex * factor) % rainbowColors.length];
    };
  })();

  $(function() {
    var Game, states;
    states = {
      play: new PlayState
    };
    Game = new GameEngine({
      canvas: $('#game').get(0),
      initialState: states.play,
      fps: 50,
      preUpdate: function() {
        return globals.rainbowIndex += 1;
      }
    });
    globals.quadtree = states.play.quadtree;
    globals.rainbowIndex = 0;
    return Game.start();
  });

}).call(this);
