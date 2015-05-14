
var fs = require('fs');

var JSDOCParser = function () {};

JSDOCParser.prototype.formatType = function (t) {
  if (typeof t === 'undefined') {
    return [];
  }
  if (typeof t.names === 'undefined') {
    return [];
  }
  return t.names;
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

  var isPublic = function (r) {
    return r.scope === 'instance';
  };

  var isClass = function (r) {
    return r.kind === 'class';
  };

  var isMemberOf = function (type) {
    return function (r) {
      return r['memberof'] === type;
    };
  };

  var isMethod = function (r) {
    if(!isPublic(r)) {
      return false;
    }
    if (r.kind !== 'function') {
      return false;
    }
    if (r.name.indexOf("_") === 0) {
      return false;
    }
    return true;
  };

  var isProperty = function (r) {
    if (!isPublic(r)) {
      return false;
    }
    if (r.kind !== 'member') {
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

  var _this = this;

  return results.filter(isClass).map(function (c) {
    var members = results.filter(isMemberOf(c.name));
    return {
      name:        c.name,
      constructor: this.formatParams(c.params),
      methods:     members.filter(isMethod).map(_this.formatMethod.bind(_this)),
      properties:  members.filter(isProperty).map(_this.formatProperty.bind(_this))
    };
  });
};

module.exports = JSDOCParser;
