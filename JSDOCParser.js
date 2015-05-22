
var TypeParser = require("./TypeParser");

var JSDOCParser = function () {};

JSDOCParser.prototype.parseType = function (t) {
  var _this = this;
  if (typeof t === 'undefined') {
    return [];
  }
  if (typeof t.names === 'undefined') {
    return [];
  }
  return t.names.map(function (name) {
    return TypeParser.reformat(name);
  });
};

JSDOCParser.prototype.parseReturn = function (r) {
  var _this = this;
  if (typeof r === 'undefined') {
    return undefined;
  }
  if (r.length === 1) {
    return this.parseType(r[0].type);
  } else {
    return r.map(function (r) {
      return _this.parseType(r.type);
    });
  }
};

JSDOCParser.prototype.parseProperty = function (r) {
  return {
    name:  r.name,
    type:  this.parseType(r.type)
  };
};

JSDOCParser.prototype.parseMethod = function (r) {
  return {
    name:    r.name,
    params:  this.parseParams(r.params),
    returns: this.parseReturn(r.returns)
  }
};

JSDOCParser.prototype.parseParam = function (p) {
  if (typeof p === 'undefined') {
    return undefined;
  }
  return {
    name:     p.name,
    optional: p.optional,
    type:     this.parseType(p.type)
  };
};

JSDOCParser.prototype.parseParams = function (params) {
  var _this = this;
  if (typeof params === 'undefined') {
    return [];
  }
  return params.map(function (p) {
    return _this.parseParam(p);
  });
};

JSDOCParser.prototype.parseTypeDef = function (td) {
  var _this = this;
  return {
    name:    td.name,
    type:    _this.parseType(td.type),
    params:  _this.parseParams(td.params),
    returns: _this.parseReturn(td.returns)
  };
};

JSDOCParser.prototype.parse = function (results) {

  var isDocumented = function (r) {
    return r.undocumented !== true;
  };

  var isPublic = function (r) {
    return r.access !== "private";
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
    return r.kind === 'constant';
  };

  var isNamespace = function (r) {
    return r.kind === 'namespace';
  };
  
  var isTypeDef = function (r) {
    return r.kind === 'typedef';
  };

  var _this = this;

  var documented = results.filter(isPublic).filter(isDocumented);

  var classes = documented.filter(isClass).map(function (c) {

    var members = documented.filter(isMemberOf(c.name));
    var instance = members.filter(isInstance);
    var static   = members.filter(isStatic);

    return {
      name:             c.name,
      constructor:      _this.parseParams(c.params),
      methods:          instance.filter(isFunction).map(_this.parseMethod.bind(_this)),
      properties:       instance.filter(isProperty).map(_this.parseProperty.bind(_this)),
      staticProperties: static.filter(isProperty).map(_this.parseProperty.bind(_this)),
      staticMethods:    static.filter(isFunction).map(_this.parseMethod.bind(_this)),
      typedefs:         members.filter(isTypeDef).map(_this.parseTypeDef.bind(_this))
    };
  });

  var functions = documented.filter(isGlobalFunction).map(_this.parseMethod.bind(_this)).map(function (f) {
    f.typedefs = documented.filter(isMemberOf(f.name)).filter(isTypeDef).map(_this.parseTypeDef.bind(_this))
    return f;
  });

  var namespaces = documented.filter(isNamespace).map(function (n) {

    var members = documented.filter(isMemberOf(n.name));

    return {
      name:       n.name,
      properties: members.filter(isProperty).map(_this.parseProperty.bind(_this)),
      methods:    members.filter(isFunction).map(_this.parseMethod.bind(_this))
    };
  });

  return {
    classes:    classes,
    functions:  functions,
    namespaces: namespaces
  };
};

module.exports = JSDOCParser;
