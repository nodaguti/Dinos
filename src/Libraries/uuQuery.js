// uuQuery.js
// { version: "1.0", license: "MIT", author: "uupaa.js@gmail.com" }

// === uuMeta ===
// depend: none
/*
uuMeta.ie
uuMeta.opera
uuMeta.gecko
uuMeta.webkit
uuMeta.chrome
uuMeta.iphone
uuMeta.uaver
uuMeta.slver
uuMeta.flashver
uuMeta.enginever
uuMeta.iemode8
uuMeta.quirks
uuMeta.runstyle
uuMeta.hex
uuMeta.mix(base, flavor, aroma = undef, override = true) - return base
uuMeta.toArray(fake) - return array
--- event ---
uuMeta.event.bind(elm, eventName, fn, capture)
uuMeta.event.unbind(elm, eventName, fn, capture)
uuMeta.event.stop(evt)
 */
(function() {
var _meta,  // inner namespace
    _event, // inner namespace
    _win = window,
    _doc = document,
//  _int = parseInt,
    _float = parseFloat,
    _nu = navigator.userAgent,
    _ie = !!_doc.uniqueID,
    _opera = !!_win.opera,
    _webkit = _nu.indexOf("WebKit") > 0,
    _uaver = _opera ? opera.version() // Opera10 shock
                    : _float((/(?:IE |fox\/|ome\/|ion\/)(\d+\.\d+)/.
                             exec(_nu) || [,0])[1]),
    _slver = (function() {
      try {
        var a = ["1.0", "2.0", "3.0"], i = 3, ok,
            o = _ie ? new ActiveXObject("AgControl.AgControl")
                    : navigator.plugins["Silverlight Plug-In"];
        while (i--) {
          ok = _ie ? o.IsVersionSupported(a[i])
                   : _float(/\d+\.\d+/.exec(o.description)[0]) >= _float(a[i]);
          if (ok) {
            return _float(a[i]);
          }
        }
      } catch(err) {}
      return 0;
    })(),
    _flashver = (function() {
      try {
        var o = _ie ? new ActiveXObject("ShockwaveFlash.ShockwaveFlash")
                    : navigator.plugins["Shockwave Flash"],
            v = _ie ? o.GetVariable("$version").replace(/,/g, ".")
                    : o.description,
            m = /\d+\.\d+/.exec(v);
        return m ? _float(m[0], 10) : 0;
      } catch(err) {}
      return 0;
    })(),
    _enginever = _float(((/(?:rv\:|ari\/|sto\/)(\d+\.\d+(\.\d+)?)/.
      exec(navigator.userAgent) || [,0])[1]).toString().
      replace(/[^\d\.]/g, "").replace(/^(\d+\.\d+)(\.(\d+))?$/, "$1$3")
    ),
    _runstyle = _ie ? "currentStyle"
                    : _doc.defaultView.getComputedStyle,
    _hex = (function() {
      var r = [], i = 256;
      for(; i < 512; ++i) {
        r.push(i.toString(16).slice(1));
      }
      return r;
    })(),
    _mix = function(base,       // @param Hash: mixin base
                    flavor,     // @param Hash: add flavor
                    aroma,      // @param Hash(= undefined): add aroma
                    override) { // @param Boolean(= true): true is override
                                // @return Hash: base
      var i, ride = (override === void 0) || override;

      for (i in flavor) {
        if (ride || !(i in base)) {
          base[i] = flavor[i];
        }
      }
      return aroma ? _meta.mix(base, aroma, void 0, ride) : base;
    },
    _toArray = function(fake) { // @param NodeList/Array:
                                // @return Array:
      if (!_ie) {
        return Array.prototype.slice.call(fake, 0);
      }
      var rv = [], ri = -1, i = 0, iz = fake.length;
      for (; i < iz; ++i) {
        rv[++ri] = fake[i];
      }
      return rv;
    };

_meta = {
  ie:         _ie,
  opera:      _opera,
  gecko:      _nu.indexOf("Gecko/") > 0,
  webkit:     _webkit,
  chrome:     _nu.indexOf("Chrome") > 0,
  iphone:     _webkit && /iPod|iPhone/.test(_nu),
  uaver:      _uaver, // user agent version
  slver:      _slver, // Silverlight version
  flashver:   _flashver, // Flash version(ver 7 later)
  enginever:  _enginever, // Render engine version
  iemode8:    _ie && _doc.documentMode >= 8,
  quirks:     _ie && (_doc.compatMode || "") !== "CSS1Compat",
  runstyle:   _runstyle,
  hex:        _hex,
  mix:        _mix,
  toArray:    _toArray
};

_event = {
  // uuMeta.event.bind
  bind: function(elm,       // @param Node:
                 eventName, // @param String:
                 callback,  // @param Function: callback
                 capture) { // @param Boolean(= false):
    _ie ? elm.attachEvent("on" + eventName, callback)
        : elm.addEventListener(eventName, callback, capture || false);
  },
  // uuMeta.event.unbind
  unbind: function(elm,       // @param Node:
                   eventName, // @param String:
                   callback,  // @param Function: callback
                   capture) { // @param Boolean(= false):
    _ie ? elm.detachEvent("on" + eventName, callback)
        : elm.removeEventListener(eventName, callback, capture || false);
  },
  // uuMeta.event.stop
  stop: function(evt) { // @param EventObject(= undefined):
    evt = evt || _win.event;
    _ie ? (evt.cancelBubble = true) : evt.stopPropagation();
    _ie ? (evt.returnValue = false) : evt.preventDefault();
  }
};

// --- initialize ---

// --- export ---
_win.uuMeta = _meta;   // window.uuMeta
_meta.event = _event;  // window.uuMeta.event
})(); // uuMeta scope

// === uuQuery ===
// depend: uuMeta, [uuStyle, uuColor]
/*
uuQuery(expr, context) - return NodeArray
uuQuery.id(expr) - return Node
uuQuery.tag(expr, context) - return NodeArray
uuQuery.className(expr, context) - return NodeArray
 */
