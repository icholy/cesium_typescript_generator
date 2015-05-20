
var TypeParser = function (input) {
  this._pos = 0;
  this._input = input;
};

TypeParser.prototype.isEOF = function () {
  return this._pos > this._input.length;
};

TypeParser.prototype.next = function () {
  var pos = this._pos++;
  return this._input.charAt(pos);
};

TypeParser.prototype.type = function (parent) {

  var t = {
    name:      "",
    typeParam: []
  };

  while (!this.isEOF()) {
    var c = this.next();
    switch (c) {
      case ".":
      case ")":
      case "(":
        break;
      case "<":
        this.type(t);
        break;
      case ">":
        parent.typeParam.push(t);
        return;
      case "|":
        this.type(parent);
        break;
      default:
        t.name += c;
    }
  }
  
  parent.typeParam.push(t);
};

TypeParser.formatName = function (name) {

  if (name.indexOf("~") !== -1) {
    return name.replace("~", ".");
  }

  switch (name) {
    case 'String':
      return 'string';
    case 'Number':
      return 'number';
    case 'Boolean':
      return 'boolean';
    case 'Object':
      return 'any';
    case 'Array':
      return 'any[]';
    case 'function':
      return 'Function';
    case '*':
      return '...any';
    case 'Any':
      return 'any';
    case 'Image':
      return 'HTMLImageElement';
    case 'Canvas':
      return 'HTMLCanvasElement';
    case 'CanvasPixelArray':
      return 'number[]';
    case 'TypedArray':
      return '(' + [
        'Int8Array',
        'Uint8Array',
        'Int16Array',
        'Uint16Array',
        'Float32Array',
        'Float64Array'
      ].join('|') + ')';
    default:
      return name;
  }
}

TypeParser.formatUnion = function (types) {
  return types.reverse().map(function (type) {
    return TypeParser.formatType(type);
  }).join("|");
};

TypeParser.formatType = function (type) {
  if (type.typeParam.length === 0) {
    return TypeParser.formatName(type.name)
  } else {
    if (type.name === "Array" && type.typeParam.length === 1) {
      return TypeParser.formatUnion(type.typeParam) + "[]";
    } else {
      return TypeParser.formatName(type.name) + "<" + TypeParser.formatUnion(type.typeParam) + ">";
    }
  }
};

TypeParser.format = function (root) {
  return TypeParser.formatUnion(root.typeParam);
};

TypeParser.parse = function (input) {
  var p = new TypeParser(input);
  var root = { typeParam: [], name: "root" };
  p.type(root);
  return root;
};

TypeParser.reformat = function (input) {
  var root = TypeParser.parse(input);
  return TypeParser.format(root);
};

module.exports = TypeParser;
