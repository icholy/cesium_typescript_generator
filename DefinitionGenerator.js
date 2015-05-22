
function makeGenerator(indent) {

  function formatProperty(p) {
    var s = p.name;
    if (p.type.length !== 0) {
      s += formatTypeAnnotation(p.type);
    }
    return s + ";";
  }

  function formatStaticProperty(p) {
    return "static " + formatProperty(p);
  }

  function formatMethod(m) {
    var s = m.name + "(" + formatParameters(m.params) + ")";
    if (m.returns && m.returns.length !== 0) {
      s += formatTypeAnnotation(m.returns);
    }
    return s + ";";
  }

  function formatStaticMethod(m) {
    return "static " + formatMethod(m);
  }

  function formatFixOptionalParameters(items) {
    var optionalIndex = items.reduce(function (optionalIndex, item, i) {
      if (item.optional === true) {
        return optionalIndex;
      }
      return i;
    }, 0);
    items.forEach(function (item, i) {
      if (i < optionalIndex) {
        if (typeof item.optional !== 'undefined') {
          delete item.optional;
        }
      }
    });
    return items;
  }

  function formatConsolodateNestedTypes(items) {

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
  }

  function formatTypeAnnotation(type) {

    type = type.filter(function (t) {
      return t !== 'undefined';
    });

    if (type.length === 0) {
      return "";
    }

    return ": " + formatType(type);
  }

  function formatType(type) {
    
    var s = "";

    if (typeof type === 'undefined') {
      return 'void';
    }

    type = type.filter(function (t) {
      return t !== 'undefined';
    });

    if (type.length === 0) {
      return "";
    }

    if (typeof type[0] === 'object') {
      
      var typeObj = type[0];
      
      s += "{ ";

      s += Object.keys(typeObj).map(function (name) {

        var p = typeObj[name];
        var s = name;

        if (p.optional === true) {
          s += "?";
        }

        s += formatTypeAnnotation(p.type);
        return s;
      }).join("; ");

      s += " }";

    } else {
      s += type.join("|");
    }
    return s;
  }

  function formatParameters(parameters) {

    parameters = formatConsolodateNestedTypes(parameters);
    parameters = formatFixOptionalParameters(parameters);

    return parameters.map(function (p) {

      var s = p.name;

      if (p.optional === true) {
        s += "?";
      }

      return s + formatTypeAnnotation(p.type);
    }).join(", ");
  }

  function formatTypeDef(td) {
    if (td.type.length === 1 &&
        (
          typeof td.params !== 'undefined' ||
          typeof td.returns !== 'undefined'
        )) {

      return "type " + td.name + " = " + "(" + formatParameters(td.params) + ") => " + formatType(td.returns) + ";";
    }
    return "type " + td.name + " = " + formatType(td.type) + ";";
  }

  function formatClass(c) {

    var s = "class " + c.name + " {\n";

    formatConsolodateNestedTypes(c.properties).forEach(function (prop) {
      s += indent + formatProperty(prop) + "\n";
    });

    formatConsolodateNestedTypes(c.staticProperties).forEach(function (prop) {
      s += indent + formatStaticProperty(prop) + "\n";
    })

    if (c.constructor.length !== 0) {
      s += indent + "constructor(" + formatParameters(c.constructor) + ");\n";
    }

    c.methods.forEach(function (method) {
      s += indent + formatMethod(method) + "\n";
    });

    c.staticMethods.forEach(function (method) {
      s += indent + formatStaticMethod(method) + "\n";
    });

    s += "}";

    if (c.typedefs.length !== 0) {

      s += "\n\nmodule " + c.name + "{\n";

      c.typedefs.forEach(function (typedef) {
        s += indent + formatTypeDef(typedef) + "\n";
      });

      s += "}";

    }
    return s;
  }

  function formatEnum(n) {
    var s = "enum " + n.name + " {\n";
    n.properties.forEach(function (p) {
      s += indent + p.name + ",\n";
    });
    return s + "}";
  }

  function formatNamespace(n) {
    var s = "module " + n.name + " {\n";
    n.methods.forEach(function (method) {
      s += indent + "function " + formatMethod(method) + "\n";
    });
    return s + "}";
  }

  function generate(info) {
    var s = "";
    info.classes.forEach(function (c) {
      s += "\n\n" + formatClass(c);
    })
    info.functions.forEach(function (f) {
      s += "\n\nfunction "  + formatMethod(f);

      if (f.typedefs.length !== 0) {
        s += "\n\nmodule " + f.name + " {\n";
        f.typedefs.forEach(function (typedef) {
          s += indent + formatTypeDef(typedef) + "\n";
        });
        s += "}";
      }
      
      return s;
    });
    info.namespaces.forEach(function (n) {
      if (n.properties.length !== 0) {
        s += "\n\n" + formatEnum(n);
      }
      if (n.methods.length !== 0) {
        s += "\n\n" + formatNamespace(n);
      }
    });
    return s;
  }

  return generate;
}

module.exports = makeGenerator;