(function() {
var _query, // inner namespace
    _mm = uuMeta,
    _win = window,
    _doc = document,
    _visited = !!_win.UUQUERY_ENABLE_VISITED, // 1 = :visited activate
    _int = parseInt,
    _float = parseFloat,
    _ie = _mm.ie,
    _gecko = _mm.gecko,
    _iemode8 = _mm.iemode8,
    _innerText = _gecko ? "textContent" : "innerText",
    _runstyle = _mm.runstyle,
    _uid = 0, // unique-id(incremental counter)
    _sheet, // StyleSheet
    _toArray = _mm.toArray,
    // root - ref document root element (<html>)
    _rootElement = _doc.documentElement ||
                   _doc.getElementsByTagName("html")[0],
    _headElement = _doc.getElementsByTagName("head")[0],
    // --- content-type cache (1: HTML, 2: XML) ---
    _contentTypeCache = { /* quid: contentType */ },
    // tag dict( { a: "A", A: "A", ... } )
    _htmlTag = {},
    _xmlTag = {},
    QUERYID = "quid",
    QUICK_STATIC = {
      "*":      function(ctx) { return _query.tag("*", ctx); },
      "*:root": function() { return [_rootElement]; }, // fix #27 (*:root)
      ":root":  function() { return [_rootElement]; }, // fix #27 (*:root)
      "* :root":function() { return []; }, // fix #27b (* :root)
      "* html": function() { return []; }, // fix #27b (* html) IE6 CSS Hack
      "html":   function() { return [_rootElement]; },
      "head":   function() { return [_headElement]; },
      "body":   function() { return [_doc.body]; },
      ":link":  function() { return _toArray(_doc.links); } // spoof
    },
    // :after :before :contains :digit :first-letter :first-line :link
    // :negative :playing :target :visited  !=  ?=  /=  <=  >=  &=  {  }
    REJECT_API  = /(:(a|b|co|dig|first-l|li|ne|p|t|v))|!=|\/=|<=|>=|&=|\{/, // }
    TRIM_QUOTE  = /^\s*["']?|["']?\s*$/g,
    QUICK_QUERY = /^(?:\*?(\.|#)([a-z_\u00C0-\uFFEE\-][\w\u00C0-\uFFEE\-]*)|(\w+)(?:\s*,\s*(\w+)(?:\s*,\s*(\w+))?)?|(\w+)\s+(\w+)(?:\s+(\w+))?)$/i,
    QUICK_HEAD  = /^#([a-z_\u00C0-\uFFEE\-][\w\u00C0-\uFFEE\-]*)\b(?![#\.:\[])|^((?:\.[a-z_\u00C0-\uFFEE\-][\w\u00C0-\uFFEE\-]*)+)$/i, // ]
    QUICK_COMMA = /^[^"'\(\)]*,/,
    ROOT_REJECT = /[a-z]+\-(child|type)$/,
    ID_OR_CLASS = /^[#\.]([a-z_\u00C0-\uFFEE\-][\w\u00C0-\uFFEE\-]*)/i,
    CHILD       = /^\s*(?:([>+~])\s*)?(\*|\w*)/,
    GROUP       = /^\s*,\s*/,
    PSEUDO      = /^(?::(not)\((?:(\*)|(\w+)|[#\.][a-z_\u00C0-\uFFEE\-][\w\u00C0-\uFFEE\-]*|\[\s*(?:[^~\^$*|=!\/\s]+\s*[~\^$*|!\/]?\=\s*(["'])?.*?\4i?|[^\]\s]+)\s*\]|:contains\((["'])?.*?\5\)|::?[\w\-]+(?:\([^\u0029]+\))?)\)|:contains\((["'])?(.*?)\6\)|::?([\w\-]+)(?:\((.*)\))?)/i,
    ATTR        = /^\[\s*(?:([^~\^$*|=!\/\s]+)\s*([~\^$*|!\/]?\=)\s*(["'])?(.*?)\3(i?)|([^\]\s]+))\s*\]/,
    STYLE       = /^\{\s*([^\^$*=!<>&\/\s]+)\s*(:|[\^$*!<>&\/]?\=)\s*(["'])?(.*?)\3(i?)\s*\}/,
    NTH_ANB     = /^((even)|(odd)|(1n\+0|n\+0|n)|(\d+)|((-?\d*)n([+\-]?\d*)))$/,
    JOINT1      = { ">": 1, "+": 2, "~": 3 },
    JOINT2      = { "#": 1, ".": 2, ":": 3, "[": 4, "{": 5 }, // }]
    ATTR_ALIAS  = { "class": "className", "for": "htmlFor" },
    ATTR_IE_BUG = { href: 1, src: 1 },
    ATTR_OPERATOR = { "=": 1, "!=": 2, "*=": 3, "^=": 4,
                              "$=": 5, "~=": 6, "|=": 7, "/=": 8 },
    ATTR_CASESENS = { title: 0, id: 0, name: 0, "class": 0, "for": 0 },
    EX_PROP_KIND= { color: 1, backgroundColor: 1, opacity: 2, width: 3, height: 4,
                    left: 5, top: 5, right: 5, bottom: 5, backgroundImage: 6 },
    EX_OPERATOR = { ":": 1,     // E{prop : value}             match
                    "=": 1,     // E{prop = value}             match
                    "!=": 2,    // E{prop != value}            not match
                    "*=": 3,    // E{prop *= value}            match somewhere
                    "^=": 4,    // E{prop ^= value}            match head
                    "$=": 5,    // E{prop $= value}            match tail
                    "/=": 8,    // E{prop /= "value"}          match Regexp
                    ">=": 9,    // E{prop >= value}            more than
                    "<=": 10,   // E{prop <= value}            less than
                    "&=": 11    // E{prop &= value1 ~ value2}  from value1 to value2
                  },
    DUMMY = function() { return []; },
    filters = {
      "first-child":    [0x01, childFilter],
      "last-child":     [0x02, childFilter],
      "only-child":     [0x03, childFilter],
      "nth-child":      [0x04, nthChildFilter],
      "nth-last-child": [0x05, nthChildFilter],
      "nth-of-type":    [0x06, nthOfTypeFilter],
      "nth-last-of-type":
                        [0x07, nthOfTypeFilter],
      "first-of-type":  [0x09, ofTypeFilter],
      "last-of-type":   [0x0a, ofTypeFilter],
      enabled:          [0x0b, simpleFilter],
      disabled:         [0x0c, simpleFilter],
      checked:          [0x0d, simpleFilter],
      link:             [0x0e, _visited ? visitedFilter : link],
      visited:          [0x0f, _visited ? visitedFilter : DUMMY],
      hover:            [0x10, actionFilter],
      focus:            [0x11, actionFilter],
      empty:            [0x12, empty],
      lang:             [0x13, lang],
      "only-of-type":   [0x14, onlyOfType],
      // [0x15] reserved.
      root:             [0x16, root],
      target:           [0x17, target],
      contains:         [0x18, contains],
      digit:            [0x40, extendFilter],
      negative:         [0x41, extendFilter],
      tween:            [0x42, extendFilter],
      playing:          [0x43, extendFilter],
      // bit information
      //    0x100: use flag
      //    0x200: none operation flag
      //    0x400: :not exclude flag
      //    0x800: need double-semicolon(::) flag
      before:           [0xf00, null],
      after:            [0xf00, null],
      "first-letter":   [0xf00, null],
      "first-line":     [0xf00, null]
    };

if (_visited) {
  delete QUICK_STATIC[":link"];
}

// uuQuery - query css
_query = function(expr,      // @param String: "css > rule"
                  context) { // @param Node(= document): query context
                             // @return NodeArray( [Node, Node, ...] )
                             //         /EmptyArray( [] )
  if (_doc.querySelectorAll) {
    if (!REJECT_API.test(expr)) {
      try {
        return _toArray((context || _doc).querySelectorAll(expr));
      } catch(err) {} // case: extend pseudo class / operators
    }
  }

  return querySelectorAll(expr.replace(/^\s+|\s+$/g, ""), context || _doc);
};

// uuQuery.id - query id
_query.id = function(expr) { // @param String: id
                             // @return Node/null
  return _doc.getElementById(expr);
};

// uuQuery.tag - query tagName
_query.tag = (function() {
  if (!_ie) {
    return function(expr,      // @param String: "*" or "tag"
                    context) { // @param Node(= document): query context
                               // @return NodeArray( [Node, Node, ...] )
                               //         /EmptyArray( [] )
      return Array.prototype.slice.call(
                  (context || _doc).getElementsByTagName(expr));
    }
  }
  return function(expr, context) {
    var nodeList = (context || _doc).getElementsByTagName(expr),
        rv = [], ri = -1, v, i = 0;
    if (expr !== "*") {
      while ( (v = nodeList[i++]) ) {
        rv[++ri] = v;
      }
    } else { // ie: getElementsByTagName("*") has comment nodes
      while ( (v = nodeList[i++]) ) {
        (v.nodeType === 1) && (rv[++ri] = v);
      }
    }
    return rv;
  };
})();

// uuQuery.className - query className
_query.className = (function() {
  if (_doc.getElementsByClassName) {
    return function(expr,      // @param JointString: "class", "class1, ..."
                    context) { // @param Node(= document): query context
                               // @return NodeArray( [Node, Node, ...] )
                               //         /EmptyArray( [] )
      return Array.prototype.slice.call(
                  (context || _doc).getElementsByClassName(expr));
    };
  }
  return function(expr, context) {
    var nodeList = (context || _doc).getElementsByTagName("*"),
        name = expr.replace(/^\s+|\s+$/g, "").split(/\s+/),
        rv = [], ri = -1, v, match, c, i = 0, nz = name.length, rex,
        urv = [], uri = -1, unq = {}, u = 0;

    if (nz > 1) { // #fix 170b
      while ( (v = name[u++]) ) {
        if (!(v in unq)) {
          unq[v] = 1;
          urv[++uri] = v;
        }
      }
      name = urv, nz = uri + 1;
    }
    // /(?:^| )(AA|BB|CC)(?:$|(?= ))/g
    rex = RegExp("(?:^| )(" + name.join("|") + ")(?:$|(?= ))", "g");

    while ( (v = nodeList[i++]) ) {
      c = v.className;
      if (c) {
        match = c.match(rex); // NG: match = rex.exec(c);
        (match && match.length >= nz) && (rv[++ri] = v);
      }
    }
    return rv;
  };
})();

function quickQuery(expr, match, context) {
  var rv = [], ri = -1, unq = {}, uid,
      m1, m2, m3, nodeList1, nodeList2, nodeList3,
      v, i, j, k, iz, jz, kz;

  // "#id" or ".class"
  if (match[1]) {
    if (match[1] === ".") {
      return _query.className(match[2], context);
    }
    nodeList1 = (context.ownerDocument || _doc).getElementById(match[2]);
    return nodeList1 ? [nodeList1] : [];
  }

  // "E" or "E,F" or "E,F,G"
  if (match[3]) {
    m1 = match[3], m2 = match[4], m3 = match[5];
    if (/^\d+$/.test(m1) || /^\d+$/.test(m2) || /^\d+$/.test(m3)) {
      throw expr + " syntax error";
    }

    unq[m1] = 1, nodeList1 = _toArray(context.getElementsByTagName(m1));
    if (m2 && !(m2 in unq)) {
      unq[m2] = 1, nodeList2 = _toArray(context.getElementsByTagName(m2));
    }
    if (m3 && !(m3 in unq)) {
      unq[m3] = 1, nodeList3 = _toArray(context.getElementsByTagName(m3));
    }
    return [].concat(nodeList1, nodeList2 || [], nodeList3 || []);
  }

  // "E F" or "E F G"
  m1 = match[6], m2 = match[7], m3 = match[8];

  nodeList1 = context.getElementsByTagName(m1); // "E"
  for (i = 0, iz = nodeList1.length; i < iz; ++i) {
    nodeList2 = nodeList1[i].getElementsByTagName(m2); // "E F"
    for (j = 0, jz = nodeList2.length; j < jz; ++j) {
      if (m3) {
        nodeList3 = nodeList2[j].getElementsByTagName(m3); // "E F G"
        for (k = 0, kz = nodeList3.length; k < kz; ++k) {
          v = nodeList3[k];
          uid = v[QUERYID] || (v[QUERYID] = ++_uid);
          if (!(uid in unq)) {
            rv[++ri] = v;
            unq[uid] = 1;
          }
        }
      } else {
        v = nodeList2[j];
        uid = v[QUERYID] || (v[QUERYID] = ++_uid);
        if (!(uid in unq)) {
          rv[++ri] = v;
          unq[uid] = 1;
        }
      }
    }
  }
  return rv;
}

function querySelectorAll(expr, context) {
  var _contentType, _tags, // alias
      // --- double registration guard ---
      uid,        // unique-id
      guard = {}, // global guard
      unq   = {}, // local guard
      mixed = 0,  // 1: mixed
      // --- result and context elements ---
      rv  = [], ri, r,
      ctx = [context],
      // --- loop out flag --
      lastExpr1,  // last expr for outer loop
      lastExpr2,  // last expr for inner loop
      // --- iterator and loop counter ---
      i, j, iz,
      // --- work ---
      withComma = expr.indexOf(",") >= 0, // with comma(",")
      tag,        // the E or F or universal selector("*")
      isUniversal,// true: tag is universal selector("*")
      joint,      // >+~_#.:[     // ]
      nodeList, needle, pseudo, v, w, operator, match, negate = 0;

  if (/^[>+~]|[>+~*]{2}|[>+~]$/.test(expr)) {
    throw expr + " syntax error";
  }

  // --- Quick phase ---
  if (!withComma && expr in QUICK_STATIC) { // "*" ":root" "body" ...
    return QUICK_STATIC[expr](context);
  }
  if ( (match = QUICK_QUERY.exec(expr)) ) { // "#id" ".class" "E" "E F" "E,F"...
    return quickQuery(expr, match, context);
  }
  if (withComma && QUICK_COMMA.test(expr)) { // split("#id, .class, E")
    w = expr.split(","); // "expr, expr, expr"
    for (i = 0, iz = w.length; i < iz; ++i) {
      v = w[i].replace(/^\s+|\s+$/g, "");
      if (!v) {
        throw expr + " syntax error";
      }
      r = querySelectorAll(v, context);
      mixin(r, rv, unq);
    }
    return rv;
  }
  if (!withComma) {
    if ( (match = QUICK_HEAD.exec(expr)) ) {
      if (match[1]) {
        w = _doc.getElementById(match[1]);
        ctx = w ? [w] : [];
      } else {
        v = match[2].replace(/\./g, " "); // ".class.class" -> " class class"
        return _query.className(v, context);
      }
      expr = expr.slice(match[0].length);
    }
  }
  
  // init tag set
  uid = context[QUERYID] || (context[QUERYID] = ++_uid);
  _contentType = _contentTypeCache[uid] ||
                    (_contentTypeCache[uid] = getContentType(context));
  _tags = _contentType === 1 ? _htmlTag : _xmlTag;

  // --- Generic phase ---
  while (expr && expr !== lastExpr1) { // outer loop
    lastExpr1 = expr;

    r = [], ri = -1, unq = {}, i = 0, iz = ctx.length;

    // "E > F"  "E + F"  "E ~ F"  "E"  "E F" phase
    if ( (match = CHILD.exec(expr)) ) {
      tag = match[2];
      tag = tag ? (_tags[tag] || addTag(tag, _contentType)) : "*";
      isUniversal = tag === "*"; // true: tag is universal selector

      if (match[1]) {
        joint = JOINT1[match[1]];

        if (joint === 1) { // 1: "E > F"
          for (; i < iz; ++i) {
            for (v = ctx[i].firstChild; v; v = v.nextSibling) {
              if (v.nodeType === 1) {
                if (isUniversal || v.tagName === tag) {
                  r[++ri] = v;
                }
              }
            }
          }
        } else if (joint === 2) { // 2: "E + F"
          for (; i < iz; ++i) {
            for (v = ctx[i].nextSibling; v; v = v.nextSibling) {
              if (v.nodeType === 1) {
                if (_ie) {
                  w = v.tagName;
                  if (!w.indexOf("/")) { continue; } // fix #25
                  if (isUniversal || w === tag) {
                    r[++ri] = v;
                  }
                } else {
                  if (isUniversal || v.tagName === tag) {
                    r[++ri] = v;
                  }
                }
                break;
              }
            }
          }
        } else { // 3: "E ~ F"
          for (; i < iz; ++i) {
            for (v = ctx[i].nextSibling; v; v = v.nextSibling) {
              if (v.nodeType === 1) {
                if (isUniversal || v.tagName === tag) {

                  uid = v[QUERYID] || (v[QUERYID] = ++_uid);
                  if (uid in unq) {
                    break;
                  } else {
                    r[++ri] = v;
                    unq[uid] = 1;
                  }
                }
              }
            }
          }
        }
      } else {
        // >+~ is not found
        if (iz === 1) {
          r = _query.tag(tag, ctx[0]);
        } else {
          for (; i < iz; ++i) {
            nodeList = ctx[i].getElementsByTagName(tag);

            // tag("*") has text/comment node(in IE)
            j = 0;
            while ( (v = nodeList[j++]) ) {
              if (!_ie || !isUniversal || v.nodeType === 1) {
                if (isUniversal || v.tagName === tag) {

                  uid = v[QUERYID] || (v[QUERYID] = ++_uid);
                  if (!(uid in unq)) {
                    r[++ri] = v;
                    unq[uid] = 1;
                  }
                }
              }
            }
          }
        }
      }
      ctx = r;
      expr = expr.slice(match[0].length);
    }

    // Attribute, Class, Pseudo, ID phase
    while (expr && expr !== lastExpr2) { // inner loop
      lastExpr2 = expr;
      match = null;

      r = [], ri = -1, i = 0;

      joint = JOINT2[expr.charAt(0)] || 9; // 9: dummy

      switch (joint) {
      case 1: // 1: "#id"
        if ( (match = ID_OR_CLASS.exec(expr)) ) {
          needle = match[1]; // "id"

          if (_contentType === 1) { // 1:html (match id or name)
            while ( (v = ctx[i++]) ) {
              if (((w = v.id || v.name) && (w === needle)) ^ negate) {
                r[++ri] = v;
              }
            }
          } else { // 2: xml (match id)
            while ( (v = ctx[i++]) ) {
              if (((w = v.id) && (w === needle)) ^ negate) {
                r[++ri] = v;
              }
            }
          }
        }
        break;

      case 2: // 2: ".class"
        if ( (match = ID_OR_CLASS.exec(expr)) ) {
          needle = (" " + match[1] + " "); // " className "

          while ( (v = ctx[i++]) ) {
            if (((w = v.className) &&
                ((" " + w + " ").indexOf(needle) >= 0)) ^ negate) {
              r[++ri] = v;
            }
          }
        }
        break;

      case 3: // 3: pseudo
        if ( (match = PSEUDO.exec(expr)) ) {
          if ( (iz = ctx.length) ) {
            if (match[1]) { // :not(...)
              if (negate) {
                throw ":not(:not(...)) syntax error";
              }
              if (match[2]) { // :not(*)
                break;
              }
              if (match[3]) { // ':not(div)' -> match[3] = "div"
                tag = match[3];
                tag = _tags[tag] || addTag(tag, _contentType);
                while ( (v = ctx[i++]) ) {
                  (v.tagName !== tag) && (r[++ri] = v);
                }
                break;
              }
              w = expr.slice(match[0].length); // remain expr
              expr = match[0].replace(/^:not\(\s*|\s*\)$/g, "") + w;
              ++negate;
              continue;
            } else {
              pseudo = match[8] || "contains";

              // ":root:xxx-child" or ":root:xxx-type" -> not match
              // ":root:not(:first-child)"             -> match root element
              if (iz === 1 && ctx[0] === _rootElement
                           && ROOT_REJECT.test(pseudo)) {
                r = negate ? [_rootElement] : [];
              } else {
                if ( !(v = filters[pseudo]) ) {
                  throw ":" + pseudo + " unsupported";
                }
                w = v[0];
                if (w & 0x100) {
                  if ((w & 0x800) && !/^::/.test(expr)) {
                    throw match[0] + " syntax error(need ::)";
                  }
                  if ((w & 0x400) && negate) {
                    throw ":not(" + match[0] + ") syntax error" +
                          "(exclude pseudo-element)";
                  }
                  if (w & 0x200) { // 0x100 is none operation
                    r = negate ? [] : ctx;
                    break;
                  }
                }
                r = v[1].call(this, w, negate, ctx, pseudo,
                              match[9] || match[7], _tags, _contentType);
              }
            }
          }
        }
        break;

      case 4: // 4: Attr "[A=V]" or "[A]"
        if ( (match = ATTR.exec(expr)) ) {
          if (match[6]) { // "[A]"
            needle = match[6];

            while ( (v = ctx[i++]) ) {
              if (_ie) {
                w = v.getAttributeNode(needle);
                if ((w && w.specified) ^ negate) {
                  r[++ri] = v;
                }
              } else if (v.hasAttribute(needle) ^ negate) {
                r[++ri] = v;
              }
            }
          } else { // "[A=V]"
            needle = match[4].replace(/^\s*["']|["']\s*$/g, "");
            operator = ATTR_OPERATOR[match[2]];
            if (!operator) {
              throw match[0] + " unsupported";
            }
            w = match[5] || ""; // regexp flag

            if (operator === 8) { // 8: "/=" is regexp operator
              needle = RegExp(needle, w);
            } else {
              // fix [class=i] -> match[4] = "", match[5] = "i"
              w && (needle += w);
            }
            r = judgeAttr(negate, ctx, match[1], operator, needle);
          }
        }
        break;

      case 5: // 5: Style "{S=V}" or "{S}"
        if (_win.uuStyle) {
          if ( (match = STYLE.exec(expr)) ) {
            r = styleQuery(negate, ctx, match);
          }
        }
      }

      if (match) {
        ctx = r;
        expr = expr.slice(match[0].length);
        negate = 0;
      }
    }

    // "E,F" phase
    if (withComma && expr && (match = GROUP.exec(expr)) ) {
      ++mixed;
      mixin(ctx, rv, guard);
      ctx = [context];
      lastExpr1 = lastExpr2 = "";
      expr = expr.slice(match[0].length);
    }
  }

  if (expr.length) {
    throw expr + " unsupported";
  }
  return mixed ? mixin(ctx, rv, guard) : ctx;
}

// mix results
function mixin(ctx, rv, guard) {
  var ri = rv.length - 1, i = 0, v, uid;

  while ( (v = ctx[i++]) ) {
    uid = v[QUERYID] || (v[QUERYID] = ++_uid);

    if (!(uid in guard)) {
      rv[++ri] = v;
      guard[uid] = 1;
    }
  }
  return rv;
}

function getContentType(context) {
  var owner = context.ownerDocument || _doc,
      p = owner.createElement("p"),
      P = owner.createElement("P");
  // see http://d.hatena.ne.jp/uupaa/20081010/1223630689 [THX! id:os0x]
  return p.tagName === P.tagName ? 1 : 2; // 1: HTMLDocument, 2: XMLDocument
}

function addTag(tag, contentType) {
  var lo = tag.toLowerCase(),
      up = tag.toUpperCase();
  if (!(lo in _htmlTag)) {
    _xmlTag[up] = _htmlTag[lo] = _htmlTag[up] = up;
    _xmlTag[lo] = lo;
  }
  return contentType === 1 ? up : tag;
}

// [attr operator "value"]
function judgeAttr(negate, elms, attr, operator, value) {
  var rv = [], ri = -1, r, e, v = value, i = 0, rex,
      attrFlag = 0, // attrFlag: ie only
      isInsens = !(attr in ATTR_CASESENS); // true: case insensitive

  if (_ie) {
    if (_iemode8 || ATTR_IE_BUG[attr]) { // fix a[href^="#"]
      attrFlag = 2;
    } else {
      attr = ATTR_ALIAS[attr] || attr;
    }
  }

  if (operator < 3) { // [attr = value] or [attr != value]
    --operator;
    if (isInsens) {
      v = v.toLowerCase();
    }
    while ( (e = elms[i++]) ) {
      if ( (r = e.getAttribute(attr, attrFlag)) ) {
        if (isInsens) {
          r = r.toLowerCase();
        }
        ((v === r) ^ operator ^ negate) && (rv[++ri] = e);
      }
    }
  } else {
    switch (operator) {
    case 3: rex = v; break;                           // [attr *= value]
    case 4: rex = "^" + v; break;                     // [attr ^= value]
    case 5: rex = v + "$"; break;                     // [attr $= value]
    case 6: if (v.indexOf(" ") >= 0) { return rv; }   // fix #7b
            rex = "(?:^| )" + v + "(?:$| )"; break;   // [attr ~= value]
    case 7: rex = "^" + v + "\\-|^" + v + "$"; break; // [attr |= value]
    }
    if (rex) {
      v = RegExp(rex, isInsens ? "i": "");
    }
    while ( (e = elms[i++]) ) {
      r = e.getAttribute(attr, attrFlag);
      if ((r && v.test(r)) ^ negate) {
        rv[++ri] = e;
      }
    }
  }
  return rv;
}

// :first-child  :last-child  :only-child
function childFilter(fid, negate, elms) {
  var rv = [], ri = -1, i = 0, v, c, f,
      iter1 = "previousSibling",
      iter2 = "nextSibling";

  while ( (v = elms[i++]) ) {
    f = 0;
    // first-child
    if (fid & 1) {
      for (c = v[iter1]; c; c = c[iter1]) {
        if (c.nodeType === 1) {
          ++f;
          break;
        }
      }
    }
    // last-child
    if (!f && fid & 2) {
      for (c = v[iter2]; c; c = c[iter2]) {
        if (c.nodeType === 1) {
          ++f;
          break;
        }
      }
    }
    if ((!f) ^ negate) {
      rv[++ri] = v;
    }
  }
  return rv;
}

// :nth-child  :nth-last-child
function nthChildFilter(fid, negate, elms, pseudo, value, tags, contentType) {
  if (value === "n") {
    return negate ? [] : elms;
  }
  // 0x4 = nth-child, 0x5 = nth-last-child
  var v = elms[0].tagName,
      tag = tags[v] || addTag(v, contentType),
      rv = [], ri = -1, i = 0, iz = elms.length, uid, unq = {},
      pn, cn, idx, ok,
      iter1 = (fid === 0x5) ? "lastChild" : "firstChild",
      iter2 = (fid === 0x5) ? "previousSibling" : "nextSibling",
      f = nth(value), a = f.a, b = f.b, k = f.k;

  for (; i < iz; ++i) {
    pn = elms[i].parentNode;
    uid = pn[QUERYID] || (pn[QUERYID] = ++_uid);

    if (!(uid in unq)) {
      unq[uid] = 1;
      idx = 0;

      for (cn = pn[iter1]; cn; cn = cn[iter2]) {
        if (cn.nodeType === 1) {
          ++idx;

          ok = 0;
          switch (k) {
          case 1:  ok = (idx === b); break;
          case 2:  ok = (idx >= b); break;
          case 3:  ok = (!((idx - b) % a) && (idx - b) / a >= 0); break;
          default: ok = (idx <= b);
          }
          (ok ^ negate) && cn.tagName === tag && (rv[++ri] = cn);
        }
      }
    }
  }
  return rv;
}

// :nth-of-type  :nth-last-of-type
function nthOfTypeFilter(fid, negate, elms, pseudo, value) {
  if (fid === 0x07) { // 0x07: nth-last-of-type
    elms.reverse();
  }

  var rv = [], ri = -1, v, i = 0, unq = {},
      idx, pn, currentParent = null, tagName, ok,
      f = nth(value), a = f.a, b = f.b, k = f.k;

  while ( (v = elms[i++]) ) {
    pn = v.parentNode;
    if (pn !== currentParent) {
      currentParent = pn;
      unq = {};
    }

    tagName = v.tagName;
    if (tagName in unq) {
      ++unq[tagName];
    } else {
      unq[tagName] = 1;
    }
    idx = unq[tagName];
    ok = 0;

    switch (k) {
    case 1:  ok = (idx === b); break;
    case 2:  ok = (idx >=  b); break;
    case 3:  ok = (!((idx - b) % a) && (idx - b) / a >= 0); break;
    default: ok = (idx <=  b);
    }
    if (ok ^ negate) {
      rv[++ri] = v;
    }
  }
  return rv;
}

// :first-of-type  :last-of-type
function ofTypeFilter(fid, negate, elms) {
  if (fid === 0x0a) { // 0x0a: last-of-type
    elms.reverse();
  }
  var rv = [], ri = -1, v, i = 0, unq = {},
      pn, currentParent = null;

  while ( (v = elms[i++]) ) {
    pn = v.parentNode;
    if (pn !== currentParent) {
      currentParent = pn;
      unq = {};
    }
    if (v.tagName in unq) {
      ++unq[v.tagName];
    } else {
      unq[v.tagName] = 1;
    }
    if ((unq[v.tagName] === 1) ^ negate) {
      rv[++ri] = v;
    }
  }
  return rv;
}

// :enabled  :disabled  :checked
function simpleFilter(fid, negate, elms) {
  var rv = [], ri = -1, v, i = 0, ok, needValidate,
      rex = /^(input|button|select|option|textarea)$/i;

  while ( (v = elms[i++]) ) {
    needValidate = ok = 0;
    switch (fid) {
    case 0x0b: ++needValidate; ok = !v.disabled; break;  // 0x0b: enabled
    case 0x0c: ++needValidate; ok = !!v.disabled; break; // 0x0c: disabled
    case 0x0d: ++needValidate; ok = !!v.checked; break;  // 0x0d: checked
    }

    if (needValidate && !rex.test(v.tagName)) { // fix #144
      if (negate) {
        rv[++ri] = v;
      }
    } else if (ok ^ negate) {
      rv[++ri] = v;
    }
  }
  return rv;
}

// :root
function root(fid, negate, elms) {
  if (!negate) {
    return [_rootElement];
  }
  var rv = [], ri = -1, v, i = 0;
  while ( (v = elms[i++]) ) {
    if (v !== _rootElement) {
      rv[++ri] = v;
    }
  }
  return rv;
}

// :target
function target(fid, negate, elms, pseudo, value, tags, contentType) {
  var rv = [], ri = -1, i = 0, v, needle = location.hash.slice(1);

  if (needle) {
    if (contentType === 1) { // 1: html
      while ( (v = elms[i++]) ) {
        (((v.id || v.name) === needle) ^ negate) && (rv[++ri] = v);
      }
    } else { // 2: xml
      while ( (v = elms[i++]) ) {
        ((v.id === needle) ^ negate) && (rv[++ri] = v);
      }
    }
  }
  return rv;
}

// :contains
function contains(fid, negate, elms, pseudo, value) {
  valie = value.replace(TRIM_QUOTE, "");
  var rv = [], ri = -1, v, i = 0;

  while ( (v = elms[i++]) ) {
    if ((v[_innerText].indexOf(value) >= 0) ^ negate) {
      rv[++ri] = v;
    }
  }
  return rv;
}

// :link
function link(fid, negate, elms) {
  var rv = [], ri = -1, ary = _toArray(_doc.links), v, i = 0,
      j = 0, jz = elms.length, hit;
  while ( (v = ary[i++]) ) {
    for (hit = -1, j = 0; j < jz; ++j) {
      if (elms[j] === v) {
        hit = j;
        break;
      }
    }
    if ((hit >= 0) ^ negate) {
      rv[++ri] = v;
    }
  }
  return rv;
}

// :empty
function empty(fid, negate, elms) {
  var rv = [], ri = -1, i = 0, v, c, missMatch = 0;
  while ( (v = elms[i++]) ) {
    missMatch = 0;
    for (c = v.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 1) {
        ++missMatch;
        break;
      }
    }
    // touch(v.textContent) very slowly
    if ((!missMatch && !v[_innerText]) ^ negate) {
      rv[++ri] = v;
    }
  }
  return rv;
}

// :lang
function lang(fid, negate, elms, pseudo, value) {
  var rv = [], ri = -1, v, i = 0, iz = elms.length,
      rex = RegExp("^(" + value + "$|" + value + "-)", "i");

  for (; i < iz; ++i) { // don't touch me
    v = elms[i];
    while (v && v !== _doc && !v.getAttribute("lang")) {
      v = v.parentNode;
    }
    if (((v && v !== _doc) && rex.test(v.getAttribute("lang"))) ^ negate) {
      rv[++ri] = elms[i];
    }
  }
  return rv;
}

// :only-of-type
function onlyOfType(fid, negate, elms, pseudo, value, tags, contentType) {
  var rv = [], ri = -1, v, i = 0, c, f, t, tagName,
      iter1 = "nextSibling",
      iter2 = "previousSibling";

  while ( (v = elms[i++]) ) {
    f = 0;
    tagName = v.tagName,
    t = tags[tagName] || addTag(tagName, contentType);
    for (c = v[iter1]; c; c = c[iter1]) {
      if (c.nodeType === 1 && c.tagName === t) {
        ++f;
        break;
      }
    }
    if (!f) {
      for (c = v[iter2]; c; c = c[iter2]) {
        if (c.nodeType === 1 && c.tagName === t){
          ++f;
          break;
        }
      }
    }
    if ((!f) ^ negate) {
      rv[++ri] = v;
    }
  }
  return rv;
}

// parse :nth-xxx(an+b)
function nth(anb) {
  var a, b, c, match = NTH_ANB.exec(anb);

  if (!match) { throw anb + " unsupported"; }
  if (match[2]) { return { a: 2, b: 0, k: 3 }; } // nth(even)
  if (match[3]) { return { a: 2, b: 1, k: 3 }; } // nth(odd)
  if (match[4]) { return { a: 0, b: 0, k: 2 }; } // nth(1n+0), nth(n+0), nht(n)
  if (match[5]) { return { a: 0, b: _int(match[5], 10), k: 1 }; } // nth(1)
  a = (match[7] === "-" ? -1 : match[7] || 1) - 0;
  b = (match[8] || 0) - 0;
  c = a < 2;
  return {
    a: c ? 0 : a,
    b: b,
    k: c ? a + 1 : 3
  };
}

// === uuQuery Selectors ==================================
// :digit(0x40)  :negative(0x41)  :tween(0x42)  :playing(0x43)
function extendFilter(fid, negate, elms) {
  var rv = [], ri = -1, v, i = 0, ok,
      DIGIT = /^\s*(?:[\-+]?)[\d,\.]+\s*$/,
      NEGATIVE = /^\s*\-[\d,\.]+\s*$/;

  while ( (v = elms[i++]) ) {
    ok = 0;
    switch (fid) {
    case 0x40: ok = DIGIT.test(v[_innerText] || ""); break;
    case 0x41: ok = NEGATIVE.test(v[_innerText] || ""); break;
    case 0x42: ok = !!v.tween; break;
    case 0x43: ok = v.tween && v.tween.playing(); break;
    }
    if (ok ^ negate) {
      rv[++ri] = v;
    }
  }
  return rv;
}

function parseColor(color) { // @param HexColorString: "#000000" style only
                             // @return Number: color number
  var rv = color;
  if (typeof rv === "string") {
    if (_win.uuColor) {
      rv = uuColor.parse(rv)[0];
      rv = _int(rv.replace(/^#/, "0x"), 16);
    }
  }
  return rv;
}

function styleQuery(negate, elms, match) {
  var value = match[4].replace(/^\s*["']|["']\s*$/g, ""), // trim quote
      prop, propKind,
      operator = EX_OPERATOR[match[2]], w,
      rv = [], ri = -1, ary, ok, r, e, v1, v2 = 0, i = 0,
      hasRange = 0, unitExchanged = 0;

  if (!operator) {
    throw match[0] + " unsupported";
  }
  w = match[5] || ""; // regexp flag

  if (operator === 8) { // 8: "/=" is regexp operator
    value = RegExp(value, w); // build regexp object
  } else {
    // fix {class=i} -> match[4] = "", match[5] = "i"
    w && (value += w);
  }

  prop = match[1];

  v1 = value;
  if (operator === 11) { // 11: "&="
    ary = v1.split(/\s*\~\s*/); // {prop&=0x0~0xf}
    if (ary.length !== 2) {
      throw "[" + prop + "&=" + v1 + "-???] syntax error";
    }
    v1 = ary[0];
    v2 = ary[1];
    hasRange = 1;
  }

  // pre-filter
  propKind = EX_PROP_KIND[prop] || 0;
  switch (propKind) {
  case 1: // 1: color, backgroundColor to number
    v1 = parseColor(v1);
    hasRange && (v2 = parseColor(v2));
    break;
  case 2: // 2: opacity
    v1 = _float(v1);
    hasRange && (v2 = _float(v2));
  }

  // range normalize
  if (hasRange && v1 > v2) { // {prop&=1~0} -> {prop&=0~1}
    r = v2, v2 = v1, v1 = r; // swap(v1, v2);
  }

  while ( (e = elms[i++]) ) {
    switch (propKind) {
    case 1: // color, backgroundColor
      r = parseColor((_ie ? e[_runstyle]
                          : _runstyle(e, ""))[prop]);
      break;
    case 2: // opacity
      r = _ie ? (e.filters.alpha ? e.style.opacity : 1.0)
              : _float(_runstyle(e, "").opacity);
      break;
    case 3: // width
      r = uuStyle.getPixel("width", e);

      if (!unitExchanged) {
        ++unitExchanged;
        v1 = uuStyle.toPixel(v1, e);
        hasRange && (v2 = uuStyle.toPixel(v1, e));
      }
      break;
    case 4: // height
      r = uuStyle.getPixel("height", e);

      if (!unitExchanged) {
        ++unitExchanged;
        v1 = uuStyle.toPixel(v1, e);
        hasRange && (v2 = uuStyle.toPixel(v1, e));
      }
      break;
    case 5: // top, right, bottom, left
      r = uuStyle.toPixel((_ie ? e[_runstyle]
                               : _runstyle(e, ""))[prop], e);
      if (!unitExchanged) {
        ++unitExchanged;
        v1 = uuStyle.toPixel(v1, e);
        hasRange && (v2 = uuStyle.toPixel(v1, e));
      }
      break;
    case 6: // backgroundImage
      r = uuStyle.getBackgroundImage(e); // "none" or "http://..."
      break;
    default:
      w = (_ie ? e[_runstyle]
               : _runstyle(e, ""))[prop];
      r = (operator >= 9) ? _float(w) : w;
    }

    ok = 0;
    switch (operator) {
    case 1: ok = v1 == r; break;            // {prop = value} or {prop: value}
    case 2: ok = v1 != r; break;            // {prop != value}
    case 3: ok = r.indexOf(v1) >= 0; break; // {prop *= value}
    case 4: ok = !r.indexOf(v1); break;     // {prop ^= value}
    case 5: ok = (r.lastIndexOf(v1) + v1.length) === r.length; break;
                                            // {prop $= value}
    case 8: ok = v1.test(r); break;         // {prop /= "regexp"ig}
    case 9: ok = r >= v1; break;            // {prop >= value}
    case 10: ok = r <= v1; break;           // {prop <= value}
    case 11: ok = r >= v1 && r <= v2;       // {prop &= #000000~#ffffff}
    }
    if (ok ^ negate) {
      rv[++ri] = e;
    }
  }
  return rv;
}

// === Action Selectors ====================================
function visitedFilter(fid, negate, elms) {
  // :link(0x0e)  :visited(0x0f)
  var rv = [], ri = -1, v, i = 0, ok, cs,
      // http://d.hatena.ne.jp/uupaa/20080928/1222543331
      idx = insertRule("a:visited", _ie ? "ruby-align:center"
                                        : "outline:0 solid #000");
  while ( (v = elms[i++]) ) {
    if (v.tagName === "A") {
      if (_ie) {
        ok = (v.currentStyle.rubyAlign === "center") ? 1 : 0;
      } else {
        cs = _runstyle(v, "");
        ok = (cs.outlineWidth === "0px" &&
              cs.outlineStyle === "solid") ? 1 : 0;
      }
      if (fid === 0x0e) {
        if ((!ok) ^ negate) {
          rv[++ri] = v;
        }
      } else {
        if (ok ^ negate) {
          rv[++ri] = v;
        }
      }
    }
  }
  _ie ? _sheet.removeRule(idx)
      : _sheet.sheet.deleteRule(idx);
  return rv;
}

function actionFilter(fid, negate, elms, pusedo) {
  // :hover(0x10)  :focus(0x11)
  var rv = [], ri = -1, v, i = 0, ok, cs,
      // http://d.hatena.ne.jp/uupaa/20080928/1222543331
      idx = insertRule(":" + pusedo, _ie ? "ruby-align:center"
                                         : "outline:0 solid #000");
  while ( (v = elms[i++]) ) {
    if (_ie) {
      ok = (v.currentStyle.rubyAlign === "center") ? 1 : 0;
    } else {
      cs = _runstyle(v, "");
      ok = (cs.outlineWidth === "0px" &&
            cs.outlineStyle === "solid") ? 1 : 0;
    }
    if (ok ^ negate) {
      rv[++ri] = v;
    }
  }
  _ie ? _sheet.removeRule(idx)
      : _sheet.sheet.deleteRule(idx);
  return rv;
}

function insertRule(selector, declaration) {
  var pos, rule, e;

  if (!_sheet) {
    if (_ie) {
      _sheet = _doc.createStyleSheet();
    } else {
      e = _doc.createElement("style");
      e.appendChild(_doc.createTextNode(""));
      _sheet = _doc.getElementsByTagName("head")[0].appendChild(e);
    }
  }

  if (_ie) {
    pos = _sheet.rules.length;
    _sheet.addRule(selector.replace(/^\s+|\s+$/g, ""),
                   declaration.replace(/^\s+|\s+$/g, ""), pos);
  } else {
    rule = selector + "{" + declaration + "}";
    pos = _sheet.sheet.insertRule(rule, _sheet.sheet.cssRules.length);
    if (!!_win.opera && opera.version() < 9.5) {
      pos = _sheet.sheet.cssRules.length - 1;
    }
  }
  return pos;
}

// --- initialize ---
(function() {
  // create tag dict.
  var ary = ("*,div,p,a,ul,ol,li,span,td,tr,dl,dt,dd,h1,h2,h3,h4," +
             "iframe,form,input,textarea,select,body,style,script").split(","),
      i = 0, iz = ary.length;
  for (; i < iz; ++i) {
    addTag(ary[i]);
  }

  // prebuild node.alid
  function prebuild() {
    var ary = _query.tag("*"), v, i = 0;
    while ( ( v = ary[i++]) ) {
      v[QUERYID] || (v[QUERYID] = ++_uid);
    }
  }
  _mm.event.bind(_win, "load", prebuild);
})();

// --- export ---
_win.uuQuery = _query;            // window.uuQuery
_query.filters = filters;         // window.uuQuery.filters
_query.childFilter = childFilter; // window.uuQuery.childFilter
})(); // uuQuery scope

// === uuQuery+ ===
// depend: uuMeta, uuQuery
(function() {
var _query = uuQuery,
    _mm = uuMeta,
    _int = parseInt,
    _ie = _mm.ie,
    _runstyle = _mm.runstyle,
    _mix = _mm.mix,
    TYPE = "type";

// === jQuery Selectors ====================================
_mix(_query.filters, {
  first:    [0x01, _query.childFilter],
  last:     [0x02, _query.childFilter],
  even:     [0x80, even],
  odd:      [0x81, odd],
  eq:       [0x82, eq],
  gt:       [0x83, jFilter],
  lt:       [0x84, jFilter],
  parent:   [0x85, jFilter],
  header:   [0x86, jFilter],
  input:    [0x87, jFilter],
  button:   [0x88, jFilter],
  text:     [0x89, jFilter],
  password: [0x8a, jFilter],
  radio:    [0x8b, jFilter],
  checkbox: [0x8c, jFilter],
  submit:   [0x8d, jFilter],
  image:    [0x8e, jFilter],
  reset:    [0x8f, jFilter],
  file:     [0x90, jFilter],
  hidden:   [0x91, jFilter],
  visible:  [0x92, jFilter],
  selected: [0x93, jFilter]
});

function jFilter(fid, negate, elms, pseudo, value, tags, contentType) {
  var rv = [], ri = -1, v, i = 0, iz = elms.length, ok, rex;

  function hidden(elm) {
    var cs = _ie ? elm[_runstyle]
                 : _runstyle(elm, "");
    return cs.display === "none" || cs.visibility === "hidden";
  }

  for(; i < iz; ++i) {
    v = elms[i];
    ok = 0;
    switch (fid) {
    case 0x83:  ok = i >= _int(value) + 1; break;
    case 0x84:  ok = i <= _int(value) - 1; break;
    case 0x85:  ok = !!v.firstChild; break;
    case 0x86:  rex = RegExp("h[1-6]", contentType === 1 ? "i" : "");
                ok = rex.test(v.tagName); break;
    case 0x87:  rex = RegExp("(input|textarea|select|button)",
                             contentType === 1 ? "i" : "");
                ok = rex.test(v.tagName) || v[TYPE] === "button"; break;
    case 0x88:  rex = RegExp("button", contentType === 1 ? "i" : "");
                ok = rex.test(v.tagName) || v[TYPE] === "button"; break;
    case 0x89:  ok = v[TYPE] === "text"; break;
    case 0x8a:  ok = v[TYPE] === "password"; break;
    case 0x8b:  ok = v[TYPE] === "radio"; break;
    case 0x8c:  ok = v[TYPE] === "checkbox"; break;
    case 0x8d:  ok = v[TYPE] === "submit"; break;
    case 0x8e:  ok = v[TYPE] === "image"; break;
    case 0x8f:  ok = v[TYPE] === "reset"; break;
    case 0x90:  ok = v[TYPE] === "file"; break;
    case 0x91:  ok = (v[TYPE] === "hidden" || hidden(v)); break;
    case 0x92:  ok = (v[TYPE] !== "hidden" && !hidden(v)); break;
    case 0x93:  ok = !!v.selected; break;
    }
    if (ok ^ negate) {
      rv[++ri] = v;
    }
  }
  return rv;
}

function even(fid, negate, elms, pseudo, value, tags, contentType) {
  var fl = _query.filters["nth-child"];
  return fl[1](fl[0], negate, elms, pseudo, "odd", tags, contentType);
}

function odd(fid, negate, elms, pseudo, value, tags, contentType) {
  var fl = _query.filters["nth-child"];
  return fl[1](fl[0], negate, elms, pseudo, "even", tags, contentType);
}

function eq(fid, negate, elms, pseudo, value) {
  var v, ok = 0;
  if ( (v = elms[_int(value)]) ) {
    ok = 1;
  }
  return (ok ^ negate) ? [v] : [];
}

// --- initialize ---

// --- export ---

})(); // uuQuery+ scope

// === uuColor ===
// depend: uuMeta
/*
uuColor.hash
uuColor.hex(rgba) - return HexColorString("#ffffff")
uuColor.rgba(rgba) - return RGBAColorString("rgba(0,0,0,0)")
uuColor.arrange(rgba, h = 0, s = 0, v = 0) - return RGBAHash
uuColor.parse(color, toRGBA = 0) - return ["#ffffff", alpha] or RGBAHash
uuColor.hex2rgba(hex) - return RGBAHash
uuColor.rgba2hsva(rgba) - return HSVAHash
uuColor.hsva2rgba(hsva) - return RGBAHash
 */
(function() {
var _color, // inner namespace
    _mm = uuMeta,
    _float = parseFloat,
    _math = Math,
    _round = _math.round,
    _hex = _mm.hex;

_color = {
  // uuColor.hash - color hash
  hash: (function() { // Hash( { black: "#000000" } )
    var rv = [], v, i = 0, iz, item = (
  // Famicom(TM) Named Color(from "fc00" to "fc3f")
"7b7b7bfc00,0000fffc01,0000bdfc02,4229bdfc03,940084fc04,ad0021fc05,8c1000fc06,"+
"8c1000fc07,522900fc08,007300fc09,006b00fc0a,005a00fc0b,004252fc0c,000000fc0d,"+
"000000fc0e,000000fc0f,bdbdbdfc10,0073f7fc11,0052f7fc12,6b42fffc13,de00cefc14,"+
"e7005afc15,f73100fc16,e75a10fc17,ad7b00fc18,00ad00fc19,00ad00fc1a,00ad42fc1b,"+
"008c8cfc1c,000000fc1d,000000fc1e,000000fc1f,f7f7f7fc20,39bdfffc20,6b84fffc22,"+
"9473f7fc23,f773f7fc24,f75294fc25,f77352fc26,ffa542fc27,f7b500fc28,b5f710fc29,"+
"5ade52fc2a,52f794fc2b,00efdefc2c,737373fc2d,000000fc2e,000000fc2f,fffffffc30,"+
"a5e7fffc31,b5b5f7fc32,d6b5f7fc33,f7b5f7fc34,ffa5c6fc35,efceadfc36,ffe7adfc37,"+
"ffde7bfc38,d6f773fc39,b5f7b5fc3a,b5f7d6fc3b,00fffffc3c,f7d6f7fc3d,000000fc3e,"+
"000000fc3f,"+
  // W3C Named Color
"000000black,888888gray,ccccccsilver,ffffffwhite,ff0000red,"+
"ffff00yellow,00ff00lime,00ffffaqua,00ffffcyan,0000ffblue,ff00fffuchsia,"+
"ff00ffmagenta,880000maroon,888800olive,008800green,008888teal,000088navy,"+
"880088purple,696969dimgray,808080gray,a9a9a9darkgray,c0c0c0silver,"+
"d3d3d3lightgrey,dcdcdcgainsboro,f5f5f5whitesmoke,fffafasnow,708090slategray,"+
"778899lightslategray,b0c4delightsteelblue,4682b4steelblue,5f9ea0cadetblue,"+
"4b0082indigo,483d8bdarkslateblue,6a5acdslateblue,7b68eemediumslateblue,"+
"9370dbmediumpurple,f8f8ffghostwhite,00008bdarkblue,0000cdmediumblue,"+
"4169e1royalblue,1e90ffdodgerblue,6495edcornflowerblue,87cefalightskyblue,"+
"add8e6lightblue,f0f8ffaliceblue,191970midnightblue,00bfffdeepskyblue,"+
"87ceebskyblue,b0e0e6powderblue,2f4f4fdarkslategray,00ced1darkturquoise,"+
"afeeeepaleturquoise,f0ffffazure,008b8bdarkcyan,20b2aalightseagreen,"+
"48d1ccmediumturquoise,40e0d0turquoise,7fffd4aquamarine,e0fffflightcyan,"+
"00fa9amediumspringgreen,7cfc00lawngreen,00ff7fspringgreen,7fff00chartreuse,"+
"adff2fgreenyellow,2e8b57seagreen,3cb371mediumseagreen,66cdaamediumaquamarine,"+
"98fb98palegreen,f5fffamintcream,006400darkgreen,228b22forestgreen,"+
"32cd32limegreen,90ee90lightgreen,f0fff0honeydew,556b2fdarkolivegreen,"+
"6b8e23olivedrab,9acd32yellowgreen,8fbc8fdarkseagreen,9400d3darkviolet,"+
"8a2be2blueviolet,dda0ddplum,d8bfd8thistle,8b008bdarkmagenta,9932ccdarkorchid,"+
"ba55d3mediumorchid,da70d6orchid,ee82eeviolet,e6e6falavender,"+
"c71585mediumvioletred,bc8f8frosybrown,ff69b4hotpink,ffc0cbpink,"+
"ffe4e1mistyrose,ff1493deeppink,db7093palevioletred,e9967adarksalmon,"+
"ffb6c1lightpink,fff0f5lavenderblush,cd5c5cindianred,f08080lightcoral,"+
"f4a460sandybrown,fff5eeseashell,dc143ccrimson,ff6347tomato,ff7f50coral,"+
"fa8072salmon,ffa07alightsalmon,ffdab9peachpuff,ffffe0lightyellow,"+
"b22222firebrick,ff4500orangered,ff8c00darkorange,ffa500orange,"+
"ffd700gold,fafad2lightgoldenrodyellow,8b0000darkred,a52a2abrown,"+
"a0522dsienna,b8860bdarkgoldenrod,daa520goldenrod,deb887burlywood,f0e68ckhaki,"+
"fffacdlemonchiffon,d2691echocolate,cd853fperu,bdb76bdarkkhaki,bdb76btan,"+
"eee8aapalegoldenrod,f5f5dcbeige,ffdeadnavajowhite,ffe4b5moccasin,"+
"ffe4c4bisque,ffebcdblanchedalmond,ffefd5papayawhip,fff8dccornsilk,"+
"f5deb3wheat,faebd7antiquewhite,faf0e6linen,fdf5e6oldlace,fffaf0floralwhite,"+
"fffff0ivory").split(",");

    for (iz = item.length; i < iz; ++i) {
      v = item[i];
      rv[v.slice(6)] = "#" + v.slice(0, 6);
    }
    return rv;
  })(),

  // uuColor.hex - return Hex Color String( "#ffffff" )
  hex: function(rgba) { // @param RGBAHash: Hash( { r,g,b,a })
                        // @return HexColorString( "#ffffff" )
    return ["#", _hex[rgba.r], _hex[rgba.g], _hex[rgba.b]].join("");
  },

  // uuColor.rgba - return RGBA Color String( "rgba(0,0,0,0)" )
  rgba: function(rgba) { // @param RGBAHash: Hash( { r,g,b,a })
                         // @return RGBAColorString( "rgba(0,0,0,0)" )
    return "rgba(" + [rgba.r, rgba.g, rgba.b, rgba.a].join(",") + ")";
  },

  // uuColor.arrange - arrangemented color(Hue, Saturation and Value)
  //    Hue is absolure value,
  //    Saturation and Value is relative value.
  arrange: function(rgba, // @param RGBAHash: Hash( { r,g,b,a })
                    h,    // @param Number(=0): Hue (from -360 to 360)
                    s,    // @param Number(=0): Saturation (from -100 to 100)
                    v) {  // @param Number(=0): Value (from -100 to 100)
                          // @return RGBAHash:
    var rv = _color.rgba2hsva(rgba), r = 360;
    rv.h += h, rv.h = (rv.h > r) ? rv.h - r : (rv.h < 0) ? rv.h + r : rv.h;
    rv.s += s, rv.s = (rv.s > 100) ? 100 : (rv.s < 0) ? 0 : rv.s;
    rv.v += v, rv.v = (rv.v > 100) ? 100 : (rv.v < 0) ? 0 : rv.v;
    return _color.hsva2rgba(rv);
  },

  // uuColor.parse - parse color
  //    RGBAColorString is "rgba(0,0,0,0)" style color string
  //    HexColorString is "#ffffff" style color string
  //    W3CNamedColorString is "pink" style color string
  parse: function(color,    // @parem RGBAColorString/HexColorString
                            //        /W3CNamedColorString
                  toRGBA) { // @param Boolean(= false): true = return RGBAHash
                            //                          false = return Array
                            // @return Array: [ HexColorString, Number(alpha) ]
                            //         RGBAHash: { r, g, b, a }
    var c = color.toLowerCase(), rv, m, rex = [
      /^#(([\da-f])([\da-f])([\da-f]))(([\da-f])([\da-f]{2}))?$/,
      /[\d\.]+%/g,
      /(rgb[a]?)\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d\.]+))?\s*\)/
    ];

    if (c !== "transparent") {
      if (c in _color.hash) {
        rv = _color.hash[c];
        return toRGBA ? _color.hex2rgba(rv) : [rv, 1];
      }
      if ( (m = rex[0].exec(c)) ) {
        rv = (c.length > 4) ? c
                            : ["#", m[2], m[2],
                                    m[3], m[3],
                                    m[4], m[4]].join("");
        return toRGBA ? _color.hex2rgba(rv) : [rv, 1];
      }
      c = c.replace(rex[1], function(n) {
        return _math.min((_float(n) || 0) * 2.55, 255) | 0
      });
      if ( (m = rex[2].exec(c)) ) {
        return toRGBA ? { r: m[2] | 0, g: m[3] | 0, b: m[4] | 0,
                          a: m[1] === "rgb" ? 1 : _float(m[5]) }
                      : [["#", _hex[m[2]], _hex[m[3]], _hex[m[4]]].join(""),
                         m[1] === "rgb" ? 1 : _float(m[5])];
      }
    }
    return toRGBA ? { r: 0, g: 0, b: 0, a: 0 } : ["#000000", 0];
  },

  // uuColor.hex2rgba - convert "#ffffff" to RGBAHash
  hex2rgba: function(hex) { // @param HexColorString: String( "#ffffff" )
                            // @return RGBAHash: Hash( { r,g,b,a } )
    var n = parseInt(hex.slice(1), 16);
    return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff, a: 1 };
  },

  // uuColor.rgba2hsva
  rgba2hsva: function(rgba) { // @param RGBAHash:
                              // @return HSVAHash:
    var r = rgba.r / 255, g = rgba.g / 255, b = rgba.b / 255,
        max = _math.max(r, g, b), diff = max - _math.min(r, g, b),
        h = 0, s = max ? _round(diff / max * 100) : 0, v = _round(max * 100);
    if (!s) {
      return { h: 0, s: 0, v: v, a: rgba.a };
    }
    h = (r === max) ? ((g - b) * 60 / diff) :
        (g === max) ? ((b - r) * 60 / diff + 120)
                    : ((r - g) * 60 / diff + 240);
    // HSVAHash( { h:360, s:100, v:100, a:1.0 } )
    return { h: (h < 0) ? h + 360 : h, s: s, v: v, a: rgba.a };
  },

  // uuColor.hsva2rgba
  hsva2rgba: function(hsva) { // @param HSVAHash:
                              // @return RGBAHash:
    var h = (hsva.h >= 360) ? 0 : hsva.h,
        s = hsva.s / 100,
        v = hsva.v / 100,
        a = hsva.a,
        h60 = h / 60, matrix = h60 | 0, f = h60 - matrix,
        v255, p, q, t, w;
    if (!s) {
      h = _round(v * 255);
      return { r: h, g: h, b: h, a: a };
    }
    v255 = v * 255,
    p = _round((1 - s) * v255),
    q = _round((1 - (s * f)) * v255),
    t = _round((1 - (s * (1 - f))) * v255),
    w = _round(v255);
    switch (matrix) {
      case 0: return { r: w, g: t, b: p, a: a };
      case 1: return { r: q, g: w, b: p, a: a };
      case 2: return { r: p, g: w, b: t, a: a };
      case 3: return { r: p, g: q, b: w, a: a };
      case 4: return { r: t, g: p, b: w, a: a };
      case 5: return { r: w, g: p, b: q, a: a };
    }
    return { r: 0, g: 0, b: 0, a: a };
  }
};

// --- initialize ---

// --- export ---
window.uuColor = _color; // window.uuColor

})(); // uuColor scope

// === uuStyle ===
// depend: none
/*
uuStyle.toPixel(value, context = undef) - return pixel value
uuStyle.getPixel(elm, prop) - return pixel value
uuStyle.getBackgroundImage(elm) - return url
uuStyle.getOpacity(elm) - return 0.0 ~ 1.0
uuStyle.setOpacity(elm, opacity = 1.0, diff = false)
uuStyle.getActualDimension(image) - return { width, height }
 */
(function() {
var _style, // inner namespace
    _mm = uuMeta,
    _doc = document,
    _float = parseFloat,
    _ie = !!_doc.uniqueID,
    _runstyle = _mm.runstyle;

_style = {
  // uuStyle.toPixel - covert unit
  //    toPixel(123)     -> 123
  //    toPixel("12px")  -> 12
  //    toPixel("12pt")  -> 15.996
  //    toPixel("12em", document.body) -> 12em * 1
  toPixel: function(value,      // @param String/Number:
                    context) {  // @param Node(= undefined): context
                                // @return Number: pixel value
    function fontSize() {
      return _float((_ie ? context[_runstyle]
                         : _runstyle(context, "")).fontSize);
    }
    var rv = value;
    if (typeof value === "string") {
      rv = _float(rv);
      if (/pt$/.test(value)) {
        rv = fontSize() * rv * 4 / 3; // 1.333...
      } else if (/em$/.test(value)) {
        rv = fontSize() * rv;
      }
    }
    return rv;
  },

  // uuStyle.getPixel - get pixel unit
  //    getPixel("left", node)
  //    getPixel("width", node)
  getPixel: function(elm,    // @param Node:
                     prop) { // @param String: style property name
                             // @return Number: pixel value
    var rv = (_ie ? elm[_runstyle]
                  : _runstyle(elm, ""))[prop];

    function dim(horizontal) {
      var r = elm.getBoundingClientRect();
      return horizontal ? (r.right - r.left) : (r.bottom - r.top);
    }

    if (_ie) {
      switch (prop) {
      case "width": rv = elm.clientWidth || dim(1); break;
      case "height": rv = elm.clientHeight || dim(0);
      }
    }
    return _style.toPixel(rv, elm);
  },

  // uuStyle.getBackgroundImage
  getBackgroundImage: function(elm) { // @param Node:
                                      // @return String: "none" or "http://..."
    var bg = "backgroundImage", m,
        url = _ie ? (elm.style[bg] || elm[_runstyle][bg])
                  : _runstyle(elm, "")[bg];
    if (url) {
      if ( (m = /^url\((.*)\)$/.exec(url)) ) {
        return m[1].replace(/^\s*[\"\']?|[\"\']?\s*$/g, ""); // trim quote
      }
    }
    return "none";
  },

  // uuStyle.getOpacity - get opacity value(from 0.0 to 1.0)
  getOpacity: function(elm) { // @param Node:
                              // @return Number: float value(min: 0.0, max: 1.0)
    if (_ie) {
      return elm.filters.alpha ? elm.style.opacity : 1.0;
    }
    return _float(_runstyle(elm, "").opacity);
  },

  // uuStyle.setOpacity - set opacity value(from 0.0 to 1.0)
  setOpacity: function(elm,     // @param Node:
                       opacity, // @param Number(= 1.0): float value(0.0 to 1.0)
                       diff) {  // @param Boolean(= false):
    diff = (diff === void 0) ? false : diff;
    var opa = _float(opacity === void 0 ? 1.0 : opacity),
        st = elm.style;

    if (diff) {
      opa = (_ie ? (elm.filters.alpha ? st.opacity : 1.0)
                 : _float(_runstyle(elm, "").opacity)) + opa;
    }
    if (opa > 0.999) {
      opa = 1;
    } else if (opa < 0.001) {
      opa = 0;
    }
    st.opacity = opa;
    if (_ie) {
      if (!elm.filters.alpha) {
        st.filter += " alpha(opacity=0)";
        st.zoom = st.zoom || "1"; // IE6, IE7: force "hasLayout"
      }
      elm.filters.alpha.opacity = opa * 100;
    }
  },

  // uuStyle.getActualDimension
  // http://d.hatena.ne.jp/uupaa/20090602/1243933843
  getActualDimension: function(image) { // @param HTMLImageElement
                                        // @return Hash: { width, height }
    var run, mem, w, h, key = "actual";

    // for Firefox, Safari, Chrome
    if ("naturalWidth" in image) {
      return { width:  image.naturalWidth,
               height: image.naturalHeight };
    }

    if ("src" in image) { // HTMLImageElement
      if (image[key] && image[key].src === image.src) {
        return image[key];
      }
      if (_ie) { // for IE
        run = image.runtimeStyle;
        mem = { w: run.width, h: run.height }; // keep runtimeStyle
        run.width  = "auto"; // override
        run.height = "auto";
        w = image.width;
        h = image.height;
        run.width  = mem.w; // restore
        run.height = mem.h;
      } else { // for Opera
        mem = { w: image.width, h: image.height }; // keep current style
        image.removeAttribute("width");
        image.removeAttribute("height");
        w = image.width;
        h = image.height;
        image.width  = mem.w; // restore
        image.height = mem.h;
      }
      return image[key] = { width: w, height: h, src: image.src }; // bond
    }
    // HTMLCanvasElement
    return { width: image.width, height: image.height };
  }
};

// --- initialize ---

// --- export ---
window.uuStyle = _style; // window.uuStyle

})(); // uuStyle scope
