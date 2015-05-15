
var DefinitionGenerator = function () {
  this.indent = "    ";
};

DefinitionGenerator.prototype.property = function (p) {
  var s = p.name;
  if (p.type.length !== 0) {
    s += this.type(p.type);
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
    s += _this.type(m.returns);
  }
  return s + ";";
};

DefinitionGenerator.prototype.staticMethod = function (m) {
  return "static " + this.method(m);
};

DefinitionGenerator.prototype.consolodateNestedTypes = function (items) {

  var itemMap  = {};
  var itemList = [];

  items.forEach(function (item) {

    if (item.name.indexOf(".") === -1) {
      itemMap[item.name] = item;
      itemList.push(item);
      return;
    }

    var parts      = item.name.split(".");
    var parentName = parts[0];
    var childName  = parts.slice(1).join("");
    var parent     = itemMap[parentName];

    if (typeof parent === 'undefined') {
      parent = {
        name: parentName,
        type: [{}]
      };
      itemMap[parentName] = parent;
    }

    var typeObj = parent.type[0];
    if (typeof typeObj !== 'object') {
      typeObj = {};
      parent.type[0] = typeObj;
    }

    typeObj[childName] = { type: item.type };
    if (item.optional === true) {
      typeObj[childName].optional = true;
    }

  });

  return itemList;
};

DefinitionGenerator.prototype.type = function (type) {

  type = type.filter(function (t) {
    return t !== 'undefined';
  });

  if (type.length === 0) {
    return "";
  }

  var s = ": ";
  if (typeof type[0] === 'object') {
    
    var typeObj = type[0];
    
    s += "{ ";

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
    s += type.join("|");
  }
  return s;
};

DefinitionGenerator.prototype.parameters = function (parameters) {

  var _this = this;

  var parameters = this.consolodateNestedTypes(parameters);

  return parameters.map(function (p) {

    var s = p.name;

    if (p.optional === true) {
      s += "?";
    }

    return s + _this.type(p.type);
  }).join(", ");
};

DefinitionGenerator.prototype.clazz = function (c) {

  var _this = this;

  var s = "class " + c.name + " {\n";

  _this.consolodateNestedTypes(c.properties).forEach(function (prop) {
    s += _this.indent + _this.property(prop) + "\n";
  });

  _this.consolodateNestedTypes(c.staticProperties).forEach(function (prop) {
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

DefinitionGenerator.prototype.enum = function (n) {
  var _this = this;
  var s = "enum " + n.name + " {\n";
  n.properties.forEach(function (p) {
    s += _this.indent + p.name + ",\n";
  });
  return s + "}";
};

DefinitionGenerator.prototype.namespace = function (n) {
  var _this = this;
  var s = "module " + n.name + " {\n";
  n.methods.forEach(function (method) {
    s += _this.indent + "function " + _this.method(method) + "\n";
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
    s += "\n" + "function "  + _this.method(f);
  });
  info.namespaces.forEach(function (n) {
    if (n.properties.length !== 0) {
      s += "\n\n" + _this.enum(n);
    }
    if (n.methods.length !== 0) {
      s += "\n\n" + _this.namespace(n);
    }
  });
  return s;
};

module.exports = DefinitionGenerator;
