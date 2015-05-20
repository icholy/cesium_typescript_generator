
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

TypeParser.prototype.type = function () {

  var t = {
    name:          "",
    typeParam: null
  };

  while (!this.isEOF()) {
    var c = this.next();
    switch (c) {
      case ".":
        break;
      case "<":
        t.typeParam = this.type();
        return t;
      case ">":
        return t;
      default:
        t.name += c;
    }
  }
  
  return t;
};

TypeParser.formatName = function (name) {
  // TODO: figure out how to handle these
  if (name.indexOf('~') !== -1) {
    return 'unknown';
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

TypeParser.formatType = function (t) {
  if (t.typeParam === null) {
    return this.formatName(t.name);
  } else {
    return t.name + "<" + this.formatType(t.typeParam) + ">";
  }
};

TypeParser.format = function (name) {
  var p = new TypeParser(name);
  var t = p.type();
  return this.formatType(t);
};

module.exports = TypeParser;
