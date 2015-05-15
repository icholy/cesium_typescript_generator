
var JSDOCParser = function () {};

JSDOCParser.prototype.formatTypeName = function (name) {

  // TODO: figure out how to handle these
  if (name.indexOf('~') !== -1) {
    return 'any';
  }

  // rewrite arrays
  var re = /Array\.<([^>]+)>/;
  var m = re.exec(name);
  if (m !== null) {
    return this.formatType(m[1]) + "[]";
  }

  // don't use wrapped types
  switch (name.toLowerCase()) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'object':
      return 'any';
    case 'array':
      return 'any[]';
    case 'function':
      return 'Function';
    case '*':
      return 'any';
    default:
      return name;
  }
};

JSDOCParser.prototype.formatType = function (t) {
  var _this = this;
  if (typeof t === 'undefined') {
    return [];
  }
  if (typeof t.names === 'undefined') {
    return [];
  }
  return t.names.map(function (name) {
    return _this.formatTypeName(name);
  });
};

JSDOCParser.prototype.formatReturn = function (r) {
  var _this = this;
  if (typeof r === 'undefined') {
    return undefined;
  }
  if (r.length === 1) {
    return this.formatType(r[0].type);
  } else {
    return r.map(function (r) {
      return _this.formatType(r.type);
    });
  }
};

JSDOCParser.prototype.formatProperty = function (r) {
  return {
    name:  r.name,
    type:  this.formatType(r.type)
  };
};

JSDOCParser.prototype.formatMethod = function (r) {
  return {
    name:    r.name,
    params:  this.formatParams(r.params),
    returns: this.formatReturn(r.returns)
  }
};

JSDOCParser.prototype.formatParam = function (p) {
  if (typeof p === 'undefined') {
    return undefined;
  }
  return {
    name:     p.name,
    optional: p.optional,
    type:     this.formatType(p.type)
  };
};

JSDOCParser.prototype.formatParams = function (params) {
  var _this = this;
  if (typeof params === 'undefined') {
    return [];
  }
  return params.map(function (p) {
    return _this.formatParam(p);
  });
};

JSDOCParser.prototype.parse = function (results) {

  var isDocumented = function (r) {
    if (r.undocumented === true) {
      return false;
    }
    return true;
  };

  var isPublic = function (r) {
    if (r.access === "private") {
      return false;
    }
    return true;
  };

  var isInstance = function (r) {
    return r.scope === 'instance';
  };

  var isStatic = function (r) {
    return r.scope === 'static';
  };

  var isClass = function (r) {
    if (r.kind !== 'class') {
      return false;
    }
    if (typeof r.memberof !== 'undefined') {
      return false;
    }
    return true;
  };

  var isMemberOf = function (type) {
    return function (r) {
      return r['memberof'] === type;
    };
  };

  var isGlobalFunction = function (r) {
    if (r.kind !== 'module') {
      return false;
    }
    if (typeof r.params === 'undefined') {
      return false;
    }
    if (r.access === "private") {
      return false;
    }
    return true;
  };

  var isFunction = function (r) {
    if (r.kind !== 'function') {
      return false;
    }
    if (r.name.indexOf("_") === 0) {
      return false;
    }
    return true;
  };

  var isProperty = function (r) {
    if (r.kind !== 'member' && r.kind !== 'constant') {
      return false;
    }
    if (r.type === 'undefined') {
      return false;
    }
    if (r.name.indexOf("_") === 0) {
      return false;
    }
    return true;
  };

  var isConstant = function (r) {
    if (r.kind !== "constant") {
      return false;
    }
  };

  var isNamespace = function (r) {
    return r.kind === 'namespace';
  };

  var _this = this;

  var documented = results.filter(isPublic).filter(isDocumented);

  var classes = documented.filter(isClass).map(function (c) {

    var members = documented.filter(isMemberOf(c.name));
    var instance = members.filter(isInstance);
    var static   = members.filter(isStatic);

    return {
      name:             c.name,
      constructor:      _this.formatParams(c.params),
      methods:          instance.filter(isFunction).map(_this.formatMethod.bind(_this)),
      properties:       instance.filter(isProperty).map(_this.formatProperty.bind(_this)),
      staticProperties: static.filter(isProperty).map(_this.formatProperty.bind(_this)),
      staticMethods:    static.filter(isFunction).map(_this.formatMethod.bind(_this))
    };
  });

  var functions = documented.filter(isGlobalFunction).map(_this.formatMethod.bind(_this));

  var namespaces = documented.filter(isNamespace).map(function (n) {

    var members = documented.filter(isMemberOf(n.name));

    return {
      name:       n.name,
      properties: members.filter(isProperty).map(_this.formatProperty.bind(_this)),
      methods:    members.filter(isFunction).map(_this.formatMethod.bind(_this))
    };
  });

  return {
    classes:    classes,
    functions:  functions,
    namespaces: []
  };
};

module.exports = JSDOCParser;
