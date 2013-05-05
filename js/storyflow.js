/**
 * Storyflow widget.
 *
 * Requires the Raphael.js library.
 *
 * Visit our homepage at http://storyflow.net
 */

(function() {
  var Storyflow = {};

  Storyflow.Widget = (function() {

    function Widget(options) {
      var _this = this;
      if (!(this instanceof Storyflow.Widget)) {
        return new Storyflow.Widget(options);
      }
      this.el = $(document.getElementById(options.element));
      if (this.el === null || this.el.length === 0) {
        throw new Error("Graph placeholder not found.");
      }
      this.options = $.extend({}, this.defaults, options);
      if (typeof this.options.units === 'string') {
        this.options.postUnits = options.units;
      }
      if (this.options.data === void 0 || this.options.data.length === 0) {
        return;
      }
      this.el.addClass('graph-initialised');
      this.r = new Raphael(this.el[0]);
      
      this.indicator = null;
      this.indicatorTop = null;
      this.indicatorBottom = null;
      this.cMap = {1: {0:0}, 2: {0:1, 1:0}, 3: {0:2, 1:0, 2:1}, 4: {0:3, 1:0, 2:2, 3:1}};
      
      this.r.customAttributes.arc = function (value, total, sum, innerR, ringWidth, ps, cx, cy) {
        var outerR = innerR + ringWidth,
          alpha = 360 * value / total,
          beta = 360 * _this.cMap[total][sum] / total,
          a1 = (90 - beta) * Math.PI / 180,
          a2 = (90 - (alpha + beta)) * Math.PI / 180,
          x0 = cx + innerR * Math.cos(a1),
          y0 = cy - innerR * Math.sin(a1),
          x1 = cx + outerR * Math.cos(a1),
          y1 = cy - outerR * Math.sin(a1),
          x2 = cx + outerR * Math.cos(a2),
          y2 = cy - outerR * Math.sin(a2),
          x3 = cx + innerR * Math.cos(a2),
          y3 = cy - innerR * Math.sin(a2);
        
        var path = [["M", x1, y1], ["A", outerR, outerR, 0, +(alpha > 180), 1, x2, y2], ["L", x3, y3], ["A", innerR, innerR, 0, +(alpha > 180), 0, x0, y0], ["z"]];
        
        return {path: path};
      };
      
      this.pointGrow = Raphael.animation({
        r: this.options.pointSizeActive
      }, 200, 'linear');
      this.pointShrink = Raphael.animation({
        r: this.options.pointSize
      }, 200, 'linear');
      this.ringGrow = function(elem) {
        var earc = elem.attrs.arc;
        earc[3] = this.options.pointSizeActive + this.options.gapSizeActive;
        elem.animate({
          arc: earc
        }, 0, 'linear');
        earc[4] = this.options.ringWidthActive + this.options.ringWidthActivePlus * earc[5];
        elem.animate({
          arc: earc
        }, 0, 'linear');
        elem.toFront();
      }
      this.ringShrink = function(elem) {
        var earc = elem.attrs.arc;
        earc[3] = this.options.pointSize + this.options.gapSize;
        earc[4] = this.options.ringWidth;
        elem.animate({
          arc: earc
        }, 0, 'linear');
      }
      this.activeHover = null;
      this.hoveract = function() {
        if (_this.seriesCoords.length < 2) {
          return;
        }
        var _i = Math.floor(Math.random()*_this.seriesCoords.length);
        if (_i != _this.activeHover) {
          _this.activeHover = _i;
          _this.highlight(_i);
        } else {
          _this.hoveract();
        }
      };
      this.activeImage = null;
      this.elementWidth = null;
      this.elementHeight = null;
      this.dirty = false;
      this.prevHighlight = null;
      this.el.mousemove(function(evt) {
        _this.updateHighlight(evt.pageX, evt.pageY);
      });
      this.el.mouseleave(function(evt) {
        if (!_this.interval) {
          // TODO only restart if also leaving the tooltip area
          //_this.interval = window.setInterval(_this.hoveract, 3000);
        }
      });
      this.touchHandler = function(evt) {
        var x, y, _item, touch;
        
        touch = evt.originalEvent.touches[0] || evt.originalEvent.changedTouches[0];
        _item = _this.seriesCoords[_this.activeHover];
        x = touch.pageX - this.el.offset().left;
        y = touch.pageY - this.el.offset().top;
        if (Storyflow.inRange(_item.x, _item.y, x, y, _this.options.pointSizeActive)) {
          _this.updateHighlight(touch.pageX, touch.pageY);
          return false;
        }
      };
      this.el.bind('touchstart', this.touchHandler);
      this.el.bind('touchmove', this.touchHandler);
      this.el.bind('touchend', this.touchHandler);
      this.setData(this.options.data);
      this.interval = window.setInterval(this.hoveract, 3000);
    }

    Widget.prototype.defaults = {
      pointSize: 5,
      pointSizeActive: 15,
      ringWidth: 3,
      ringWidthActive: 5,
      ringWidthActivePlus: 35,
      gapSize: 2,
      gapSizeActive: 4,
      pointColor: '#aaa',
      lineColors: ['#d00012', '#31aad4', '#fcc637', '#be3d8f'],
      xmax: 'auto '+Date.now(),
      xmin: 'auto '+(Date.now() - 365*24*60*60*1000),
      ymax: 'auto 100',
      ymin: 'auto 0',
      ysections: 4,
      marginTop: 25,
      marginRight: 0,
      marginBottom: 30,
      marginLeft: 10,
      yearBoxSize: 12,
      yearBoxValue: function(x) { return new Date(x).getFullYear(); },
      yearBoxMarginTop: 2,
      yearBoxMarginBottom: 0,
      yearBoxLabelColor: '#fff',
      gridColor: '#aaa',
      gridStrokeWidth: 0.5,
      textColor: '#888',
      textSize: 10,
      drawXLabels: true,
      xLabelMargin: 5,
      xLabelUnit: 'month',
      xLabelFormat: function (x) { return x.getMonth() + 1; },
      indicatorColor: '#555',
      indicatorWidth: 1
    };

    Widget.prototype.setData = function(data, redraw) {
      var d, _i, _ref,
        _this = this;
      if (redraw == null) {
        redraw = true;
      }
      this.options.data = data.slice(0);
      this.options.data.sort(function(a, b) {
        return (a.date < b.date) - (b.date < a.date);
      });
      this.series = [];
      _ref = this.options.data;
      for (_i = 0; _i < _ref.length; _i++) {
        d = _ref[_i];
        this.series.push((function() {
          switch (typeof d['score']) {
            case 'number':
              return d['score'];
            case 'string':
              return parseFloat(d['score']);
            default:
              return null;
          }
        })());
      }
      this.xvals = $.map(this.options.data, function(d) {
        return d.date;
      });
      if (typeof this.options.xmax === 'string' && this.options.xmax.slice(0, 4) === 'auto') {
        xmax = Math.max.apply(null, this.xvals);
        if (this.options.xmax.length > 5) {
          this.xmax = Math.max(parseInt(this.options.xmax.slice(5), 10), xmax);
        } else {
          this.xmax = xmax;
        }
      }
      if (typeof this.options.xmin === 'string' && this.options.xmin.slice(0, 4) === 'auto') {
        xmin = Math.min.apply(null, this.xvals);
        if (this.options.xmin.length > 5) {
          this.xmin = Math.min(parseInt(this.options.xmin.slice(5), 10), xmin);
        } else {
          this.xmin = xmin;
        }
      }
      if (this.xmin === this.xmax) {
        this.xmin -= 1;
        this.xmax += 1;
      }
      
      if (typeof this.options.ymax === 'string' && this.options.ymax.slice(0, 4) === 'auto') {
        ymax = Math.max.apply(null, this.series);
        if (this.options.ymax.length > 5) {
          this.ymax = Math.max(parseInt(this.options.ymax.slice(5), 10), ymax);
        } else {
          this.ymax = ymax;
        }
      }
      if (typeof this.options.ymin === 'string' && this.options.ymin.slice(0, 4) === 'auto') {
        ymin = Math.min.apply(null, this.series);
        if (this.options.ymin.length > 5) {
          this.ymin = Math.min(parseInt(this.options.ymin.slice(5), 10), ymin);
        } else {
          this.ymin = ymin;
        }
      }
      if (this.ymin === this.ymax) {
        this.ymin -= 1;
        this.ymax += 1;
      }
      this.yInterval = (this.ymax - this.ymin) / (this.options.ysections);
      if (this.yInterval > 0 && this.yInterval < 1) {
        this.precision = -Math.floor(Math.log(this.yInterval) / Math.log(10));
      } else {
        this.precision = 0;
      }
      this.dirty = true;
      if (redraw) {
        this.redraw();
      }
    };

    Widget.prototype.calc = function() {
      var h, w, x, _i, _len, _ref,
        _this = this;
      w = this.el.width();
      h = this.el.height();
      if (this.elementWidth !== w || this.elementHeight !== h || this.dirty) {
        this.elementWidth = w;
        this.elementHeight = h;
        this.dirty = false;
        this.width = this.el.width() - this.options.marginLeft - this.options.marginRight;
        this.height = this.el.height() - this.options.marginTop - this.options.marginBottom;
        if (this.options.yearBoxSize) {
          this.height -= this.options.yearBoxSize - this.options.yearBoxMarginTop - this.options.yearBoxMarginBottom;
        }
        this.dx = this.width / (this.xmax - this.xmin);
        this.dy = this.height / (this.ymax - this.ymin);
        
        this.seriesCoords = [];
        _ref = this.xvals;
        _ref2 = this.series;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          this.seriesCoords.push({
            x: _this.transX(_ref[_i]),
            y: _this.transY(_ref2[_i])
          });
        }
        
        this.seriesPoints = [];
        this.seriesRings = [];
      }
    };

    Widget.prototype.transX = function(x) {
      if (this.xvals.length === 1) {
        return this.options.marginLeft + this.width / 2;
      } else {
        return this.options.marginLeft + (x - this.xmin) * this.dx;
      }
    };

    Widget.prototype.transY = function(y) {
      return this.options.marginTop + this.height - (y - this.ymin) * this.dy;
    };

    Widget.prototype.redraw = function() {
      this.r.clear();
      this.calc();
      this.drawGrid();
      this.drawSeries();
      this.highlight(0);
    };

    Widget.prototype.drawGrid = function() {
      var drawTick, drawLabel, firstY, l, lastY, lineY, prevLabelMargin, v, y, yposTick, yposLabel, prevYear, _i, _j, _li, _len, _ref, _ref1, popLabel, popBox, ml, mt, ts, tc, gsw, gc,
        _this = this;
      
      ml = this.options.marginLeft;
      mt = this.options.marginTop;
      ts = this.options.textSize;
      tc = this.options.textColor;
      gsw = this.options.gridStrokeWidth;
      gc = this.options.gridColor;
      
      firstY = this.ymin;
      lastY = this.ymax;
      for (lineY = _i = firstY, _ref = this.yInterval; firstY <= lastY ? _i <= lastY : _i >= lastY; lineY = _i += _ref) {
        v = parseFloat(lineY.toFixed(this.precision));
        y = this.transY(v);
        this.r.path("M" + ml + "," + y + "H" + (ml + this.width)).attr('stroke', gc).attr('stroke-width', gsw);
      }
      
      this.r.image('http://api.storyflow.net/images/sf-grad.jpg', 0, mt, 8, 236);
      
      popLabel = this.r.text(0, mt - ts, 'Popularity').attr('font-size', ts).attr('fill', tc);
      popBox = popLabel.getBBox();
      popLabel.attr({'x':popBox.width/2});
      
      this.r.path("M" + ml + "," + mt + "V" + (mt + this.height)).attr('stroke', gc).attr('stroke-width', gsw);
      this.r.path("M" + (ml + this.width) + "," + mt + "V" + (mt + this.height)).attr('stroke', gc).attr('stroke-width', gsw);
      
      yposTick = mt + this.height;
      yposLabel = mt + this.height + this.options.marginBottom / 2;
      if (this.options.yearBoxSize) {
        this.r.path("M" + ml + "," + (yposTick + this.options.yearBoxSize/2 + this.options.yearBoxMarginTop) + "H" + (ml + this.width)).attr('stroke', gc).attr('stroke-width', this.options.yearBoxSize);
        yposTick += this.options.yearBoxSize + this.options.yearBoxMarginTop + this.options.yearBoxMarginBottom;
        yposLabel += this.options.yearBoxSize + this.options.yearBoxMarginTop + this.options.yearBoxMarginBottom;
      }
      
      drawTick = function(drawPos) {
        _this.r.path("M" + drawPos + "," + yposTick + "V" + (yposTick + 5)).attr('stroke', gc).attr('stroke-width', 1);
        _this.r.path("M" + drawPos + "," + mt + "V" + (mt + _this.height)).attr('stroke', gc).attr('stroke-width', gsw/2);
      }
      
      prevLabelMargin = null;
      drawLabel = function(labelText, drawPos) {
        var label, labelBox;
        label = _this.r.text(drawPos, yposLabel, labelText).attr('font-size', ts).attr('fill', tc);
        labelBox = label.getBBox();
        if ((prevLabelMargin === null || prevLabelMargin <= labelBox.x) && labelBox.x >= 0 && (labelBox.x + labelBox.width) < _this.el.width()) {
          return prevLabelMargin = labelBox.x + labelBox.width + _this.options.xLabelMargin;
        } else {
          return label.remove();
        }
      };
      
      drawYears = function(prevYear, xpos, drawPos) {
        var thisYear, yposYear, thisYearLabel, thisYearLabelBox, prevYearLabel, prevYearLabelBox;
        
        thisYear = _this.options.yearBoxValue(xpos);
        yposYear = yposTick - _this.options.yearBoxSize/2 - _this.options.yearBoxMarginBottom;
        if (_j > 0 && thisYear != prevYear) {
          prevYearLabel = _this.r.text(drawPos, yposYear, prevYear).attr('font-size', ts).attr('font-weight', 'bold').attr('fill', _this.options.yearBoxLabelColor);
          prevYearLabelBox = prevYearLabel.getBBox();
          prevYearLabel.attr({'x':drawPos - prevYearLabelBox.width/2 - 2});
          
          _this.r.path("M" + drawPos + "," + (yposYear - _this.options.yearBoxSize/2) + "V" + (yposYear + _this.options.yearBoxSize/2)).attr('stroke', _this.options.yearBoxLabelColor).attr('stroke-width', 1);
          
          thisYearLabel = _this.r.text(drawPos, yposYear, thisYear).attr('font-size', ts).attr('font-weight', 'bold').attr('fill', _this.options.yearBoxLabelColor);
          thisYearLabelBox = thisYearLabel.getBBox();
          thisYearLabel.attr({'x':drawPos + thisYearLabelBox.width/2 + 2});
        }
        return thisYear;
      };
      
      prevYear = null;
      _ref1 = Storyflow.labelSeries(this.xmin, this.xmax, this.width, this.options.xLabelUnit, this.options.xLabelFormat);
      for (_j = 0, _len = _ref1.length; _j < _len; _j++) {
        l = _ref1[_j];
        drawPos = this.transX(l[1]);
        drawTick(drawPos);
        if (this.options.drawXLabels) {
          drawLabel(l[0], drawPos);
        }
        if (this.options.yearBoxSize) {
          prevYear = drawYears(prevYear, l[1], drawPos);
        }
      }
      
      this.indicator = this.r.path("M" + 0 + "," + 0 + "V" + 1).attr('stroke', this.options.indicatorColor).attr('stroke-width', this.options.indicatorWidth);
      this.indicatorTop = this.r.circle(0, 0, 3).attr('fill', this.options.indicatorColor).attr('stroke', this.options.indicatorColor);
      this.indicatorBottom = this.r.circle(0, 0, 3).attr('fill', this.options.indicatorColor).attr('stroke', this.options.indicatorColor);
      
      this.activeImage = this.r.image('http://api.storyflow.net/images/sf-doc.png', 20, 20, 16, 13);
      
      for (_li = 0; _li < this.options.keys.length; _li++) {
        $('<li id="sf-topic-'+(_li+1)+'" title="'+this.options.keys[_li]+'"><div class="sf-circle"></div><span href="#" onClick="javascript:return false;">'+this.options.keys[_li]+'</span></li>').appendTo('#sf-story-topics ul');
      }
    };

    Widget.prototype.drawSeries = function() {
      var c, circle, ring, rings, _i, _k, _ref, _ref3, _tsum, _t, _tc, _w, color;
      
      _ref = this.seriesCoords
      for (_k = 0; _k < _ref.length; _k++) {
        c = _ref[_k];
        circle = this.r.circle(c.x, c.y, this.options.pointSize).attr({fill: this.options.pointColor, stroke: this.options.pointColor, href:this.options.data[_k].link});
        this.seriesPoints.push(circle);
        
        _t = 0;
        _ref3 = this.options.data[_k].topicweights;
        for (_w = 0; _w < _ref3.length; _w++) {
          if (_ref3[_w]) {
            _t += 1;
          }
        }
        _tc = _t;
        if (_t == 1) {
          _tc = 2;
        }
        
        _tsum = 0;
        rings = []
        for (_i = 0; _i < this.options.keys.length; _i++) {
          if (_ref3[_i]) {
            color = this.options.lineColors[_i];
            ring = this.r.path().attr({"stroke-width": 0.5}).attr({arc: [1, _tc, _tsum, this.options.pointSize + this.options.gapSize, this.options.ringWidth, _ref3[_i], c.x, c.y], stroke: color, fill: color});
            rings.push(ring);
            if (_t == 1) {
              ring = this.r.path().attr({"stroke-width": 0.5}).attr({arc: [1, _tc,  1, this.options.pointSize + this.options.gapSize, this.options.ringWidth, _ref3[_i], c.x, c.y], stroke: color, fill: color});
              rings.push(ring);
            }
            _tsum += 1;
          }
        }
        this.seriesRings.push(rings);
      }
    };

    Widget.prototype.highlight = function(index) {
      var i, j, _ref, _ref1;
      if (this.prevHighlight !== null && this.prevHighlight !== index) {
        this.seriesPoints[this.prevHighlight].animate(this.pointShrink);
        _ref = this.seriesRings[this.prevHighlight];
        for (i = 0; i < _ref.length; i++) {
          this.ringShrink(_ref[i]);
        }
      }
      if (index !== null && this.prevHighlight !== index) {
        this.seriesPoints[index].animate(this.pointGrow).toFront();
        _ref1 = this.seriesRings[index];
        for (j = 0; j < _ref1.length; j++) {
          this.ringGrow(_ref1[j]);
        }
        this.updateHover(index);
      }
      this.prevHighlight = index;
    };
    
    Widget.prototype.updateHover = function(index) {
      var _li, hoverCoords, indicatorY;
      $('#sf-story-title a').html(this.options.data[index].title).attr('title', this.options.data[index].title).attr('href', this.options.data[index].link);
      $('#sf-story-topics ul li').removeClass('sf-topic-active');
      for (_li = 0; _li < this.options.keys.length; _li++) {
        if (this.options.data[index].topicweights[_li]) {
          $('#sf-story-topics ul #sf-topic-'+(_li+1)).addClass('sf-topic-active');
        } 
      }
      hoverCoords = this.seriesCoords[index];
      this.activeImage.attr({x:hoverCoords.x-8, y:hoverCoords.y-7, href:this.options.data[index].link}).toFront();
      indicatorY = hoverCoords.y - this.options.pointSizeActive/2 - this.options.ringWidthActive - this.options.ringWidthActivePlus - this.options.gapSizeActive;
      this.indicator.animate({path: "M" + hoverCoords.x + "," + 0 + "V" + indicatorY}, 200, 'linear');
      this.indicatorTop.animate({cx: hoverCoords.x}, 200, 'linear');
      this.indicatorBottom.animate({cx: hoverCoords.x, cy: indicatorY}, 200, 'linear');
    };

    Widget.prototype.updateHighlight = function(x, y) {
      var _i, _item;
      x -= this.el.offset().left;
      y -= this.el.offset().top;
      
      for (_i = 0; _i < this.seriesCoords.length; _i++) {
        _item = this.seriesCoords[_i];
        if (Storyflow.inRange(_item.x, _item.y, x, y, this.options.pointSizeActive)) {
          window.clearInterval(this.interval);
          this.interval = null;
          this.activeHover = _i;
          this.highlight(_i);
          return;
        }
      }
    };

    return Widget;
  })();
  
  Storyflow.inRange = function(x, y, x2, y2, r) {
    if (Math.sqrt(Math.pow(x2 - x, 2) + Math.pow(y2 - y, 2)) <= r) {
      return true;
    }
    return false;
  }

  Storyflow.pad2 = function(number) {
    return (number < 10 ? '0' : '') + number;
  };
  
  Storyflow.AUTO_LABEL_ORDER = ["year", "month", "day"];

  Storyflow.LABEL_SPECS = {
    "year": {
      span: 17280000000,
      start: function(d) {
        return new Date(d.getFullYear(), 0, 1);
      },
      fmt: function(d) {
        return "" + (d.getFullYear());
      },
      incr: function(d) {
        return d.setFullYear(d.getFullYear() + 1);
      }
    },
    "month": {
      span: 2419200000,
      start: function(d) {
        return new Date(d.getFullYear(), d.getMonth(), 1);
      },
      fmt: function(d) {
        return "" + (d.getFullYear()) + "-" + (Storyflow.pad2(d.getMonth() + 1));
      },
      incr: function(d) {
        return d.setMonth(d.getMonth() + 1);
      }
    },
    "day": {
      span: 86400000,
      start: function(d) {
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
      },
      fmt: function(d) {
        return "" + (d.getFullYear()) + "-" + (Storyflow.pad2(d.getMonth() + 1)) + "-" + (Storyflow.pad2(d.getDate()));
      },
      incr: function(d) {
        return d.setDate(d.getDate() + 1);
      }
    }
  };
  
  Storyflow.labelSeries = function(dmin, dmax, pxwidth, specName, xLabelFormat) {
    var d, d0, ddensity, name, ret, s, spec, t, _i, _len, _ref;
    ddensity = 200 * (dmax - dmin) / pxwidth;
    d0 = new Date(dmin);
    spec = Storyflow.LABEL_SPECS[specName];
    if (spec === void 0) {
      _ref = Storyflow.AUTO_LABEL_ORDER;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        name = _ref[_i];
        s = Storyflow.LABEL_SPECS[name];
        if (ddensity >= s.span) {
          spec = s;
          break;
        }
      }
    }
    if (spec === void 0) {
      spec = Storyflow.LABEL_SPECS["second"];
    }
    if (xLabelFormat) {
      spec = $.extend({}, spec, {
        fmt: xLabelFormat
      });
    }
    d = spec.start(d0);
    ret = [];
    while ((t = d.getTime()) <= dmax) {
      if (t >= dmin) {
        ret.push([spec.fmt(d), t]);
      }
      spec.incr(d);
    }
    return ret;
  };

  window.Storyflow = Storyflow;

}).call(this);
