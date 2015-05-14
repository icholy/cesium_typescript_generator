
var DefinitionGenerator = function () {
  this.indent = "    ";
};

DefinitionGenerator.prototype.property = function (p) {
  var s = p.name;
  if (p.type.length !== 0) {
    s += ": " + p.type.join("|");
  }
  return s + ";";
};

DefinitionGenerator.prototype.staticProperty = function (p) {
  return "static " + this.property(p);
};

DefinitionGenerator.prototype.method = function (m) {
  var _this = this;
  var s = m.name + "(" + _this.parameters(m.params) + ")";
  if (m.returns && m.returns.length !== 0) {
    s += ": " + m.returns.join("|");
  }
  return s + ";";
};

DefinitionGenerator.prototype.staticMethod = function (m) {
  return "static " + this.method(m);
};

DefinitionGenerator.prototype.parameters = function (parameters) {

  var paramMap  = {};
  var paramList = [];

  parameters.forEach(function (p) {

    if (p.name.indexOf(".") === -1) {
      paramMap[p.name] = p;
      paramList.push(p);
      return;
    }

    var parts      = p.name.split(".");
    var parentName = parts[0];
    var childName  = parts.slice(1).join("");
    var parent     = paramMap[parentName];

    if (typeof parent === 'undefined') {
      parent = {
        name: parentName,
        type: [{}]
      };
      paramMap[parentName] = parent;
    }

    var typeObj = parent.type[0];
    if (typeof obj !== 'object') {
      typeObj = {};
      parent.type[0] = typeObj;
    }

    typeObj[childName] = { type: p.type };
    if (p.optional === true) {
      typeObj[childName].optional = true;
    }

  });

  return paramList.map(function (p) {

    var s = p.name;

    if (p.optional === true) {
      s += "?";
    }

    if (typeof p.type[0] === 'object') {
      
      var typeObj = p.type[0];
      
      s += ": { ";

      s += Object.keys(typeObj).map(function (name) {

        var p = typeObj[name];
        var s = name;

        if (p.optional === true) {
          s += "?";
        }

        s += ": " + p.type.join("|");
        return s;
      }).join("; ");

      s += " }";

    } else {
      s += ": " + p.type.join("|");
    }

    return s;
  }).join(", ");
};

DefinitionGenerator.prototype.clazz = function (c) {

  var _this = this;

  var s = "declare class " + c.name + " {\n";

  c.properties.forEach(function (prop) {
    s += _this.indent + _this.property(prop) + "\n";
  });

  c.staticProperties.forEach(function (prop) {
    s += _this.indent + _this.staticProperty(prop) + "\n";
  })

  s += _this.indent + "constructor(" + _this.parameters(c.constructor) + ");\n";

  c.methods.forEach(function (method) {
    s += _this.indent + _this.method(method) + "\n";
  });

  c.staticMethods.forEach(function (method) {
    s += _this.indent + _this.staticMethod(method) + "\n";
  });

  return s + "}";
};

DefinitionGenerator.prototype.generate = function (info) {
  var _this = this;
  var s = "";
  info.classes.forEach(function (c) {
    s += "\n\n" + _this.clazz(c);
  })
  info.functions.forEach(function (f) {
    s += "\n" + "declare function "  + _this.method(f);
  });
  return s;
};

module.exports = DefinitionGenerator;
