
var TypeParser = require("./TypeParser");

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

function parseType(t) {
  if (typeof t === 'undefined') {
    return [];
  }
  if (typeof t.names === 'undefined') {
    return [];
  }
  return t.names.map(function (name) {
    return TypeParser.reformat(name);
  });
}

function parseReturn(r) {
  if (typeof r === 'undefined') {
    return undefined;
  }
  if (r.length === 1) {
    return parseType(r[0].type);
  } else {
    return r.map(function (r) {
      return parseType(r.type);
    });
  }
}

function parseProperty(r) {
  return {
    name:  r.name,
    type:  parseType(r.type)
  };
}

function parseMethod(r) {
  return {
    name:    r.name,
    params:  parseParams(r.params),
    returns: parseReturn(r.returns)
  }
}

function parseParam(p) {
  if (typeof p === 'undefined') {
    return undefined;
  }
  return {
    name:     p.name,
    optional: p.optional,
    type:     parseType(p.type)
  };
}

function parseParams(params) {
  if (typeof params === 'undefined') {
    return [];
  }
  return params.map(function (p) {
    return parseParam(p);
  });
}

function parseTypeDef(td) {
  return {
    name:    td.name,
    type:    parseType(td.type),
    params:  parseParams(td.params),
    returns: parseReturn(td.returns)
  };
}

function parse(results) {

  var documented = results.filter(isPublic).filter(isDocumented);

  var classes = documented.filter(isClass).map(function (c) {

    var members = documented.filter(isMemberOf(c.name));
    var instance = members.filter(isInstance);
    var static   = members.filter(isStatic);

    return {
      name:             c.name,
      constructor:      parseParams(c.params),
      methods:          instance.filter(isFunction).map(parseMethod),
      properties:       instance.filter(isProperty).map(parseProperty),
      staticProperties: static.filter(isProperty).map(parseProperty),
      staticMethods:    static.filter(isFunction).map(parseMethod),
      typedefs:         members.filter(isTypeDef).map(parseTypeDef)
    };
  });

  var functions = documented.filter(isGlobalFunction).map(parseMethod).map(function (f) {
    f.typedefs = documented.filter(isMemberOf(f.name)).filter(isTypeDef).map(parseTypeDef)
    return f;
  });

  var namespaces = documented.filter(isNamespace).map(function (n) {

    var members = documented.filter(isMemberOf(n.name));

    return {
      name:       n.name,
      properties: members.filter(isProperty).map(parseProperty),
      methods:    members.filter(isFunction).map(parseMethod)
    };
  });

  return {
    classes:    classes,
    functions:  functions,
    namespaces: namespaces
  };
}

module.exports = parse;
