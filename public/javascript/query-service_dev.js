var CLOSURE_NO_DEPS = true;
var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(opt_returnValue, var_args) {
  return opt_returnValue
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    if(ctor.instance_) {
      return ctor.instance_
    }
    if(goog.DEBUG) {
      goog.instantiatedSingletons_[goog.instantiatedSingletons_.length] = ctor
    }
    return ctor.instance_ = new ctor
  }
};
goog.instantiatedSingletons_ = [];
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = typeof val;
  return type == "object" && val != null || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  if(Error.captureStackTrace) {
    Error.captureStackTrace(this, goog.debug.Error)
  }else {
    this.stack = (new Error).stack || ""
  }
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.urlEncode = function(str) {
  return encodeURIComponent(String(str))
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.countOf = function(s, ss) {
  return s && ss ? s.split(ss).length - 1 : 0
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCase = function(str) {
  return String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  })
};
goog.string.toSelectorCase = function(str) {
  return String(str).replace(/([A-Z])/g, "-$1").toLowerCase()
};
goog.string.toTitleCase = function(str, opt_delimiters) {
  var delimiters = goog.isString(opt_delimiters) ? goog.string.regExpEscape(opt_delimiters) : "\\s";
  delimiters = delimiters ? "|[" + delimiters + "]+" : "";
  var regexp = new RegExp("(^" + delimiters + ")([a-z])", "g");
  return str.replace(regexp, function(all, p1, p2) {
    return p1 + p2.toUpperCase()
  })
};
goog.string.parseInt = function(value) {
  if(isFinite(value)) {
    value = String(value)
  }
  if(goog.isString(value)) {
    return/^\s*-?0x/i.test(value) ? parseInt(value, 16) : parseInt(value, 10)
  }
  return NaN
};
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
  return value
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.toArray = function(object) {
  var length = object.length;
  if(length > 0) {
    var rv = new Array(length);
    for(var i = 0;i < length;i++) {
      rv[i] = object[i]
    }
    return rv
  }
  return[]
};
goog.array.clone = goog.array.toArray;
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.string.format");
goog.require("goog.string");
goog.string.format = function(formatString, var_args) {
  var args = Array.prototype.slice.call(arguments);
  var template = args.shift();
  if(typeof template == "undefined") {
    throw Error("[goog.string.format] Template required");
  }
  var formatRe = /%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;
  function replacerDemuxer(match, flags, width, dotp, precision, type, offset, wholeString) {
    if(type == "%") {
      return"%"
    }
    var value = args.shift();
    if(typeof value == "undefined") {
      throw Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = value;
    return goog.string.format.demuxes_[type].apply(null, arguments)
  }
  return template.replace(formatRe, replacerDemuxer)
};
goog.string.format.demuxes_ = {};
goog.string.format.demuxes_["s"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value;
  if(isNaN(width) || width == "" || replacement.length >= width) {
    return replacement
  }
  if(flags.indexOf("-", 0) > -1) {
    replacement = replacement + goog.string.repeat(" ", width - replacement.length)
  }else {
    replacement = goog.string.repeat(" ", width - replacement.length) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["f"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value.toString();
  if(!(isNaN(precision) || precision == "")) {
    replacement = value.toFixed(precision)
  }
  var sign;
  if(value < 0) {
    sign = "-"
  }else {
    if(flags.indexOf("+") >= 0) {
      sign = "+"
    }else {
      if(flags.indexOf(" ") >= 0) {
        sign = " "
      }else {
        sign = ""
      }
    }
  }
  if(value >= 0) {
    replacement = sign + replacement
  }
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  replacement = isNaN(precision) ? Math.abs(value).toString() : Math.abs(value).toFixed(precision);
  var padCount = width - replacement.length - sign.length;
  if(flags.indexOf("-", 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(" ", padCount)
  }else {
    var paddingChar = flags.indexOf("0", 0) >= 0 ? "0" : " ";
    replacement = sign + goog.string.repeat(paddingChar, padCount) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["d"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  return goog.string.format.demuxes_["f"](parseInt(value, 10), flags, width, dotp, 0, type, offset, wholeString)
};
goog.string.format.demuxes_["i"] = goog.string.format.demuxes_["d"];
goog.string.format.demuxes_["u"] = goog.string.format.demuxes_["d"];
goog.provide("goog.string.StringBuffer");
goog.string.StringBuffer = function(opt_a1, var_args) {
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.buffer_ = "";
goog.string.StringBuffer.prototype.set = function(s) {
  this.buffer_ = "" + s
};
goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
  this.buffer_ += a1;
  if(opt_a2 != null) {
    for(var i = 1;i < arguments.length;i++) {
      this.buffer_ += arguments[i]
    }
  }
  return this
};
goog.string.StringBuffer.prototype.clear = function() {
  this.buffer_ = ""
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.buffer_.length
};
goog.string.StringBuffer.prototype.toString = function() {
  return this.buffer_
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.format");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.set_print_fn_BANG_ = function set_print_fn_BANG_(f) {
  return cljs.core._STAR_print_fn_STAR_ = f
};
goog.exportSymbol("cljs.core.set_print_fn_BANG_", cljs.core.set_print_fn_BANG_);
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.PersistentArrayMap.fromArray(["\ufdd0:flush-on-newline", cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0:readably", cljs.core._STAR_print_readably_STAR_, "\ufdd0:meta", cljs.core._STAR_print_meta_STAR_, "\ufdd0:dup", cljs.core._STAR_print_dup_STAR_], true)
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.not_native = null;
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.array_QMARK_ = function array_QMARK_(x) {
  return x instanceof Array
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return typeof n === "number"
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3941__auto__ = goog.isString(x);
  if(and__3941__auto__) {
    return!(x.charAt(0) === "\ufdd0")
  }else {
    return and__3941__auto__
  }
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var x__$1 = x == null ? null : x;
  if(p[goog.typeOf(x__$1)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0:else") {
        return false
      }else {
        return null
      }
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  var ty = cljs.core.type.call(null, obj);
  var ty__$1 = cljs.core.truth_(function() {
    var and__3941__auto__ = ty;
    if(cljs.core.truth_(and__3941__auto__)) {
      return ty.cljs$lang$type
    }else {
      return and__3941__auto__
    }
  }()) ? ty.cljs$lang$ctorStr : goog.typeOf(obj);
  return new Error(["No protocol method ", proto, " defined for type ", ty__$1, ": ", obj].join(""))
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  make_array.cljs$core$IFn$_invoke$arity$1 = make_array__1;
  make_array.cljs$core$IFn$_invoke$arity$2 = make_array__2;
  return make_array
}();
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__3989__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__3989 = function(array, i, var_args) {
      var idxs = null;
      if(arguments.length > 2) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3989__delegate.call(this, array, i, idxs)
    };
    G__3989.cljs$lang$maxFixedArity = 2;
    G__3989.cljs$lang$applyTo = function(arglist__3990) {
      var array = cljs.core.first(arglist__3990);
      arglist__3990 = cljs.core.next(arglist__3990);
      var i = cljs.core.first(arglist__3990);
      var idxs = cljs.core.rest(arglist__3990);
      return G__3989__delegate(array, i, idxs)
    };
    G__3989.cljs$core$IFn$_invoke$arity$variadic = G__3989__delegate;
    return G__3989
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$core$IFn$_invoke$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$core$IFn$_invoke$arity$2 = aget__2;
  aget.cljs$core$IFn$_invoke$arity$variadic = aget__3.cljs$core$IFn$_invoke$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  into_array.cljs$core$IFn$_invoke$arity$1 = into_array__1;
  into_array.cljs$core$IFn$_invoke$arity$2 = into_array__2;
  return into_array
}();
cljs.core.Fn = {};
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2942__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2942__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2942__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2942__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2942__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2942__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2942__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2942__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2942__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2942__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2942__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2942__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2942__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2942__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2942__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2942__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2942__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2942__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2942__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2942__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2942__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2942__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2942__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2942__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2942__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2942__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2942__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2942__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2942__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2942__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2942__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2942__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2942__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2942__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2942__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2942__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2942__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2942__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2942__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2942__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2942__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2942__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _invoke.cljs$core$IFn$_invoke$arity$1 = _invoke__1;
  _invoke.cljs$core$IFn$_invoke$arity$2 = _invoke__2;
  _invoke.cljs$core$IFn$_invoke$arity$3 = _invoke__3;
  _invoke.cljs$core$IFn$_invoke$arity$4 = _invoke__4;
  _invoke.cljs$core$IFn$_invoke$arity$5 = _invoke__5;
  _invoke.cljs$core$IFn$_invoke$arity$6 = _invoke__6;
  _invoke.cljs$core$IFn$_invoke$arity$7 = _invoke__7;
  _invoke.cljs$core$IFn$_invoke$arity$8 = _invoke__8;
  _invoke.cljs$core$IFn$_invoke$arity$9 = _invoke__9;
  _invoke.cljs$core$IFn$_invoke$arity$10 = _invoke__10;
  _invoke.cljs$core$IFn$_invoke$arity$11 = _invoke__11;
  _invoke.cljs$core$IFn$_invoke$arity$12 = _invoke__12;
  _invoke.cljs$core$IFn$_invoke$arity$13 = _invoke__13;
  _invoke.cljs$core$IFn$_invoke$arity$14 = _invoke__14;
  _invoke.cljs$core$IFn$_invoke$arity$15 = _invoke__15;
  _invoke.cljs$core$IFn$_invoke$arity$16 = _invoke__16;
  _invoke.cljs$core$IFn$_invoke$arity$17 = _invoke__17;
  _invoke.cljs$core$IFn$_invoke$arity$18 = _invoke__18;
  _invoke.cljs$core$IFn$_invoke$arity$19 = _invoke__19;
  _invoke.cljs$core$IFn$_invoke$arity$20 = _invoke__20;
  _invoke.cljs$core$IFn$_invoke$arity$21 = _invoke__21;
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2942__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._count[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._count["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2942__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._empty[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._empty["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2942__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._conj[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._conj["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3941__auto__ = coll;
      if(and__3941__auto__) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3941__auto__
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2942__auto__ = coll == null ? null : coll;
      return function() {
        var or__3943__auto__ = cljs.core._nth[goog.typeOf(x__2942__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._nth["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3941__auto__ = coll;
      if(and__3941__auto__) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3941__auto__
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2942__auto__ = coll == null ? null : coll;
      return function() {
        var or__3943__auto__ = cljs.core._nth[goog.typeOf(x__2942__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._nth["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _nth.cljs$core$IFn$_invoke$arity$2 = _nth__2;
  _nth.cljs$core$IFn$_invoke$arity$3 = _nth__3;
  return _nth
}();
cljs.core.ASeq = {};
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2942__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._first[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._first["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2942__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._rest[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._rest["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2942__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._next[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._next["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3941__auto__ = o;
      if(and__3941__auto__) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3941__auto__
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2942__auto__ = o == null ? null : o;
      return function() {
        var or__3943__auto__ = cljs.core._lookup[goog.typeOf(x__2942__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._lookup["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3941__auto__ = o;
      if(and__3941__auto__) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3941__auto__
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2942__auto__ = o == null ? null : o;
      return function() {
        var or__3943__auto__ = cljs.core._lookup[goog.typeOf(x__2942__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._lookup["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _lookup.cljs$core$IFn$_invoke$arity$2 = _lookup__2;
  _lookup.cljs$core$IFn$_invoke$arity$3 = _lookup__3;
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2942__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._contains_key_QMARK_[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._contains_key_QMARK_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2942__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._assoc[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._assoc["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2942__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._dissoc[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._dissoc["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2942__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._key[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._key["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2942__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._val[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._val["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2942__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._disjoin[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._disjoin["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2942__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._peek[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._peek["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2942__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._pop[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._pop["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2942__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._assoc_n[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._assoc_n["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2942__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._deref[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._deref["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2942__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._deref_with_timeout[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._deref_with_timeout["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2942__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._meta[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._meta["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2942__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._with_meta[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._with_meta["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3941__auto__ = coll;
      if(and__3941__auto__) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3941__auto__
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2942__auto__ = coll == null ? null : coll;
      return function() {
        var or__3943__auto__ = cljs.core._reduce[goog.typeOf(x__2942__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._reduce["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3941__auto__ = coll;
      if(and__3941__auto__) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3941__auto__
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2942__auto__ = coll == null ? null : coll;
      return function() {
        var or__3943__auto__ = cljs.core._reduce[goog.typeOf(x__2942__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._reduce["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _reduce.cljs$core$IFn$_invoke$arity$2 = _reduce__2;
  _reduce.cljs$core$IFn$_invoke$arity$3 = _reduce__3;
  return _reduce
}();
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2942__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._kv_reduce[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._kv_reduce["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2942__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._equiv[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._equiv["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2942__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._hash[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._hash["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2942__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._seq[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._seq["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IList = {};
cljs.core.IRecord = {};
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2942__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._rseq[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._rseq["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2942__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._sorted_seq[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._sorted_seq["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2942__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._sorted_seq_from[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._sorted_seq_from["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2942__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._entry_key[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._entry_key["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2942__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._comparator[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._comparator["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IWriter = {};
cljs.core._write = function _write(writer, s) {
  if(function() {
    var and__3941__auto__ = writer;
    if(and__3941__auto__) {
      return writer.cljs$core$IWriter$_write$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return writer.cljs$core$IWriter$_write$arity$2(writer, s)
  }else {
    var x__2942__auto__ = writer == null ? null : writer;
    return function() {
      var or__3943__auto__ = cljs.core._write[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._write["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IWriter.-write", writer);
        }
      }
    }().call(null, writer, s)
  }
};
cljs.core._flush = function _flush(writer) {
  if(function() {
    var and__3941__auto__ = writer;
    if(and__3941__auto__) {
      return writer.cljs$core$IWriter$_flush$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return writer.cljs$core$IWriter$_flush$arity$1(writer)
  }else {
    var x__2942__auto__ = writer == null ? null : writer;
    return function() {
      var or__3943__auto__ = cljs.core._flush[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._flush["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IWriter.-flush", writer);
        }
      }
    }().call(null, writer)
  }
};
cljs.core.IPrintWithWriter = {};
cljs.core._pr_writer = function _pr_writer(o, writer, opts) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$IPrintWithWriter$_pr_writer$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$IPrintWithWriter$_pr_writer$arity$3(o, writer, opts)
  }else {
    var x__2942__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._pr_writer[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._pr_writer["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintWithWriter.-pr-writer", o);
        }
      }
    }().call(null, o, writer, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3941__auto__ = d;
    if(and__3941__auto__) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2942__auto__ = d == null ? null : d;
    return function() {
      var or__3943__auto__ = cljs.core._realized_QMARK_[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._realized_QMARK_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3941__auto__ = this$;
    if(and__3941__auto__) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2942__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3943__auto__ = cljs.core._notify_watches[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._notify_watches["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3941__auto__ = this$;
    if(and__3941__auto__) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2942__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3943__auto__ = cljs.core._add_watch[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._add_watch["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3941__auto__ = this$;
    if(and__3941__auto__) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2942__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3943__auto__ = cljs.core._remove_watch[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._remove_watch["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2942__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._as_transient[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._as_transient["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3941__auto__ = tcoll;
    if(and__3941__auto__) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2942__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto__ = cljs.core._conj_BANG_[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._conj_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3941__auto__ = tcoll;
    if(and__3941__auto__) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2942__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto__ = cljs.core._persistent_BANG_[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._persistent_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3941__auto__ = tcoll;
    if(and__3941__auto__) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2942__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto__ = cljs.core._assoc_BANG_[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._assoc_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3941__auto__ = tcoll;
    if(and__3941__auto__) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2942__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto__ = cljs.core._dissoc_BANG_[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._dissoc_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3941__auto__ = tcoll;
    if(and__3941__auto__) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2942__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto__ = cljs.core._assoc_n_BANG_[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._assoc_n_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3941__auto__ = tcoll;
    if(and__3941__auto__) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2942__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto__ = cljs.core._pop_BANG_[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._pop_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3941__auto__ = tcoll;
    if(and__3941__auto__) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2942__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto__ = cljs.core._disjoin_BANG_[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._disjoin_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3941__auto__ = x;
    if(and__3941__auto__) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2942__auto__ = x == null ? null : x;
    return function() {
      var or__3943__auto__ = cljs.core._compare[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._compare["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2942__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._drop_first[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._drop_first["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2942__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._chunked_first[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._chunked_first["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2942__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._chunked_rest[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._chunked_rest["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2942__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._chunked_next[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._chunked_next["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INamed = {};
cljs.core._name = function _name(x) {
  if(function() {
    var and__3941__auto__ = x;
    if(and__3941__auto__) {
      return x.cljs$core$INamed$_name$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return x.cljs$core$INamed$_name$arity$1(x)
  }else {
    var x__2942__auto__ = x == null ? null : x;
    return function() {
      var or__3943__auto__ = cljs.core._name[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._name["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "INamed.-name", x);
        }
      }
    }().call(null, x)
  }
};
cljs.core._namespace = function _namespace(x) {
  if(function() {
    var and__3941__auto__ = x;
    if(and__3941__auto__) {
      return x.cljs$core$INamed$_namespace$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return x.cljs$core$INamed$_namespace$arity$1(x)
  }else {
    var x__2942__auto__ = x == null ? null : x;
    return function() {
      var or__3943__auto__ = cljs.core._namespace[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._namespace["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "INamed.-namespace", x);
        }
      }
    }().call(null, x)
  }
};
goog.provide("cljs.core.StringBufferWriter");
cljs.core.StringBufferWriter = function(sb) {
  this.sb = sb;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073741824
};
cljs.core.StringBufferWriter.cljs$lang$type = true;
cljs.core.StringBufferWriter.cljs$lang$ctorStr = "cljs.core/StringBufferWriter";
cljs.core.StringBufferWriter.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/StringBufferWriter")
};
cljs.core.StringBufferWriter.prototype.cljs$core$IWriter$_write$arity$2 = function(_, s) {
  var self__ = this;
  return self__.sb.append(s)
};
cljs.core.StringBufferWriter.prototype.cljs$core$IWriter$_flush$arity$1 = function(_) {
  var self__ = this;
  return null
};
cljs.core.pr_str_STAR_ = function pr_str_STAR_(obj) {
  var sb = new goog.string.StringBuffer;
  var writer = new cljs.core.StringBufferWriter(sb);
  cljs.core._pr_writer.call(null, obj, writer, cljs.core.pr_opts.call(null));
  cljs.core._flush.call(null, writer);
  return[cljs.core.str(sb)].join("")
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  return x instanceof cljs.core.Symbol
};
goog.provide("cljs.core.Symbol");
cljs.core.Symbol = function(ns, name, str, _hash, _meta) {
  this.ns = ns;
  this.name = name;
  this.str = str;
  this._hash = _hash;
  this._meta = _meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2154168321
};
cljs.core.Symbol.cljs$lang$type = true;
cljs.core.Symbol.cljs$lang$ctorStr = "cljs.core/Symbol";
cljs.core.Symbol.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/Symbol")
};
cljs.core.Symbol.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(o, writer, _) {
  var self__ = this;
  return cljs.core._write.call(null, writer, self__.str)
};
cljs.core.Symbol.prototype.cljs$core$INamed$ = true;
cljs.core.Symbol.prototype.cljs$core$INamed$_name$arity$1 = function(_) {
  var self__ = this;
  return self__.name
};
cljs.core.Symbol.prototype.cljs$core$INamed$_namespace$arity$1 = function(_) {
  var self__ = this;
  return self__.ns
};
cljs.core.Symbol.prototype.cljs$core$IHash$_hash$arity$1 = function(_) {
  var self__ = this;
  if(self__._hash === -1) {
    self__._hash = cljs.core.hash_combine.call(null, cljs.core.hash.call(null, self__.ns), cljs.core.hash.call(null, self__.name));
    return self__._hash
  }else {
    return self__._hash
  }
};
cljs.core.Symbol.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(_, new_meta) {
  var self__ = this;
  return new cljs.core.Symbol(self__.ns, self__.name, self__.str, self__._hash, new_meta)
};
cljs.core.Symbol.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var self__ = this;
  return self__._meta
};
cljs.core.Symbol.prototype.call = function() {
  var G__3992 = null;
  var G__3992__2 = function(self__, coll) {
    var self__ = this;
    var self____$1 = this;
    var sym = self____$1;
    return cljs.core._lookup.call(null, coll, sym, null)
  };
  var G__3992__3 = function(self__, coll, not_found) {
    var self__ = this;
    var self____$1 = this;
    var sym = self____$1;
    return cljs.core._lookup.call(null, coll, sym, not_found)
  };
  G__3992 = function(self__, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3992__2.call(this, self__, coll);
      case 3:
        return G__3992__3.call(this, self__, coll, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3992
}();
cljs.core.Symbol.prototype.apply = function(self__, args3991) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args3991.slice()))
};
cljs.core.Symbol.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var self__ = this;
  if(other instanceof cljs.core.Symbol) {
    return self__.str === other.str
  }else {
    return false
  }
};
cljs.core.Symbol.prototype.toString = function() {
  var self__ = this;
  var _ = this;
  return self__.str
};
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(name instanceof cljs.core.Symbol) {
      return name
    }else {
      return symbol.call(null, null, name)
    }
  };
  var symbol__2 = function(ns, name) {
    var sym_str = !(ns == null) ? [cljs.core.str(ns), cljs.core.str("/"), cljs.core.str(name)].join("") : name;
    return new cljs.core.Symbol(ns, name, sym_str, -1, null)
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  symbol.cljs$core$IFn$_invoke$arity$1 = symbol__1;
  symbol.cljs$core$IFn$_invoke$arity$2 = symbol__2;
  return symbol
}();
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__3994 = coll;
      if(G__3994) {
        if(function() {
          var or__3943__auto__ = G__3994.cljs$lang$protocol_mask$partition0$ & 8388608;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__3994.cljs$core$ISeqable$
          }
        }()) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return cljs.core._seq.call(null, coll)
    }else {
      if(coll instanceof Array) {
        if(coll.length === 0) {
          return null
        }else {
          return new cljs.core.IndexedSeq(coll, 0)
        }
      }else {
        if(cljs.core.string_QMARK_.call(null, coll)) {
          if(coll.length === 0) {
            return null
          }else {
            return new cljs.core.IndexedSeq(coll, 0)
          }
        }else {
          if(cljs.core.type_satisfies_.call(null, cljs.core.ILookup, coll)) {
            return cljs.core._seq.call(null, coll)
          }else {
            if("\ufdd0:else") {
              throw new Error([cljs.core.str(coll), cljs.core.str("is not ISeqable")].join(""));
            }else {
              return null
            }
          }
        }
      }
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__3996 = coll;
      if(G__3996) {
        if(function() {
          var or__3943__auto__ = G__3996.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__3996.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s = cljs.core.seq.call(null, coll);
      if(s == null) {
        return null
      }else {
        return cljs.core._first.call(null, s)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__3998 = coll;
      if(G__3998) {
        if(function() {
          var or__3943__auto__ = G__3998.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__3998.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s = cljs.core.seq.call(null, coll);
      if(!(s == null)) {
        return cljs.core._rest.call(null, s)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__4000 = coll;
      if(G__4000) {
        if(function() {
          var or__3943__auto__ = G__4000.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__4000.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
};
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3943__auto__ = x === y;
    if(or__3943__auto__) {
      return or__3943__auto__
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__4001__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__4002 = y;
            var G__4003 = cljs.core.first.call(null, more);
            var G__4004 = cljs.core.next.call(null, more);
            x = G__4002;
            y = G__4003;
            more = G__4004;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4001 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4001__delegate.call(this, x, y, more)
    };
    G__4001.cljs$lang$maxFixedArity = 2;
    G__4001.cljs$lang$applyTo = function(arglist__4005) {
      var x = cljs.core.first(arglist__4005);
      arglist__4005 = cljs.core.next(arglist__4005);
      var y = cljs.core.first(arglist__4005);
      var more = cljs.core.rest(arglist__4005);
      return G__4001__delegate(x, y, more)
    };
    G__4001.cljs$core$IFn$_invoke$arity$variadic = G__4001__delegate;
    return G__4001
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$core$IFn$_invoke$arity$1 = _EQ___1;
  _EQ_.cljs$core$IFn$_invoke$arity$2 = _EQ___2;
  _EQ_.cljs$core$IFn$_invoke$arity$variadic = _EQ___3.cljs$core$IFn$_invoke$arity$variadic;
  return _EQ_
}();
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.IKVReduce["null"] = true;
cljs.core._kv_reduce["null"] = function(_, f, init) {
  return init
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var and__3941__auto__ = other instanceof Date;
  if(and__3941__auto__) {
    return o.toString() === other.toString()
  }else {
    return and__3941__auto__
  }
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return Math.floor(o) % 2147483647
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IMeta["function"] = true;
cljs.core._meta["function"] = function(_) {
  return null
};
cljs.core.Fn["function"] = true;
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
goog.provide("cljs.core.Reduced");
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorStr = "cljs.core/Reduced";
cljs.core.Reduced.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var self__ = this;
  return self__.val
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return r instanceof cljs.core.Reduced
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt = cljs.core._count.call(null, cicoll);
    if(cnt === 0) {
      return f.call(null)
    }else {
      var val = cljs.core._nth.call(null, cicoll, 0);
      var n = 1;
      while(true) {
        if(n < cnt) {
          var nval = f.call(null, val, cljs.core._nth.call(null, cicoll, n));
          if(cljs.core.reduced_QMARK_.call(null, nval)) {
            return cljs.core.deref.call(null, nval)
          }else {
            var G__4006 = nval;
            var G__4007 = n + 1;
            val = G__4006;
            n = G__4007;
            continue
          }
        }else {
          return val
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt = cljs.core._count.call(null, cicoll);
    var val__$1 = val;
    var n = 0;
    while(true) {
      if(n < cnt) {
        var nval = f.call(null, val__$1, cljs.core._nth.call(null, cicoll, n));
        if(cljs.core.reduced_QMARK_.call(null, nval)) {
          return cljs.core.deref.call(null, nval)
        }else {
          var G__4008 = nval;
          var G__4009 = n + 1;
          val__$1 = G__4008;
          n = G__4009;
          continue
        }
      }else {
        return val__$1
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt = cljs.core._count.call(null, cicoll);
    var val__$1 = val;
    var n = idx;
    while(true) {
      if(n < cnt) {
        var nval = f.call(null, val__$1, cljs.core._nth.call(null, cicoll, n));
        if(cljs.core.reduced_QMARK_.call(null, nval)) {
          return cljs.core.deref.call(null, nval)
        }else {
          var G__4010 = nval;
          var G__4011 = n + 1;
          val__$1 = G__4010;
          n = G__4011;
          continue
        }
      }else {
        return val__$1
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  ci_reduce.cljs$core$IFn$_invoke$arity$2 = ci_reduce__2;
  ci_reduce.cljs$core$IFn$_invoke$arity$3 = ci_reduce__3;
  ci_reduce.cljs$core$IFn$_invoke$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val = arr[0];
      var n = 1;
      while(true) {
        if(n < cnt) {
          var nval = f.call(null, val, arr[n]);
          if(cljs.core.reduced_QMARK_.call(null, nval)) {
            return cljs.core.deref.call(null, nval)
          }else {
            var G__4012 = nval;
            var G__4013 = n + 1;
            val = G__4012;
            n = G__4013;
            continue
          }
        }else {
          return val
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt = arr.length;
    var val__$1 = val;
    var n = 0;
    while(true) {
      if(n < cnt) {
        var nval = f.call(null, val__$1, arr[n]);
        if(cljs.core.reduced_QMARK_.call(null, nval)) {
          return cljs.core.deref.call(null, nval)
        }else {
          var G__4014 = nval;
          var G__4015 = n + 1;
          val__$1 = G__4014;
          n = G__4015;
          continue
        }
      }else {
        return val__$1
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt = arr.length;
    var val__$1 = val;
    var n = idx;
    while(true) {
      if(n < cnt) {
        var nval = f.call(null, val__$1, arr[n]);
        if(cljs.core.reduced_QMARK_.call(null, nval)) {
          return cljs.core.deref.call(null, nval)
        }else {
          var G__4016 = nval;
          var G__4017 = n + 1;
          val__$1 = G__4016;
          n = G__4017;
          continue
        }
      }else {
        return val__$1
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  array_reduce.cljs$core$IFn$_invoke$arity$2 = array_reduce__2;
  array_reduce.cljs$core$IFn$_invoke$arity$3 = array_reduce__3;
  array_reduce.cljs$core$IFn$_invoke$arity$4 = array_reduce__4;
  return array_reduce
}();
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__4019 = x;
  if(G__4019) {
    if(function() {
      var or__3943__auto__ = G__4019.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__4019.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__4019.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__4019)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__4019)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__4021 = x;
  if(G__4021) {
    if(function() {
      var or__3943__auto__ = G__4021.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__4021.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__4021.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4021)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4021)
  }
};
goog.provide("cljs.core.IndexedSeq");
cljs.core.IndexedSeq = function(arr, i) {
  this.arr = arr;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199550
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorStr = "cljs.core/IndexedSeq";
cljs.core.IndexedSeq.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var self__ = this;
  if(self__.i + 1 < self__.arr.length) {
    return new cljs.core.IndexedSeq(self__.arr, self__.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var self__ = this;
  var c = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c > 0) {
    return new cljs.core.RSeq(coll, c - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  return cljs.core.array_reduce.call(null, self__.arr, f, self__.arr[self__.i], self__.i + 1)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var self__ = this;
  return cljs.core.array_reduce.call(null, self__.arr, f, start, self__.i)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var self__ = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var self__ = this;
  return self__.arr.length - self__.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var self__ = this;
  return self__.arr[self__.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var self__ = this;
  if(self__.i + 1 < self__.arr.length) {
    return new cljs.core.IndexedSeq(self__.arr, self__.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var self__ = this;
  var i__$1 = n + self__.i;
  if(i__$1 < self__.arr.length) {
    return self__.arr[i__$1]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var self__ = this;
  var i__$1 = n + self__.i;
  if(i__$1 < self__.arr.length) {
    return self__.arr[i__$1]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.List.EMPTY
};
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(i < prim.length) {
      return new cljs.core.IndexedSeq(prim, i)
    }else {
      return null
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  prim_seq.cljs$core$IFn$_invoke$arity$1 = prim_seq__1;
  prim_seq.cljs$core$IFn$_invoke$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  array_seq.cljs$core$IFn$_invoke$arity$1 = array_seq__1;
  array_seq.cljs$core$IFn$_invoke$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
goog.provide("cljs.core.RSeq");
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850574
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorStr = "cljs.core/RSeq";
cljs.core.RSeq.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._nth.call(null, self__.ci, self__.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.i > 0) {
    return new cljs.core.RSeq(self__.ci, self__.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var self__ = this;
  return new cljs.core.RSeq(self__.ci, self__.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.RSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn = cljs.core.next.call(null, s);
    if(!(sn == null)) {
      var G__4022 = sn;
      s = G__4022;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    if(!(coll == null)) {
      return cljs.core._conj.call(null, coll, x)
    }else {
      return cljs.core.list.call(null, x)
    }
  };
  var conj__3 = function() {
    var G__4023__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__4024 = conj.call(null, coll, x);
          var G__4025 = cljs.core.first.call(null, xs);
          var G__4026 = cljs.core.next.call(null, xs);
          coll = G__4024;
          x = G__4025;
          xs = G__4026;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__4023 = function(coll, x, var_args) {
      var xs = null;
      if(arguments.length > 2) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4023__delegate.call(this, coll, x, xs)
    };
    G__4023.cljs$lang$maxFixedArity = 2;
    G__4023.cljs$lang$applyTo = function(arglist__4027) {
      var coll = cljs.core.first(arglist__4027);
      arglist__4027 = cljs.core.next(arglist__4027);
      var x = cljs.core.first(arglist__4027);
      var xs = cljs.core.rest(arglist__4027);
      return G__4023__delegate(coll, x, xs)
    };
    G__4023.cljs$core$IFn$_invoke$arity$variadic = G__4023__delegate;
    return G__4023
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$core$IFn$_invoke$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$core$IFn$_invoke$arity$2 = conj__2;
  conj.cljs$core$IFn$_invoke$arity$variadic = conj__3.cljs$core$IFn$_invoke$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s = cljs.core.seq.call(null, coll);
  var acc = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s)) {
      return acc + cljs.core._count.call(null, s)
    }else {
      var G__4028 = cljs.core.next.call(null, s);
      var G__4029 = acc + 1;
      s = G__4028;
      acc = G__4029;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    while(true) {
      if(coll == null) {
        throw new Error("Index out of bounds");
      }else {
        if(n === 0) {
          if(cljs.core.seq.call(null, coll)) {
            return cljs.core.first.call(null, coll)
          }else {
            throw new Error("Index out of bounds");
          }
        }else {
          if(cljs.core.indexed_QMARK_.call(null, coll)) {
            return cljs.core._nth.call(null, coll, n)
          }else {
            if(cljs.core.seq.call(null, coll)) {
              var G__4030 = cljs.core.next.call(null, coll);
              var G__4031 = n - 1;
              coll = G__4030;
              n = G__4031;
              continue
            }else {
              if("\ufdd0:else") {
                throw new Error("Index out of bounds");
              }else {
                return null
              }
            }
          }
        }
      }
      break
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    while(true) {
      if(coll == null) {
        return not_found
      }else {
        if(n === 0) {
          if(cljs.core.seq.call(null, coll)) {
            return cljs.core.first.call(null, coll)
          }else {
            return not_found
          }
        }else {
          if(cljs.core.indexed_QMARK_.call(null, coll)) {
            return cljs.core._nth.call(null, coll, n, not_found)
          }else {
            if(cljs.core.seq.call(null, coll)) {
              var G__4032 = cljs.core.next.call(null, coll);
              var G__4033 = n - 1;
              var G__4034 = not_found;
              coll = G__4032;
              n = G__4033;
              not_found = G__4034;
              continue
            }else {
              if("\ufdd0:else") {
                return not_found
              }else {
                return null
              }
            }
          }
        }
      }
      break
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  linear_traversal_nth.cljs$core$IFn$_invoke$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$core$IFn$_invoke$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__4037 = coll;
        if(G__4037) {
          if(function() {
            var or__3943__auto__ = G__4037.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3943__auto__) {
              return or__3943__auto__
            }else {
              return G__4037.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            return false
          }
        }else {
          return false
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        if(coll instanceof Array) {
          if(n < coll.length) {
            return coll[n]
          }else {
            return null
          }
        }else {
          if(cljs.core.string_QMARK_.call(null, coll)) {
            if(n < coll.length) {
              return coll[n]
            }else {
              return null
            }
          }else {
            if("\ufdd0:else") {
              return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__4038 = coll;
        if(G__4038) {
          if(function() {
            var or__3943__auto__ = G__4038.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3943__auto__) {
              return or__3943__auto__
            }else {
              return G__4038.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            return false
          }
        }else {
          return false
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        if(coll instanceof Array) {
          if(n < coll.length) {
            return coll[n]
          }else {
            return not_found
          }
        }else {
          if(cljs.core.string_QMARK_.call(null, coll)) {
            if(n < coll.length) {
              return coll[n]
            }else {
              return not_found
            }
          }else {
            if("\ufdd0:else") {
              return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
            }else {
              return null
            }
          }
        }
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  nth.cljs$core$IFn$_invoke$arity$2 = nth__2;
  nth.cljs$core$IFn$_invoke$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    if(o == null) {
      return null
    }else {
      if(function() {
        var G__4041 = o;
        if(G__4041) {
          if(function() {
            var or__3943__auto__ = G__4041.cljs$lang$protocol_mask$partition0$ & 256;
            if(or__3943__auto__) {
              return or__3943__auto__
            }else {
              return G__4041.cljs$core$ILookup$
            }
          }()) {
            return true
          }else {
            return false
          }
        }else {
          return false
        }
      }()) {
        return cljs.core._lookup.call(null, o, k)
      }else {
        if(o instanceof Array) {
          if(k < o.length) {
            return o[k]
          }else {
            return null
          }
        }else {
          if(cljs.core.string_QMARK_.call(null, o)) {
            if(k < o.length) {
              return o[k]
            }else {
              return null
            }
          }else {
            if(cljs.core.type_satisfies_.call(null, cljs.core.ILookup, o)) {
              return cljs.core._lookup.call(null, o, k)
            }else {
              if("\ufdd0:else") {
                return null
              }else {
                return null
              }
            }
          }
        }
      }
    }
  };
  var get__3 = function(o, k, not_found) {
    if(!(o == null)) {
      if(function() {
        var G__4042 = o;
        if(G__4042) {
          if(function() {
            var or__3943__auto__ = G__4042.cljs$lang$protocol_mask$partition0$ & 256;
            if(or__3943__auto__) {
              return or__3943__auto__
            }else {
              return G__4042.cljs$core$ILookup$
            }
          }()) {
            return true
          }else {
            return false
          }
        }else {
          return false
        }
      }()) {
        return cljs.core._lookup.call(null, o, k, not_found)
      }else {
        if(o instanceof Array) {
          if(k < o.length) {
            return o[k]
          }else {
            return not_found
          }
        }else {
          if(cljs.core.string_QMARK_.call(null, o)) {
            if(k < o.length) {
              return o[k]
            }else {
              return not_found
            }
          }else {
            if(cljs.core.type_satisfies_.call(null, cljs.core.ILookup, o)) {
              return cljs.core._lookup.call(null, o, k, not_found)
            }else {
              if("\ufdd0:else") {
                return not_found
              }else {
                return null
              }
            }
          }
        }
      }
    }else {
      return not_found
    }
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  get.cljs$core$IFn$_invoke$arity$2 = get__2;
  get.cljs$core$IFn$_invoke$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    if(!(coll == null)) {
      return cljs.core._assoc.call(null, coll, k, v)
    }else {
      return cljs.core.hash_map.call(null, k, v)
    }
  };
  var assoc__4 = function() {
    var G__4043__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__4044 = ret;
          var G__4045 = cljs.core.first.call(null, kvs);
          var G__4046 = cljs.core.second.call(null, kvs);
          var G__4047 = cljs.core.nnext.call(null, kvs);
          coll = G__4044;
          k = G__4045;
          v = G__4046;
          kvs = G__4047;
          continue
        }else {
          return ret
        }
        break
      }
    };
    var G__4043 = function(coll, k, v, var_args) {
      var kvs = null;
      if(arguments.length > 3) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4043__delegate.call(this, coll, k, v, kvs)
    };
    G__4043.cljs$lang$maxFixedArity = 3;
    G__4043.cljs$lang$applyTo = function(arglist__4048) {
      var coll = cljs.core.first(arglist__4048);
      arglist__4048 = cljs.core.next(arglist__4048);
      var k = cljs.core.first(arglist__4048);
      arglist__4048 = cljs.core.next(arglist__4048);
      var v = cljs.core.first(arglist__4048);
      var kvs = cljs.core.rest(arglist__4048);
      return G__4043__delegate(coll, k, v, kvs)
    };
    G__4043.cljs$core$IFn$_invoke$arity$variadic = G__4043__delegate;
    return G__4043
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$core$IFn$_invoke$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$core$IFn$_invoke$arity$3 = assoc__3;
  assoc.cljs$core$IFn$_invoke$arity$variadic = assoc__4.cljs$core$IFn$_invoke$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__4049__delegate = function(coll, k, ks) {
      while(true) {
        var ret = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__4050 = ret;
          var G__4051 = cljs.core.first.call(null, ks);
          var G__4052 = cljs.core.next.call(null, ks);
          coll = G__4050;
          k = G__4051;
          ks = G__4052;
          continue
        }else {
          return ret
        }
        break
      }
    };
    var G__4049 = function(coll, k, var_args) {
      var ks = null;
      if(arguments.length > 2) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4049__delegate.call(this, coll, k, ks)
    };
    G__4049.cljs$lang$maxFixedArity = 2;
    G__4049.cljs$lang$applyTo = function(arglist__4053) {
      var coll = cljs.core.first(arglist__4053);
      arglist__4053 = cljs.core.next(arglist__4053);
      var k = cljs.core.first(arglist__4053);
      var ks = cljs.core.rest(arglist__4053);
      return G__4049__delegate(coll, k, ks)
    };
    G__4049.cljs$core$IFn$_invoke$arity$variadic = G__4049__delegate;
    return G__4049
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$core$IFn$_invoke$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$core$IFn$_invoke$arity$1 = dissoc__1;
  dissoc.cljs$core$IFn$_invoke$arity$2 = dissoc__2;
  dissoc.cljs$core$IFn$_invoke$arity$variadic = dissoc__3.cljs$core$IFn$_invoke$arity$variadic;
  return dissoc
}();
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  var or__3943__auto__ = goog.isFunction(f);
  if(or__3943__auto__) {
    return or__3943__auto__
  }else {
    var G__4055 = f;
    if(G__4055) {
      if(cljs.core.truth_(function() {
        var or__3943__auto____$1 = null;
        if(cljs.core.truth_(or__3943__auto____$1)) {
          return or__3943__auto____$1
        }else {
          return G__4055.cljs$core$Fn$
        }
      }())) {
        return true
      }else {
        if(!G__4055.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.Fn, G__4055)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.Fn, G__4055)
    }
  }
};
cljs.core.with_meta = function with_meta(o, meta) {
  if(function() {
    var and__3941__auto__ = cljs.core.fn_QMARK_.call(null, o);
    if(and__3941__auto__) {
      return!function() {
        var G__4061 = o;
        if(G__4061) {
          if(function() {
            var or__3943__auto__ = G__4061.cljs$lang$protocol_mask$partition0$ & 262144;
            if(or__3943__auto__) {
              return or__3943__auto__
            }else {
              return G__4061.cljs$core$IWithMeta$
            }
          }()) {
            return true
          }else {
            if(!G__4061.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IWithMeta, G__4061)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IWithMeta, G__4061)
        }
      }()
    }else {
      return and__3941__auto__
    }
  }()) {
    return with_meta.call(null, function() {
      if(void 0 === cljs.core.t4062) {
        goog.provide("cljs.core.t4062");
        cljs.core.t4062 = function(meta, o, with_meta, meta4063) {
          this.meta = meta;
          this.o = o;
          this.with_meta = with_meta;
          this.meta4063 = meta4063;
          this.cljs$lang$protocol_mask$partition1$ = 0;
          this.cljs$lang$protocol_mask$partition0$ = 393217
        };
        cljs.core.t4062.cljs$lang$type = true;
        cljs.core.t4062.cljs$lang$ctorStr = "cljs.core/t4062";
        cljs.core.t4062.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
          return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/t4062")
        };
        cljs.core.t4062.prototype.call = function() {
          var G__4066__delegate = function(self__, args) {
            var self____$1 = this;
            var _ = self____$1;
            return cljs.core.apply.call(null, self__.o, args)
          };
          var G__4066 = function(self__, var_args) {
            var self__ = this;
            var args = null;
            if(arguments.length > 1) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
            }
            return G__4066__delegate.call(this, self__, args)
          };
          G__4066.cljs$lang$maxFixedArity = 1;
          G__4066.cljs$lang$applyTo = function(arglist__4067) {
            var self__ = cljs.core.first(arglist__4067);
            var args = cljs.core.rest(arglist__4067);
            return G__4066__delegate(self__, args)
          };
          G__4066.cljs$core$IFn$_invoke$arity$variadic = G__4066__delegate;
          return G__4066
        }();
        cljs.core.t4062.prototype.apply = function(self__, args4065) {
          var self__ = this;
          return self__.call.apply(self__, [self__].concat(args4065.slice()))
        };
        cljs.core.t4062.prototype.cljs$core$Fn$ = true;
        cljs.core.t4062.prototype.cljs$core$IMeta$_meta$arity$1 = function(_4064) {
          var self__ = this;
          return self__.meta4063
        };
        cljs.core.t4062.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(_4064, meta4063__$1) {
          var self__ = this;
          return new cljs.core.t4062(self__.meta, self__.o, self__.with_meta, meta4063__$1)
        }
      }else {
      }
      return new cljs.core.t4062(meta, o, with_meta, null)
    }(), meta)
  }else {
    return cljs.core._with_meta.call(null, o, meta)
  }
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__4069 = o;
    if(G__4069) {
      if(function() {
        var or__3943__auto__ = G__4069.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__4069.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__4069.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__4069)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__4069)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__4070__delegate = function(coll, k, ks) {
      while(true) {
        var ret = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__4071 = ret;
          var G__4072 = cljs.core.first.call(null, ks);
          var G__4073 = cljs.core.next.call(null, ks);
          coll = G__4071;
          k = G__4072;
          ks = G__4073;
          continue
        }else {
          return ret
        }
        break
      }
    };
    var G__4070 = function(coll, k, var_args) {
      var ks = null;
      if(arguments.length > 2) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4070__delegate.call(this, coll, k, ks)
    };
    G__4070.cljs$lang$maxFixedArity = 2;
    G__4070.cljs$lang$applyTo = function(arglist__4074) {
      var coll = cljs.core.first(arglist__4074);
      arglist__4074 = cljs.core.next(arglist__4074);
      var k = cljs.core.first(arglist__4074);
      var ks = cljs.core.rest(arglist__4074);
      return G__4070__delegate(coll, k, ks)
    };
    G__4070.cljs$core$IFn$_invoke$arity$variadic = G__4070__delegate;
    return G__4070
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$core$IFn$_invoke$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$core$IFn$_invoke$arity$1 = disj__1;
  disj.cljs$core$IFn$_invoke$arity$2 = disj__2;
  disj.cljs$core$IFn$_invoke$arity$variadic = disj__3.cljs$core$IFn$_invoke$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h = cljs.core.string_hash_cache[k];
  if(typeof h === "number") {
    return h
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.call(null, o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3941__auto__ = goog.isString(o);
      if(and__3941__auto__) {
        return check_cache
      }else {
        return and__3941__auto__
      }
    }()) {
      return cljs.core.check_string_hash_cache.call(null, o)
    }else {
      return cljs.core._hash.call(null, o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  hash.cljs$core$IFn$_invoke$arity$1 = hash__1;
  hash.cljs$core$IFn$_invoke$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  var or__3943__auto__ = coll == null;
  if(or__3943__auto__) {
    return or__3943__auto__
  }else {
    return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
  }
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__4076 = x;
    if(G__4076) {
      if(function() {
        var or__3943__auto__ = G__4076.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__4076.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__4076.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__4076)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__4076)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__4078 = x;
    if(G__4078) {
      if(function() {
        var or__3943__auto__ = G__4078.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__4078.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__4078.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__4078)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__4078)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__4080 = x;
  if(G__4080) {
    if(function() {
      var or__3943__auto__ = G__4080.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__4080.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__4080.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__4080)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__4080)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__4082 = x;
  if(G__4082) {
    if(function() {
      var or__3943__auto__ = G__4082.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__4082.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__4082.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__4082)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__4082)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__4084 = x;
  if(G__4084) {
    if(function() {
      var or__3943__auto__ = G__4084.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__4084.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__4084.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4084)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4084)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__4086 = x;
    if(G__4086) {
      if(function() {
        var or__3943__auto__ = G__4086.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__4086.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__4086.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__4086)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__4086)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__4088 = x;
  if(G__4088) {
    if(function() {
      var or__3943__auto__ = G__4088.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__4088.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__4088.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__4088)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__4088)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var or__3943__auto__ = x instanceof cljs.core.ChunkedCons;
  if(or__3943__auto__) {
    return or__3943__auto__
  }else {
    return x instanceof cljs.core.ChunkedSeq
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__4089__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__4089 = function(var_args) {
      var keyvals = null;
      if(arguments.length > 0) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__4089__delegate.call(this, keyvals)
    };
    G__4089.cljs$lang$maxFixedArity = 0;
    G__4089.cljs$lang$applyTo = function(arglist__4090) {
      var keyvals = cljs.core.seq(arglist__4090);
      return G__4089__delegate(keyvals)
    };
    G__4089.cljs$core$IFn$_invoke$arity$variadic = G__4089__delegate;
    return G__4089
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$core$IFn$_invoke$arity$0 = js_obj__0;
  js_obj.cljs$core$IFn$_invoke$arity$variadic = js_obj__1.cljs$core$IFn$_invoke$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys = [];
  goog.object.forEach(obj, function(val, key, obj__$1) {
    return keys.push(key)
  });
  return keys
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__$1 = i;
  var j__$1 = j;
  var len__$1 = len;
  while(true) {
    if(len__$1 === 0) {
      return to
    }else {
      to[j__$1] = from[i__$1];
      var G__4091 = i__$1 + 1;
      var G__4092 = j__$1 + 1;
      var G__4093 = len__$1 - 1;
      i__$1 = G__4091;
      j__$1 = G__4092;
      len__$1 = G__4093;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__$1 = i + (len - 1);
  var j__$1 = j + (len - 1);
  var len__$1 = len;
  while(true) {
    if(len__$1 === 0) {
      return to
    }else {
      to[j__$1] = from[i__$1];
      var G__4094 = i__$1 - 1;
      var G__4095 = j__$1 - 1;
      var G__4096 = len__$1 - 1;
      i__$1 = G__4094;
      j__$1 = G__4095;
      len__$1 = G__4096;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__4098 = s;
    if(G__4098) {
      if(function() {
        var or__3943__auto__ = G__4098.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__4098.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__4098.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4098)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4098)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__4100 = s;
  if(G__4100) {
    if(function() {
      var or__3943__auto__ = G__4100.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__4100.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__4100.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__4100)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__4100)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3941__auto__ = goog.isString(x);
  if(and__3941__auto__) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3941__auto__
  }
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3943__auto__ = cljs.core.fn_QMARK_.call(null, f);
  if(or__3943__auto__) {
    return or__3943__auto__
  }else {
    var G__4102 = f;
    if(G__4102) {
      if(function() {
        var or__3943__auto____$1 = G__4102.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          return G__4102.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__4102.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__4102)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__4102)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3941__auto__ = typeof n === "number";
  if(and__3941__auto__) {
    var and__3941__auto____$1 = !isNaN(n);
    if(and__3941__auto____$1) {
      var and__3941__auto____$2 = !(n === Infinity);
      if(and__3941__auto____$2) {
        return parseFloat(n) === parseInt(n, 10)
      }else {
        return and__3941__auto____$2
      }
    }else {
      return and__3941__auto____$1
    }
  }else {
    return and__3941__auto__
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core.get.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(function() {
    var and__3941__auto__ = !(coll == null);
    if(and__3941__auto__) {
      var and__3941__auto____$1 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3941__auto____$1) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3941__auto____$1
      }
    }else {
      return and__3941__auto__
    }
  }()) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core.get.call(null, coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__4103__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s = cljs.core.PersistentHashSet.fromArray([y, null, x, null], true);
        var xs = more;
        while(true) {
          var x__$1 = cljs.core.first.call(null, xs);
          var etc = cljs.core.next.call(null, xs);
          if(cljs.core.truth_(xs)) {
            if(cljs.core.contains_QMARK_.call(null, s, x__$1)) {
              return false
            }else {
              var G__4104 = cljs.core.conj.call(null, s, x__$1);
              var G__4105 = etc;
              s = G__4104;
              xs = G__4105;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__4103 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4103__delegate.call(this, x, y, more)
    };
    G__4103.cljs$lang$maxFixedArity = 2;
    G__4103.cljs$lang$applyTo = function(arglist__4106) {
      var x = cljs.core.first(arglist__4106);
      arglist__4106 = cljs.core.next(arglist__4106);
      var y = cljs.core.first(arglist__4106);
      var more = cljs.core.rest(arglist__4106);
      return G__4103__delegate(x, y, more)
    };
    G__4103.cljs$core$IFn$_invoke$arity$variadic = G__4103__delegate;
    return G__4103
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$core$IFn$_invoke$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$core$IFn$_invoke$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$core$IFn$_invoke$arity$variadic = distinct_QMARK___3.cljs$core$IFn$_invoke$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
          if(function() {
            var G__4108 = x;
            if(G__4108) {
              if(function() {
                var or__3943__auto__ = G__4108.cljs$lang$protocol_mask$partition1$ & 2048;
                if(or__3943__auto__) {
                  return or__3943__auto__
                }else {
                  return G__4108.cljs$core$IComparable$
                }
              }()) {
                return true
              }else {
                return false
              }
            }else {
              return false
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0:else") {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl = cljs.core.count.call(null, xs);
    var yl = cljs.core.count.call(null, ys);
    if(xl < yl) {
      return-1
    }else {
      if(xl > yl) {
        return 1
      }else {
        if("\ufdd0:else") {
          return compare_indexed.call(null, xs, ys, xl, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3941__auto__ = d === 0;
        if(and__3941__auto__) {
          return n + 1 < len
        }else {
          return and__3941__auto__
        }
      }()) {
        var G__4109 = xs;
        var G__4110 = ys;
        var G__4111 = len;
        var G__4112 = n + 1;
        xs = G__4109;
        ys = G__4110;
        len = G__4111;
        n = G__4112;
        continue
      }else {
        return d
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  compare_indexed.cljs$core$IFn$_invoke$arity$2 = compare_indexed__2;
  compare_indexed.cljs$core$IFn$_invoke$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r = f.call(null, x, y);
      if(typeof r === "number") {
        return r
      }else {
        if(cljs.core.truth_(r)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq.call(null, coll)) {
      var a = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  sort.cljs$core$IFn$_invoke$arity$1 = sort__1;
  sort.cljs$core$IFn$_invoke$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  sort_by.cljs$core$IFn$_invoke$arity$2 = sort_by__2;
  sort_by.cljs$core$IFn$_invoke$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__4090__auto__ = cljs.core.seq.call(null, coll);
    if(temp__4090__auto__) {
      var s = temp__4090__auto__;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s), cljs.core.next.call(null, s))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__$1 = val;
    var coll__$1 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__$1) {
        var nval = f.call(null, val__$1, cljs.core.first.call(null, coll__$1));
        if(cljs.core.reduced_QMARK_.call(null, nval)) {
          return cljs.core.deref.call(null, nval)
        }else {
          var G__4113 = nval;
          var G__4114 = cljs.core.next.call(null, coll__$1);
          val__$1 = G__4113;
          coll__$1 = G__4114;
          continue
        }
      }else {
        return val__$1
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  seq_reduce.cljs$core$IFn$_invoke$arity$2 = seq_reduce__2;
  seq_reduce.cljs$core$IFn$_invoke$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.shuffle = function shuffle(coll) {
  var a = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a);
  return cljs.core.vec.call(null, a)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__4117 = coll;
      if(G__4117) {
        if(function() {
          var or__3943__auto__ = G__4117.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__4117.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      if(coll instanceof Array) {
        return cljs.core.array_reduce.call(null, coll, f)
      }else {
        if(cljs.core.string_QMARK_.call(null, coll)) {
          return cljs.core.array_reduce.call(null, coll, f)
        }else {
          if(cljs.core.type_satisfies_.call(null, cljs.core.IReduce, coll)) {
            return cljs.core._reduce.call(null, coll, f)
          }else {
            if("\ufdd0:else") {
              return cljs.core.seq_reduce.call(null, f, coll)
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__4118 = coll;
      if(G__4118) {
        if(function() {
          var or__3943__auto__ = G__4118.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__4118.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      if(coll instanceof Array) {
        return cljs.core.array_reduce.call(null, coll, f, val)
      }else {
        if(cljs.core.string_QMARK_.call(null, coll)) {
          return cljs.core.array_reduce.call(null, coll, f, val)
        }else {
          if(cljs.core.type_satisfies_.call(null, cljs.core.IReduce, coll)) {
            return cljs.core._reduce.call(null, coll, f, val)
          }else {
            if("\ufdd0:else") {
              return cljs.core.seq_reduce.call(null, f, val, coll)
            }else {
              return null
            }
          }
        }
      }
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  reduce.cljs$core$IFn$_invoke$arity$2 = reduce__2;
  reduce.cljs$core$IFn$_invoke$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__4119__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__4119 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4119__delegate.call(this, x, y, more)
    };
    G__4119.cljs$lang$maxFixedArity = 2;
    G__4119.cljs$lang$applyTo = function(arglist__4120) {
      var x = cljs.core.first(arglist__4120);
      arglist__4120 = cljs.core.next(arglist__4120);
      var y = cljs.core.first(arglist__4120);
      var more = cljs.core.rest(arglist__4120);
      return G__4119__delegate(x, y, more)
    };
    G__4119.cljs$core$IFn$_invoke$arity$variadic = G__4119__delegate;
    return G__4119
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$core$IFn$_invoke$arity$0 = _PLUS___0;
  _PLUS_.cljs$core$IFn$_invoke$arity$1 = _PLUS___1;
  _PLUS_.cljs$core$IFn$_invoke$arity$2 = _PLUS___2;
  _PLUS_.cljs$core$IFn$_invoke$arity$variadic = _PLUS___3.cljs$core$IFn$_invoke$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__4121__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__4121 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4121__delegate.call(this, x, y, more)
    };
    G__4121.cljs$lang$maxFixedArity = 2;
    G__4121.cljs$lang$applyTo = function(arglist__4122) {
      var x = cljs.core.first(arglist__4122);
      arglist__4122 = cljs.core.next(arglist__4122);
      var y = cljs.core.first(arglist__4122);
      var more = cljs.core.rest(arglist__4122);
      return G__4121__delegate(x, y, more)
    };
    G__4121.cljs$core$IFn$_invoke$arity$variadic = G__4121__delegate;
    return G__4121
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$core$IFn$_invoke$arity$1 = ___1;
  _.cljs$core$IFn$_invoke$arity$2 = ___2;
  _.cljs$core$IFn$_invoke$arity$variadic = ___3.cljs$core$IFn$_invoke$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__4123__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__4123 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4123__delegate.call(this, x, y, more)
    };
    G__4123.cljs$lang$maxFixedArity = 2;
    G__4123.cljs$lang$applyTo = function(arglist__4124) {
      var x = cljs.core.first(arglist__4124);
      arglist__4124 = cljs.core.next(arglist__4124);
      var y = cljs.core.first(arglist__4124);
      var more = cljs.core.rest(arglist__4124);
      return G__4123__delegate(x, y, more)
    };
    G__4123.cljs$core$IFn$_invoke$arity$variadic = G__4123__delegate;
    return G__4123
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$core$IFn$_invoke$arity$0 = _STAR___0;
  _STAR_.cljs$core$IFn$_invoke$arity$1 = _STAR___1;
  _STAR_.cljs$core$IFn$_invoke$arity$2 = _STAR___2;
  _STAR_.cljs$core$IFn$_invoke$arity$variadic = _STAR___3.cljs$core$IFn$_invoke$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__4125__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__4125 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4125__delegate.call(this, x, y, more)
    };
    G__4125.cljs$lang$maxFixedArity = 2;
    G__4125.cljs$lang$applyTo = function(arglist__4126) {
      var x = cljs.core.first(arglist__4126);
      arglist__4126 = cljs.core.next(arglist__4126);
      var y = cljs.core.first(arglist__4126);
      var more = cljs.core.rest(arglist__4126);
      return G__4125__delegate(x, y, more)
    };
    G__4125.cljs$core$IFn$_invoke$arity$variadic = G__4125__delegate;
    return G__4125
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$core$IFn$_invoke$arity$1 = _SLASH___1;
  _SLASH_.cljs$core$IFn$_invoke$arity$2 = _SLASH___2;
  _SLASH_.cljs$core$IFn$_invoke$arity$variadic = _SLASH___3.cljs$core$IFn$_invoke$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__4127__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__4128 = y;
            var G__4129 = cljs.core.first.call(null, more);
            var G__4130 = cljs.core.next.call(null, more);
            x = G__4128;
            y = G__4129;
            more = G__4130;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4127 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4127__delegate.call(this, x, y, more)
    };
    G__4127.cljs$lang$maxFixedArity = 2;
    G__4127.cljs$lang$applyTo = function(arglist__4131) {
      var x = cljs.core.first(arglist__4131);
      arglist__4131 = cljs.core.next(arglist__4131);
      var y = cljs.core.first(arglist__4131);
      var more = cljs.core.rest(arglist__4131);
      return G__4127__delegate(x, y, more)
    };
    G__4127.cljs$core$IFn$_invoke$arity$variadic = G__4127__delegate;
    return G__4127
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$core$IFn$_invoke$arity$1 = _LT___1;
  _LT_.cljs$core$IFn$_invoke$arity$2 = _LT___2;
  _LT_.cljs$core$IFn$_invoke$arity$variadic = _LT___3.cljs$core$IFn$_invoke$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__4132__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__4133 = y;
            var G__4134 = cljs.core.first.call(null, more);
            var G__4135 = cljs.core.next.call(null, more);
            x = G__4133;
            y = G__4134;
            more = G__4135;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4132 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4132__delegate.call(this, x, y, more)
    };
    G__4132.cljs$lang$maxFixedArity = 2;
    G__4132.cljs$lang$applyTo = function(arglist__4136) {
      var x = cljs.core.first(arglist__4136);
      arglist__4136 = cljs.core.next(arglist__4136);
      var y = cljs.core.first(arglist__4136);
      var more = cljs.core.rest(arglist__4136);
      return G__4132__delegate(x, y, more)
    };
    G__4132.cljs$core$IFn$_invoke$arity$variadic = G__4132__delegate;
    return G__4132
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$core$IFn$_invoke$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$core$IFn$_invoke$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$core$IFn$_invoke$arity$variadic = _LT__EQ___3.cljs$core$IFn$_invoke$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__4137__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__4138 = y;
            var G__4139 = cljs.core.first.call(null, more);
            var G__4140 = cljs.core.next.call(null, more);
            x = G__4138;
            y = G__4139;
            more = G__4140;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4137 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4137__delegate.call(this, x, y, more)
    };
    G__4137.cljs$lang$maxFixedArity = 2;
    G__4137.cljs$lang$applyTo = function(arglist__4141) {
      var x = cljs.core.first(arglist__4141);
      arglist__4141 = cljs.core.next(arglist__4141);
      var y = cljs.core.first(arglist__4141);
      var more = cljs.core.rest(arglist__4141);
      return G__4137__delegate(x, y, more)
    };
    G__4137.cljs$core$IFn$_invoke$arity$variadic = G__4137__delegate;
    return G__4137
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$core$IFn$_invoke$arity$1 = _GT___1;
  _GT_.cljs$core$IFn$_invoke$arity$2 = _GT___2;
  _GT_.cljs$core$IFn$_invoke$arity$variadic = _GT___3.cljs$core$IFn$_invoke$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__4142__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__4143 = y;
            var G__4144 = cljs.core.first.call(null, more);
            var G__4145 = cljs.core.next.call(null, more);
            x = G__4143;
            y = G__4144;
            more = G__4145;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4142 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4142__delegate.call(this, x, y, more)
    };
    G__4142.cljs$lang$maxFixedArity = 2;
    G__4142.cljs$lang$applyTo = function(arglist__4146) {
      var x = cljs.core.first(arglist__4146);
      arglist__4146 = cljs.core.next(arglist__4146);
      var y = cljs.core.first(arglist__4146);
      var more = cljs.core.rest(arglist__4146);
      return G__4142__delegate(x, y, more)
    };
    G__4142.cljs$core$IFn$_invoke$arity$variadic = G__4142__delegate;
    return G__4142
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$core$IFn$_invoke$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$core$IFn$_invoke$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$core$IFn$_invoke$arity$variadic = _GT__EQ___3.cljs$core$IFn$_invoke$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__4147__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__4147 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4147__delegate.call(this, x, y, more)
    };
    G__4147.cljs$lang$maxFixedArity = 2;
    G__4147.cljs$lang$applyTo = function(arglist__4148) {
      var x = cljs.core.first(arglist__4148);
      arglist__4148 = cljs.core.next(arglist__4148);
      var y = cljs.core.first(arglist__4148);
      var more = cljs.core.rest(arglist__4148);
      return G__4147__delegate(x, y, more)
    };
    G__4147.cljs$core$IFn$_invoke$arity$variadic = G__4147__delegate;
    return G__4147
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$core$IFn$_invoke$arity$1 = max__1;
  max.cljs$core$IFn$_invoke$arity$2 = max__2;
  max.cljs$core$IFn$_invoke$arity$variadic = max__3.cljs$core$IFn$_invoke$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__4149__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__4149 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4149__delegate.call(this, x, y, more)
    };
    G__4149.cljs$lang$maxFixedArity = 2;
    G__4149.cljs$lang$applyTo = function(arglist__4150) {
      var x = cljs.core.first(arglist__4150);
      arglist__4150 = cljs.core.next(arglist__4150);
      var y = cljs.core.first(arglist__4150);
      var more = cljs.core.rest(arglist__4150);
      return G__4149__delegate(x, y, more)
    };
    G__4149.cljs$core$IFn$_invoke$arity$variadic = G__4149__delegate;
    return G__4149
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$core$IFn$_invoke$arity$1 = min__1;
  min.cljs$core$IFn$_invoke$arity$2 = min__2;
  min.cljs$core$IFn$_invoke$arity$variadic = min__3.cljs$core$IFn$_invoke$arity$variadic;
  return min
}();
cljs.core.byte$ = function byte$(x) {
  return x
};
cljs.core.char$ = function char$(x) {
  if(typeof x === "number") {
    return String.fromCharCode(x)
  }else {
    if(function() {
      var and__3941__auto__ = cljs.core.string_QMARK_.call(null, x);
      if(and__3941__auto__) {
        return x.length === 1
      }else {
        return and__3941__auto__
      }
    }()) {
      return x
    }else {
      if("\ufdd0:else") {
        throw new Error("Argument to char must be a character or number");
      }else {
        return null
      }
    }
  }
};
cljs.core.short$ = function short$(x) {
  return x
};
cljs.core.float$ = function float$(x) {
  return x
};
cljs.core.double$ = function double$(x) {
  return x
};
cljs.core.unchecked_byte = function unchecked_byte(x) {
  return x
};
cljs.core.unchecked_char = function unchecked_char(x) {
  return x
};
cljs.core.unchecked_short = function unchecked_short(x) {
  return x
};
cljs.core.unchecked_float = function unchecked_float(x) {
  return x
};
cljs.core.unchecked_double = function unchecked_double(x) {
  return x
};
cljs.core.unchecked_add = function() {
  var unchecked_add = null;
  var unchecked_add__0 = function() {
    return 0
  };
  var unchecked_add__1 = function(x) {
    return x
  };
  var unchecked_add__2 = function(x, y) {
    return x + y
  };
  var unchecked_add__3 = function() {
    var G__4151__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, unchecked_add, x + y, more)
    };
    var G__4151 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4151__delegate.call(this, x, y, more)
    };
    G__4151.cljs$lang$maxFixedArity = 2;
    G__4151.cljs$lang$applyTo = function(arglist__4152) {
      var x = cljs.core.first(arglist__4152);
      arglist__4152 = cljs.core.next(arglist__4152);
      var y = cljs.core.first(arglist__4152);
      var more = cljs.core.rest(arglist__4152);
      return G__4151__delegate(x, y, more)
    };
    G__4151.cljs$core$IFn$_invoke$arity$variadic = G__4151__delegate;
    return G__4151
  }();
  unchecked_add = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return unchecked_add__0.call(this);
      case 1:
        return unchecked_add__1.call(this, x);
      case 2:
        return unchecked_add__2.call(this, x, y);
      default:
        return unchecked_add__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  unchecked_add.cljs$lang$maxFixedArity = 2;
  unchecked_add.cljs$lang$applyTo = unchecked_add__3.cljs$lang$applyTo;
  unchecked_add.cljs$core$IFn$_invoke$arity$0 = unchecked_add__0;
  unchecked_add.cljs$core$IFn$_invoke$arity$1 = unchecked_add__1;
  unchecked_add.cljs$core$IFn$_invoke$arity$2 = unchecked_add__2;
  unchecked_add.cljs$core$IFn$_invoke$arity$variadic = unchecked_add__3.cljs$core$IFn$_invoke$arity$variadic;
  return unchecked_add
}();
cljs.core.unchecked_add_int = function() {
  var unchecked_add_int = null;
  var unchecked_add_int__0 = function() {
    return 0
  };
  var unchecked_add_int__1 = function(x) {
    return x
  };
  var unchecked_add_int__2 = function(x, y) {
    return x + y
  };
  var unchecked_add_int__3 = function() {
    var G__4153__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, unchecked_add_int, x + y, more)
    };
    var G__4153 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4153__delegate.call(this, x, y, more)
    };
    G__4153.cljs$lang$maxFixedArity = 2;
    G__4153.cljs$lang$applyTo = function(arglist__4154) {
      var x = cljs.core.first(arglist__4154);
      arglist__4154 = cljs.core.next(arglist__4154);
      var y = cljs.core.first(arglist__4154);
      var more = cljs.core.rest(arglist__4154);
      return G__4153__delegate(x, y, more)
    };
    G__4153.cljs$core$IFn$_invoke$arity$variadic = G__4153__delegate;
    return G__4153
  }();
  unchecked_add_int = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return unchecked_add_int__0.call(this);
      case 1:
        return unchecked_add_int__1.call(this, x);
      case 2:
        return unchecked_add_int__2.call(this, x, y);
      default:
        return unchecked_add_int__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  unchecked_add_int.cljs$lang$maxFixedArity = 2;
  unchecked_add_int.cljs$lang$applyTo = unchecked_add_int__3.cljs$lang$applyTo;
  unchecked_add_int.cljs$core$IFn$_invoke$arity$0 = unchecked_add_int__0;
  unchecked_add_int.cljs$core$IFn$_invoke$arity$1 = unchecked_add_int__1;
  unchecked_add_int.cljs$core$IFn$_invoke$arity$2 = unchecked_add_int__2;
  unchecked_add_int.cljs$core$IFn$_invoke$arity$variadic = unchecked_add_int__3.cljs$core$IFn$_invoke$arity$variadic;
  return unchecked_add_int
}();
cljs.core.unchecked_dec = function unchecked_dec(x) {
  return x - 1
};
cljs.core.unchecked_dec_int = function unchecked_dec_int(x) {
  return x - 1
};
cljs.core.unchecked_divide_int = function() {
  var unchecked_divide_int = null;
  var unchecked_divide_int__1 = function(x) {
    return unchecked_divide_int.call(null, 1, x)
  };
  var unchecked_divide_int__2 = function(x, y) {
    return x / y
  };
  var unchecked_divide_int__3 = function() {
    var G__4155__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, unchecked_divide_int, unchecked_divide_int.call(null, x, y), more)
    };
    var G__4155 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4155__delegate.call(this, x, y, more)
    };
    G__4155.cljs$lang$maxFixedArity = 2;
    G__4155.cljs$lang$applyTo = function(arglist__4156) {
      var x = cljs.core.first(arglist__4156);
      arglist__4156 = cljs.core.next(arglist__4156);
      var y = cljs.core.first(arglist__4156);
      var more = cljs.core.rest(arglist__4156);
      return G__4155__delegate(x, y, more)
    };
    G__4155.cljs$core$IFn$_invoke$arity$variadic = G__4155__delegate;
    return G__4155
  }();
  unchecked_divide_int = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return unchecked_divide_int__1.call(this, x);
      case 2:
        return unchecked_divide_int__2.call(this, x, y);
      default:
        return unchecked_divide_int__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  unchecked_divide_int.cljs$lang$maxFixedArity = 2;
  unchecked_divide_int.cljs$lang$applyTo = unchecked_divide_int__3.cljs$lang$applyTo;
  unchecked_divide_int.cljs$core$IFn$_invoke$arity$1 = unchecked_divide_int__1;
  unchecked_divide_int.cljs$core$IFn$_invoke$arity$2 = unchecked_divide_int__2;
  unchecked_divide_int.cljs$core$IFn$_invoke$arity$variadic = unchecked_divide_int__3.cljs$core$IFn$_invoke$arity$variadic;
  return unchecked_divide_int
}();
cljs.core.unchecked_inc = function unchecked_inc(x) {
  return x + 1
};
cljs.core.unchecked_inc_int = function unchecked_inc_int(x) {
  return x + 1
};
cljs.core.unchecked_multiply = function() {
  var unchecked_multiply = null;
  var unchecked_multiply__0 = function() {
    return 1
  };
  var unchecked_multiply__1 = function(x) {
    return x
  };
  var unchecked_multiply__2 = function(x, y) {
    return x * y
  };
  var unchecked_multiply__3 = function() {
    var G__4157__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, unchecked_multiply, x * y, more)
    };
    var G__4157 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4157__delegate.call(this, x, y, more)
    };
    G__4157.cljs$lang$maxFixedArity = 2;
    G__4157.cljs$lang$applyTo = function(arglist__4158) {
      var x = cljs.core.first(arglist__4158);
      arglist__4158 = cljs.core.next(arglist__4158);
      var y = cljs.core.first(arglist__4158);
      var more = cljs.core.rest(arglist__4158);
      return G__4157__delegate(x, y, more)
    };
    G__4157.cljs$core$IFn$_invoke$arity$variadic = G__4157__delegate;
    return G__4157
  }();
  unchecked_multiply = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return unchecked_multiply__0.call(this);
      case 1:
        return unchecked_multiply__1.call(this, x);
      case 2:
        return unchecked_multiply__2.call(this, x, y);
      default:
        return unchecked_multiply__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  unchecked_multiply.cljs$lang$maxFixedArity = 2;
  unchecked_multiply.cljs$lang$applyTo = unchecked_multiply__3.cljs$lang$applyTo;
  unchecked_multiply.cljs$core$IFn$_invoke$arity$0 = unchecked_multiply__0;
  unchecked_multiply.cljs$core$IFn$_invoke$arity$1 = unchecked_multiply__1;
  unchecked_multiply.cljs$core$IFn$_invoke$arity$2 = unchecked_multiply__2;
  unchecked_multiply.cljs$core$IFn$_invoke$arity$variadic = unchecked_multiply__3.cljs$core$IFn$_invoke$arity$variadic;
  return unchecked_multiply
}();
cljs.core.unchecked_multiply_int = function() {
  var unchecked_multiply_int = null;
  var unchecked_multiply_int__0 = function() {
    return 1
  };
  var unchecked_multiply_int__1 = function(x) {
    return x
  };
  var unchecked_multiply_int__2 = function(x, y) {
    return x * y
  };
  var unchecked_multiply_int__3 = function() {
    var G__4159__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, unchecked_multiply_int, x * y, more)
    };
    var G__4159 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4159__delegate.call(this, x, y, more)
    };
    G__4159.cljs$lang$maxFixedArity = 2;
    G__4159.cljs$lang$applyTo = function(arglist__4160) {
      var x = cljs.core.first(arglist__4160);
      arglist__4160 = cljs.core.next(arglist__4160);
      var y = cljs.core.first(arglist__4160);
      var more = cljs.core.rest(arglist__4160);
      return G__4159__delegate(x, y, more)
    };
    G__4159.cljs$core$IFn$_invoke$arity$variadic = G__4159__delegate;
    return G__4159
  }();
  unchecked_multiply_int = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return unchecked_multiply_int__0.call(this);
      case 1:
        return unchecked_multiply_int__1.call(this, x);
      case 2:
        return unchecked_multiply_int__2.call(this, x, y);
      default:
        return unchecked_multiply_int__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  unchecked_multiply_int.cljs$lang$maxFixedArity = 2;
  unchecked_multiply_int.cljs$lang$applyTo = unchecked_multiply_int__3.cljs$lang$applyTo;
  unchecked_multiply_int.cljs$core$IFn$_invoke$arity$0 = unchecked_multiply_int__0;
  unchecked_multiply_int.cljs$core$IFn$_invoke$arity$1 = unchecked_multiply_int__1;
  unchecked_multiply_int.cljs$core$IFn$_invoke$arity$2 = unchecked_multiply_int__2;
  unchecked_multiply_int.cljs$core$IFn$_invoke$arity$variadic = unchecked_multiply_int__3.cljs$core$IFn$_invoke$arity$variadic;
  return unchecked_multiply_int
}();
cljs.core.unchecked_negate = function unchecked_negate(x) {
  return-x
};
cljs.core.unchecked_negate_int = function unchecked_negate_int(x) {
  return-x
};
cljs.core.unchecked_remainder_int = function unchecked_remainder_int(x, n) {
  return cljs.core.mod.call(null, x, n)
};
cljs.core.unchecked_substract = function() {
  var unchecked_substract = null;
  var unchecked_substract__1 = function(x) {
    return-x
  };
  var unchecked_substract__2 = function(x, y) {
    return x - y
  };
  var unchecked_substract__3 = function() {
    var G__4161__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, unchecked_substract, x - y, more)
    };
    var G__4161 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4161__delegate.call(this, x, y, more)
    };
    G__4161.cljs$lang$maxFixedArity = 2;
    G__4161.cljs$lang$applyTo = function(arglist__4162) {
      var x = cljs.core.first(arglist__4162);
      arglist__4162 = cljs.core.next(arglist__4162);
      var y = cljs.core.first(arglist__4162);
      var more = cljs.core.rest(arglist__4162);
      return G__4161__delegate(x, y, more)
    };
    G__4161.cljs$core$IFn$_invoke$arity$variadic = G__4161__delegate;
    return G__4161
  }();
  unchecked_substract = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return unchecked_substract__1.call(this, x);
      case 2:
        return unchecked_substract__2.call(this, x, y);
      default:
        return unchecked_substract__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  unchecked_substract.cljs$lang$maxFixedArity = 2;
  unchecked_substract.cljs$lang$applyTo = unchecked_substract__3.cljs$lang$applyTo;
  unchecked_substract.cljs$core$IFn$_invoke$arity$1 = unchecked_substract__1;
  unchecked_substract.cljs$core$IFn$_invoke$arity$2 = unchecked_substract__2;
  unchecked_substract.cljs$core$IFn$_invoke$arity$variadic = unchecked_substract__3.cljs$core$IFn$_invoke$arity$variadic;
  return unchecked_substract
}();
cljs.core.unchecked_substract_int = function() {
  var unchecked_substract_int = null;
  var unchecked_substract_int__1 = function(x) {
    return-x
  };
  var unchecked_substract_int__2 = function(x, y) {
    return x - y
  };
  var unchecked_substract_int__3 = function() {
    var G__4163__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, unchecked_substract_int, x - y, more)
    };
    var G__4163 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4163__delegate.call(this, x, y, more)
    };
    G__4163.cljs$lang$maxFixedArity = 2;
    G__4163.cljs$lang$applyTo = function(arglist__4164) {
      var x = cljs.core.first(arglist__4164);
      arglist__4164 = cljs.core.next(arglist__4164);
      var y = cljs.core.first(arglist__4164);
      var more = cljs.core.rest(arglist__4164);
      return G__4163__delegate(x, y, more)
    };
    G__4163.cljs$core$IFn$_invoke$arity$variadic = G__4163__delegate;
    return G__4163
  }();
  unchecked_substract_int = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return unchecked_substract_int__1.call(this, x);
      case 2:
        return unchecked_substract_int__2.call(this, x, y);
      default:
        return unchecked_substract_int__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  unchecked_substract_int.cljs$lang$maxFixedArity = 2;
  unchecked_substract_int.cljs$lang$applyTo = unchecked_substract_int__3.cljs$lang$applyTo;
  unchecked_substract_int.cljs$core$IFn$_invoke$arity$1 = unchecked_substract_int__1;
  unchecked_substract_int.cljs$core$IFn$_invoke$arity$2 = unchecked_substract_int__2;
  unchecked_substract_int.cljs$core$IFn$_invoke$arity$variadic = unchecked_substract_int__3.cljs$core$IFn$_invoke$arity$variadic;
  return unchecked_substract_int
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return x | 0
};
cljs.core.unchecked_int = function unchecked_int(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.unchecked_long = function unchecked_long(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.booleans = function booleans(x) {
  return x
};
cljs.core.bytes = function bytes(x) {
  return x
};
cljs.core.chars = function chars(x) {
  return x
};
cljs.core.shorts = function shorts(x) {
  return x
};
cljs.core.ints = function ints(x) {
  return x
};
cljs.core.floats = function floats(x) {
  return x
};
cljs.core.doubles = function doubles(x) {
  return x
};
cljs.core.longs = function longs(x) {
  return x
};
cljs.core.js_mod = function js_mod(n, d) {
  return n % d
};
cljs.core.mod = function mod(n, d) {
  return(n % d + d) % d
};
cljs.core.quot = function quot(n, d) {
  var rem = n % d;
  return cljs.core.fix.call(null, (n - rem) / d)
};
cljs.core.rem = function rem(n, d) {
  var q = cljs.core.quot.call(null, n, d);
  return n - d * q
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  rand.cljs$core$IFn$_invoke$arity$0 = rand__0;
  rand.cljs$core$IFn$_invoke$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__$1 = v - (v >> 1 & 1431655765);
  var v__$2 = (v__$1 & 858993459) + (v__$1 >> 2 & 858993459);
  return(v__$2 + (v__$2 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__4165__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__4166 = y;
            var G__4167 = cljs.core.first.call(null, more);
            var G__4168 = cljs.core.next.call(null, more);
            x = G__4166;
            y = G__4167;
            more = G__4168;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4165 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4165__delegate.call(this, x, y, more)
    };
    G__4165.cljs$lang$maxFixedArity = 2;
    G__4165.cljs$lang$applyTo = function(arglist__4169) {
      var x = cljs.core.first(arglist__4169);
      arglist__4169 = cljs.core.next(arglist__4169);
      var y = cljs.core.first(arglist__4169);
      var more = cljs.core.rest(arglist__4169);
      return G__4165__delegate(x, y, more)
    };
    G__4165.cljs$core$IFn$_invoke$arity$variadic = G__4165__delegate;
    return G__4165
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$core$IFn$_invoke$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$core$IFn$_invoke$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$core$IFn$_invoke$arity$variadic = _EQ__EQ___3.cljs$core$IFn$_invoke$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__$1 = n;
  var xs = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3941__auto__ = xs;
      if(and__3941__auto__) {
        return n__$1 > 0
      }else {
        return and__3941__auto__
      }
    }())) {
      var G__4170 = n__$1 - 1;
      var G__4171 = cljs.core.next.call(null, xs);
      n__$1 = G__4170;
      xs = G__4171;
      continue
    }else {
      return xs
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0:else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__4172__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__4173 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__4174 = cljs.core.next.call(null, more);
            sb = G__4173;
            more = G__4174;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__4172 = function(x, var_args) {
      var ys = null;
      if(arguments.length > 1) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__4172__delegate.call(this, x, ys)
    };
    G__4172.cljs$lang$maxFixedArity = 1;
    G__4172.cljs$lang$applyTo = function(arglist__4175) {
      var x = cljs.core.first(arglist__4175);
      var ys = cljs.core.rest(arglist__4175);
      return G__4172__delegate(x, ys)
    };
    G__4172.cljs$core$IFn$_invoke$arity$variadic = G__4172__delegate;
    return G__4172
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$core$IFn$_invoke$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$core$IFn$_invoke$arity$0 = str_STAR___0;
  str_STAR_.cljs$core$IFn$_invoke$arity$1 = str_STAR___1;
  str_STAR_.cljs$core$IFn$_invoke$arity$variadic = str_STAR___2.cljs$core$IFn$_invoke$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.keyword_QMARK_.call(null, x)) {
      return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
    }else {
      if(x == null) {
        return""
      }else {
        if("\ufdd0:else") {
          return x.toString()
        }else {
          return null
        }
      }
    }
  };
  var str__2 = function() {
    var G__4176__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__4177 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__4178 = cljs.core.next.call(null, more);
            sb = G__4177;
            more = G__4178;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__4176 = function(x, var_args) {
      var ys = null;
      if(arguments.length > 1) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__4176__delegate.call(this, x, ys)
    };
    G__4176.cljs$lang$maxFixedArity = 1;
    G__4176.cljs$lang$applyTo = function(arglist__4179) {
      var x = cljs.core.first(arglist__4179);
      var ys = cljs.core.rest(arglist__4179);
      return G__4176__delegate(x, ys)
    };
    G__4176.cljs$core$IFn$_invoke$arity$variadic = G__4176__delegate;
    return G__4176
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$core$IFn$_invoke$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$core$IFn$_invoke$arity$0 = str__0;
  str.cljs$core$IFn$_invoke$arity$1 = str__1;
  str.cljs$core$IFn$_invoke$arity$variadic = str__2.cljs$core$IFn$_invoke$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  subs.cljs$core$IFn$_invoke$arity$2 = subs__2;
  subs.cljs$core$IFn$_invoke$arity$3 = subs__3;
  return subs
}();
cljs.core.format = function() {
  var format__delegate = function(fmt, args) {
    var args__$1 = cljs.core.map.call(null, function(x) {
      if(function() {
        var or__3943__auto__ = cljs.core.keyword_QMARK_.call(null, x);
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return x instanceof cljs.core.Symbol
        }
      }()) {
        return[cljs.core.str(x)].join("")
      }else {
        return x
      }
    }, args);
    return cljs.core.apply.call(null, goog.string.format, fmt, args__$1)
  };
  var format = function(fmt, var_args) {
    var args = null;
    if(arguments.length > 1) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return format__delegate.call(this, fmt, args)
  };
  format.cljs$lang$maxFixedArity = 1;
  format.cljs$lang$applyTo = function(arglist__4180) {
    var fmt = cljs.core.first(arglist__4180);
    var args = cljs.core.rest(arglist__4180);
    return format__delegate(fmt, args)
  };
  format.cljs$core$IFn$_invoke$arity$variadic = format__delegate;
  return format
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(name instanceof cljs.core.Symbol) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", ":", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0:else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", ":", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  keyword.cljs$core$IFn$_invoke$arity$1 = keyword__1;
  keyword.cljs$core$IFn$_invoke$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs = cljs.core.seq.call(null, x);
    var ys = cljs.core.seq.call(null, y);
    while(true) {
      if(xs == null) {
        return ys == null
      }else {
        if(ys == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs), cljs.core.first.call(null, ys))) {
            var G__4181 = cljs.core.next.call(null, xs);
            var G__4182 = cljs.core.next.call(null, ys);
            xs = G__4181;
            ys = G__4182;
            continue
          }else {
            if("\ufdd0:else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__4183_SHARP_, p2__4184_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__4183_SHARP_, cljs.core.hash.call(null, p2__4184_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h = 0;
  var s = cljs.core.seq.call(null, m);
  while(true) {
    if(s) {
      var e = cljs.core.first.call(null, s);
      var G__4185 = (h + (cljs.core.hash.call(null, cljs.core.key.call(null, e)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e)))) % 4503599627370496;
      var G__4186 = cljs.core.next.call(null, s);
      h = G__4185;
      s = G__4186;
      continue
    }else {
      return h
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h = 0;
  var s__$1 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__$1) {
      var e = cljs.core.first.call(null, s__$1);
      var G__4187 = (h + cljs.core.hash.call(null, e)) % 4503599627370496;
      var G__4188 = cljs.core.next.call(null, s__$1);
      h = G__4187;
      s__$1 = G__4188;
      continue
    }else {
      return h
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var seq__4195_4201 = cljs.core.seq.call(null, fn_map);
  var chunk__4196_4202 = null;
  var count__4197_4203 = 0;
  var i__4198_4204 = 0;
  while(true) {
    if(i__4198_4204 < count__4197_4203) {
      var vec__4199_4205 = cljs.core._nth.call(null, chunk__4196_4202, i__4198_4204);
      var key_name_4206 = cljs.core.nth.call(null, vec__4199_4205, 0, null);
      var f_4207 = cljs.core.nth.call(null, vec__4199_4205, 1, null);
      var str_name_4208 = cljs.core.name.call(null, key_name_4206);
      obj[str_name_4208] = f_4207;
      var G__4209 = seq__4195_4201;
      var G__4210 = chunk__4196_4202;
      var G__4211 = count__4197_4203;
      var G__4212 = i__4198_4204 + 1;
      seq__4195_4201 = G__4209;
      chunk__4196_4202 = G__4210;
      count__4197_4203 = G__4211;
      i__4198_4204 = G__4212;
      continue
    }else {
      var temp__4092__auto___4213 = cljs.core.seq.call(null, seq__4195_4201);
      if(temp__4092__auto___4213) {
        var seq__4195_4214__$1 = temp__4092__auto___4213;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__4195_4214__$1)) {
          var c__3073__auto___4215 = cljs.core.chunk_first.call(null, seq__4195_4214__$1);
          var G__4216 = cljs.core.chunk_rest.call(null, seq__4195_4214__$1);
          var G__4217 = c__3073__auto___4215;
          var G__4218 = cljs.core.count.call(null, c__3073__auto___4215);
          var G__4219 = 0;
          seq__4195_4201 = G__4216;
          chunk__4196_4202 = G__4217;
          count__4197_4203 = G__4218;
          i__4198_4204 = G__4219;
          continue
        }else {
          var vec__4200_4220 = cljs.core.first.call(null, seq__4195_4214__$1);
          var key_name_4221 = cljs.core.nth.call(null, vec__4200_4220, 0, null);
          var f_4222 = cljs.core.nth.call(null, vec__4200_4220, 1, null);
          var str_name_4223 = cljs.core.name.call(null, key_name_4221);
          obj[str_name_4223] = f_4222;
          var G__4224 = cljs.core.next.call(null, seq__4195_4214__$1);
          var G__4225 = null;
          var G__4226 = 0;
          var G__4227 = 0;
          seq__4195_4201 = G__4224;
          chunk__4196_4202 = G__4225;
          count__4197_4203 = G__4226;
          i__4198_4204 = G__4227;
          continue
        }
      }else {
      }
    }
    break
  }
  return obj
};
goog.provide("cljs.core.List");
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413358
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorStr = "cljs.core/List";
cljs.core.List.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2768__auto__ = self__.__hash;
  if(!(h__2768__auto__ == null)) {
    return h__2768__auto__
  }else {
    var h__2768__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2768__auto____$1;
    return h__2768__auto____$1
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  if(self__.count === 1) {
    return null
  }else {
    return self__.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return new cljs.core.List(self__.meta, o, coll, self__.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  return self__.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return self__.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return self__.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.List(meta__$1, self__.first, self__.rest, self__.count, self__.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.List.EMPTY
};
goog.provide("cljs.core.EmptyList");
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorStr = "cljs.core/EmptyList";
cljs.core.EmptyList.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return new cljs.core.List(self__.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.EmptyList(meta__$1)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__4229 = coll;
  if(G__4229) {
    if(function() {
      var or__3943__auto__ = G__4229.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__4229.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__4229.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__4229)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__4229)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_.call(null, coll)) {
    return cljs.core.rseq.call(null, coll)
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list__delegate = function(xs) {
    var arr = xs instanceof cljs.core.IndexedSeq ? xs.arr : function() {
      var arr = [];
      var xs__$1 = xs;
      while(true) {
        if(!(xs__$1 == null)) {
          arr.push(cljs.core._first.call(null, xs__$1));
          var G__4230 = cljs.core._next.call(null, xs__$1);
          xs__$1 = G__4230;
          continue
        }else {
          return arr
        }
        break
      }
    }();
    var i = arr.length;
    var r = cljs.core.List.EMPTY;
    while(true) {
      if(i > 0) {
        var G__4231 = i - 1;
        var G__4232 = cljs.core._conj.call(null, r, arr[i - 1]);
        i = G__4231;
        r = G__4232;
        continue
      }else {
        return r
      }
      break
    }
  };
  var list = function(var_args) {
    var xs = null;
    if(arguments.length > 0) {
      xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return list__delegate.call(this, xs)
  };
  list.cljs$lang$maxFixedArity = 0;
  list.cljs$lang$applyTo = function(arglist__4233) {
    var xs = cljs.core.seq(arglist__4233);
    return list__delegate(xs)
  };
  list.cljs$core$IFn$_invoke$arity$variadic = list__delegate;
  return list
}();
goog.provide("cljs.core.Cons");
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorStr = "cljs.core/Cons";
cljs.core.Cons.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2768__auto__ = self__.__hash;
  if(!(h__2768__auto__ == null)) {
    return h__2768__auto__
  }else {
    var h__2768__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2768__auto____$1;
    return h__2768__auto____$1
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  if(self__.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, self__.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return new cljs.core.Cons(null, o, coll, self__.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return self__.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return self__.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.Cons(meta__$1, self__.first, self__.rest, self__.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3943__auto__ = coll == null;
    if(or__3943__auto__) {
      return or__3943__auto__
    }else {
      var G__4235 = coll;
      if(G__4235) {
        if(function() {
          var or__3943__auto____$1 = G__4235.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            return G__4235.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__4237 = x;
  if(G__4237) {
    if(function() {
      var or__3943__auto__ = G__4237.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__4237.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__4237.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__4237)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__4237)
  }
};
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
goog.provide("cljs.core.Keyword");
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorStr = "cljs.core/Keyword";
cljs.core.Keyword.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__4239 = null;
  var G__4239__2 = function(self__, coll) {
    var self__ = this;
    var self____$1 = this;
    var _ = self____$1;
    if(coll == null) {
      return null
    }else {
      var strobj = coll.strobj;
      if(strobj == null) {
        return cljs.core._lookup.call(null, coll, self__.k, null)
      }else {
        return strobj[self__.k]
      }
    }
  };
  var G__4239__3 = function(self__, coll, not_found) {
    var self__ = this;
    var self____$1 = this;
    var _ = self____$1;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, self__.k, not_found)
    }
  };
  G__4239 = function(self__, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4239__2.call(this, self__, coll);
      case 3:
        return G__4239__3.call(this, self__, coll, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__4239
}();
cljs.core.Keyword.prototype.apply = function(self__, args4238) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args4238.slice()))
};
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__4241 = null;
  var G__4241__2 = function(self__, coll) {
    var self____$1 = this;
    var this$ = self____$1;
    return cljs.core.get.call(null, coll, this$.toString())
  };
  var G__4241__3 = function(self__, coll, not_found) {
    var self____$1 = this;
    var this$ = self____$1;
    return cljs.core.get.call(null, coll, this$.toString(), not_found)
  };
  G__4241 = function(self__, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4241__2.call(this, self__, coll);
      case 3:
        return G__4241__3.call(this, self__, coll, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__4241
}();
String.prototype.apply = function(self__, args4240) {
  return self__.call.apply(self__, [self__].concat(args4240.slice()))
};
String.prototype.apply = function(s, args) {
  if(args.length < 2) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x = lazy_seq.x;
  if(lazy_seq.realized) {
    return x
  }else {
    lazy_seq.x = x.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
goog.provide("cljs.core.LazySeq");
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorStr = "cljs.core/LazySeq";
cljs.core.LazySeq.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2768__auto__ = self__.__hash;
  if(!(h__2768__auto__ == null)) {
    return h__2768__auto__
  }else {
    var h__2768__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2768__auto____$1;
    return h__2768__auto____$1
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.LazySeq(meta__$1, self__.realized, self__.x, self__.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
goog.provide("cljs.core.ChunkBuffer");
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorStr = "cljs.core/ChunkBuffer";
cljs.core.ChunkBuffer.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var self__ = this;
  return self__.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var self__ = this;
  var _ = this;
  self__.buf[self__.end] = o;
  return self__.end = self__.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var self__ = this;
  var _ = this;
  var ret = new cljs.core.ArrayChunk(self__.buf, 0, self__.end);
  self__.buf = null;
  return ret
};
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(new Array(capacity), 0)
};
goog.provide("cljs.core.ArrayChunk");
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorStr = "cljs.core/ArrayChunk";
cljs.core.ArrayChunk.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  return cljs.core.array_reduce.call(null, self__.arr, f, self__.arr[self__.off], self__.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var self__ = this;
  return cljs.core.array_reduce.call(null, self__.arr, f, start, self__.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var self__ = this;
  if(self__.off === self__.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(self__.arr, self__.off + 1, self__.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var self__ = this;
  return self__.arr[self__.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = i >= 0;
    if(and__3941__auto__) {
      return i < self__.end - self__.off
    }else {
      return and__3941__auto__
    }
  }()) {
    return self__.arr[self__.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var self__ = this;
  return self__.end - self__.off
};
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return new cljs.core.ArrayChunk(arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return new cljs.core.ArrayChunk(arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  array_chunk.cljs$core$IFn$_invoke$arity$1 = array_chunk__1;
  array_chunk.cljs$core$IFn$_invoke$arity$2 = array_chunk__2;
  array_chunk.cljs$core$IFn$_invoke$arity$3 = array_chunk__3;
  return array_chunk
}();
goog.provide("cljs.core.ChunkedCons");
cljs.core.ChunkedCons = function(chunk, more, meta, __hash) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition0$ = 31850604;
  this.cljs$lang$protocol_mask$partition1$ = 1536
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorStr = "cljs.core/ChunkedCons";
cljs.core.ChunkedCons.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2768__auto__ = self__.__hash;
  if(!(h__2768__auto__ == null)) {
    return h__2768__auto__
  }else {
    var h__2768__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2768__auto____$1;
    return h__2768__auto____$1
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._nth.call(null, self__.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(cljs.core._count.call(null, self__.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, self__.chunk), self__.more, self__.meta, null)
  }else {
    if(self__.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return self__.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var self__ = this;
  if(self__.more == null) {
    return null
  }else {
    return self__.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var self__ = this;
  return new cljs.core.ChunkedCons(self__.chunk, self__.more, m, self__.__hash)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var self__ = this;
  return self__.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return self__.more
  }
};
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first.call(null, s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest.call(null, s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__4243 = s;
    if(G__4243) {
      if(function() {
        var or__3943__auto__ = G__4243.cljs$lang$protocol_mask$partition1$ & 1024;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__4243.cljs$core$IChunkedNext$
        }
      }()) {
        return true
      }else {
        return false
      }
    }else {
      return false
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary = [];
  var s__$1 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__$1)) {
      ary.push(cljs.core.first.call(null, s__$1));
      var G__4244 = cljs.core.next.call(null, s__$1);
      s__$1 = G__4244;
      continue
    }else {
      return ary
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret = new Array(cljs.core.count.call(null, coll));
  var i_4245 = 0;
  var xs_4246 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs_4246) {
      ret[i_4245] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs_4246));
      var G__4247 = i_4245 + 1;
      var G__4248 = cljs.core.next.call(null, xs_4246);
      i_4245 = G__4247;
      xs_4246 = G__4248;
      continue
    }else {
    }
    break
  }
  return ret
};
cljs.core.int_array = function() {
  var int_array = null;
  var int_array__1 = function(size_or_seq) {
    if(typeof size_or_seq === "number") {
      return int_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0:else") {
          throw new Error("int-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var int_array__2 = function(size, init_val_or_seq) {
    var a = new Array(size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s = cljs.core.seq.call(null, init_val_or_seq);
      var i = 0;
      var s__$1 = s;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto__ = s__$1;
          if(and__3941__auto__) {
            return i < size
          }else {
            return and__3941__auto__
          }
        }())) {
          a[i] = cljs.core.first.call(null, s__$1);
          var G__4249 = i + 1;
          var G__4250 = cljs.core.next.call(null, s__$1);
          i = G__4249;
          s__$1 = G__4250;
          continue
        }else {
          return a
        }
        break
      }
    }else {
      var n__3120__auto___4251 = size;
      var i_4252 = 0;
      while(true) {
        if(i_4252 < n__3120__auto___4251) {
          a[i_4252] = init_val_or_seq;
          var G__4253 = i_4252 + 1;
          i_4252 = G__4253;
          continue
        }else {
        }
        break
      }
      return a
    }
  };
  int_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return int_array__1.call(this, size);
      case 2:
        return int_array__2.call(this, size, init_val_or_seq)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  int_array.cljs$core$IFn$_invoke$arity$1 = int_array__1;
  int_array.cljs$core$IFn$_invoke$arity$2 = int_array__2;
  return int_array
}();
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(typeof size_or_seq === "number") {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0:else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a = new Array(size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s = cljs.core.seq.call(null, init_val_or_seq);
      var i = 0;
      var s__$1 = s;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto__ = s__$1;
          if(and__3941__auto__) {
            return i < size
          }else {
            return and__3941__auto__
          }
        }())) {
          a[i] = cljs.core.first.call(null, s__$1);
          var G__4254 = i + 1;
          var G__4255 = cljs.core.next.call(null, s__$1);
          i = G__4254;
          s__$1 = G__4255;
          continue
        }else {
          return a
        }
        break
      }
    }else {
      var n__3120__auto___4256 = size;
      var i_4257 = 0;
      while(true) {
        if(i_4257 < n__3120__auto___4256) {
          a[i_4257] = init_val_or_seq;
          var G__4258 = i_4257 + 1;
          i_4257 = G__4258;
          continue
        }else {
        }
        break
      }
      return a
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  long_array.cljs$core$IFn$_invoke$arity$1 = long_array__1;
  long_array.cljs$core$IFn$_invoke$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(typeof size_or_seq === "number") {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0:else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a = new Array(size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s = cljs.core.seq.call(null, init_val_or_seq);
      var i = 0;
      var s__$1 = s;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto__ = s__$1;
          if(and__3941__auto__) {
            return i < size
          }else {
            return and__3941__auto__
          }
        }())) {
          a[i] = cljs.core.first.call(null, s__$1);
          var G__4259 = i + 1;
          var G__4260 = cljs.core.next.call(null, s__$1);
          i = G__4259;
          s__$1 = G__4260;
          continue
        }else {
          return a
        }
        break
      }
    }else {
      var n__3120__auto___4261 = size;
      var i_4262 = 0;
      while(true) {
        if(i_4262 < n__3120__auto___4261) {
          a[i_4262] = init_val_or_seq;
          var G__4263 = i_4262 + 1;
          i_4262 = G__4263;
          continue
        }else {
        }
        break
      }
      return a
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  double_array.cljs$core$IFn$_invoke$arity$1 = double_array__1;
  double_array.cljs$core$IFn$_invoke$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(typeof size_or_seq === "number") {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0:else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a = new Array(size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s = cljs.core.seq.call(null, init_val_or_seq);
      var i = 0;
      var s__$1 = s;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto__ = s__$1;
          if(and__3941__auto__) {
            return i < size
          }else {
            return and__3941__auto__
          }
        }())) {
          a[i] = cljs.core.first.call(null, s__$1);
          var G__4264 = i + 1;
          var G__4265 = cljs.core.next.call(null, s__$1);
          i = G__4264;
          s__$1 = G__4265;
          continue
        }else {
          return a
        }
        break
      }
    }else {
      var n__3120__auto___4266 = size;
      var i_4267 = 0;
      while(true) {
        if(i_4267 < n__3120__auto___4266) {
          a[i_4267] = init_val_or_seq;
          var G__4268 = i_4267 + 1;
          i_4267 = G__4268;
          continue
        }else {
        }
        break
      }
      return a
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  object_array.cljs$core$IFn$_invoke$arity$1 = object_array__1;
  object_array.cljs$core$IFn$_invoke$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__$1 = s;
    var i = n;
    var sum = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3941__auto__ = i > 0;
        if(and__3941__auto__) {
          return cljs.core.seq.call(null, s__$1)
        }else {
          return and__3941__auto__
        }
      }())) {
        var G__4269 = cljs.core.next.call(null, s__$1);
        var G__4270 = i - 1;
        var G__4271 = sum + 1;
        s__$1 = G__4269;
        i = G__4270;
        sum = G__4271;
        continue
      }else {
        return sum
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0:else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s = cljs.core.seq.call(null, x);
      if(s) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s), concat.call(null, cljs.core.chunk_rest.call(null, s), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s), concat.call(null, cljs.core.rest.call(null, s), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__4272__delegate = function(x, y, zs) {
      var cat = function cat(xys, zs__$1) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__$1 = cljs.core.seq.call(null, xys);
          if(xys__$1) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__$1)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__$1), cat.call(null, cljs.core.chunk_rest.call(null, xys__$1), zs__$1))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__$1), cat.call(null, cljs.core.rest.call(null, xys__$1), zs__$1))
            }
          }else {
            if(cljs.core.truth_(zs__$1)) {
              return cat.call(null, cljs.core.first.call(null, zs__$1), cljs.core.next.call(null, zs__$1))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat.call(null, concat.call(null, x, y), zs)
    };
    var G__4272 = function(x, y, var_args) {
      var zs = null;
      if(arguments.length > 2) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4272__delegate.call(this, x, y, zs)
    };
    G__4272.cljs$lang$maxFixedArity = 2;
    G__4272.cljs$lang$applyTo = function(arglist__4273) {
      var x = cljs.core.first(arglist__4273);
      arglist__4273 = cljs.core.next(arglist__4273);
      var y = cljs.core.first(arglist__4273);
      var zs = cljs.core.rest(arglist__4273);
      return G__4272__delegate(x, y, zs)
    };
    G__4272.cljs$core$IFn$_invoke$arity$variadic = G__4272__delegate;
    return G__4272
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$core$IFn$_invoke$arity$0 = concat__0;
  concat.cljs$core$IFn$_invoke$arity$1 = concat__1;
  concat.cljs$core$IFn$_invoke$arity$2 = concat__2;
  concat.cljs$core$IFn$_invoke$arity$variadic = concat__3.cljs$core$IFn$_invoke$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__4274__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__4274 = function(a, b, c, d, var_args) {
      var more = null;
      if(arguments.length > 4) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__4274__delegate.call(this, a, b, c, d, more)
    };
    G__4274.cljs$lang$maxFixedArity = 4;
    G__4274.cljs$lang$applyTo = function(arglist__4275) {
      var a = cljs.core.first(arglist__4275);
      arglist__4275 = cljs.core.next(arglist__4275);
      var b = cljs.core.first(arglist__4275);
      arglist__4275 = cljs.core.next(arglist__4275);
      var c = cljs.core.first(arglist__4275);
      arglist__4275 = cljs.core.next(arglist__4275);
      var d = cljs.core.first(arglist__4275);
      var more = cljs.core.rest(arglist__4275);
      return G__4274__delegate(a, b, c, d, more)
    };
    G__4274.cljs$core$IFn$_invoke$arity$variadic = G__4274__delegate;
    return G__4274
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$core$IFn$_invoke$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$core$IFn$_invoke$arity$1 = list_STAR___1;
  list_STAR_.cljs$core$IFn$_invoke$arity$2 = list_STAR___2;
  list_STAR_.cljs$core$IFn$_invoke$arity$3 = list_STAR___3;
  list_STAR_.cljs$core$IFn$_invoke$arity$4 = list_STAR___4;
  list_STAR_.cljs$core$IFn$_invoke$arity$variadic = list_STAR___5.cljs$core$IFn$_invoke$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__$1 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a = cljs.core._first.call(null, args__$1);
    var args__$2 = cljs.core._rest.call(null, args__$1);
    if(argc === 1) {
      if(f.cljs$core$IFn$_invoke$arity$1) {
        return f.cljs$core$IFn$_invoke$arity$1(a)
      }else {
        return f.call(null, a)
      }
    }else {
      var b = cljs.core._first.call(null, args__$2);
      var args__$3 = cljs.core._rest.call(null, args__$2);
      if(argc === 2) {
        if(f.cljs$core$IFn$_invoke$arity$2) {
          return f.cljs$core$IFn$_invoke$arity$2(a, b)
        }else {
          return f.call(null, a, b)
        }
      }else {
        var c = cljs.core._first.call(null, args__$3);
        var args__$4 = cljs.core._rest.call(null, args__$3);
        if(argc === 3) {
          if(f.cljs$core$IFn$_invoke$arity$3) {
            return f.cljs$core$IFn$_invoke$arity$3(a, b, c)
          }else {
            return f.call(null, a, b, c)
          }
        }else {
          var d = cljs.core._first.call(null, args__$4);
          var args__$5 = cljs.core._rest.call(null, args__$4);
          if(argc === 4) {
            if(f.cljs$core$IFn$_invoke$arity$4) {
              return f.cljs$core$IFn$_invoke$arity$4(a, b, c, d)
            }else {
              return f.call(null, a, b, c, d)
            }
          }else {
            var e = cljs.core._first.call(null, args__$5);
            var args__$6 = cljs.core._rest.call(null, args__$5);
            if(argc === 5) {
              if(f.cljs$core$IFn$_invoke$arity$5) {
                return f.cljs$core$IFn$_invoke$arity$5(a, b, c, d, e)
              }else {
                return f.call(null, a, b, c, d, e)
              }
            }else {
              var f__$1 = cljs.core._first.call(null, args__$6);
              var args__$7 = cljs.core._rest.call(null, args__$6);
              if(argc === 6) {
                if(f__$1.cljs$core$IFn$_invoke$arity$6) {
                  return f__$1.cljs$core$IFn$_invoke$arity$6(a, b, c, d, e, f__$1)
                }else {
                  return f__$1.call(null, a, b, c, d, e, f__$1)
                }
              }else {
                var g = cljs.core._first.call(null, args__$7);
                var args__$8 = cljs.core._rest.call(null, args__$7);
                if(argc === 7) {
                  if(f__$1.cljs$core$IFn$_invoke$arity$7) {
                    return f__$1.cljs$core$IFn$_invoke$arity$7(a, b, c, d, e, f__$1, g)
                  }else {
                    return f__$1.call(null, a, b, c, d, e, f__$1, g)
                  }
                }else {
                  var h = cljs.core._first.call(null, args__$8);
                  var args__$9 = cljs.core._rest.call(null, args__$8);
                  if(argc === 8) {
                    if(f__$1.cljs$core$IFn$_invoke$arity$8) {
                      return f__$1.cljs$core$IFn$_invoke$arity$8(a, b, c, d, e, f__$1, g, h)
                    }else {
                      return f__$1.call(null, a, b, c, d, e, f__$1, g, h)
                    }
                  }else {
                    var i = cljs.core._first.call(null, args__$9);
                    var args__$10 = cljs.core._rest.call(null, args__$9);
                    if(argc === 9) {
                      if(f__$1.cljs$core$IFn$_invoke$arity$9) {
                        return f__$1.cljs$core$IFn$_invoke$arity$9(a, b, c, d, e, f__$1, g, h, i)
                      }else {
                        return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i)
                      }
                    }else {
                      var j = cljs.core._first.call(null, args__$10);
                      var args__$11 = cljs.core._rest.call(null, args__$10);
                      if(argc === 10) {
                        if(f__$1.cljs$core$IFn$_invoke$arity$10) {
                          return f__$1.cljs$core$IFn$_invoke$arity$10(a, b, c, d, e, f__$1, g, h, i, j)
                        }else {
                          return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j)
                        }
                      }else {
                        var k = cljs.core._first.call(null, args__$11);
                        var args__$12 = cljs.core._rest.call(null, args__$11);
                        if(argc === 11) {
                          if(f__$1.cljs$core$IFn$_invoke$arity$11) {
                            return f__$1.cljs$core$IFn$_invoke$arity$11(a, b, c, d, e, f__$1, g, h, i, j, k)
                          }else {
                            return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k)
                          }
                        }else {
                          var l = cljs.core._first.call(null, args__$12);
                          var args__$13 = cljs.core._rest.call(null, args__$12);
                          if(argc === 12) {
                            if(f__$1.cljs$core$IFn$_invoke$arity$12) {
                              return f__$1.cljs$core$IFn$_invoke$arity$12(a, b, c, d, e, f__$1, g, h, i, j, k, l)
                            }else {
                              return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l)
                            }
                          }else {
                            var m = cljs.core._first.call(null, args__$13);
                            var args__$14 = cljs.core._rest.call(null, args__$13);
                            if(argc === 13) {
                              if(f__$1.cljs$core$IFn$_invoke$arity$13) {
                                return f__$1.cljs$core$IFn$_invoke$arity$13(a, b, c, d, e, f__$1, g, h, i, j, k, l, m)
                              }else {
                                return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m)
                              }
                            }else {
                              var n = cljs.core._first.call(null, args__$14);
                              var args__$15 = cljs.core._rest.call(null, args__$14);
                              if(argc === 14) {
                                if(f__$1.cljs$core$IFn$_invoke$arity$14) {
                                  return f__$1.cljs$core$IFn$_invoke$arity$14(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n)
                                }else {
                                  return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n)
                                }
                              }else {
                                var o = cljs.core._first.call(null, args__$15);
                                var args__$16 = cljs.core._rest.call(null, args__$15);
                                if(argc === 15) {
                                  if(f__$1.cljs$core$IFn$_invoke$arity$15) {
                                    return f__$1.cljs$core$IFn$_invoke$arity$15(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o)
                                  }else {
                                    return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o)
                                  }
                                }else {
                                  var p = cljs.core._first.call(null, args__$16);
                                  var args__$17 = cljs.core._rest.call(null, args__$16);
                                  if(argc === 16) {
                                    if(f__$1.cljs$core$IFn$_invoke$arity$16) {
                                      return f__$1.cljs$core$IFn$_invoke$arity$16(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p)
                                    }else {
                                      return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p)
                                    }
                                  }else {
                                    var q = cljs.core._first.call(null, args__$17);
                                    var args__$18 = cljs.core._rest.call(null, args__$17);
                                    if(argc === 17) {
                                      if(f__$1.cljs$core$IFn$_invoke$arity$17) {
                                        return f__$1.cljs$core$IFn$_invoke$arity$17(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q)
                                      }else {
                                        return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q)
                                      }
                                    }else {
                                      var r = cljs.core._first.call(null, args__$18);
                                      var args__$19 = cljs.core._rest.call(null, args__$18);
                                      if(argc === 18) {
                                        if(f__$1.cljs$core$IFn$_invoke$arity$18) {
                                          return f__$1.cljs$core$IFn$_invoke$arity$18(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r)
                                        }else {
                                          return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r)
                                        }
                                      }else {
                                        var s = cljs.core._first.call(null, args__$19);
                                        var args__$20 = cljs.core._rest.call(null, args__$19);
                                        if(argc === 19) {
                                          if(f__$1.cljs$core$IFn$_invoke$arity$19) {
                                            return f__$1.cljs$core$IFn$_invoke$arity$19(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r, s)
                                          }else {
                                            return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r, s)
                                          }
                                        }else {
                                          var t = cljs.core._first.call(null, args__$20);
                                          var args__$21 = cljs.core._rest.call(null, args__$20);
                                          if(argc === 20) {
                                            if(f__$1.cljs$core$IFn$_invoke$arity$20) {
                                              return f__$1.cljs$core$IFn$_invoke$arity$20(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r, s, t)
                                            }else {
                                              return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r, s, t)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity = f.cljs$lang$maxFixedArity;
    if(f.cljs$lang$applyTo) {
      var bc = cljs.core.bounded_count.call(null, args, fixed_arity + 1);
      if(bc <= fixed_arity) {
        return cljs.core.apply_to.call(null, f, bc, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity = f.cljs$lang$maxFixedArity;
    if(f.cljs$lang$applyTo) {
      var bc = cljs.core.bounded_count.call(null, arglist, fixed_arity + 1);
      if(bc <= fixed_arity) {
        return cljs.core.apply_to.call(null, f, bc, arglist)
      }else {
        return f.cljs$lang$applyTo(arglist)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity = f.cljs$lang$maxFixedArity;
    if(f.cljs$lang$applyTo) {
      var bc = cljs.core.bounded_count.call(null, arglist, fixed_arity + 1);
      if(bc <= fixed_arity) {
        return cljs.core.apply_to.call(null, f, bc, arglist)
      }else {
        return f.cljs$lang$applyTo(arglist)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity = f.cljs$lang$maxFixedArity;
    if(f.cljs$lang$applyTo) {
      var bc = cljs.core.bounded_count.call(null, arglist, fixed_arity + 1);
      if(bc <= fixed_arity) {
        return cljs.core.apply_to.call(null, f, bc, arglist)
      }else {
        return f.cljs$lang$applyTo(arglist)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist))
    }
  };
  var apply__6 = function() {
    var G__4276__delegate = function(f, a, b, c, d, args) {
      var arglist = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity = f.cljs$lang$maxFixedArity;
      if(f.cljs$lang$applyTo) {
        var bc = cljs.core.bounded_count.call(null, arglist, fixed_arity + 1);
        if(bc <= fixed_arity) {
          return cljs.core.apply_to.call(null, f, bc, arglist)
        }else {
          return f.cljs$lang$applyTo(arglist)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist))
      }
    };
    var G__4276 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(arguments.length > 5) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__4276__delegate.call(this, f, a, b, c, d, args)
    };
    G__4276.cljs$lang$maxFixedArity = 5;
    G__4276.cljs$lang$applyTo = function(arglist__4277) {
      var f = cljs.core.first(arglist__4277);
      arglist__4277 = cljs.core.next(arglist__4277);
      var a = cljs.core.first(arglist__4277);
      arglist__4277 = cljs.core.next(arglist__4277);
      var b = cljs.core.first(arglist__4277);
      arglist__4277 = cljs.core.next(arglist__4277);
      var c = cljs.core.first(arglist__4277);
      arglist__4277 = cljs.core.next(arglist__4277);
      var d = cljs.core.first(arglist__4277);
      var args = cljs.core.rest(arglist__4277);
      return G__4276__delegate(f, a, b, c, d, args)
    };
    G__4276.cljs$core$IFn$_invoke$arity$variadic = G__4276__delegate;
    return G__4276
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$core$IFn$_invoke$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$core$IFn$_invoke$arity$2 = apply__2;
  apply.cljs$core$IFn$_invoke$arity$3 = apply__3;
  apply.cljs$core$IFn$_invoke$arity$4 = apply__4;
  apply.cljs$core$IFn$_invoke$arity$5 = apply__5;
  apply.cljs$core$IFn$_invoke$arity$variadic = apply__6.cljs$core$IFn$_invoke$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(arguments.length > 2) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__4278) {
    var obj = cljs.core.first(arglist__4278);
    arglist__4278 = cljs.core.next(arglist__4278);
    var f = cljs.core.first(arglist__4278);
    var args = cljs.core.rest(arglist__4278);
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$core$IFn$_invoke$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var not_EQ___3 = function() {
    var G__4279__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__4279 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4279__delegate.call(this, x, y, more)
    };
    G__4279.cljs$lang$maxFixedArity = 2;
    G__4279.cljs$lang$applyTo = function(arglist__4280) {
      var x = cljs.core.first(arglist__4280);
      arglist__4280 = cljs.core.next(arglist__4280);
      var y = cljs.core.first(arglist__4280);
      var more = cljs.core.rest(arglist__4280);
      return G__4279__delegate(x, y, more)
    };
    G__4279.cljs$core$IFn$_invoke$arity$variadic = G__4279__delegate;
    return G__4279
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$core$IFn$_invoke$arity$1 = not_EQ___1;
  not_EQ_.cljs$core$IFn$_invoke$arity$2 = not_EQ___2;
  not_EQ_.cljs$core$IFn$_invoke$arity$variadic = not_EQ___3.cljs$core$IFn$_invoke$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq.call(null, coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__4281 = pred;
        var G__4282 = cljs.core.next.call(null, coll);
        pred = G__4281;
        coll = G__4282;
        continue
      }else {
        if("\ufdd0:else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_.call(null, pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll)) {
      var or__3943__auto__ = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3943__auto__)) {
        return or__3943__auto__
      }else {
        var G__4283 = pred;
        var G__4284 = cljs.core.next.call(null, coll);
        pred = G__4283;
        coll = G__4284;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_.call(null, n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__4285 = null;
    var G__4285__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__4285__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__4285__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__4285__3 = function() {
      var G__4286__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__4286 = function(x, y, var_args) {
        var zs = null;
        if(arguments.length > 2) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__4286__delegate.call(this, x, y, zs)
      };
      G__4286.cljs$lang$maxFixedArity = 2;
      G__4286.cljs$lang$applyTo = function(arglist__4287) {
        var x = cljs.core.first(arglist__4287);
        arglist__4287 = cljs.core.next(arglist__4287);
        var y = cljs.core.first(arglist__4287);
        var zs = cljs.core.rest(arglist__4287);
        return G__4286__delegate(x, y, zs)
      };
      G__4286.cljs$core$IFn$_invoke$arity$variadic = G__4286__delegate;
      return G__4286
    }();
    G__4285 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__4285__0.call(this);
        case 1:
          return G__4285__1.call(this, x);
        case 2:
          return G__4285__2.call(this, x, y);
        default:
          return G__4285__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw new Error("Invalid arity: " + arguments.length);
    };
    G__4285.cljs$lang$maxFixedArity = 2;
    G__4285.cljs$lang$applyTo = G__4285__3.cljs$lang$applyTo;
    return G__4285
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__4288__delegate = function(args) {
      return x
    };
    var G__4288 = function(var_args) {
      var args = null;
      if(arguments.length > 0) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__4288__delegate.call(this, args)
    };
    G__4288.cljs$lang$maxFixedArity = 0;
    G__4288.cljs$lang$applyTo = function(arglist__4289) {
      var args = cljs.core.seq(arglist__4289);
      return G__4288__delegate(args)
    };
    G__4288.cljs$core$IFn$_invoke$arity$variadic = G__4288__delegate;
    return G__4288
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__4290 = null;
      var G__4290__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__4290__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__4290__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__4290__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__4290__4 = function() {
        var G__4291__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__4291 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4291__delegate.call(this, x, y, z, args)
        };
        G__4291.cljs$lang$maxFixedArity = 3;
        G__4291.cljs$lang$applyTo = function(arglist__4292) {
          var x = cljs.core.first(arglist__4292);
          arglist__4292 = cljs.core.next(arglist__4292);
          var y = cljs.core.first(arglist__4292);
          arglist__4292 = cljs.core.next(arglist__4292);
          var z = cljs.core.first(arglist__4292);
          var args = cljs.core.rest(arglist__4292);
          return G__4291__delegate(x, y, z, args)
        };
        G__4291.cljs$core$IFn$_invoke$arity$variadic = G__4291__delegate;
        return G__4291
      }();
      G__4290 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__4290__0.call(this);
          case 1:
            return G__4290__1.call(this, x);
          case 2:
            return G__4290__2.call(this, x, y);
          case 3:
            return G__4290__3.call(this, x, y, z);
          default:
            return G__4290__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__4290.cljs$lang$maxFixedArity = 3;
      G__4290.cljs$lang$applyTo = G__4290__4.cljs$lang$applyTo;
      return G__4290
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__4293 = null;
      var G__4293__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__4293__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__4293__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__4293__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__4293__4 = function() {
        var G__4294__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__4294 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4294__delegate.call(this, x, y, z, args)
        };
        G__4294.cljs$lang$maxFixedArity = 3;
        G__4294.cljs$lang$applyTo = function(arglist__4295) {
          var x = cljs.core.first(arglist__4295);
          arglist__4295 = cljs.core.next(arglist__4295);
          var y = cljs.core.first(arglist__4295);
          arglist__4295 = cljs.core.next(arglist__4295);
          var z = cljs.core.first(arglist__4295);
          var args = cljs.core.rest(arglist__4295);
          return G__4294__delegate(x, y, z, args)
        };
        G__4294.cljs$core$IFn$_invoke$arity$variadic = G__4294__delegate;
        return G__4294
      }();
      G__4293 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__4293__0.call(this);
          case 1:
            return G__4293__1.call(this, x);
          case 2:
            return G__4293__2.call(this, x, y);
          case 3:
            return G__4293__3.call(this, x, y, z);
          default:
            return G__4293__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__4293.cljs$lang$maxFixedArity = 3;
      G__4293.cljs$lang$applyTo = G__4293__4.cljs$lang$applyTo;
      return G__4293
    }()
  };
  var comp__4 = function() {
    var G__4296__delegate = function(f1, f2, f3, fs) {
      var fs__$1 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__4297__delegate = function(args) {
          var ret = cljs.core.apply.call(null, cljs.core.first.call(null, fs__$1), args);
          var fs__$2 = cljs.core.next.call(null, fs__$1);
          while(true) {
            if(fs__$2) {
              var G__4298 = cljs.core.first.call(null, fs__$2).call(null, ret);
              var G__4299 = cljs.core.next.call(null, fs__$2);
              ret = G__4298;
              fs__$2 = G__4299;
              continue
            }else {
              return ret
            }
            break
          }
        };
        var G__4297 = function(var_args) {
          var args = null;
          if(arguments.length > 0) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__4297__delegate.call(this, args)
        };
        G__4297.cljs$lang$maxFixedArity = 0;
        G__4297.cljs$lang$applyTo = function(arglist__4300) {
          var args = cljs.core.seq(arglist__4300);
          return G__4297__delegate(args)
        };
        G__4297.cljs$core$IFn$_invoke$arity$variadic = G__4297__delegate;
        return G__4297
      }()
    };
    var G__4296 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(arguments.length > 3) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4296__delegate.call(this, f1, f2, f3, fs)
    };
    G__4296.cljs$lang$maxFixedArity = 3;
    G__4296.cljs$lang$applyTo = function(arglist__4301) {
      var f1 = cljs.core.first(arglist__4301);
      arglist__4301 = cljs.core.next(arglist__4301);
      var f2 = cljs.core.first(arglist__4301);
      arglist__4301 = cljs.core.next(arglist__4301);
      var f3 = cljs.core.first(arglist__4301);
      var fs = cljs.core.rest(arglist__4301);
      return G__4296__delegate(f1, f2, f3, fs)
    };
    G__4296.cljs$core$IFn$_invoke$arity$variadic = G__4296__delegate;
    return G__4296
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$core$IFn$_invoke$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$core$IFn$_invoke$arity$0 = comp__0;
  comp.cljs$core$IFn$_invoke$arity$1 = comp__1;
  comp.cljs$core$IFn$_invoke$arity$2 = comp__2;
  comp.cljs$core$IFn$_invoke$arity$3 = comp__3;
  comp.cljs$core$IFn$_invoke$arity$variadic = comp__4.cljs$core$IFn$_invoke$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__4302__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__4302 = function(var_args) {
        var args = null;
        if(arguments.length > 0) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__4302__delegate.call(this, args)
      };
      G__4302.cljs$lang$maxFixedArity = 0;
      G__4302.cljs$lang$applyTo = function(arglist__4303) {
        var args = cljs.core.seq(arglist__4303);
        return G__4302__delegate(args)
      };
      G__4302.cljs$core$IFn$_invoke$arity$variadic = G__4302__delegate;
      return G__4302
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__4304__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__4304 = function(var_args) {
        var args = null;
        if(arguments.length > 0) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__4304__delegate.call(this, args)
      };
      G__4304.cljs$lang$maxFixedArity = 0;
      G__4304.cljs$lang$applyTo = function(arglist__4305) {
        var args = cljs.core.seq(arglist__4305);
        return G__4304__delegate(args)
      };
      G__4304.cljs$core$IFn$_invoke$arity$variadic = G__4304__delegate;
      return G__4304
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__4306__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__4306 = function(var_args) {
        var args = null;
        if(arguments.length > 0) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__4306__delegate.call(this, args)
      };
      G__4306.cljs$lang$maxFixedArity = 0;
      G__4306.cljs$lang$applyTo = function(arglist__4307) {
        var args = cljs.core.seq(arglist__4307);
        return G__4306__delegate(args)
      };
      G__4306.cljs$core$IFn$_invoke$arity$variadic = G__4306__delegate;
      return G__4306
    }()
  };
  var partial__5 = function() {
    var G__4308__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__4309__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__4309 = function(var_args) {
          var args = null;
          if(arguments.length > 0) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__4309__delegate.call(this, args)
        };
        G__4309.cljs$lang$maxFixedArity = 0;
        G__4309.cljs$lang$applyTo = function(arglist__4310) {
          var args = cljs.core.seq(arglist__4310);
          return G__4309__delegate(args)
        };
        G__4309.cljs$core$IFn$_invoke$arity$variadic = G__4309__delegate;
        return G__4309
      }()
    };
    var G__4308 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(arguments.length > 4) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__4308__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__4308.cljs$lang$maxFixedArity = 4;
    G__4308.cljs$lang$applyTo = function(arglist__4311) {
      var f = cljs.core.first(arglist__4311);
      arglist__4311 = cljs.core.next(arglist__4311);
      var arg1 = cljs.core.first(arglist__4311);
      arglist__4311 = cljs.core.next(arglist__4311);
      var arg2 = cljs.core.first(arglist__4311);
      arglist__4311 = cljs.core.next(arglist__4311);
      var arg3 = cljs.core.first(arglist__4311);
      var more = cljs.core.rest(arglist__4311);
      return G__4308__delegate(f, arg1, arg2, arg3, more)
    };
    G__4308.cljs$core$IFn$_invoke$arity$variadic = G__4308__delegate;
    return G__4308
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$core$IFn$_invoke$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$core$IFn$_invoke$arity$2 = partial__2;
  partial.cljs$core$IFn$_invoke$arity$3 = partial__3;
  partial.cljs$core$IFn$_invoke$arity$4 = partial__4;
  partial.cljs$core$IFn$_invoke$arity$variadic = partial__5.cljs$core$IFn$_invoke$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__4312 = null;
      var G__4312__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__4312__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__4312__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__4312__4 = function() {
        var G__4313__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__4313 = function(a, b, c, var_args) {
          var ds = null;
          if(arguments.length > 3) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4313__delegate.call(this, a, b, c, ds)
        };
        G__4313.cljs$lang$maxFixedArity = 3;
        G__4313.cljs$lang$applyTo = function(arglist__4314) {
          var a = cljs.core.first(arglist__4314);
          arglist__4314 = cljs.core.next(arglist__4314);
          var b = cljs.core.first(arglist__4314);
          arglist__4314 = cljs.core.next(arglist__4314);
          var c = cljs.core.first(arglist__4314);
          var ds = cljs.core.rest(arglist__4314);
          return G__4313__delegate(a, b, c, ds)
        };
        G__4313.cljs$core$IFn$_invoke$arity$variadic = G__4313__delegate;
        return G__4313
      }();
      G__4312 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__4312__1.call(this, a);
          case 2:
            return G__4312__2.call(this, a, b);
          case 3:
            return G__4312__3.call(this, a, b, c);
          default:
            return G__4312__4.cljs$core$IFn$_invoke$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__4312.cljs$lang$maxFixedArity = 3;
      G__4312.cljs$lang$applyTo = G__4312__4.cljs$lang$applyTo;
      return G__4312
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__4315 = null;
      var G__4315__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__4315__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__4315__4 = function() {
        var G__4316__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__4316 = function(a, b, c, var_args) {
          var ds = null;
          if(arguments.length > 3) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4316__delegate.call(this, a, b, c, ds)
        };
        G__4316.cljs$lang$maxFixedArity = 3;
        G__4316.cljs$lang$applyTo = function(arglist__4317) {
          var a = cljs.core.first(arglist__4317);
          arglist__4317 = cljs.core.next(arglist__4317);
          var b = cljs.core.first(arglist__4317);
          arglist__4317 = cljs.core.next(arglist__4317);
          var c = cljs.core.first(arglist__4317);
          var ds = cljs.core.rest(arglist__4317);
          return G__4316__delegate(a, b, c, ds)
        };
        G__4316.cljs$core$IFn$_invoke$arity$variadic = G__4316__delegate;
        return G__4316
      }();
      G__4315 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__4315__2.call(this, a, b);
          case 3:
            return G__4315__3.call(this, a, b, c);
          default:
            return G__4315__4.cljs$core$IFn$_invoke$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__4315.cljs$lang$maxFixedArity = 3;
      G__4315.cljs$lang$applyTo = G__4315__4.cljs$lang$applyTo;
      return G__4315
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__4318 = null;
      var G__4318__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__4318__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__4318__4 = function() {
        var G__4319__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__4319 = function(a, b, c, var_args) {
          var ds = null;
          if(arguments.length > 3) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4319__delegate.call(this, a, b, c, ds)
        };
        G__4319.cljs$lang$maxFixedArity = 3;
        G__4319.cljs$lang$applyTo = function(arglist__4320) {
          var a = cljs.core.first(arglist__4320);
          arglist__4320 = cljs.core.next(arglist__4320);
          var b = cljs.core.first(arglist__4320);
          arglist__4320 = cljs.core.next(arglist__4320);
          var c = cljs.core.first(arglist__4320);
          var ds = cljs.core.rest(arglist__4320);
          return G__4319__delegate(a, b, c, ds)
        };
        G__4319.cljs$core$IFn$_invoke$arity$variadic = G__4319__delegate;
        return G__4319
      }();
      G__4318 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__4318__2.call(this, a, b);
          case 3:
            return G__4318__3.call(this, a, b, c);
          default:
            return G__4318__4.cljs$core$IFn$_invoke$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__4318.cljs$lang$maxFixedArity = 3;
      G__4318.cljs$lang$applyTo = G__4318__4.cljs$lang$applyTo;
      return G__4318
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  fnil.cljs$core$IFn$_invoke$arity$2 = fnil__2;
  fnil.cljs$core$IFn$_invoke$arity$3 = fnil__3;
  fnil.cljs$core$IFn$_invoke$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi = function mapi(idx, coll__$1) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll__$1);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, s)) {
          var c = cljs.core.chunk_first.call(null, s);
          var size = cljs.core.count.call(null, c);
          var b = cljs.core.chunk_buffer.call(null, size);
          var n__3120__auto___4321 = size;
          var i_4322 = 0;
          while(true) {
            if(i_4322 < n__3120__auto___4321) {
              cljs.core.chunk_append.call(null, b, f.call(null, idx + i_4322, cljs.core._nth.call(null, c, i_4322)));
              var G__4323 = i_4322 + 1;
              i_4322 = G__4323;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b), mapi.call(null, idx + size, cljs.core.chunk_rest.call(null, s)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto__ = cljs.core.seq.call(null, coll);
    if(temp__4092__auto__) {
      var s = temp__4092__auto__;
      if(cljs.core.chunked_seq_QMARK_.call(null, s)) {
        var c = cljs.core.chunk_first.call(null, s);
        var size = cljs.core.count.call(null, c);
        var b = cljs.core.chunk_buffer.call(null, size);
        var n__3120__auto___4324 = size;
        var i_4325 = 0;
        while(true) {
          if(i_4325 < n__3120__auto___4324) {
            var x_4326 = f.call(null, cljs.core._nth.call(null, c, i_4325));
            if(x_4326 == null) {
            }else {
              cljs.core.chunk_append.call(null, b, x_4326)
            }
            var G__4327 = i_4325 + 1;
            i_4325 = G__4327;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b), keep.call(null, f, cljs.core.chunk_rest.call(null, s)))
      }else {
        var x = f.call(null, cljs.core.first.call(null, s));
        if(x == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s))
        }else {
          return cljs.core.cons.call(null, x, keep.call(null, f, cljs.core.rest.call(null, s)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi = function keepi(idx, coll__$1) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll__$1);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, s)) {
          var c = cljs.core.chunk_first.call(null, s);
          var size = cljs.core.count.call(null, c);
          var b = cljs.core.chunk_buffer.call(null, size);
          var n__3120__auto___4334 = size;
          var i_4335 = 0;
          while(true) {
            if(i_4335 < n__3120__auto___4334) {
              var x_4336 = f.call(null, idx + i_4335, cljs.core._nth.call(null, c, i_4335));
              if(x_4336 == null) {
              }else {
                cljs.core.chunk_append.call(null, b, x_4336)
              }
              var G__4337 = i_4335 + 1;
              i_4335 = G__4337;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b), keepi.call(null, idx + size, cljs.core.chunk_rest.call(null, s)))
        }else {
          var x = f.call(null, idx, cljs.core.first.call(null, s));
          if(x == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s))
          }else {
            return cljs.core.cons.call(null, x, keepi.call(null, idx + 1, cljs.core.rest.call(null, s)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto__ = p.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            return p.call(null, y)
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto__ = p.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            var and__3941__auto____$1 = p.call(null, y);
            if(cljs.core.truth_(and__3941__auto____$1)) {
              return p.call(null, z)
            }else {
              return and__3941__auto____$1
            }
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep1__4 = function() {
        var G__4344__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3941__auto__ = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3941__auto__)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3941__auto__
            }
          }())
        };
        var G__4344 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4344__delegate.call(this, x, y, z, args)
        };
        G__4344.cljs$lang$maxFixedArity = 3;
        G__4344.cljs$lang$applyTo = function(arglist__4345) {
          var x = cljs.core.first(arglist__4345);
          arglist__4345 = cljs.core.next(arglist__4345);
          var y = cljs.core.first(arglist__4345);
          arglist__4345 = cljs.core.next(arglist__4345);
          var z = cljs.core.first(arglist__4345);
          var args = cljs.core.rest(arglist__4345);
          return G__4344__delegate(x, y, z, args)
        };
        G__4344.cljs$core$IFn$_invoke$arity$variadic = G__4344__delegate;
        return G__4344
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$core$IFn$_invoke$arity$0 = ep1__0;
      ep1.cljs$core$IFn$_invoke$arity$1 = ep1__1;
      ep1.cljs$core$IFn$_invoke$arity$2 = ep1__2;
      ep1.cljs$core$IFn$_invoke$arity$3 = ep1__3;
      ep1.cljs$core$IFn$_invoke$arity$variadic = ep1__4.cljs$core$IFn$_invoke$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto__ = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            return p2.call(null, x)
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto__ = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            var and__3941__auto____$1 = p1.call(null, y);
            if(cljs.core.truth_(and__3941__auto____$1)) {
              var and__3941__auto____$2 = p2.call(null, x);
              if(cljs.core.truth_(and__3941__auto____$2)) {
                return p2.call(null, y)
              }else {
                return and__3941__auto____$2
              }
            }else {
              return and__3941__auto____$1
            }
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto__ = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            var and__3941__auto____$1 = p1.call(null, y);
            if(cljs.core.truth_(and__3941__auto____$1)) {
              var and__3941__auto____$2 = p1.call(null, z);
              if(cljs.core.truth_(and__3941__auto____$2)) {
                var and__3941__auto____$3 = p2.call(null, x);
                if(cljs.core.truth_(and__3941__auto____$3)) {
                  var and__3941__auto____$4 = p2.call(null, y);
                  if(cljs.core.truth_(and__3941__auto____$4)) {
                    return p2.call(null, z)
                  }else {
                    return and__3941__auto____$4
                  }
                }else {
                  return and__3941__auto____$3
                }
              }else {
                return and__3941__auto____$2
              }
            }else {
              return and__3941__auto____$1
            }
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep2__4 = function() {
        var G__4346__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3941__auto__ = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3941__auto__)) {
              return cljs.core.every_QMARK_.call(null, function(p1__4328_SHARP_) {
                var and__3941__auto____$1 = p1.call(null, p1__4328_SHARP_);
                if(cljs.core.truth_(and__3941__auto____$1)) {
                  return p2.call(null, p1__4328_SHARP_)
                }else {
                  return and__3941__auto____$1
                }
              }, args)
            }else {
              return and__3941__auto__
            }
          }())
        };
        var G__4346 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4346__delegate.call(this, x, y, z, args)
        };
        G__4346.cljs$lang$maxFixedArity = 3;
        G__4346.cljs$lang$applyTo = function(arglist__4347) {
          var x = cljs.core.first(arglist__4347);
          arglist__4347 = cljs.core.next(arglist__4347);
          var y = cljs.core.first(arglist__4347);
          arglist__4347 = cljs.core.next(arglist__4347);
          var z = cljs.core.first(arglist__4347);
          var args = cljs.core.rest(arglist__4347);
          return G__4346__delegate(x, y, z, args)
        };
        G__4346.cljs$core$IFn$_invoke$arity$variadic = G__4346__delegate;
        return G__4346
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$core$IFn$_invoke$arity$0 = ep2__0;
      ep2.cljs$core$IFn$_invoke$arity$1 = ep2__1;
      ep2.cljs$core$IFn$_invoke$arity$2 = ep2__2;
      ep2.cljs$core$IFn$_invoke$arity$3 = ep2__3;
      ep2.cljs$core$IFn$_invoke$arity$variadic = ep2__4.cljs$core$IFn$_invoke$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto__ = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            var and__3941__auto____$1 = p2.call(null, x);
            if(cljs.core.truth_(and__3941__auto____$1)) {
              return p3.call(null, x)
            }else {
              return and__3941__auto____$1
            }
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto__ = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            var and__3941__auto____$1 = p2.call(null, x);
            if(cljs.core.truth_(and__3941__auto____$1)) {
              var and__3941__auto____$2 = p3.call(null, x);
              if(cljs.core.truth_(and__3941__auto____$2)) {
                var and__3941__auto____$3 = p1.call(null, y);
                if(cljs.core.truth_(and__3941__auto____$3)) {
                  var and__3941__auto____$4 = p2.call(null, y);
                  if(cljs.core.truth_(and__3941__auto____$4)) {
                    return p3.call(null, y)
                  }else {
                    return and__3941__auto____$4
                  }
                }else {
                  return and__3941__auto____$3
                }
              }else {
                return and__3941__auto____$2
              }
            }else {
              return and__3941__auto____$1
            }
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto__ = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            var and__3941__auto____$1 = p2.call(null, x);
            if(cljs.core.truth_(and__3941__auto____$1)) {
              var and__3941__auto____$2 = p3.call(null, x);
              if(cljs.core.truth_(and__3941__auto____$2)) {
                var and__3941__auto____$3 = p1.call(null, y);
                if(cljs.core.truth_(and__3941__auto____$3)) {
                  var and__3941__auto____$4 = p2.call(null, y);
                  if(cljs.core.truth_(and__3941__auto____$4)) {
                    var and__3941__auto____$5 = p3.call(null, y);
                    if(cljs.core.truth_(and__3941__auto____$5)) {
                      var and__3941__auto____$6 = p1.call(null, z);
                      if(cljs.core.truth_(and__3941__auto____$6)) {
                        var and__3941__auto____$7 = p2.call(null, z);
                        if(cljs.core.truth_(and__3941__auto____$7)) {
                          return p3.call(null, z)
                        }else {
                          return and__3941__auto____$7
                        }
                      }else {
                        return and__3941__auto____$6
                      }
                    }else {
                      return and__3941__auto____$5
                    }
                  }else {
                    return and__3941__auto____$4
                  }
                }else {
                  return and__3941__auto____$3
                }
              }else {
                return and__3941__auto____$2
              }
            }else {
              return and__3941__auto____$1
            }
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep3__4 = function() {
        var G__4348__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3941__auto__ = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3941__auto__)) {
              return cljs.core.every_QMARK_.call(null, function(p1__4329_SHARP_) {
                var and__3941__auto____$1 = p1.call(null, p1__4329_SHARP_);
                if(cljs.core.truth_(and__3941__auto____$1)) {
                  var and__3941__auto____$2 = p2.call(null, p1__4329_SHARP_);
                  if(cljs.core.truth_(and__3941__auto____$2)) {
                    return p3.call(null, p1__4329_SHARP_)
                  }else {
                    return and__3941__auto____$2
                  }
                }else {
                  return and__3941__auto____$1
                }
              }, args)
            }else {
              return and__3941__auto__
            }
          }())
        };
        var G__4348 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4348__delegate.call(this, x, y, z, args)
        };
        G__4348.cljs$lang$maxFixedArity = 3;
        G__4348.cljs$lang$applyTo = function(arglist__4349) {
          var x = cljs.core.first(arglist__4349);
          arglist__4349 = cljs.core.next(arglist__4349);
          var y = cljs.core.first(arglist__4349);
          arglist__4349 = cljs.core.next(arglist__4349);
          var z = cljs.core.first(arglist__4349);
          var args = cljs.core.rest(arglist__4349);
          return G__4348__delegate(x, y, z, args)
        };
        G__4348.cljs$core$IFn$_invoke$arity$variadic = G__4348__delegate;
        return G__4348
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$core$IFn$_invoke$arity$0 = ep3__0;
      ep3.cljs$core$IFn$_invoke$arity$1 = ep3__1;
      ep3.cljs$core$IFn$_invoke$arity$2 = ep3__2;
      ep3.cljs$core$IFn$_invoke$arity$3 = ep3__3;
      ep3.cljs$core$IFn$_invoke$arity$variadic = ep3__4.cljs$core$IFn$_invoke$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__4350__delegate = function(p1, p2, p3, ps) {
      var ps__$1 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__4330_SHARP_) {
            return p1__4330_SHARP_.call(null, x)
          }, ps__$1)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__4331_SHARP_) {
            var and__3941__auto__ = p1__4331_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3941__auto__)) {
              return p1__4331_SHARP_.call(null, y)
            }else {
              return and__3941__auto__
            }
          }, ps__$1)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__4332_SHARP_) {
            var and__3941__auto__ = p1__4332_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3941__auto__)) {
              var and__3941__auto____$1 = p1__4332_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3941__auto____$1)) {
                return p1__4332_SHARP_.call(null, z)
              }else {
                return and__3941__auto____$1
              }
            }else {
              return and__3941__auto__
            }
          }, ps__$1)
        };
        var epn__4 = function() {
          var G__4351__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3941__auto__ = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3941__auto__)) {
                return cljs.core.every_QMARK_.call(null, function(p1__4333_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__4333_SHARP_, args)
                }, ps__$1)
              }else {
                return and__3941__auto__
              }
            }())
          };
          var G__4351 = function(x, y, z, var_args) {
            var args = null;
            if(arguments.length > 3) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__4351__delegate.call(this, x, y, z, args)
          };
          G__4351.cljs$lang$maxFixedArity = 3;
          G__4351.cljs$lang$applyTo = function(arglist__4352) {
            var x = cljs.core.first(arglist__4352);
            arglist__4352 = cljs.core.next(arglist__4352);
            var y = cljs.core.first(arglist__4352);
            arglist__4352 = cljs.core.next(arglist__4352);
            var z = cljs.core.first(arglist__4352);
            var args = cljs.core.rest(arglist__4352);
            return G__4351__delegate(x, y, z, args)
          };
          G__4351.cljs$core$IFn$_invoke$arity$variadic = G__4351__delegate;
          return G__4351
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw new Error("Invalid arity: " + arguments.length);
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$core$IFn$_invoke$arity$0 = epn__0;
        epn.cljs$core$IFn$_invoke$arity$1 = epn__1;
        epn.cljs$core$IFn$_invoke$arity$2 = epn__2;
        epn.cljs$core$IFn$_invoke$arity$3 = epn__3;
        epn.cljs$core$IFn$_invoke$arity$variadic = epn__4.cljs$core$IFn$_invoke$arity$variadic;
        return epn
      }()
    };
    var G__4350 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(arguments.length > 3) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4350__delegate.call(this, p1, p2, p3, ps)
    };
    G__4350.cljs$lang$maxFixedArity = 3;
    G__4350.cljs$lang$applyTo = function(arglist__4353) {
      var p1 = cljs.core.first(arglist__4353);
      arglist__4353 = cljs.core.next(arglist__4353);
      var p2 = cljs.core.first(arglist__4353);
      arglist__4353 = cljs.core.next(arglist__4353);
      var p3 = cljs.core.first(arglist__4353);
      var ps = cljs.core.rest(arglist__4353);
      return G__4350__delegate(p1, p2, p3, ps)
    };
    G__4350.cljs$core$IFn$_invoke$arity$variadic = G__4350__delegate;
    return G__4350
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$core$IFn$_invoke$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$core$IFn$_invoke$arity$1 = every_pred__1;
  every_pred.cljs$core$IFn$_invoke$arity$2 = every_pred__2;
  every_pred.cljs$core$IFn$_invoke$arity$3 = every_pred__3;
  every_pred.cljs$core$IFn$_invoke$arity$variadic = every_pred__4.cljs$core$IFn$_invoke$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3943__auto__ = p.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3943__auto__ = p.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = p.call(null, y);
          if(cljs.core.truth_(or__3943__auto____$1)) {
            return or__3943__auto____$1
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__4355__delegate = function(x, y, z, args) {
          var or__3943__auto__ = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3943__auto__)) {
            return or__3943__auto__
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__4355 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4355__delegate.call(this, x, y, z, args)
        };
        G__4355.cljs$lang$maxFixedArity = 3;
        G__4355.cljs$lang$applyTo = function(arglist__4356) {
          var x = cljs.core.first(arglist__4356);
          arglist__4356 = cljs.core.next(arglist__4356);
          var y = cljs.core.first(arglist__4356);
          arglist__4356 = cljs.core.next(arglist__4356);
          var z = cljs.core.first(arglist__4356);
          var args = cljs.core.rest(arglist__4356);
          return G__4355__delegate(x, y, z, args)
        };
        G__4355.cljs$core$IFn$_invoke$arity$variadic = G__4355__delegate;
        return G__4355
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$core$IFn$_invoke$arity$0 = sp1__0;
      sp1.cljs$core$IFn$_invoke$arity$1 = sp1__1;
      sp1.cljs$core$IFn$_invoke$arity$2 = sp1__2;
      sp1.cljs$core$IFn$_invoke$arity$3 = sp1__3;
      sp1.cljs$core$IFn$_invoke$arity$variadic = sp1__4.cljs$core$IFn$_invoke$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3943__auto__ = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3943__auto__ = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = p1.call(null, y);
          if(cljs.core.truth_(or__3943__auto____$1)) {
            return or__3943__auto____$1
          }else {
            var or__3943__auto____$2 = p2.call(null, x);
            if(cljs.core.truth_(or__3943__auto____$2)) {
              return or__3943__auto____$2
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3943__auto__ = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = p1.call(null, y);
          if(cljs.core.truth_(or__3943__auto____$1)) {
            return or__3943__auto____$1
          }else {
            var or__3943__auto____$2 = p1.call(null, z);
            if(cljs.core.truth_(or__3943__auto____$2)) {
              return or__3943__auto____$2
            }else {
              var or__3943__auto____$3 = p2.call(null, x);
              if(cljs.core.truth_(or__3943__auto____$3)) {
                return or__3943__auto____$3
              }else {
                var or__3943__auto____$4 = p2.call(null, y);
                if(cljs.core.truth_(or__3943__auto____$4)) {
                  return or__3943__auto____$4
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__4357__delegate = function(x, y, z, args) {
          var or__3943__auto__ = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3943__auto__)) {
            return or__3943__auto__
          }else {
            return cljs.core.some.call(null, function(p1__4338_SHARP_) {
              var or__3943__auto____$1 = p1.call(null, p1__4338_SHARP_);
              if(cljs.core.truth_(or__3943__auto____$1)) {
                return or__3943__auto____$1
              }else {
                return p2.call(null, p1__4338_SHARP_)
              }
            }, args)
          }
        };
        var G__4357 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4357__delegate.call(this, x, y, z, args)
        };
        G__4357.cljs$lang$maxFixedArity = 3;
        G__4357.cljs$lang$applyTo = function(arglist__4358) {
          var x = cljs.core.first(arglist__4358);
          arglist__4358 = cljs.core.next(arglist__4358);
          var y = cljs.core.first(arglist__4358);
          arglist__4358 = cljs.core.next(arglist__4358);
          var z = cljs.core.first(arglist__4358);
          var args = cljs.core.rest(arglist__4358);
          return G__4357__delegate(x, y, z, args)
        };
        G__4357.cljs$core$IFn$_invoke$arity$variadic = G__4357__delegate;
        return G__4357
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$core$IFn$_invoke$arity$0 = sp2__0;
      sp2.cljs$core$IFn$_invoke$arity$1 = sp2__1;
      sp2.cljs$core$IFn$_invoke$arity$2 = sp2__2;
      sp2.cljs$core$IFn$_invoke$arity$3 = sp2__3;
      sp2.cljs$core$IFn$_invoke$arity$variadic = sp2__4.cljs$core$IFn$_invoke$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3943__auto__ = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = p2.call(null, x);
          if(cljs.core.truth_(or__3943__auto____$1)) {
            return or__3943__auto____$1
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3943__auto__ = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = p2.call(null, x);
          if(cljs.core.truth_(or__3943__auto____$1)) {
            return or__3943__auto____$1
          }else {
            var or__3943__auto____$2 = p3.call(null, x);
            if(cljs.core.truth_(or__3943__auto____$2)) {
              return or__3943__auto____$2
            }else {
              var or__3943__auto____$3 = p1.call(null, y);
              if(cljs.core.truth_(or__3943__auto____$3)) {
                return or__3943__auto____$3
              }else {
                var or__3943__auto____$4 = p2.call(null, y);
                if(cljs.core.truth_(or__3943__auto____$4)) {
                  return or__3943__auto____$4
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3943__auto__ = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = p2.call(null, x);
          if(cljs.core.truth_(or__3943__auto____$1)) {
            return or__3943__auto____$1
          }else {
            var or__3943__auto____$2 = p3.call(null, x);
            if(cljs.core.truth_(or__3943__auto____$2)) {
              return or__3943__auto____$2
            }else {
              var or__3943__auto____$3 = p1.call(null, y);
              if(cljs.core.truth_(or__3943__auto____$3)) {
                return or__3943__auto____$3
              }else {
                var or__3943__auto____$4 = p2.call(null, y);
                if(cljs.core.truth_(or__3943__auto____$4)) {
                  return or__3943__auto____$4
                }else {
                  var or__3943__auto____$5 = p3.call(null, y);
                  if(cljs.core.truth_(or__3943__auto____$5)) {
                    return or__3943__auto____$5
                  }else {
                    var or__3943__auto____$6 = p1.call(null, z);
                    if(cljs.core.truth_(or__3943__auto____$6)) {
                      return or__3943__auto____$6
                    }else {
                      var or__3943__auto____$7 = p2.call(null, z);
                      if(cljs.core.truth_(or__3943__auto____$7)) {
                        return or__3943__auto____$7
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__4359__delegate = function(x, y, z, args) {
          var or__3943__auto__ = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3943__auto__)) {
            return or__3943__auto__
          }else {
            return cljs.core.some.call(null, function(p1__4339_SHARP_) {
              var or__3943__auto____$1 = p1.call(null, p1__4339_SHARP_);
              if(cljs.core.truth_(or__3943__auto____$1)) {
                return or__3943__auto____$1
              }else {
                var or__3943__auto____$2 = p2.call(null, p1__4339_SHARP_);
                if(cljs.core.truth_(or__3943__auto____$2)) {
                  return or__3943__auto____$2
                }else {
                  return p3.call(null, p1__4339_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__4359 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4359__delegate.call(this, x, y, z, args)
        };
        G__4359.cljs$lang$maxFixedArity = 3;
        G__4359.cljs$lang$applyTo = function(arglist__4360) {
          var x = cljs.core.first(arglist__4360);
          arglist__4360 = cljs.core.next(arglist__4360);
          var y = cljs.core.first(arglist__4360);
          arglist__4360 = cljs.core.next(arglist__4360);
          var z = cljs.core.first(arglist__4360);
          var args = cljs.core.rest(arglist__4360);
          return G__4359__delegate(x, y, z, args)
        };
        G__4359.cljs$core$IFn$_invoke$arity$variadic = G__4359__delegate;
        return G__4359
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$core$IFn$_invoke$arity$0 = sp3__0;
      sp3.cljs$core$IFn$_invoke$arity$1 = sp3__1;
      sp3.cljs$core$IFn$_invoke$arity$2 = sp3__2;
      sp3.cljs$core$IFn$_invoke$arity$3 = sp3__3;
      sp3.cljs$core$IFn$_invoke$arity$variadic = sp3__4.cljs$core$IFn$_invoke$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__4361__delegate = function(p1, p2, p3, ps) {
      var ps__$1 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__4340_SHARP_) {
            return p1__4340_SHARP_.call(null, x)
          }, ps__$1)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__4341_SHARP_) {
            var or__3943__auto__ = p1__4341_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3943__auto__)) {
              return or__3943__auto__
            }else {
              return p1__4341_SHARP_.call(null, y)
            }
          }, ps__$1)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__4342_SHARP_) {
            var or__3943__auto__ = p1__4342_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3943__auto__)) {
              return or__3943__auto__
            }else {
              var or__3943__auto____$1 = p1__4342_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3943__auto____$1)) {
                return or__3943__auto____$1
              }else {
                return p1__4342_SHARP_.call(null, z)
              }
            }
          }, ps__$1)
        };
        var spn__4 = function() {
          var G__4362__delegate = function(x, y, z, args) {
            var or__3943__auto__ = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3943__auto__)) {
              return or__3943__auto__
            }else {
              return cljs.core.some.call(null, function(p1__4343_SHARP_) {
                return cljs.core.some.call(null, p1__4343_SHARP_, args)
              }, ps__$1)
            }
          };
          var G__4362 = function(x, y, z, var_args) {
            var args = null;
            if(arguments.length > 3) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__4362__delegate.call(this, x, y, z, args)
          };
          G__4362.cljs$lang$maxFixedArity = 3;
          G__4362.cljs$lang$applyTo = function(arglist__4363) {
            var x = cljs.core.first(arglist__4363);
            arglist__4363 = cljs.core.next(arglist__4363);
            var y = cljs.core.first(arglist__4363);
            arglist__4363 = cljs.core.next(arglist__4363);
            var z = cljs.core.first(arglist__4363);
            var args = cljs.core.rest(arglist__4363);
            return G__4362__delegate(x, y, z, args)
          };
          G__4362.cljs$core$IFn$_invoke$arity$variadic = G__4362__delegate;
          return G__4362
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw new Error("Invalid arity: " + arguments.length);
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$core$IFn$_invoke$arity$0 = spn__0;
        spn.cljs$core$IFn$_invoke$arity$1 = spn__1;
        spn.cljs$core$IFn$_invoke$arity$2 = spn__2;
        spn.cljs$core$IFn$_invoke$arity$3 = spn__3;
        spn.cljs$core$IFn$_invoke$arity$variadic = spn__4.cljs$core$IFn$_invoke$arity$variadic;
        return spn
      }()
    };
    var G__4361 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(arguments.length > 3) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4361__delegate.call(this, p1, p2, p3, ps)
    };
    G__4361.cljs$lang$maxFixedArity = 3;
    G__4361.cljs$lang$applyTo = function(arglist__4364) {
      var p1 = cljs.core.first(arglist__4364);
      arglist__4364 = cljs.core.next(arglist__4364);
      var p2 = cljs.core.first(arglist__4364);
      arglist__4364 = cljs.core.next(arglist__4364);
      var p3 = cljs.core.first(arglist__4364);
      var ps = cljs.core.rest(arglist__4364);
      return G__4361__delegate(p1, p2, p3, ps)
    };
    G__4361.cljs$core$IFn$_invoke$arity$variadic = G__4361__delegate;
    return G__4361
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$core$IFn$_invoke$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$core$IFn$_invoke$arity$1 = some_fn__1;
  some_fn.cljs$core$IFn$_invoke$arity$2 = some_fn__2;
  some_fn.cljs$core$IFn$_invoke$arity$3 = some_fn__3;
  some_fn.cljs$core$IFn$_invoke$arity$variadic = some_fn__4.cljs$core$IFn$_invoke$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, s)) {
          var c = cljs.core.chunk_first.call(null, s);
          var size = cljs.core.count.call(null, c);
          var b = cljs.core.chunk_buffer.call(null, size);
          var n__3120__auto___4365 = size;
          var i_4366 = 0;
          while(true) {
            if(i_4366 < n__3120__auto___4365) {
              cljs.core.chunk_append.call(null, b, f.call(null, cljs.core._nth.call(null, c, i_4366)));
              var G__4367 = i_4366 + 1;
              i_4366 = G__4367;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b), map.call(null, f, cljs.core.chunk_rest.call(null, s)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s)), map.call(null, f, cljs.core.rest.call(null, s)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1 = cljs.core.seq.call(null, c1);
      var s2 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3941__auto__ = s1;
        if(and__3941__auto__) {
          return s2
        }else {
          return and__3941__auto__
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1), cljs.core.first.call(null, s2)), map.call(null, f, cljs.core.rest.call(null, s1), cljs.core.rest.call(null, s2)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1 = cljs.core.seq.call(null, c1);
      var s2 = cljs.core.seq.call(null, c2);
      var s3 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3941__auto__ = s1;
        if(and__3941__auto__) {
          var and__3941__auto____$1 = s2;
          if(and__3941__auto____$1) {
            return s3
          }else {
            return and__3941__auto____$1
          }
        }else {
          return and__3941__auto__
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1), cljs.core.first.call(null, s2), cljs.core.first.call(null, s3)), map.call(null, f, cljs.core.rest.call(null, s1), cljs.core.rest.call(null, s2), cljs.core.rest.call(null, s3)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__4368__delegate = function(f, c1, c2, c3, colls) {
      var step = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss), step.call(null, map.call(null, cljs.core.rest, ss)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__4354_SHARP_) {
        return cljs.core.apply.call(null, f, p1__4354_SHARP_)
      }, step.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__4368 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(arguments.length > 4) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__4368__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__4368.cljs$lang$maxFixedArity = 4;
    G__4368.cljs$lang$applyTo = function(arglist__4369) {
      var f = cljs.core.first(arglist__4369);
      arglist__4369 = cljs.core.next(arglist__4369);
      var c1 = cljs.core.first(arglist__4369);
      arglist__4369 = cljs.core.next(arglist__4369);
      var c2 = cljs.core.first(arglist__4369);
      arglist__4369 = cljs.core.next(arglist__4369);
      var c3 = cljs.core.first(arglist__4369);
      var colls = cljs.core.rest(arglist__4369);
      return G__4368__delegate(f, c1, c2, c3, colls)
    };
    G__4368.cljs$core$IFn$_invoke$arity$variadic = G__4368__delegate;
    return G__4368
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$core$IFn$_invoke$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$core$IFn$_invoke$arity$2 = map__2;
  map.cljs$core$IFn$_invoke$arity$3 = map__3;
  map.cljs$core$IFn$_invoke$arity$4 = map__4;
  map.cljs$core$IFn$_invoke$arity$variadic = map__5.cljs$core$IFn$_invoke$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s), take.call(null, n - 1, cljs.core.rest.call(null, s)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step = function(n__$1, coll__$1) {
    while(true) {
      var s = cljs.core.seq.call(null, coll__$1);
      if(cljs.core.truth_(function() {
        var and__3941__auto__ = n__$1 > 0;
        if(and__3941__auto__) {
          return s
        }else {
          return and__3941__auto__
        }
      }())) {
        var G__4370 = n__$1 - 1;
        var G__4371 = cljs.core.rest.call(null, s);
        n__$1 = G__4370;
        coll__$1 = G__4371;
        continue
      }else {
        return s
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step.call(null, n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  drop_last.cljs$core$IFn$_invoke$arity$1 = drop_last__1;
  drop_last.cljs$core$IFn$_invoke$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s = cljs.core.seq.call(null, coll);
  var lead = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead) {
      var G__4372 = cljs.core.next.call(null, s);
      var G__4373 = cljs.core.next.call(null, lead);
      s = G__4372;
      lead = G__4373;
      continue
    }else {
      return s
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step = function(pred__$1, coll__$1) {
    while(true) {
      var s = cljs.core.seq.call(null, coll__$1);
      if(cljs.core.truth_(function() {
        var and__3941__auto__ = s;
        if(and__3941__auto__) {
          return pred__$1.call(null, cljs.core.first.call(null, s))
        }else {
          return and__3941__auto__
        }
      }())) {
        var G__4374 = pred__$1;
        var G__4375 = cljs.core.rest.call(null, s);
        pred__$1 = G__4374;
        coll__$1 = G__4375;
        continue
      }else {
        return s
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto__ = cljs.core.seq.call(null, coll);
    if(temp__4092__auto__) {
      var s = temp__4092__auto__;
      return cljs.core.concat.call(null, s, cycle.call(null, s))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  repeat.cljs$core$IFn$_invoke$arity$1 = repeat__1;
  repeat.cljs$core$IFn$_invoke$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  repeatedly.cljs$core$IFn$_invoke$arity$1 = repeatedly__1;
  repeatedly.cljs$core$IFn$_invoke$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1 = cljs.core.seq.call(null, c1);
      var s2 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3941__auto__ = s1;
        if(and__3941__auto__) {
          return s2
        }else {
          return and__3941__auto__
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1), cljs.core.cons.call(null, cljs.core.first.call(null, s2), interleave.call(null, cljs.core.rest.call(null, s1), cljs.core.rest.call(null, s2))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__4376__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss)))
        }else {
          return null
        }
      }, null)
    };
    var G__4376 = function(c1, c2, var_args) {
      var colls = null;
      if(arguments.length > 2) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4376__delegate.call(this, c1, c2, colls)
    };
    G__4376.cljs$lang$maxFixedArity = 2;
    G__4376.cljs$lang$applyTo = function(arglist__4377) {
      var c1 = cljs.core.first(arglist__4377);
      arglist__4377 = cljs.core.next(arglist__4377);
      var c2 = cljs.core.first(arglist__4377);
      var colls = cljs.core.rest(arglist__4377);
      return G__4376__delegate(c1, c2, colls)
    };
    G__4376.cljs$core$IFn$_invoke$arity$variadic = G__4376__delegate;
    return G__4376
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$core$IFn$_invoke$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$core$IFn$_invoke$arity$2 = interleave__2;
  interleave.cljs$core$IFn$_invoke$arity$variadic = interleave__3.cljs$core$IFn$_invoke$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat = function cat(coll, colls__$1) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4090__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4090__auto__) {
        var coll__$1 = temp__4090__auto__;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__$1), cat.call(null, cljs.core.rest.call(null, coll__$1), colls__$1))
      }else {
        if(cljs.core.seq.call(null, colls__$1)) {
          return cat.call(null, cljs.core.first.call(null, colls__$1), cljs.core.rest.call(null, colls__$1))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__4378__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__4378 = function(f, coll, var_args) {
      var colls = null;
      if(arguments.length > 2) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4378__delegate.call(this, f, coll, colls)
    };
    G__4378.cljs$lang$maxFixedArity = 2;
    G__4378.cljs$lang$applyTo = function(arglist__4379) {
      var f = cljs.core.first(arglist__4379);
      arglist__4379 = cljs.core.next(arglist__4379);
      var coll = cljs.core.first(arglist__4379);
      var colls = cljs.core.rest(arglist__4379);
      return G__4378__delegate(f, coll, colls)
    };
    G__4378.cljs$core$IFn$_invoke$arity$variadic = G__4378__delegate;
    return G__4378
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$core$IFn$_invoke$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$core$IFn$_invoke$arity$2 = mapcat__2;
  mapcat.cljs$core$IFn$_invoke$arity$variadic = mapcat__3.cljs$core$IFn$_invoke$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto__ = cljs.core.seq.call(null, coll);
    if(temp__4092__auto__) {
      var s = temp__4092__auto__;
      if(cljs.core.chunked_seq_QMARK_.call(null, s)) {
        var c = cljs.core.chunk_first.call(null, s);
        var size = cljs.core.count.call(null, c);
        var b = cljs.core.chunk_buffer.call(null, size);
        var n__3120__auto___4380 = size;
        var i_4381 = 0;
        while(true) {
          if(i_4381 < n__3120__auto___4380) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c, i_4381)))) {
              cljs.core.chunk_append.call(null, b, cljs.core._nth.call(null, c, i_4381))
            }else {
            }
            var G__4382 = i_4381 + 1;
            i_4381 = G__4382;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b), filter.call(null, pred, cljs.core.chunk_rest.call(null, s)))
      }else {
        var f = cljs.core.first.call(null, s);
        var r = cljs.core.rest.call(null, s);
        if(cljs.core.truth_(pred.call(null, f))) {
          return cljs.core.cons.call(null, f, filter.call(null, pred, r))
        }else {
          return filter.call(null, pred, r)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__4383_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__4383_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(!(to == null)) {
    if(function() {
      var G__4385 = to;
      if(G__4385) {
        if(function() {
          var or__3943__auto__ = G__4385.cljs$lang$protocol_mask$partition1$ & 4;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__4385.cljs$core$IEditableCollection$
          }
        }()) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
    }else {
      return cljs.core.reduce.call(null, cljs.core._conj, to, from)
    }
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__4386__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__4386 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(arguments.length > 4) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__4386__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__4386.cljs$lang$maxFixedArity = 4;
    G__4386.cljs$lang$applyTo = function(arglist__4387) {
      var f = cljs.core.first(arglist__4387);
      arglist__4387 = cljs.core.next(arglist__4387);
      var c1 = cljs.core.first(arglist__4387);
      arglist__4387 = cljs.core.next(arglist__4387);
      var c2 = cljs.core.first(arglist__4387);
      arglist__4387 = cljs.core.next(arglist__4387);
      var c3 = cljs.core.first(arglist__4387);
      var colls = cljs.core.rest(arglist__4387);
      return G__4386__delegate(f, c1, c2, c3, colls)
    };
    G__4386.cljs$core$IFn$_invoke$arity$variadic = G__4386__delegate;
    return G__4386
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$core$IFn$_invoke$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$core$IFn$_invoke$arity$2 = mapv__2;
  mapv.cljs$core$IFn$_invoke$arity$3 = mapv__3;
  mapv.cljs$core$IFn$_invoke$arity$4 = mapv__4;
  mapv.cljs$core$IFn$_invoke$arity$variadic = mapv__5.cljs$core$IFn$_invoke$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        var p = cljs.core.take.call(null, n, s);
        if(n === cljs.core.count.call(null, p)) {
          return cljs.core.cons.call(null, p, partition.call(null, n, step, cljs.core.drop.call(null, step, s)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        var p = cljs.core.take.call(null, n, s);
        if(n === cljs.core.count.call(null, p)) {
          return cljs.core.cons.call(null, p, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p, pad)))
        }
      }else {
        return null
      }
    }, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  partition.cljs$core$IFn$_invoke$arity$2 = partition__2;
  partition.cljs$core$IFn$_invoke$arity$3 = partition__3;
  partition.cljs$core$IFn$_invoke$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return get_in.call(null, m, ks, null)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel = cljs.core.lookup_sentinel;
    var m__$1 = m;
    var ks__$1 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__$1) {
        if(!function() {
          var G__4389 = m__$1;
          if(G__4389) {
            if(function() {
              var or__3943__auto__ = G__4389.cljs$lang$protocol_mask$partition0$ & 256;
              if(or__3943__auto__) {
                return or__3943__auto__
              }else {
                return G__4389.cljs$core$ILookup$
              }
            }()) {
              return true
            }else {
              if(!G__4389.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.ILookup, G__4389)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.ILookup, G__4389)
          }
        }()) {
          return not_found
        }else {
          var m__$2 = cljs.core.get.call(null, m__$1, cljs.core.first.call(null, ks__$1), sentinel);
          if(sentinel === m__$2) {
            return not_found
          }else {
            var G__4390 = sentinel;
            var G__4391 = m__$2;
            var G__4392 = cljs.core.next.call(null, ks__$1);
            sentinel = G__4390;
            m__$1 = G__4391;
            ks__$1 = G__4392;
            continue
          }
        }
      }else {
        return m__$1
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  get_in.cljs$core$IFn$_invoke$arity$2 = get_in__2;
  get_in.cljs$core$IFn$_invoke$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__4393, v) {
  var vec__4395 = p__4393;
  var k = cljs.core.nth.call(null, vec__4395, 0, null);
  var ks = cljs.core.nthnext.call(null, vec__4395, 1);
  if(cljs.core.truth_(ks)) {
    return cljs.core.assoc.call(null, m, k, assoc_in.call(null, cljs.core.get.call(null, m, k), ks, v))
  }else {
    return cljs.core.assoc.call(null, m, k, v)
  }
};
cljs.core.update_in = function() {
  var update_in = null;
  var update_in__3 = function(m, p__4396, f) {
    var vec__4406 = p__4396;
    var k = cljs.core.nth.call(null, vec__4406, 0, null);
    var ks = cljs.core.nthnext.call(null, vec__4406, 1);
    if(cljs.core.truth_(ks)) {
      return cljs.core.assoc.call(null, m, k, update_in.call(null, cljs.core.get.call(null, m, k), ks, f))
    }else {
      return cljs.core.assoc.call(null, m, k, f.call(null, cljs.core.get.call(null, m, k)))
    }
  };
  var update_in__4 = function(m, p__4397, f, a) {
    var vec__4407 = p__4397;
    var k = cljs.core.nth.call(null, vec__4407, 0, null);
    var ks = cljs.core.nthnext.call(null, vec__4407, 1);
    if(cljs.core.truth_(ks)) {
      return cljs.core.assoc.call(null, m, k, update_in.call(null, cljs.core.get.call(null, m, k), ks, f, a))
    }else {
      return cljs.core.assoc.call(null, m, k, f.call(null, cljs.core.get.call(null, m, k), a))
    }
  };
  var update_in__5 = function(m, p__4398, f, a, b) {
    var vec__4408 = p__4398;
    var k = cljs.core.nth.call(null, vec__4408, 0, null);
    var ks = cljs.core.nthnext.call(null, vec__4408, 1);
    if(cljs.core.truth_(ks)) {
      return cljs.core.assoc.call(null, m, k, update_in.call(null, cljs.core.get.call(null, m, k), ks, f, a, b))
    }else {
      return cljs.core.assoc.call(null, m, k, f.call(null, cljs.core.get.call(null, m, k), a, b))
    }
  };
  var update_in__6 = function(m, p__4399, f, a, b, c) {
    var vec__4409 = p__4399;
    var k = cljs.core.nth.call(null, vec__4409, 0, null);
    var ks = cljs.core.nthnext.call(null, vec__4409, 1);
    if(cljs.core.truth_(ks)) {
      return cljs.core.assoc.call(null, m, k, update_in.call(null, cljs.core.get.call(null, m, k), ks, f, a, b, c))
    }else {
      return cljs.core.assoc.call(null, m, k, f.call(null, cljs.core.get.call(null, m, k), a, b, c))
    }
  };
  var update_in__7 = function() {
    var G__4411__delegate = function(m, p__4400, f, a, b, c, args) {
      var vec__4410 = p__4400;
      var k = cljs.core.nth.call(null, vec__4410, 0, null);
      var ks = cljs.core.nthnext.call(null, vec__4410, 1);
      if(cljs.core.truth_(ks)) {
        return cljs.core.assoc.call(null, m, k, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k), ks, f, a, b, c, args))
      }else {
        return cljs.core.assoc.call(null, m, k, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k), a, b, c, args))
      }
    };
    var G__4411 = function(m, p__4400, f, a, b, c, var_args) {
      var args = null;
      if(arguments.length > 6) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 6), 0)
      }
      return G__4411__delegate.call(this, m, p__4400, f, a, b, c, args)
    };
    G__4411.cljs$lang$maxFixedArity = 6;
    G__4411.cljs$lang$applyTo = function(arglist__4412) {
      var m = cljs.core.first(arglist__4412);
      arglist__4412 = cljs.core.next(arglist__4412);
      var p__4400 = cljs.core.first(arglist__4412);
      arglist__4412 = cljs.core.next(arglist__4412);
      var f = cljs.core.first(arglist__4412);
      arglist__4412 = cljs.core.next(arglist__4412);
      var a = cljs.core.first(arglist__4412);
      arglist__4412 = cljs.core.next(arglist__4412);
      var b = cljs.core.first(arglist__4412);
      arglist__4412 = cljs.core.next(arglist__4412);
      var c = cljs.core.first(arglist__4412);
      var args = cljs.core.rest(arglist__4412);
      return G__4411__delegate(m, p__4400, f, a, b, c, args)
    };
    G__4411.cljs$core$IFn$_invoke$arity$variadic = G__4411__delegate;
    return G__4411
  }();
  update_in = function(m, p__4400, f, a, b, c, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 3:
        return update_in__3.call(this, m, p__4400, f);
      case 4:
        return update_in__4.call(this, m, p__4400, f, a);
      case 5:
        return update_in__5.call(this, m, p__4400, f, a, b);
      case 6:
        return update_in__6.call(this, m, p__4400, f, a, b, c);
      default:
        return update_in__7.cljs$core$IFn$_invoke$arity$variadic(m, p__4400, f, a, b, c, cljs.core.array_seq(arguments, 6))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  update_in.cljs$lang$maxFixedArity = 6;
  update_in.cljs$lang$applyTo = update_in__7.cljs$lang$applyTo;
  update_in.cljs$core$IFn$_invoke$arity$3 = update_in__3;
  update_in.cljs$core$IFn$_invoke$arity$4 = update_in__4;
  update_in.cljs$core$IFn$_invoke$arity$5 = update_in__5;
  update_in.cljs$core$IFn$_invoke$arity$6 = update_in__6;
  update_in.cljs$core$IFn$_invoke$arity$variadic = update_in__7.cljs$core$IFn$_invoke$arity$variadic;
  return update_in
}();
goog.provide("cljs.core.VectorNode");
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorStr = "cljs.core/VectorNode";
cljs.core.VectorNode.cljs$lang$ctorPrWriter = function(this__2885__auto__, writer__2886__auto__, opts__2887__auto__) {
  return cljs.core._write.call(null, writer__2886__auto__, "cljs.core/VectorNode")
};
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, new Array(32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt = pv.cnt;
  if(cnt < 32) {
    return 0
  }else {
    return cnt - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll = level;
  var ret = node;
  while(true) {
    if(ll === 0) {
      return ret
    }else {
      var embed = ret;
      var r = cljs.core.pv_fresh_node.call(null, edit);
      var _ = cljs.core.pv_aset.call(null, r, 0, embed);
      var G__4413 = ll - 5;
      var G__4414 = r;
      ll = G__4413;
      ret = G__4414;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret = cljs.core.pv_clone_node.call(null, parent);
  var subidx = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret, subidx, tailnode);
    return ret
  }else {
    var child = cljs.core.pv_aget.call(null, parent, subidx);
    if(!(child == null)) {
      var node_to_insert = push_tail.call(null, pv, level - 5, child, tailnode);
      cljs.core.pv_aset.call(null, ret, subidx, node_to_insert);
      return ret
    }else {
      var node_to_insert = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret, subidx, node_to_insert);
      return ret
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3941__auto__ = 0 <= i;
    if(and__3941__auto__) {
      return i < pv.cnt
    }else {
      return and__3941__auto__
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node = pv.root;
      var level = pv.shift;
      while(true) {
        if(level > 0) {
          var G__4415 = cljs.core.pv_aget.call(null, node, i >>> level & 31);
          var G__4416 = level - 5;
          node = G__4415;
          level = G__4416;
          continue
        }else {
          return node.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret, i & 31, val);
    return ret
  }else {
    var subidx = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret, subidx, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx), i, val));
    return ret
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx));
    if(function() {
      var and__3941__auto__ = new_child == null;
      if(and__3941__auto__) {
        return subidx === 0
      }else {
        return and__3941__auto__
      }
    }()) {
      return null
    }else {
      var ret = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret, subidx, new_child);
      return ret
    }
  }else {
    if(subidx === 0) {
      return null
    }else {
      if("\ufdd0:else") {
        var ret = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret, subidx, null);
        return ret
      }else {
        return null
      }
    }
  }
};
goog.provide("cljs.core.PersistentVector");
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorStr = "cljs.core/PersistentVector";
cljs.core.PersistentVector.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var self__ = this;
  return new cljs.core.TransientVector(self__.cnt, self__.shift, cljs.core.tv_editable_root.call(null, self__.root), cljs.core.tv_editable_tail.call(null, self__.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2768__auto__ = self__.__hash;
  if(!(h__2768__auto__ == null)) {
    return h__2768__auto__
  }else {
    var h__2768__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2768__auto____$1;
    return h__2768__auto____$1
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = 0 <= k;
    if(and__3941__auto__) {
      return k < self__.cnt
    }else {
      return and__3941__auto__
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail = self__.tail.slice();
      new_tail[k & 31] = v;
      return new cljs.core.PersistentVector(self__.meta, self__.cnt, self__.shift, self__.root, new_tail, null)
    }else {
      return new cljs.core.PersistentVector(self__.meta, self__.cnt, self__.shift, cljs.core.do_assoc.call(null, coll, self__.shift, self__.root, k, v), self__.tail, null)
    }
  }else {
    if(k === self__.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0:else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(self__.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__4418 = null;
  var G__4418__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__4418__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__4418 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4418__2.call(this, self__, k);
      case 3:
        return G__4418__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__4418
}();
cljs.core.PersistentVector.prototype.apply = function(self__, args4417) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args4417.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var self__ = this;
  var step_init = [0, init];
  var i = 0;
  while(true) {
    if(i < self__.cnt) {
      var arr = cljs.core.array_for.call(null, v, i);
      var len = arr.length;
      var init__$1 = function() {
        var j = 0;
        var init__$1 = step_init[1];
        while(true) {
          if(j < len) {
            var init__$2 = f.call(null, init__$1, j + i, arr[j]);
            if(cljs.core.reduced_QMARK_.call(null, init__$2)) {
              return init__$2
            }else {
              var G__4419 = j + 1;
              var G__4420 = init__$2;
              j = G__4419;
              init__$1 = G__4420;
              continue
            }
          }else {
            step_init[0] = len;
            step_init[1] = init__$1;
            return init__$1
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__$1)) {
        return cljs.core.deref.call(null, init__$1)
      }else {
        var G__4421 = i + step_init[0];
        i = G__4421;
        continue
      }
    }else {
      return step_init[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  if(self__.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail = self__.tail.slice();
    new_tail.push(o);
    return new cljs.core.PersistentVector(self__.meta, self__.cnt + 1, self__.shift, self__.root, new_tail, null)
  }else {
    var root_overflow_QMARK_ = self__.cnt >>> 5 > 1 << self__.shift;
    var new_shift = root_overflow_QMARK_ ? self__.shift + 5 : self__.shift;
    var new_root = root_overflow_QMARK_ ? function() {
      var n_r = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r, 0, self__.root);
      cljs.core.pv_aset.call(null, n_r, 1, cljs.core.new_path.call(null, null, self__.shift, new cljs.core.VectorNode(null, self__.tail)));
      return n_r
    }() : cljs.core.push_tail.call(null, coll, self__.shift, self__.root, new cljs.core.VectorNode(null, self__.tail));
    return new cljs.core.PersistentVector(self__.meta, self__.cnt + 1, new_shift, new_root, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt > 0) {
    return new cljs.core.RSeq(coll, self__.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt === 0) {
    return null
  }else {
    if(self__.cnt < 32) {
      return cljs.core.array_seq.call(null, self__.tail)
    }else {
      if("\ufdd0:else") {
        return cljs.core.chunked_seq.call(null, coll, 0, 0)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, self__.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === self__.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, self__.meta)
    }else {
      if(1 < self__.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(self__.meta, self__.cnt - 1, self__.shift, self__.root, self__.tail.slice(0, -1), null)
      }else {
        if("\ufdd0:else") {
          var new_tail = cljs.core.array_for.call(null, coll, self__.cnt - 2);
          var nr = cljs.core.pop_tail.call(null, coll, self__.shift, self__.root);
          var new_root = nr == null ? cljs.core.PersistentVector.EMPTY_NODE : nr;
          var cnt_1 = self__.cnt - 1;
          if(function() {
            var and__3941__auto__ = 5 < self__.shift;
            if(and__3941__auto__) {
              return cljs.core.pv_aget.call(null, new_root, 1) == null
            }else {
              return and__3941__auto__
            }
          }()) {
            return new cljs.core.PersistentVector(self__.meta, cnt_1, self__.shift - 5, cljs.core.pv_aget.call(null, new_root, 0), new_tail, null)
          }else {
            return new cljs.core.PersistentVector(self__.meta, cnt_1, self__.shift, new_root, new_tail, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var self__ = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentVector(meta__$1, self__.cnt, self__.shift, self__.root, self__.tail, self__.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var self__ = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = 0 <= n;
    if(and__3941__auto__) {
      return n < self__.cnt
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, self__.meta)
};
cljs.core.PersistentVector.EMPTY_NODE = new cljs.core.VectorNode(null, new Array(32));
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l = xs.length;
  var xs__$1 = no_clone ? xs : xs.slice();
  if(l < 32) {
    return new cljs.core.PersistentVector(null, l, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__$1, null)
  }else {
    var node = xs__$1.slice(0, 32);
    var v = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node, null);
    var i = 32;
    var out = cljs.core._as_transient.call(null, v);
    while(true) {
      if(i < l) {
        var G__4422 = i + 1;
        var G__4423 = cljs.core.conj_BANG_.call(null, out, xs__$1[i]);
        i = G__4422;
        out = G__4423;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core._as_transient.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(arguments.length > 0) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__4424) {
    var args = cljs.core.seq(arglist__4424);
    return vector__delegate(args)
  };
  vector.cljs$core$IFn$_invoke$arity$variadic = vector__delegate;
  return vector
}();
goog.provide("cljs.core.ChunkedSeq");
cljs.core.ChunkedSeq = function(vec, node, i, off, meta, __hash) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition0$ = 31719660;
  this.cljs$lang$protocol_mask$partition1$ = 1536
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorStr = "cljs.core/ChunkedSeq";
cljs.core.ChunkedSeq.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2768__auto__ = self__.__hash;
  if(!(h__2768__auto__ == null)) {
    return h__2768__auto__
  }else {
    var h__2768__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2768__auto____$1;
    return h__2768__auto____$1
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  if(self__.off + 1 < self__.node.length) {
    var s = cljs.core.chunked_seq.call(null, self__.vec, self__.node, self__.i, self__.off + 1);
    if(s == null) {
      return null
    }else {
      return s
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return self__.node[self__.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.off + 1 < self__.node.length) {
    var s = cljs.core.chunked_seq.call(null, self__.vec, self__.node, self__.i, self__.off + 1);
    if(s == null) {
      return cljs.core.List.EMPTY
    }else {
      return s
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var self__ = this;
  var l = self__.node.length;
  var s = self__.i + l < cljs.core._count.call(null, self__.vec) ? cljs.core.chunked_seq.call(null, self__.vec, self__.i + l, 0) : null;
  if(s == null) {
    return null
  }else {
    return s
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var self__ = this;
  return cljs.core.chunked_seq.call(null, self__.vec, self__.node, self__.i, self__.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, self__.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.array_chunk.call(null, self__.node, self__.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var self__ = this;
  var l = self__.node.length;
  var s = self__.i + l < cljs.core._count.call(null, self__.vec) ? cljs.core.chunked_seq.call(null, self__.vec, self__.i + l, 0) : null;
  if(s == null) {
    return cljs.core.List.EMPTY
  }else {
    return s
  }
};
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return new cljs.core.ChunkedSeq(vec, cljs.core.array_for.call(null, vec, i), i, off, null, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, null, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta, null)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  chunked_seq.cljs$core$IFn$_invoke$arity$3 = chunked_seq__3;
  chunked_seq.cljs$core$IFn$_invoke$arity$4 = chunked_seq__4;
  chunked_seq.cljs$core$IFn$_invoke$arity$5 = chunked_seq__5;
  return chunked_seq
}();
goog.provide("cljs.core.Subvec");
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorStr = "cljs.core/Subvec";
cljs.core.Subvec.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2768__auto__ = self__.__hash;
  if(!(h__2768__auto__ == null)) {
    return h__2768__auto__
  }else {
    var h__2768__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2768__auto____$1;
    return h__2768__auto____$1
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var self__ = this;
  var v_pos = self__.start + key;
  return cljs.core.build_subvec.call(null, self__.meta, cljs.core.assoc.call(null, self__.v, v_pos, val), self__.start, self__.end > v_pos + 1 ? self__.end : v_pos + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__4426 = null;
  var G__4426__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__4426__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__4426 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4426__2.call(this, self__, k);
      case 3:
        return G__4426__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__4426
}();
cljs.core.Subvec.prototype.apply = function(self__, args4425) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args4425.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.build_subvec.call(null, self__.meta, cljs.core._assoc_n.call(null, self__.v, self__.end, o), self__.start, self__.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start__$1) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, coll, f, start__$1)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  var subvec_seq = function subvec_seq(i) {
    if(i === self__.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, self__.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq.call(null, self__.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.end - self__.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._nth.call(null, self__.v, self__.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  if(self__.start === self__.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return cljs.core.build_subvec.call(null, self__.meta, self__.v, self__.start, self__.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var self__ = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return cljs.core.build_subvec.call(null, meta__$1, self__.v, self__.start, self__.end, self__.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var self__ = this;
  return cljs.core._nth.call(null, self__.v, self__.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var self__ = this;
  return cljs.core._nth.call(null, self__.v, self__.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, self__.meta)
};
cljs.core.build_subvec = function build_subvec(meta, v, start, end, __hash) {
  while(true) {
    if(v instanceof cljs.core.Subvec) {
      var G__4427 = meta;
      var G__4428 = v.v;
      var G__4429 = v.start + start;
      var G__4430 = v.start + end;
      var G__4431 = __hash;
      meta = G__4427;
      v = G__4428;
      start = G__4429;
      end = G__4430;
      __hash = G__4431;
      continue
    }else {
      var c = cljs.core.count.call(null, v);
      if(function() {
        var or__3943__auto__ = start < 0;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = end < 0;
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            var or__3943__auto____$2 = start > c;
            if(or__3943__auto____$2) {
              return or__3943__auto____$2
            }else {
              return end > c
            }
          }
        }
      }()) {
        throw new Error("Index out of bounds");
      }else {
      }
      return new cljs.core.Subvec(meta, v, start, end, __hash)
    }
    break
  }
};
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return cljs.core.build_subvec.call(null, null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  subvec.cljs$core$IFn$_invoke$arity$2 = subvec__2;
  subvec.cljs$core$IFn$_invoke$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret = new Array(32);
  cljs.core.array_copy.call(null, tl, 0, ret, 0, tl.length);
  return ret
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret, subidx, level === 5 ? tail_node : function() {
    var child = cljs.core.pv_aget.call(null, ret, subidx);
    if(!(child == null)) {
      return tv_push_tail.call(null, tv, level - 5, child, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__$1 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__$1, subidx));
    if(function() {
      var and__3941__auto__ = new_child == null;
      if(and__3941__auto__) {
        return subidx === 0
      }else {
        return and__3941__auto__
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__$1, subidx, new_child);
      return node__$1
    }
  }else {
    if(subidx === 0) {
      return null
    }else {
      if("\ufdd0:else") {
        cljs.core.pv_aset.call(null, node__$1, subidx, null);
        return node__$1
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3941__auto__ = 0 <= i;
    if(and__3941__auto__) {
      return i < tv.cnt
    }else {
      return and__3941__auto__
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root = tv.root;
      var node = root;
      var level = tv.shift;
      while(true) {
        if(level > 0) {
          var G__4432 = cljs.core.tv_ensure_editable.call(null, root.edit, cljs.core.pv_aget.call(null, node, i >>> level & 31));
          var G__4433 = level - 5;
          node = G__4432;
          level = G__4433;
          continue
        }else {
          return node.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
goog.provide("cljs.core.TransientVector");
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 88
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorStr = "cljs.core/TransientVector";
cljs.core.TransientVector.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__4435 = null;
  var G__4435__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__4435__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__4435 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4435__2.call(this, self__, k);
      case 3:
        return G__4435__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__4435
}();
cljs.core.TransientVector.prototype.apply = function(self__, args4434) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args4434.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var self__ = this;
  if(self__.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = 0 <= n;
    if(and__3941__auto__) {
      return n < self__.cnt
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  if(self__.root.edit) {
    return self__.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var self__ = this;
  if(self__.root.edit) {
    if(function() {
      var and__3941__auto__ = 0 <= n;
      if(and__3941__auto__) {
        return n < self__.cnt
      }else {
        return and__3941__auto__
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        self__.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root = function go(level, node) {
          var node__$1 = cljs.core.tv_ensure_editable.call(null, self__.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__$1, n & 31, val);
            return node__$1
          }else {
            var subidx = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__$1, subidx, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__$1, subidx)));
            return node__$1
          }
        }.call(null, self__.shift, self__.root);
        self__.root = new_root;
        return tcoll
      }
    }else {
      if(n === self__.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0:else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(self__.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var self__ = this;
  if(self__.root.edit) {
    if(self__.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === self__.cnt) {
        self__.cnt = 0;
        return tcoll
      }else {
        if((self__.cnt - 1 & 31) > 0) {
          self__.cnt = self__.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0:else") {
            var new_tail = cljs.core.editable_array_for.call(null, tcoll, self__.cnt - 2);
            var new_root = function() {
              var nr = cljs.core.tv_pop_tail.call(null, tcoll, self__.shift, self__.root);
              if(!(nr == null)) {
                return nr
              }else {
                return new cljs.core.VectorNode(self__.root.edit, new Array(32))
              }
            }();
            if(function() {
              var and__3941__auto__ = 5 < self__.shift;
              if(and__3941__auto__) {
                return cljs.core.pv_aget.call(null, new_root, 1) == null
              }else {
                return and__3941__auto__
              }
            }()) {
              var new_root__$1 = cljs.core.tv_ensure_editable.call(null, self__.root.edit, cljs.core.pv_aget.call(null, new_root, 0));
              self__.root = new_root__$1;
              self__.shift = self__.shift - 5;
              self__.cnt = self__.cnt - 1;
              self__.tail = new_tail;
              return tcoll
            }else {
              self__.root = new_root;
              self__.cnt = self__.cnt - 1;
              self__.tail = new_tail;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var self__ = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var self__ = this;
  if(self__.root.edit) {
    if(self__.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      self__.tail[self__.cnt & 31] = o;
      self__.cnt = self__.cnt + 1;
      return tcoll
    }else {
      var tail_node = new cljs.core.VectorNode(self__.root.edit, self__.tail);
      var new_tail = new Array(32);
      new_tail[0] = o;
      self__.tail = new_tail;
      if(self__.cnt >>> 5 > 1 << self__.shift) {
        var new_root_array = new Array(32);
        var new_shift = self__.shift + 5;
        new_root_array[0] = self__.root;
        new_root_array[1] = cljs.core.new_path.call(null, self__.root.edit, self__.shift, tail_node);
        self__.root = new cljs.core.VectorNode(self__.root.edit, new_root_array);
        self__.shift = new_shift;
        self__.cnt = self__.cnt + 1;
        return tcoll
      }else {
        var new_root = cljs.core.tv_push_tail.call(null, tcoll, self__.shift, self__.root, tail_node);
        self__.root = new_root;
        self__.cnt = self__.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var self__ = this;
  if(self__.root.edit) {
    self__.root.edit = null;
    var len = self__.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail = new Array(len);
    cljs.core.array_copy.call(null, self__.tail, 0, trimmed_tail, 0, len);
    return new cljs.core.PersistentVector(null, self__.cnt, self__.shift, self__.root, trimmed_tail, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
goog.provide("cljs.core.PersistentQueueSeq");
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorStr = "cljs.core/PersistentQueueSeq";
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2768__auto__ = self__.__hash;
  if(!(h__2768__auto__ == null)) {
    return h__2768__auto__
  }else {
    var h__2768__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2768__auto____$1;
    return h__2768__auto____$1
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.first.call(null, self__.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  var temp__4090__auto__ = cljs.core.next.call(null, self__.front);
  if(temp__4090__auto__) {
    var f1 = temp__4090__auto__;
    return new cljs.core.PersistentQueueSeq(self__.meta, f1, self__.rear, null)
  }else {
    if(self__.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(self__.meta, self__.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentQueueSeq(meta__$1, self__.front, self__.rear, self__.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
goog.provide("cljs.core.PersistentQueue");
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorStr = "cljs.core/PersistentQueue";
cljs.core.PersistentQueue.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2768__auto__ = self__.__hash;
  if(!(h__2768__auto__ == null)) {
    return h__2768__auto__
  }else {
    var h__2768__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2768__auto____$1;
    return h__2768__auto____$1
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  if(cljs.core.truth_(self__.front)) {
    return new cljs.core.PersistentQueue(self__.meta, self__.count + 1, self__.front, cljs.core.conj.call(null, function() {
      var or__3943__auto__ = self__.rear;
      if(cljs.core.truth_(or__3943__auto__)) {
        return or__3943__auto__
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(self__.meta, self__.count + 1, cljs.core.conj.call(null, self__.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  var rear__$1 = cljs.core.seq.call(null, self__.rear);
  if(cljs.core.truth_(function() {
    var or__3943__auto__ = self__.front;
    if(cljs.core.truth_(or__3943__auto__)) {
      return or__3943__auto__
    }else {
      return rear__$1
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, self__.front, cljs.core.seq.call(null, rear__$1), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.first.call(null, self__.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  if(cljs.core.truth_(self__.front)) {
    var temp__4090__auto__ = cljs.core.next.call(null, self__.front);
    if(temp__4090__auto__) {
      var f1 = temp__4090__auto__;
      return new cljs.core.PersistentQueue(self__.meta, self__.count - 1, f1, self__.rear, null)
    }else {
      return new cljs.core.PersistentQueue(self__.meta, self__.count - 1, cljs.core.seq.call(null, self__.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.first.call(null, self__.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentQueue(meta__$1, self__.count, self__.front, self__.rear, self__.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
goog.provide("cljs.core.NeverEquiv");
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorStr = "cljs.core/NeverEquiv";
cljs.core.NeverEquiv.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var self__ = this;
  return false
};
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core.get.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len = array.length;
  var i = 0;
  while(true) {
    if(i < len) {
      if(k === array[i]) {
        return i
      }else {
        var G__4436 = i + incr;
        i = G__4436;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__$1 = cljs.core.hash.call(null, a);
  var b__$1 = cljs.core.hash.call(null, b);
  if(a__$1 < b__$1) {
    return-1
  }else {
    if(a__$1 > b__$1) {
      return 1
    }else {
      if("\ufdd0:else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks = m.keys;
  var len = ks.length;
  var so = m.strobj;
  var mm = cljs.core.meta.call(null, m);
  var i = 0;
  var out = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i < len) {
      var k__$1 = ks[i];
      var G__4437 = i + 1;
      var G__4438 = cljs.core.assoc_BANG_.call(null, out, k__$1, so[k__$1]);
      i = G__4437;
      out = G__4438;
      continue
    }else {
      return cljs.core.with_meta.call(null, cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out, k, v)), mm)
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj = {};
  var l = ks.length;
  var i_4440 = 0;
  while(true) {
    if(i_4440 < l) {
      var k_4441 = ks[i_4440];
      new_obj[k_4441] = obj[k_4441];
      var G__4442 = i_4440 + 1;
      i_4440 = G__4442;
      continue
    }else {
    }
    break
  }
  return new_obj
};
goog.provide("cljs.core.ObjMap");
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorStr = "cljs.core/ObjMap";
cljs.core.ObjMap.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2768__auto__ = self__.__hash;
  if(!(h__2768__auto__ == null)) {
    return h__2768__auto__
  }else {
    var h__2768__auto____$1 = cljs.core.hash_imap.call(null, coll);
    self__.__hash = h__2768__auto____$1;
    return h__2768__auto____$1
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = goog.isString(k);
    if(and__3941__auto__) {
      return!(cljs.core.scan_array.call(null, 1, k, self__.keys) == null)
    }else {
      return and__3941__auto__
    }
  }()) {
    return self__.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3943__auto__ = self__.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return self__.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, self__.keys) == null)) {
        var new_strobj = cljs.core.obj_clone.call(null, self__.strobj, self__.keys);
        new_strobj[k] = v;
        return new cljs.core.ObjMap(self__.meta, self__.keys, new_strobj, self__.update_count + 1, null)
      }else {
        var new_strobj = cljs.core.obj_clone.call(null, self__.strobj, self__.keys);
        var new_keys = self__.keys.slice();
        new_strobj[k] = v;
        new_keys.push(k);
        return new cljs.core.ObjMap(self__.meta, new_keys, new_strobj, self__.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = goog.isString(k);
    if(and__3941__auto__) {
      return!(cljs.core.scan_array.call(null, 1, k, self__.keys) == null)
    }else {
      return and__3941__auto__
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__4444 = null;
  var G__4444__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__4444__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__4444 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4444__2.call(this, self__, k);
      case 3:
        return G__4444__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__4444
}();
cljs.core.ObjMap.prototype.apply = function(self__, args4443) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args4443.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var self__ = this;
  var len = self__.keys.length;
  var keys__$1 = self__.keys.sort(cljs.core.obj_map_compare_keys);
  var init__$1 = init;
  while(true) {
    if(cljs.core.seq.call(null, keys__$1)) {
      var k = cljs.core.first.call(null, keys__$1);
      var init__$2 = f.call(null, init__$1, k, self__.strobj[k]);
      if(cljs.core.reduced_QMARK_.call(null, init__$2)) {
        return cljs.core.deref.call(null, init__$2)
      }else {
        var G__4445 = cljs.core.rest.call(null, keys__$1);
        var G__4446 = init__$2;
        keys__$1 = G__4445;
        init__$1 = G__4446;
        continue
      }
    }else {
      return init__$1
    }
    break
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var self__ = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__4439_SHARP_) {
      return cljs.core.vector.call(null, p1__4439_SHARP_, self__.strobj[p1__4439_SHARP_])
    }, self__.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.ObjMap(meta__$1, self__.keys, self__.strobj, self__.update_count, self__.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, self__.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = goog.isString(k);
    if(and__3941__auto__) {
      return!(cljs.core.scan_array.call(null, 1, k, self__.keys) == null)
    }else {
      return and__3941__auto__
    }
  }()) {
    var new_keys = self__.keys.slice();
    var new_strobj = cljs.core.obj_clone.call(null, self__.strobj, self__.keys);
    new_keys.splice(cljs.core.scan_array.call(null, 1, k, new_keys), 1);
    delete new_strobj[k];
    return new cljs.core.ObjMap(self__.meta, new_keys, new_strobj, self__.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 8;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.array_map_index_of_nil_QMARK_ = function array_map_index_of_nil_QMARK_(arr, m, k) {
  var len = arr.length;
  var i = 0;
  while(true) {
    if(len <= i) {
      return-1
    }else {
      if(arr[i] == null) {
        return i
      }else {
        if("\ufdd0:else") {
          var G__4447 = i + 2;
          i = G__4447;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.array_map_index_of_symbol_QMARK_ = function array_map_index_of_symbol_QMARK_(arr, m, k) {
  var len = arr.length;
  var kstr = k.str;
  var i = 0;
  while(true) {
    if(len <= i) {
      return-1
    }else {
      if(function() {
        var k_SINGLEQUOTE_ = arr[i];
        var and__3941__auto__ = k_SINGLEQUOTE_ instanceof cljs.core.Symbol;
        if(and__3941__auto__) {
          return kstr === k_SINGLEQUOTE_.str
        }else {
          return and__3941__auto__
        }
      }()) {
        return i
      }else {
        if("\ufdd0:else") {
          var G__4448 = i + 2;
          i = G__4448;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.array_map_index_of_identical_QMARK_ = function array_map_index_of_identical_QMARK_(arr, m, k) {
  var len = arr.length;
  var i = 0;
  while(true) {
    if(len <= i) {
      return-1
    }else {
      if(k === arr[i]) {
        return i
      }else {
        if("\ufdd0:else") {
          var G__4449 = i + 2;
          i = G__4449;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.array_map_index_of_equiv_QMARK_ = function array_map_index_of_equiv_QMARK_(arr, m, k) {
  var len = arr.length;
  var i = 0;
  while(true) {
    if(len <= i) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, k, arr[i])) {
        return i
      }else {
        if("\ufdd0:else") {
          var G__4450 = i + 2;
          i = G__4450;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr = m.arr;
  if(function() {
    var or__3943__auto__ = goog.isString(k);
    if(or__3943__auto__) {
      return or__3943__auto__
    }else {
      return typeof k === "number"
    }
  }()) {
    return cljs.core.array_map_index_of_identical_QMARK_.call(null, arr, m, k)
  }else {
    if(k instanceof cljs.core.Symbol) {
      return cljs.core.array_map_index_of_symbol_QMARK_.call(null, arr, m, k)
    }else {
      if(k == null) {
        return cljs.core.array_map_index_of_nil_QMARK_.call(null, arr, m, k)
      }else {
        if("\ufdd0:else") {
          return cljs.core.array_map_index_of_equiv_QMARK_.call(null, arr, m, k)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.array_map_extend_kv = function array_map_extend_kv(m, k, v) {
  var arr = m.arr;
  var l = arr.length;
  var narr = new Array(l + 2);
  var i_4451 = 0;
  while(true) {
    if(i_4451 < l) {
      narr[i_4451] = arr[i_4451];
      var G__4452 = i_4451 + 1;
      i_4451 = G__4452;
      continue
    }else {
    }
    break
  }
  narr[l] = k;
  narr[l + 1] = v;
  return narr
};
goog.provide("cljs.core.PersistentArrayMap");
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorStr = "cljs.core/PersistentArrayMap";
cljs.core.PersistentArrayMap.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var self__ = this;
  return new cljs.core.TransientArrayMap({}, self__.arr.length, self__.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2768__auto__ = self__.__hash;
  if(!(h__2768__auto__ == null)) {
    return h__2768__auto__
  }else {
    var h__2768__auto____$1 = cljs.core.hash_imap.call(null, coll);
    self__.__hash = h__2768__auto____$1;
    return h__2768__auto____$1
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  var idx = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx === -1) {
    return not_found
  }else {
    return self__.arr[idx + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  var idx = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx === -1) {
    if(self__.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      var arr__$1 = cljs.core.array_map_extend_kv.call(null, coll, k, v);
      return new cljs.core.PersistentArrayMap(self__.meta, self__.cnt + 1, arr__$1, null)
    }else {
      return cljs.core._with_meta.call(null, cljs.core._assoc.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll), k, v), self__.meta)
    }
  }else {
    if(v === self__.arr[idx + 1]) {
      return coll
    }else {
      if("\ufdd0:else") {
        var arr__$1 = function() {
          var G__4454 = self__.arr.slice();
          G__4454[idx + 1] = v;
          return G__4454
        }();
        return new cljs.core.PersistentArrayMap(self__.meta, self__.cnt, arr__$1, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var self__ = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__4455 = null;
  var G__4455__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__4455__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__4455 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4455__2.call(this, self__, k);
      case 3:
        return G__4455__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__4455
}();
cljs.core.PersistentArrayMap.prototype.apply = function(self__, args4453) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args4453.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var self__ = this;
  var len = self__.arr.length;
  var i = 0;
  var init__$1 = init;
  while(true) {
    if(i < len) {
      var init__$2 = f.call(null, init__$1, self__.arr[i], self__.arr[i + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__$2)) {
        return cljs.core.deref.call(null, init__$2)
      }else {
        var G__4456 = i + 2;
        var G__4457 = init__$2;
        i = G__4456;
        init__$1 = G__4457;
        continue
      }
    }else {
      return init__$1
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var self__ = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt > 0) {
    var len = self__.arr.length;
    var array_map_seq = function(len) {
      return function array_map_seq(i) {
        return new cljs.core.LazySeq(null, false, function(len) {
          return function() {
            if(i < len) {
              return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([self__.arr[i], self__.arr[i + 1]], true), array_map_seq.call(null, i + 2))
            }else {
              return null
            }
          }
        }(len), null)
      }
    }(len);
    return array_map_seq.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentArrayMap(meta__$1, self__.cnt, self__.arr, self__.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, self__.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var self__ = this;
  var idx = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx >= 0) {
    var len = self__.arr.length;
    var new_len = len - 2;
    if(new_len === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr = new Array(new_len);
      var s = 0;
      var d = 0;
      while(true) {
        if(s >= len) {
          return new cljs.core.PersistentArrayMap(self__.meta, self__.cnt - 1, new_arr, null)
        }else {
          if(cljs.core._EQ_.call(null, k, self__.arr[s])) {
            var G__4458 = s + 2;
            var G__4459 = d;
            s = G__4458;
            d = G__4459;
            continue
          }else {
            if("\ufdd0:else") {
              new_arr[d] = self__.arr[s];
              new_arr[d + 1] = self__.arr[s + 1];
              var G__4460 = s + 2;
              var G__4461 = d + 2;
              s = G__4460;
              d = G__4461;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 8;
cljs.core.PersistentArrayMap.fromArray = function(arr, no_clone) {
  var arr__$1 = no_clone ? arr : arr.slice();
  var cnt = arr__$1.length / 2;
  return new cljs.core.PersistentArrayMap(null, cnt, arr__$1, null)
};
goog.provide("cljs.core.TransientArrayMap");
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 56;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorStr = "cljs.core/TransientArrayMap";
cljs.core.TransientArrayMap.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var self__ = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    var idx = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx >= 0) {
      self__.arr[idx] = self__.arr[self__.len - 2];
      self__.arr[idx + 1] = self__.arr[self__.len - 1];
      var G__4462_4464 = self__.arr;
      G__4462_4464.pop();
      G__4462_4464.pop();
      self__.len = self__.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var self__ = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    var idx = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx === -1) {
      if(self__.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        self__.len = self__.len + 2;
        self__.arr.push(key);
        self__.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, self__.len, self__.arr), key, val)
      }
    }else {
      if(val === self__.arr[idx + 1]) {
        return tcoll
      }else {
        self__.arr[idx + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var self__ = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    if(function() {
      var G__4463 = o;
      if(G__4463) {
        if(function() {
          var or__3943__auto__ = G__4463.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__4463.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__4463.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__4463)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__4463)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es = cljs.core.seq.call(null, o);
      var tcoll__$1 = tcoll;
      while(true) {
        var temp__4090__auto__ = cljs.core.first.call(null, es);
        if(cljs.core.truth_(temp__4090__auto__)) {
          var e = temp__4090__auto__;
          var G__4465 = cljs.core.next.call(null, es);
          var G__4466 = tcoll__$1.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__$1, cljs.core.key.call(null, e), cljs.core.val.call(null, e));
          es = G__4465;
          tcoll__$1 = G__4466;
          continue
        }else {
          return tcoll__$1
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var self__ = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    self__.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, self__.len, 2), self__.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var self__ = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var self__ = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    var idx = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx === -1) {
      return not_found
    }else {
      return self__.arr[idx + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var self__ = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    return cljs.core.quot.call(null, self__.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i = 0;
  while(true) {
    if(i < len) {
      var G__4467 = cljs.core.assoc_BANG_.call(null, out, arr[i], arr[i + 1]);
      var G__4468 = i + 2;
      out = G__4467;
      i = G__4468;
      continue
    }else {
      return out
    }
    break
  }
};
goog.provide("cljs.core.Box");
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorStr = "cljs.core/Box";
cljs.core.Box.cljs$lang$ctorPrWriter = function(this__2885__auto__, writer__2886__auto__, opts__2887__auto__) {
  return cljs.core._write.call(null, writer__2886__auto__, "cljs.core/Box")
};
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.call(null, key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__4471 = arr.slice();
    G__4471[i] = a;
    return G__4471
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__4472 = arr.slice();
    G__4472[i] = a;
    G__4472[j] = b;
    return G__4472
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  clone_and_set.cljs$core$IFn$_invoke$arity$3 = clone_and_set__3;
  clone_and_set.cljs$core$IFn$_invoke$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr = new Array(arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr, 2 * i, new_arr.length - 2 * i);
  return new_arr
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable = inode.ensure_editable(edit);
    editable.arr[i] = a;
    return editable
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable = inode.ensure_editable(edit);
    editable.arr[i] = a;
    editable.arr[j] = b;
    return editable
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  edit_and_set.cljs$core$IFn$_invoke$arity$4 = edit_and_set__4;
  edit_and_set.cljs$core$IFn$_invoke$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len = arr.length;
  var i = 0;
  var init__$1 = init;
  while(true) {
    if(i < len) {
      var init__$2 = function() {
        var k = arr[i];
        if(!(k == null)) {
          return f.call(null, init__$1, k, arr[i + 1])
        }else {
          var node = arr[i + 1];
          if(!(node == null)) {
            return node.kv_reduce(f, init__$1)
          }else {
            return init__$1
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__$2)) {
        return cljs.core.deref.call(null, init__$2)
      }else {
        var G__4473 = i + 2;
        var G__4474 = init__$2;
        i = G__4473;
        init__$1 = G__4474;
        continue
      }
    }else {
      return init__$1
    }
    break
  }
};
goog.provide("cljs.core.BitmapIndexedNode");
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorStr = "cljs.core/BitmapIndexedNode";
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var self__ = this;
  var inode = this;
  if(self__.bitmap === bit) {
    return null
  }else {
    var editable = inode.ensure_editable(e);
    var earr = editable.arr;
    var len = earr.length;
    editable.bitmap = bit ^ editable.bitmap;
    cljs.core.array_copy.call(null, earr, 2 * (i + 1), earr, 2 * i, len - 2 * (i + 1));
    earr[len - 2] = null;
    earr[len - 1] = null;
    return editable
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit__$1, shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  var idx = cljs.core.bitmap_indexed_node_index.call(null, self__.bitmap, bit);
  if((self__.bitmap & bit) === 0) {
    var n = cljs.core.bit_count.call(null, self__.bitmap);
    if(2 * n < self__.arr.length) {
      var editable = inode.ensure_editable(edit__$1);
      var earr = editable.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr, 2 * idx, earr, 2 * (idx + 1), 2 * (n - idx));
      earr[2 * idx] = key;
      earr[2 * idx + 1] = val;
      editable.bitmap = editable.bitmap | bit;
      return editable
    }else {
      if(n >= 16) {
        var nodes = new Array(32);
        var jdx = hash >>> shift & 31;
        nodes[jdx] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit__$1, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i_4475 = 0;
        var j_4476 = 0;
        while(true) {
          if(i_4475 < 32) {
            if((self__.bitmap >>> i_4475 & 1) === 0) {
              var G__4477 = i_4475 + 1;
              var G__4478 = j_4476;
              i_4475 = G__4477;
              j_4476 = G__4478;
              continue
            }else {
              nodes[i_4475] = !(self__.arr[j_4476] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit__$1, shift + 5, cljs.core.hash.call(null, self__.arr[j_4476]), self__.arr[j_4476], self__.arr[j_4476 + 1], added_leaf_QMARK_) : self__.arr[j_4476 + 1];
              var G__4479 = i_4475 + 1;
              var G__4480 = j_4476 + 2;
              i_4475 = G__4479;
              j_4476 = G__4480;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit__$1, n + 1, nodes)
      }else {
        if("\ufdd0:else") {
          var new_arr = new Array(2 * (n + 4));
          cljs.core.array_copy.call(null, self__.arr, 0, new_arr, 0, 2 * idx);
          new_arr[2 * idx] = key;
          new_arr[2 * idx + 1] = val;
          cljs.core.array_copy.call(null, self__.arr, 2 * idx, new_arr, 2 * (idx + 1), 2 * (n - idx));
          added_leaf_QMARK_.val = true;
          var editable = inode.ensure_editable(edit__$1);
          editable.arr = new_arr;
          editable.bitmap = editable.bitmap | bit;
          return editable
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      var n = val_or_node.inode_assoc_BANG_(edit__$1, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n === val_or_node) {
        return inode
      }else {
        return cljs.core.edit_and_set.call(null, inode, edit__$1, 2 * idx + 1, n)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil)) {
        if(val === val_or_node) {
          return inode
        }else {
          return cljs.core.edit_and_set.call(null, inode, edit__$1, 2 * idx + 1, val)
        }
      }else {
        if("\ufdd0:else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode, edit__$1, 2 * idx, null, 2 * idx + 1, cljs.core.create_node.call(null, edit__$1, shift + 5, key_or_nil, val_or_node, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var self__ = this;
  var inode = this;
  return cljs.core.create_inode_seq.call(null, self__.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit__$1, shift, hash, key, removed_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  if((self__.bitmap & bit) === 0) {
    return inode
  }else {
    var idx = cljs.core.bitmap_indexed_node_index.call(null, self__.bitmap, bit);
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      var n = val_or_node.inode_without_BANG_(edit__$1, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n === val_or_node) {
        return inode
      }else {
        if(!(n == null)) {
          return cljs.core.edit_and_set.call(null, inode, edit__$1, 2 * idx + 1, n)
        }else {
          if(self__.bitmap === bit) {
            return null
          }else {
            if("\ufdd0:else") {
              return inode.edit_and_remove_pair(edit__$1, bit, idx)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil)) {
        removed_leaf_QMARK_[0] = true;
        return inode.edit_and_remove_pair(edit__$1, bit, idx)
      }else {
        if("\ufdd0:else") {
          return inode
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var self__ = this;
  var inode = this;
  if(e === self__.edit) {
    return inode
  }else {
    var n = cljs.core.bit_count.call(null, self__.bitmap);
    var new_arr = new Array(n < 0 ? 4 : 2 * (n + 1));
    cljs.core.array_copy.call(null, self__.arr, 0, new_arr, 0, 2 * n);
    return new cljs.core.BitmapIndexedNode(e, self__.bitmap, new_arr)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var self__ = this;
  var inode = this;
  return cljs.core.inode_kv_reduce.call(null, self__.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  if((self__.bitmap & bit) === 0) {
    return not_found
  }else {
    var idx = cljs.core.bitmap_indexed_node_index.call(null, self__.bitmap, bit);
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      return val_or_node.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil, val_or_node], true)
      }else {
        if("\ufdd0:else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  if((self__.bitmap & bit) === 0) {
    return inode
  }else {
    var idx = cljs.core.bitmap_indexed_node_index.call(null, self__.bitmap, bit);
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      var n = val_or_node.inode_without(shift + 5, hash, key);
      if(n === val_or_node) {
        return inode
      }else {
        if(!(n == null)) {
          return new cljs.core.BitmapIndexedNode(null, self__.bitmap, cljs.core.clone_and_set.call(null, self__.arr, 2 * idx + 1, n))
        }else {
          if(self__.bitmap === bit) {
            return null
          }else {
            if("\ufdd0:else") {
              return new cljs.core.BitmapIndexedNode(null, self__.bitmap ^ bit, cljs.core.remove_pair.call(null, self__.arr, idx))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil)) {
        return new cljs.core.BitmapIndexedNode(null, self__.bitmap ^ bit, cljs.core.remove_pair.call(null, self__.arr, idx))
      }else {
        if("\ufdd0:else") {
          return inode
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  var idx = cljs.core.bitmap_indexed_node_index.call(null, self__.bitmap, bit);
  if((self__.bitmap & bit) === 0) {
    var n = cljs.core.bit_count.call(null, self__.bitmap);
    if(n >= 16) {
      var nodes = new Array(32);
      var jdx = hash >>> shift & 31;
      nodes[jdx] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i_4481 = 0;
      var j_4482 = 0;
      while(true) {
        if(i_4481 < 32) {
          if((self__.bitmap >>> i_4481 & 1) === 0) {
            var G__4483 = i_4481 + 1;
            var G__4484 = j_4482;
            i_4481 = G__4483;
            j_4482 = G__4484;
            continue
          }else {
            nodes[i_4481] = !(self__.arr[j_4482] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, self__.arr[j_4482]), self__.arr[j_4482], self__.arr[j_4482 + 1], added_leaf_QMARK_) : self__.arr[j_4482 + 1];
            var G__4485 = i_4481 + 1;
            var G__4486 = j_4482 + 2;
            i_4481 = G__4485;
            j_4482 = G__4486;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n + 1, nodes)
    }else {
      var new_arr = new Array(2 * (n + 1));
      cljs.core.array_copy.call(null, self__.arr, 0, new_arr, 0, 2 * idx);
      new_arr[2 * idx] = key;
      new_arr[2 * idx + 1] = val;
      cljs.core.array_copy.call(null, self__.arr, 2 * idx, new_arr, 2 * (idx + 1), 2 * (n - idx));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, self__.bitmap | bit, new_arr)
    }
  }else {
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      var n = val_or_node.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n === val_or_node) {
        return inode
      }else {
        return new cljs.core.BitmapIndexedNode(null, self__.bitmap, cljs.core.clone_and_set.call(null, self__.arr, 2 * idx + 1, n))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil)) {
        if(val === val_or_node) {
          return inode
        }else {
          return new cljs.core.BitmapIndexedNode(null, self__.bitmap, cljs.core.clone_and_set.call(null, self__.arr, 2 * idx + 1, val))
        }
      }else {
        if("\ufdd0:else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, self__.bitmap, cljs.core.clone_and_set.call(null, self__.arr, 2 * idx, null, 2 * idx + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil, val_or_node, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  if((self__.bitmap & bit) === 0) {
    return not_found
  }else {
    var idx = cljs.core.bitmap_indexed_node_index.call(null, self__.bitmap, bit);
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      return val_or_node.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil)) {
        return val_or_node
      }else {
        if("\ufdd0:else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, new Array(0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr = array_node.arr;
  var len = 2 * (array_node.cnt - 1);
  var new_arr = new Array(len);
  var i = 0;
  var j = 1;
  var bitmap = 0;
  while(true) {
    if(i < len) {
      if(function() {
        var and__3941__auto__ = !(i === idx);
        if(and__3941__auto__) {
          return!(arr[i] == null)
        }else {
          return and__3941__auto__
        }
      }()) {
        new_arr[j] = arr[i];
        var G__4487 = i + 1;
        var G__4488 = j + 2;
        var G__4489 = bitmap | 1 << i;
        i = G__4487;
        j = G__4488;
        bitmap = G__4489;
        continue
      }else {
        var G__4490 = i + 1;
        var G__4491 = j;
        var G__4492 = bitmap;
        i = G__4490;
        j = G__4491;
        bitmap = G__4492;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap, new_arr)
    }
    break
  }
};
goog.provide("cljs.core.ArrayNode");
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorStr = "cljs.core/ArrayNode";
cljs.core.ArrayNode.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit__$1, shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(node == null) {
    var editable = cljs.core.edit_and_set.call(null, inode, edit__$1, idx, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit__$1, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable.cnt = editable.cnt + 1;
    return editable
  }else {
    var n = node.inode_assoc_BANG_(edit__$1, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n === node) {
      return inode
    }else {
      return cljs.core.edit_and_set.call(null, inode, edit__$1, idx, n)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var self__ = this;
  var inode = this;
  return cljs.core.create_array_node_seq.call(null, self__.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit__$1, shift, hash, key, removed_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(node == null) {
    return inode
  }else {
    var n = node.inode_without_BANG_(edit__$1, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n === node) {
      return inode
    }else {
      if(n == null) {
        if(self__.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode, edit__$1, idx)
        }else {
          var editable = cljs.core.edit_and_set.call(null, inode, edit__$1, idx, n);
          editable.cnt = editable.cnt - 1;
          return editable
        }
      }else {
        if("\ufdd0:else") {
          return cljs.core.edit_and_set.call(null, inode, edit__$1, idx, n)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var self__ = this;
  var inode = this;
  if(e === self__.edit) {
    return inode
  }else {
    return new cljs.core.ArrayNode(e, self__.cnt, self__.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var self__ = this;
  var inode = this;
  var len = self__.arr.length;
  var i = 0;
  var init__$1 = init;
  while(true) {
    if(i < len) {
      var node = self__.arr[i];
      if(!(node == null)) {
        var init__$2 = node.kv_reduce(f, init__$1);
        if(cljs.core.reduced_QMARK_.call(null, init__$2)) {
          return cljs.core.deref.call(null, init__$2)
        }else {
          var G__4493 = i + 1;
          var G__4494 = init__$2;
          i = G__4493;
          init__$1 = G__4494;
          continue
        }
      }else {
        var G__4495 = i + 1;
        var G__4496 = init__$1;
        i = G__4495;
        init__$1 = G__4496;
        continue
      }
    }else {
      return init__$1
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(!(node == null)) {
    return node.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(!(node == null)) {
    var n = node.inode_without(shift + 5, hash, key);
    if(n === node) {
      return inode
    }else {
      if(n == null) {
        if(self__.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode, null, idx)
        }else {
          return new cljs.core.ArrayNode(null, self__.cnt - 1, cljs.core.clone_and_set.call(null, self__.arr, idx, n))
        }
      }else {
        if("\ufdd0:else") {
          return new cljs.core.ArrayNode(null, self__.cnt, cljs.core.clone_and_set.call(null, self__.arr, idx, n))
        }else {
          return null
        }
      }
    }
  }else {
    return inode
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(node == null) {
    return new cljs.core.ArrayNode(null, self__.cnt + 1, cljs.core.clone_and_set.call(null, self__.arr, idx, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n = node.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n === node) {
      return inode
    }else {
      return new cljs.core.ArrayNode(null, self__.cnt, cljs.core.clone_and_set.call(null, self__.arr, idx, n))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(!(node == null)) {
    return node.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim = 2 * cnt;
  var i = 0;
  while(true) {
    if(i < lim) {
      if(cljs.core.key_test.call(null, key, arr[i])) {
        return i
      }else {
        var G__4497 = i + 2;
        i = G__4497;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
goog.provide("cljs.core.HashCollisionNode");
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorStr = "cljs.core/HashCollisionNode";
cljs.core.HashCollisionNode.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit__$1, shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  if(hash === self__.collision_hash) {
    var idx = cljs.core.hash_collision_node_find_index.call(null, self__.arr, self__.cnt, key);
    if(idx === -1) {
      if(self__.arr.length > 2 * self__.cnt) {
        var editable = cljs.core.edit_and_set.call(null, inode, edit__$1, 2 * self__.cnt, key, 2 * self__.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable.cnt = editable.cnt + 1;
        return editable
      }else {
        var len = self__.arr.length;
        var new_arr = new Array(len + 2);
        cljs.core.array_copy.call(null, self__.arr, 0, new_arr, 0, len);
        new_arr[len] = key;
        new_arr[len + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode.ensure_editable_array(edit__$1, self__.cnt + 1, new_arr)
      }
    }else {
      if(self__.arr[idx + 1] === val) {
        return inode
      }else {
        return cljs.core.edit_and_set.call(null, inode, edit__$1, idx + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit__$1, 1 << (self__.collision_hash >>> shift & 31), [null, inode, null, null])).inode_assoc_BANG_(edit__$1, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var self__ = this;
  var inode = this;
  return cljs.core.create_inode_seq.call(null, self__.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit__$1, shift, hash, key, removed_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var idx = cljs.core.hash_collision_node_find_index.call(null, self__.arr, self__.cnt, key);
  if(idx === -1) {
    return inode
  }else {
    removed_leaf_QMARK_[0] = true;
    if(self__.cnt === 1) {
      return null
    }else {
      var editable = inode.ensure_editable(edit__$1);
      var earr = editable.arr;
      earr[idx] = earr[2 * self__.cnt - 2];
      earr[idx + 1] = earr[2 * self__.cnt - 1];
      earr[2 * self__.cnt - 1] = null;
      earr[2 * self__.cnt - 2] = null;
      editable.cnt = editable.cnt - 1;
      return editable
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var self__ = this;
  var inode = this;
  if(e === self__.edit) {
    return inode
  }else {
    var new_arr = new Array(2 * (self__.cnt + 1));
    cljs.core.array_copy.call(null, self__.arr, 0, new_arr, 0, 2 * self__.cnt);
    return new cljs.core.HashCollisionNode(e, self__.collision_hash, self__.cnt, new_arr)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var self__ = this;
  var inode = this;
  return cljs.core.inode_kv_reduce.call(null, self__.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var idx = cljs.core.hash_collision_node_find_index.call(null, self__.arr, self__.cnt, key);
  if(idx < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, self__.arr[idx])) {
      return cljs.core.PersistentVector.fromArray([self__.arr[idx], self__.arr[idx + 1]], true)
    }else {
      if("\ufdd0:else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var self__ = this;
  var inode = this;
  var idx = cljs.core.hash_collision_node_find_index.call(null, self__.arr, self__.cnt, key);
  if(idx === -1) {
    return inode
  }else {
    if(self__.cnt === 1) {
      return null
    }else {
      if("\ufdd0:else") {
        return new cljs.core.HashCollisionNode(null, self__.collision_hash, self__.cnt - 1, cljs.core.remove_pair.call(null, self__.arr, cljs.core.quot.call(null, idx, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  if(hash === self__.collision_hash) {
    var idx = cljs.core.hash_collision_node_find_index.call(null, self__.arr, self__.cnt, key);
    if(idx === -1) {
      var len = self__.arr.length;
      var new_arr = new Array(len + 2);
      cljs.core.array_copy.call(null, self__.arr, 0, new_arr, 0, len);
      new_arr[len] = key;
      new_arr[len + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, self__.collision_hash, self__.cnt + 1, new_arr)
    }else {
      if(cljs.core._EQ_.call(null, self__.arr[idx], val)) {
        return inode
      }else {
        return new cljs.core.HashCollisionNode(null, self__.collision_hash, self__.cnt, cljs.core.clone_and_set.call(null, self__.arr, idx + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (self__.collision_hash >>> shift & 31), [null, inode])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var idx = cljs.core.hash_collision_node_find_index.call(null, self__.arr, self__.cnt, key);
  if(idx < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, self__.arr[idx])) {
      return self__.arr[idx + 1]
    }else {
      if("\ufdd0:else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var self__ = this;
  var inode = this;
  if(e === self__.edit) {
    self__.arr = array;
    self__.cnt = count;
    return inode
  }else {
    return new cljs.core.HashCollisionNode(self__.edit, self__.collision_hash, count, array)
  }
};
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash = cljs.core.hash.call(null, key1);
    if(key1hash === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK_ = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash, key1, val1, added_leaf_QMARK_).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK_)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash = cljs.core.hash.call(null, key1);
    if(key1hash === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK_ = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash, key1, val1, added_leaf_QMARK_).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK_)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  create_node.cljs$core$IFn$_invoke$arity$6 = create_node__6;
  create_node.cljs$core$IFn$_invoke$arity$7 = create_node__7;
  return create_node
}();
goog.provide("cljs.core.NodeSeq");
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorStr = "cljs.core/NodeSeq";
cljs.core.NodeSeq.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2768__auto__ = self__.__hash;
  if(!(h__2768__auto__ == null)) {
    return h__2768__auto__
  }else {
    var h__2768__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2768__auto____$1;
    return h__2768__auto____$1
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var self__ = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  if(self__.s == null) {
    return cljs.core.PersistentVector.fromArray([self__.nodes[self__.i], self__.nodes[self__.i + 1]], true)
  }else {
    return cljs.core.first.call(null, self__.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.s == null) {
    return cljs.core.create_inode_seq.call(null, self__.nodes, self__.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, self__.nodes, self__.i, cljs.core.next.call(null, self__.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.NodeSeq(meta__$1, self__.nodes, self__.i, self__.s, self__.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len = nodes.length;
      var j = i;
      while(true) {
        if(j < len) {
          if(!(nodes[j] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j, null, null)
          }else {
            var temp__4090__auto__ = nodes[j + 1];
            if(cljs.core.truth_(temp__4090__auto__)) {
              var node = temp__4090__auto__;
              var temp__4090__auto____$1 = node.inode_seq();
              if(cljs.core.truth_(temp__4090__auto____$1)) {
                var node_seq = temp__4090__auto____$1;
                return new cljs.core.NodeSeq(null, nodes, j + 2, node_seq, null)
              }else {
                var G__4498 = j + 2;
                j = G__4498;
                continue
              }
            }else {
              var G__4499 = j + 2;
              j = G__4499;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  create_inode_seq.cljs$core$IFn$_invoke$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$core$IFn$_invoke$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
goog.provide("cljs.core.ArrayNodeSeq");
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorStr = "cljs.core/ArrayNodeSeq";
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2768__auto__ = self__.__hash;
  if(!(h__2768__auto__ == null)) {
    return h__2768__auto__
  }else {
    var h__2768__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2768__auto____$1;
    return h__2768__auto____$1
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var self__ = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.first.call(null, self__.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.create_array_node_seq.call(null, null, self__.nodes, self__.i, cljs.core.next.call(null, self__.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.ArrayNodeSeq(meta__$1, self__.nodes, self__.i, self__.s, self__.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len = nodes.length;
      var j = i;
      while(true) {
        if(j < len) {
          var temp__4090__auto__ = nodes[j];
          if(cljs.core.truth_(temp__4090__auto__)) {
            var nj = temp__4090__auto__;
            var temp__4090__auto____$1 = nj.inode_seq();
            if(cljs.core.truth_(temp__4090__auto____$1)) {
              var ns = temp__4090__auto____$1;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j + 1, ns, null)
            }else {
              var G__4500 = j + 1;
              j = G__4500;
              continue
            }
          }else {
            var G__4501 = j + 1;
            j = G__4501;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  create_array_node_seq.cljs$core$IFn$_invoke$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$core$IFn$_invoke$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
goog.provide("cljs.core.PersistentHashMap");
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorStr = "cljs.core/PersistentHashMap";
cljs.core.PersistentHashMap.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var self__ = this;
  return new cljs.core.TransientHashMap({}, self__.root, self__.cnt, self__.has_nil_QMARK_, self__.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2768__auto__ = self__.__hash;
  if(!(h__2768__auto__ == null)) {
    return h__2768__auto__
  }else {
    var h__2768__auto____$1 = cljs.core.hash_imap.call(null, coll);
    self__.__hash = h__2768__auto____$1;
    return h__2768__auto____$1
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  if(k == null) {
    if(self__.has_nil_QMARK_) {
      return self__.nil_val
    }else {
      return not_found
    }
  }else {
    if(self__.root == null) {
      return not_found
    }else {
      if("\ufdd0:else") {
        return self__.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  if(k == null) {
    if(function() {
      var and__3941__auto__ = self__.has_nil_QMARK_;
      if(and__3941__auto__) {
        return v === self__.nil_val
      }else {
        return and__3941__auto__
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(self__.meta, self__.has_nil_QMARK_ ? self__.cnt : self__.cnt + 1, self__.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK_ = new cljs.core.Box(false);
    var new_root = (self__.root == null ? cljs.core.BitmapIndexedNode.EMPTY : self__.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK_);
    if(new_root === self__.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(self__.meta, added_leaf_QMARK_.val ? self__.cnt + 1 : self__.cnt, new_root, self__.has_nil_QMARK_, self__.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var self__ = this;
  if(k == null) {
    return self__.has_nil_QMARK_
  }else {
    if(self__.root == null) {
      return false
    }else {
      if("\ufdd0:else") {
        return!(self__.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__4503 = null;
  var G__4503__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__4503__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__4503 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4503__2.call(this, self__, k);
      case 3:
        return G__4503__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__4503
}();
cljs.core.PersistentHashMap.prototype.apply = function(self__, args4502) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args4502.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var self__ = this;
  var init__$1 = self__.has_nil_QMARK_ ? f.call(null, init, null, self__.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__$1)) {
    return cljs.core.deref.call(null, init__$1)
  }else {
    if(!(self__.root == null)) {
      return self__.root.kv_reduce(f, init__$1)
    }else {
      if("\ufdd0:else") {
        return init__$1
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var self__ = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt > 0) {
    var s = !(self__.root == null) ? self__.root.inode_seq() : null;
    if(self__.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, self__.nil_val], true), s)
    }else {
      return s
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentHashMap(meta__$1, self__.cnt, self__.root, self__.has_nil_QMARK_, self__.nil_val, self__.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, self__.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var self__ = this;
  if(k == null) {
    if(self__.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(self__.meta, self__.cnt - 1, self__.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(self__.root == null) {
      return coll
    }else {
      if("\ufdd0:else") {
        var new_root = self__.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root === self__.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(self__.meta, self__.cnt - 1, new_root, self__.has_nil_QMARK_, self__.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len = ks.length;
  var i = 0;
  var out = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i < len) {
      var G__4504 = i + 1;
      var G__4505 = cljs.core.assoc_BANG_.call(null, out, ks[i], vs[i]);
      i = G__4504;
      out = G__4505;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out)
    }
    break
  }
};
goog.provide("cljs.core.TransientHashMap");
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 56;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorStr = "cljs.core/TransientHashMap";
cljs.core.TransientHashMap.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var self__ = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var self__ = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var self__ = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var self__ = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var self__ = this;
  if(k == null) {
    if(self__.has_nil_QMARK_) {
      return self__.nil_val
    }else {
      return null
    }
  }else {
    if(self__.root == null) {
      return null
    }else {
      return self__.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var self__ = this;
  if(k == null) {
    if(self__.has_nil_QMARK_) {
      return self__.nil_val
    }else {
      return not_found
    }
  }else {
    if(self__.root == null) {
      return not_found
    }else {
      return self__.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  if(self__.edit) {
    return self__.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var self__ = this;
  var tcoll = this;
  if(self__.edit) {
    if(function() {
      var G__4506 = o;
      if(G__4506) {
        if(function() {
          var or__3943__auto__ = G__4506.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__4506.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__4506.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__4506)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__4506)
      }
    }()) {
      return tcoll.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es = cljs.core.seq.call(null, o);
      var tcoll__$1 = tcoll;
      while(true) {
        var temp__4090__auto__ = cljs.core.first.call(null, es);
        if(cljs.core.truth_(temp__4090__auto__)) {
          var e = temp__4090__auto__;
          var G__4507 = cljs.core.next.call(null, es);
          var G__4508 = tcoll__$1.assoc_BANG_(cljs.core.key.call(null, e), cljs.core.val.call(null, e));
          es = G__4507;
          tcoll__$1 = G__4508;
          continue
        }else {
          return tcoll__$1
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var self__ = this;
  var tcoll = this;
  if(self__.edit) {
    if(k == null) {
      if(self__.nil_val === v) {
      }else {
        self__.nil_val = v
      }
      if(self__.has_nil_QMARK_) {
      }else {
        self__.count = self__.count + 1;
        self__.has_nil_QMARK_ = true
      }
      return tcoll
    }else {
      var added_leaf_QMARK_ = new cljs.core.Box(false);
      var node = (self__.root == null ? cljs.core.BitmapIndexedNode.EMPTY : self__.root).inode_assoc_BANG_(self__.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK_);
      if(node === self__.root) {
      }else {
        self__.root = node
      }
      if(added_leaf_QMARK_.val) {
        self__.count = self__.count + 1
      }else {
      }
      return tcoll
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var self__ = this;
  var tcoll = this;
  if(self__.edit) {
    if(k == null) {
      if(self__.has_nil_QMARK_) {
        self__.has_nil_QMARK_ = false;
        self__.nil_val = null;
        self__.count = self__.count - 1;
        return tcoll
      }else {
        return tcoll
      }
    }else {
      if(self__.root == null) {
        return tcoll
      }else {
        var removed_leaf_QMARK_ = new cljs.core.Box(false);
        var node = self__.root.inode_without_BANG_(self__.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK_);
        if(node === self__.root) {
        }else {
          self__.root = node
        }
        if(cljs.core.truth_(removed_leaf_QMARK_[0])) {
          self__.count = self__.count - 1
        }else {
        }
        return tcoll
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var self__ = this;
  var tcoll = this;
  if(self__.edit) {
    self__.edit = null;
    return new cljs.core.PersistentHashMap(null, self__.count, self__.root, self__.has_nil_QMARK_, self__.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t = node;
  var stack__$1 = stack;
  while(true) {
    if(!(t == null)) {
      var G__4509 = ascending_QMARK_ ? t.left : t.right;
      var G__4510 = cljs.core.conj.call(null, stack__$1, t);
      t = G__4509;
      stack__$1 = G__4510;
      continue
    }else {
      return stack__$1
    }
    break
  }
};
goog.provide("cljs.core.PersistentTreeMapSeq");
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850574
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorStr = "cljs.core/PersistentTreeMapSeq";
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2768__auto__ = self__.__hash;
  if(!(h__2768__auto__ == null)) {
    return h__2768__auto__
  }else {
    var h__2768__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2768__auto____$1;
    return h__2768__auto____$1
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var self__ = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return self__.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var self__ = this;
  return cljs.core.peek.call(null, self__.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var self__ = this;
  var t = cljs.core.first.call(null, self__.stack);
  var next_stack = cljs.core.tree_map_seq_push.call(null, self__.ascending_QMARK_ ? t.right : t.left, cljs.core.next.call(null, self__.stack), self__.ascending_QMARK_);
  if(!(next_stack == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack, self__.ascending_QMARK_, self__.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentTreeMapSeq(meta__$1, self__.stack, self__.ascending_QMARK_, self__.cnt, self__.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(ins instanceof cljs.core.RedNode) {
    if(ins.left instanceof cljs.core.RedNode) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(ins.right instanceof cljs.core.RedNode) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0:else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(ins instanceof cljs.core.RedNode) {
    if(ins.right instanceof cljs.core.RedNode) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(ins.left instanceof cljs.core.RedNode) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0:else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(del instanceof cljs.core.RedNode) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(right instanceof cljs.core.BlackNode) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3941__auto__ = right instanceof cljs.core.RedNode;
        if(and__3941__auto__) {
          return right.left instanceof cljs.core.BlackNode
        }else {
          return and__3941__auto__
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0:else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(del instanceof cljs.core.RedNode) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(left instanceof cljs.core.BlackNode) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3941__auto__ = left instanceof cljs.core.RedNode;
        if(and__3941__auto__) {
          return left.right instanceof cljs.core.BlackNode
        }else {
          return and__3941__auto__
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0:else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__$1 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__$1)) {
    return cljs.core.deref.call(null, init__$1)
  }else {
    var init__$2 = f.call(null, init__$1, node.key, node.val);
    if(cljs.core.reduced_QMARK_.call(null, init__$2)) {
      return cljs.core.deref.call(null, init__$2)
    }else {
      var init__$3 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__$2) : init__$2;
      if(cljs.core.reduced_QMARK_.call(null, init__$3)) {
        return cljs.core.deref.call(null, init__$3)
      }else {
        return init__$3
      }
    }
  }
};
goog.provide("cljs.core.BlackNode");
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorStr = "cljs.core/BlackNode";
cljs.core.BlackNode.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2768__auto__ = self__.__hash;
  if(!(h__2768__auto__ == null)) {
    return h__2768__auto__
  }else {
    var h__2768__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2768__auto____$1;
    return h__2768__auto____$1
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var self__ = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var self__ = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var self__ = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__4512 = null;
  var G__4512__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var node = self____$1;
    return node.cljs$core$ILookup$_lookup$arity$2(node, k)
  };
  var G__4512__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var node = self____$1;
    return node.cljs$core$ILookup$_lookup$arity$3(node, k, not_found)
  };
  G__4512 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4512__2.call(this, self__, k);
      case 3:
        return G__4512__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__4512
}();
cljs.core.BlackNode.prototype.apply = function(self__, args4511) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args4511.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var self__ = this;
  return cljs.core.PersistentVector.fromArray([self__.key, self__.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var self__ = this;
  return self__.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var self__ = this;
  return self__.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var self__ = this;
  var node = this;
  return ins.balance_right(node)
};
cljs.core.BlackNode.prototype.redden = function() {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(self__.key, self__.val, self__.left, self__.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var self__ = this;
  var node = this;
  return cljs.core.balance_right_del.call(null, self__.key, self__.val, self__.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key__$1, val__$1, left__$1, right__$1) {
  var self__ = this;
  var node = this;
  return new cljs.core.BlackNode(key__$1, val__$1, left__$1, right__$1, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var self__ = this;
  var node = this;
  return cljs.core.tree_map_kv_reduce.call(null, node, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var self__ = this;
  var node = this;
  return cljs.core.balance_left_del.call(null, self__.key, self__.val, del, self__.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var self__ = this;
  var node = this;
  return ins.balance_left(node)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var self__ = this;
  var node = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node, parent.right, null)
};
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var self__ = this;
  var node = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var self__ = this;
  var node = this;
  return node
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var self__ = this;
  return cljs.core.list.call(null, self__.key, self__.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var self__ = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var self__ = this;
  return self__.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var self__ = this;
  return cljs.core.PersistentVector.fromArray([self__.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var self__ = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var self__ = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var self__ = this;
  if(n === 0) {
    return self__.key
  }else {
    if(n === 1) {
      return self__.val
    }else {
      if("\ufdd0:else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var self__ = this;
  if(n === 0) {
    return self__.key
  }else {
    if(n === 1) {
      return self__.val
    }else {
      if("\ufdd0:else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var self__ = this;
  return cljs.core.PersistentVector.EMPTY
};
goog.provide("cljs.core.RedNode");
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorStr = "cljs.core/RedNode";
cljs.core.RedNode.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2768__auto__ = self__.__hash;
  if(!(h__2768__auto__ == null)) {
    return h__2768__auto__
  }else {
    var h__2768__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2768__auto____$1;
    return h__2768__auto____$1
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var self__ = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var self__ = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var self__ = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__4514 = null;
  var G__4514__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var node = self____$1;
    return node.cljs$core$ILookup$_lookup$arity$2(node, k)
  };
  var G__4514__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var node = self____$1;
    return node.cljs$core$ILookup$_lookup$arity$3(node, k, not_found)
  };
  G__4514 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4514__2.call(this, self__, k);
      case 3:
        return G__4514__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__4514
}();
cljs.core.RedNode.prototype.apply = function(self__, args4513) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args4513.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var self__ = this;
  return cljs.core.PersistentVector.fromArray([self__.key, self__.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var self__ = this;
  return self__.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var self__ = this;
  return self__.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(self__.key, self__.val, self__.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var self__ = this;
  var node = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(self__.key, self__.val, self__.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key__$1, val__$1, left__$1, right__$1) {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(key__$1, val__$1, left__$1, right__$1, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var self__ = this;
  var node = this;
  return cljs.core.tree_map_kv_reduce.call(null, node, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(self__.key, self__.val, del, self__.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(self__.key, self__.val, ins, self__.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var self__ = this;
  var node = this;
  if(self__.left instanceof cljs.core.RedNode) {
    return new cljs.core.RedNode(self__.key, self__.val, self__.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, self__.right, parent.right, null), null)
  }else {
    if(self__.right instanceof cljs.core.RedNode) {
      return new cljs.core.RedNode(self__.right.key, self__.right.val, new cljs.core.BlackNode(self__.key, self__.val, self__.left, self__.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, self__.right.right, parent.right, null), null)
    }else {
      if("\ufdd0:else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var self__ = this;
  var node = this;
  if(self__.right instanceof cljs.core.RedNode) {
    return new cljs.core.RedNode(self__.key, self__.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, self__.left, null), self__.right.blacken(), null)
  }else {
    if(self__.left instanceof cljs.core.RedNode) {
      return new cljs.core.RedNode(self__.left.key, self__.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, self__.left.left, null), new cljs.core.BlackNode(self__.key, self__.val, self__.left.right, self__.right, null), null)
    }else {
      if("\ufdd0:else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var self__ = this;
  var node = this;
  return new cljs.core.BlackNode(self__.key, self__.val, self__.left, self__.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var self__ = this;
  return cljs.core.list.call(null, self__.key, self__.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var self__ = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var self__ = this;
  return self__.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var self__ = this;
  return cljs.core.PersistentVector.fromArray([self__.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var self__ = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var self__ = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var self__ = this;
  if(n === 0) {
    return self__.key
  }else {
    if(n === 1) {
      return self__.val
    }else {
      if("\ufdd0:else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var self__ = this;
  if(n === 0) {
    return self__.key
  }else {
    if(n === 1) {
      return self__.val
    }else {
      if("\ufdd0:else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var self__ = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c = comp.call(null, k, tree.key);
    if(c === 0) {
      found[0] = tree;
      return null
    }else {
      if(c < 0) {
        var ins = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins == null)) {
          return tree.add_left(ins)
        }else {
          return null
        }
      }else {
        if("\ufdd0:else") {
          var ins = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins == null)) {
            return tree.add_right(ins)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(left instanceof cljs.core.RedNode) {
        if(right instanceof cljs.core.RedNode) {
          var app = tree_map_append.call(null, left.right, right.left);
          if(app instanceof cljs.core.RedNode) {
            return new cljs.core.RedNode(app.key, app.val, new cljs.core.RedNode(left.key, left.val, left.left, app.left, null), new cljs.core.RedNode(right.key, right.val, app.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(right instanceof cljs.core.RedNode) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0:else") {
            var app = tree_map_append.call(null, left.right, right.left);
            if(app instanceof cljs.core.RedNode) {
              return new cljs.core.RedNode(app.key, app.val, new cljs.core.BlackNode(left.key, left.val, left.left, app.left, null), new cljs.core.BlackNode(right.key, right.val, app.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c = comp.call(null, k, tree.key);
    if(c === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c < 0) {
        var del = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3943__auto__ = !(del == null);
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(tree.left instanceof cljs.core.BlackNode) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0:else") {
          var del = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3943__auto__ = !(del == null);
            if(or__3943__auto__) {
              return or__3943__auto__
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(tree.right instanceof cljs.core.BlackNode) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk = tree.key;
  var c = comp.call(null, k, tk);
  if(c === 0) {
    return tree.replace(tk, v, tree.left, tree.right)
  }else {
    if(c < 0) {
      return tree.replace(tk, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0:else") {
        return tree.replace(tk, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
goog.provide("cljs.core.PersistentTreeMap");
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorStr = "cljs.core/PersistentTreeMap";
cljs.core.PersistentTreeMap.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2768__auto__ = self__.__hash;
  if(!(h__2768__auto__ == null)) {
    return h__2768__auto__
  }else {
    var h__2768__auto____$1 = cljs.core.hash_imap.call(null, coll);
    self__.__hash = h__2768__auto____$1;
    return h__2768__auto____$1
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  var n = coll.entry_at(k);
  if(!(n == null)) {
    return n.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  var found = [null];
  var t = cljs.core.tree_map_add.call(null, self__.comp, self__.tree, k, v, found);
  if(t == null) {
    var found_node = cljs.core.nth.call(null, found, 0);
    if(cljs.core._EQ_.call(null, v, found_node.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(self__.comp, cljs.core.tree_map_replace.call(null, self__.comp, self__.tree, k, v), self__.cnt, self__.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(self__.comp, t.blacken(), self__.cnt + 1, self__.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var self__ = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__4516 = null;
  var G__4516__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__4516__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__4516 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4516__2.call(this, self__, k);
      case 3:
        return G__4516__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__4516
}();
cljs.core.PersistentTreeMap.prototype.apply = function(self__, args4515) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args4515.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var self__ = this;
  if(!(self__.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, self__.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var self__ = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, self__.tree, false, self__.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var self__ = this;
  var coll = this;
  var t = self__.tree;
  while(true) {
    if(!(t == null)) {
      var c = self__.comp.call(null, k, t.key);
      if(c === 0) {
        return t
      }else {
        if(c < 0) {
          var G__4517 = t.left;
          t = G__4517;
          continue
        }else {
          if("\ufdd0:else") {
            var G__4518 = t.right;
            t = G__4518;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var self__ = this;
  if(self__.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, self__.tree, ascending_QMARK_, self__.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var self__ = this;
  if(self__.cnt > 0) {
    var stack = null;
    var t = self__.tree;
    while(true) {
      if(!(t == null)) {
        var c = self__.comp.call(null, k, t.key);
        if(c === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack, t), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c < 0) {
              var G__4519 = cljs.core.conj.call(null, stack, t);
              var G__4520 = t.left;
              stack = G__4519;
              t = G__4520;
              continue
            }else {
              var G__4521 = stack;
              var G__4522 = t.right;
              stack = G__4521;
              t = G__4522;
              continue
            }
          }else {
            if("\ufdd0:else") {
              if(c > 0) {
                var G__4523 = cljs.core.conj.call(null, stack, t);
                var G__4524 = t.right;
                stack = G__4523;
                t = G__4524;
                continue
              }else {
                var G__4525 = stack;
                var G__4526 = t.left;
                stack = G__4525;
                t = G__4526;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack == null) {
          return null
        }else {
          return new cljs.core.PersistentTreeMapSeq(null, stack, ascending_QMARK_, -1, null)
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var self__ = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var self__ = this;
  return self__.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, self__.tree, true, self__.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentTreeMap(self__.comp, self__.tree, self__.cnt, meta__$1, self__.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, self__.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var self__ = this;
  var found = [null];
  var t = cljs.core.tree_map_remove.call(null, self__.comp, self__.tree, k, found);
  if(t == null) {
    if(cljs.core.nth.call(null, found, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(self__.comp, null, 0, self__.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(self__.comp, t.blacken(), self__.cnt - 1, self__.meta, null)
  }
};
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$ = cljs.core.seq.call(null, keyvals);
    var out = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in$) {
        var G__4527 = cljs.core.nnext.call(null, in$);
        var G__4528 = cljs.core.assoc_BANG_.call(null, out, cljs.core.first.call(null, in$), cljs.core.second.call(null, in$));
        in$ = G__4527;
        out = G__4528;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(arguments.length > 0) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__4529) {
    var keyvals = cljs.core.seq(arglist__4529);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$core$IFn$_invoke$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(arguments.length > 0) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__4530) {
    var keyvals = cljs.core.seq(arglist__4530);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$core$IFn$_invoke$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks = [];
    var obj = {};
    var kvs = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs) {
        ks.push(cljs.core.first.call(null, kvs));
        obj[cljs.core.first.call(null, kvs)] = cljs.core.second.call(null, kvs);
        var G__4531 = cljs.core.nnext.call(null, kvs);
        kvs = G__4531;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks, obj)
      }
      break
    }
  };
  var obj_map = function(var_args) {
    var keyvals = null;
    if(arguments.length > 0) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return obj_map__delegate.call(this, keyvals)
  };
  obj_map.cljs$lang$maxFixedArity = 0;
  obj_map.cljs$lang$applyTo = function(arglist__4532) {
    var keyvals = cljs.core.seq(arglist__4532);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$core$IFn$_invoke$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in$ = cljs.core.seq.call(null, keyvals);
    var out = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in$) {
        var G__4533 = cljs.core.nnext.call(null, in$);
        var G__4534 = cljs.core.assoc.call(null, out, cljs.core.first.call(null, in$), cljs.core.second.call(null, in$));
        in$ = G__4533;
        out = G__4534;
        continue
      }else {
        return out
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(arguments.length > 0) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__4535) {
    var keyvals = cljs.core.seq(arglist__4535);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$core$IFn$_invoke$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in$ = cljs.core.seq.call(null, keyvals);
    var out = new cljs.core.PersistentTreeMap(cljs.core.fn__GT_comparator.call(null, comparator), null, 0, null, 0);
    while(true) {
      if(in$) {
        var G__4536 = cljs.core.nnext.call(null, in$);
        var G__4537 = cljs.core.assoc.call(null, out, cljs.core.first.call(null, in$), cljs.core.second.call(null, in$));
        in$ = G__4536;
        out = G__4537;
        continue
      }else {
        return out
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(arguments.length > 1) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__4538) {
    var comparator = cljs.core.first(arglist__4538);
    var keyvals = cljs.core.rest(arglist__4538);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$core$IFn$_invoke$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__4539_SHARP_, p2__4540_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3943__auto__ = p1__4539_SHARP_;
          if(cljs.core.truth_(or__3943__auto__)) {
            return or__3943__auto__
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__4540_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(arguments.length > 0) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__4541) {
    var maps = cljs.core.seq(arglist__4541);
    return merge__delegate(maps)
  };
  merge.cljs$core$IFn$_invoke$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry = function(m, e) {
        var k = cljs.core.first.call(null, e);
        var v = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k)) {
          return cljs.core.assoc.call(null, m, k, f.call(null, cljs.core.get.call(null, m, k), v))
        }else {
          return cljs.core.assoc.call(null, m, k, v)
        }
      };
      var merge2 = function(merge_entry) {
        return function(m1, m2) {
          return cljs.core.reduce.call(null, merge_entry, function() {
            var or__3943__auto__ = m1;
            if(cljs.core.truth_(or__3943__auto__)) {
              return or__3943__auto__
            }else {
              return cljs.core.ObjMap.EMPTY
            }
          }(), cljs.core.seq.call(null, m2))
        }
      }(merge_entry);
      return cljs.core.reduce.call(null, merge2, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(arguments.length > 1) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__4542) {
    var f = cljs.core.first(arglist__4542);
    var maps = cljs.core.rest(arglist__4542);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$core$IFn$_invoke$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret = cljs.core.ObjMap.EMPTY;
  var keys = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys) {
      var key = cljs.core.first.call(null, keys);
      var entry = cljs.core.get.call(null, map, key, "\ufdd0:cljs.core/not-found");
      var G__4543 = cljs.core.not_EQ_.call(null, entry, "\ufdd0:cljs.core/not-found") ? cljs.core.assoc.call(null, ret, key, entry) : ret;
      var G__4544 = cljs.core.next.call(null, keys);
      ret = G__4543;
      keys = G__4544;
      continue
    }else {
      return ret
    }
    break
  }
};
goog.provide("cljs.core.PersistentHashSet");
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorStr = "cljs.core/PersistentHashSet";
cljs.core.PersistentHashSet.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var self__ = this;
  return new cljs.core.TransientHashSet(cljs.core._as_transient.call(null, self__.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2768__auto__ = self__.__hash;
  if(!(h__2768__auto__ == null)) {
    return h__2768__auto__
  }else {
    var h__2768__auto____$1 = cljs.core.hash_iset.call(null, coll);
    self__.__hash = h__2768__auto____$1;
    return h__2768__auto____$1
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var self__ = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, self__.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__4547 = null;
  var G__4547__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__4547__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__4547 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4547__2.call(this, self__, k);
      case 3:
        return G__4547__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__4547
}();
cljs.core.PersistentHashSet.prototype.apply = function(self__, args4546) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args4546.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return new cljs.core.PersistentHashSet(self__.meta, cljs.core.assoc.call(null, self__.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.keys.call(null, self__.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var self__ = this;
  return new cljs.core.PersistentHashSet(self__.meta, cljs.core._dissoc.call(null, self__.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._count.call(null, self__.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var and__3941__auto__ = cljs.core.set_QMARK_.call(null, other);
  if(and__3941__auto__) {
    var and__3941__auto____$1 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3941__auto____$1) {
      return cljs.core.every_QMARK_.call(null, function(p1__4545_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__4545_SHARP_)
      }, other)
    }else {
      return and__3941__auto____$1
    }
  }else {
    return and__3941__auto__
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentHashSet(meta__$1, self__.hash_map, self__.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, self__.meta)
};
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.PersistentArrayMap.EMPTY, 0);
cljs.core.PersistentHashSet.fromArray = function(items, no_clone) {
  var len = items.length;
  if(len / 2 <= cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
    var arr = no_clone ? items : items.slice();
    return new cljs.core.PersistentHashSet(null, cljs.core.PersistentArrayMap.fromArray.call(null, arr, true), null)
  }else {
    var i = 0;
    var out = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
    while(true) {
      if(i < len) {
        var G__4548 = i + 2;
        var G__4549 = cljs.core.conj_BANG_.call(null, out, items[i]);
        i = G__4548;
        out = G__4549;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out)
      }
      break
    }
  }
};
goog.provide("cljs.core.TransientHashSet");
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 136
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorStr = "cljs.core/TransientHashSet";
cljs.core.TransientHashSet.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__4552 = null;
  var G__4552__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var tcoll = self____$1;
    if(cljs.core._lookup.call(null, self__.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__4552__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var tcoll = self____$1;
    if(cljs.core._lookup.call(null, self__.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__4552 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4552__2.call(this, self__, k);
      case 3:
        return G__4552__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__4552
}();
cljs.core.TransientHashSet.prototype.apply = function(self__, args4551) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args4551.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var self__ = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var self__ = this;
  if(cljs.core._lookup.call(null, self__.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var self__ = this;
  return cljs.core.count.call(null, self__.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var self__ = this;
  self__.transient_map = cljs.core.dissoc_BANG_.call(null, self__.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var self__ = this;
  self__.transient_map = cljs.core.assoc_BANG_.call(null, self__.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var self__ = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, self__.transient_map), null)
};
goog.provide("cljs.core.PersistentTreeSet");
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorStr = "cljs.core/PersistentTreeSet";
cljs.core.PersistentTreeSet.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2768__auto__ = self__.__hash;
  if(!(h__2768__auto__ == null)) {
    return h__2768__auto__
  }else {
    var h__2768__auto____$1 = cljs.core.hash_iset.call(null, coll);
    self__.__hash = h__2768__auto____$1;
    return h__2768__auto____$1
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var self__ = this;
  var n = self__.tree_map.entry_at(v);
  if(!(n == null)) {
    return n.key
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__4554 = null;
  var G__4554__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__4554__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__4554 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4554__2.call(this, self__, k);
      case 3:
        return G__4554__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__4554
}();
cljs.core.PersistentTreeSet.prototype.apply = function(self__, args4553) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args4553.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return new cljs.core.PersistentTreeSet(self__.meta, cljs.core.assoc.call(null, self__.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, self__.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var self__ = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, self__.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var self__ = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, self__.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var self__ = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._comparator.call(null, self__.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.keys.call(null, self__.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var self__ = this;
  return new cljs.core.PersistentTreeSet(self__.meta, cljs.core.dissoc.call(null, self__.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.count.call(null, self__.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var and__3941__auto__ = cljs.core.set_QMARK_.call(null, other);
  if(and__3941__auto__) {
    var and__3941__auto____$1 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3941__auto____$1) {
      return cljs.core.every_QMARK_.call(null, function(p1__4550_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__4550_SHARP_)
      }, other)
    }else {
      return and__3941__auto____$1
    }
  }else {
    return and__3941__auto__
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentTreeSet(meta__$1, self__.tree_map, self__.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, self__.meta)
};
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.PersistentTreeMap.EMPTY, 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__4555__delegate = function(keys) {
      if(function() {
        var and__3941__auto__ = keys instanceof cljs.core.IndexedSeq;
        if(and__3941__auto__) {
          return keys.arr.length < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD
        }else {
          return and__3941__auto__
        }
      }()) {
        var karr = keys.arr;
        var klen = karr.length;
        var alen = 2 * klen;
        var arr = new Array(alen);
        var ki = 0;
        while(true) {
          if(ki < klen) {
            var ai = 2 * ki;
            arr[ai] = karr[ki];
            arr[ai + 1] = null;
            var G__4556 = ki + 1;
            ki = G__4556;
            continue
          }else {
            return cljs.core.PersistentHashSet.fromArray.call(null, arr, true)
          }
          break
        }
      }else {
        var in$ = keys;
        var out = cljs.core._as_transient.call(null, cljs.core.PersistentHashSet.EMPTY);
        while(true) {
          if(!(in$ == null)) {
            var G__4557 = cljs.core._next.call(null, in$);
            var G__4558 = cljs.core._conj_BANG_.call(null, out, cljs.core._first.call(null, in$));
            in$ = G__4557;
            out = G__4558;
            continue
          }else {
            return cljs.core._persistent_BANG_.call(null, out)
          }
          break
        }
      }
    };
    var G__4555 = function(var_args) {
      var keys = null;
      if(arguments.length > 0) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__4555__delegate.call(this, keys)
    };
    G__4555.cljs$lang$maxFixedArity = 0;
    G__4555.cljs$lang$applyTo = function(arglist__4559) {
      var keys = cljs.core.seq(arglist__4559);
      return G__4555__delegate(keys)
    };
    G__4555.cljs$core$IFn$_invoke$arity$variadic = G__4555__delegate;
    return G__4555
  }();
  hash_set = function(var_args) {
    var keys = var_args;
    switch(arguments.length) {
      case 0:
        return hash_set__0.call(this);
      default:
        return hash_set__1.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  hash_set.cljs$lang$maxFixedArity = 0;
  hash_set.cljs$lang$applyTo = hash_set__1.cljs$lang$applyTo;
  hash_set.cljs$core$IFn$_invoke$arity$0 = hash_set__0;
  hash_set.cljs$core$IFn$_invoke$arity$variadic = hash_set__1.cljs$core$IFn$_invoke$arity$variadic;
  return hash_set
}();
cljs.core.set = function set(coll) {
  return cljs.core.apply.call(null, cljs.core.hash_set, coll)
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(arguments.length > 0) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__4560) {
    var keys = cljs.core.seq(arglist__4560);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$core$IFn$_invoke$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(arguments.length > 1) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__4562) {
    var comparator = cljs.core.first(arglist__4562);
    var keys = cljs.core.rest(arglist__4562);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$core$IFn$_invoke$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__4090__auto__ = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__4090__auto__)) {
        var e = temp__4090__auto__;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__4561_SHARP_) {
      var temp__4090__auto__ = cljs.core.find.call(null, smap, p1__4561_SHARP_);
      if(cljs.core.truth_(temp__4090__auto__)) {
        var e = temp__4090__auto__;
        return cljs.core.second.call(null, e)
      }else {
        return p1__4561_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__4569, seen__$1) {
        while(true) {
          var vec__4570 = p__4569;
          var f = cljs.core.nth.call(null, vec__4570, 0, null);
          var xs__$1 = vec__4570;
          var temp__4092__auto__ = cljs.core.seq.call(null, xs__$1);
          if(temp__4092__auto__) {
            var s = temp__4092__auto__;
            if(cljs.core.contains_QMARK_.call(null, seen__$1, f)) {
              var G__4571 = cljs.core.rest.call(null, s);
              var G__4572 = seen__$1;
              p__4569 = G__4571;
              seen__$1 = G__4572;
              continue
            }else {
              return cljs.core.cons.call(null, f, step.call(null, cljs.core.rest.call(null, s), cljs.core.conj.call(null, seen__$1, f)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret = cljs.core.PersistentVector.EMPTY;
  var s__$1 = s;
  while(true) {
    if(cljs.core.next.call(null, s__$1)) {
      var G__4573 = cljs.core.conj.call(null, ret, cljs.core.first.call(null, s__$1));
      var G__4574 = cljs.core.next.call(null, s__$1);
      ret = G__4573;
      s__$1 = G__4574;
      continue
    }else {
      return cljs.core.seq.call(null, ret)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(function() {
    var G__4576 = x;
    if(G__4576) {
      if(cljs.core.truth_(function() {
        var or__3943__auto__ = null;
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          return G__4576.cljs$core$INamed$
        }
      }())) {
        return true
      }else {
        return false
      }
    }else {
      return false
    }
  }()) {
    return cljs.core._name.call(null, x)
  }else {
    if(cljs.core.string_QMARK_.call(null, x)) {
      return x
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        var i = x.lastIndexOf("/", x.length - 2);
        if(i < 0) {
          return cljs.core.subs.call(null, x, 2)
        }else {
          return cljs.core.subs.call(null, x, i + 1)
        }
      }else {
        if("\ufdd0:else") {
          throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var G__4578 = x;
    if(G__4578) {
      if(cljs.core.truth_(function() {
        var or__3943__auto__ = null;
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          return G__4578.cljs$core$INamed$
        }
      }())) {
        return true
      }else {
        return false
      }
    }else {
      return false
    }
  }()) {
    return cljs.core._namespace.call(null, x)
  }else {
    if(cljs.core.keyword_QMARK_.call(null, x)) {
      var i = x.lastIndexOf("/", x.length - 2);
      if(i > -1) {
        return cljs.core.subs.call(null, x, 2, i)
      }else {
        return null
      }
    }else {
      throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
    }
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map = cljs.core.ObjMap.EMPTY;
  var ks = cljs.core.seq.call(null, keys);
  var vs = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3941__auto__ = ks;
      if(and__3941__auto__) {
        return vs
      }else {
        return and__3941__auto__
      }
    }()) {
      var G__4581 = cljs.core.assoc.call(null, map, cljs.core.first.call(null, ks), cljs.core.first.call(null, vs));
      var G__4582 = cljs.core.next.call(null, ks);
      var G__4583 = cljs.core.next.call(null, vs);
      map = G__4581;
      ks = G__4582;
      vs = G__4583;
      continue
    }else {
      return map
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__4586__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__4579_SHARP_, p2__4580_SHARP_) {
        return max_key.call(null, k, p1__4579_SHARP_, p2__4580_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__4586 = function(k, x, y, var_args) {
      var more = null;
      if(arguments.length > 3) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4586__delegate.call(this, k, x, y, more)
    };
    G__4586.cljs$lang$maxFixedArity = 3;
    G__4586.cljs$lang$applyTo = function(arglist__4587) {
      var k = cljs.core.first(arglist__4587);
      arglist__4587 = cljs.core.next(arglist__4587);
      var x = cljs.core.first(arglist__4587);
      arglist__4587 = cljs.core.next(arglist__4587);
      var y = cljs.core.first(arglist__4587);
      var more = cljs.core.rest(arglist__4587);
      return G__4586__delegate(k, x, y, more)
    };
    G__4586.cljs$core$IFn$_invoke$arity$variadic = G__4586__delegate;
    return G__4586
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$core$IFn$_invoke$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$core$IFn$_invoke$arity$2 = max_key__2;
  max_key.cljs$core$IFn$_invoke$arity$3 = max_key__3;
  max_key.cljs$core$IFn$_invoke$arity$variadic = max_key__4.cljs$core$IFn$_invoke$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__4588__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__4584_SHARP_, p2__4585_SHARP_) {
        return min_key.call(null, k, p1__4584_SHARP_, p2__4585_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__4588 = function(k, x, y, var_args) {
      var more = null;
      if(arguments.length > 3) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4588__delegate.call(this, k, x, y, more)
    };
    G__4588.cljs$lang$maxFixedArity = 3;
    G__4588.cljs$lang$applyTo = function(arglist__4589) {
      var k = cljs.core.first(arglist__4589);
      arglist__4589 = cljs.core.next(arglist__4589);
      var x = cljs.core.first(arglist__4589);
      arglist__4589 = cljs.core.next(arglist__4589);
      var y = cljs.core.first(arglist__4589);
      var more = cljs.core.rest(arglist__4589);
      return G__4588__delegate(k, x, y, more)
    };
    G__4588.cljs$core$IFn$_invoke$arity$variadic = G__4588__delegate;
    return G__4588
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$core$IFn$_invoke$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$core$IFn$_invoke$arity$2 = min_key__2;
  min_key.cljs$core$IFn$_invoke$arity$3 = min_key__3;
  min_key.cljs$core$IFn$_invoke$arity$variadic = min_key__4.cljs$core$IFn$_invoke$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  partition_all.cljs$core$IFn$_invoke$arity$2 = partition_all__2;
  partition_all.cljs$core$IFn$_invoke$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto__ = cljs.core.seq.call(null, coll);
    if(temp__4092__auto__) {
      var s = temp__4092__auto__;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s), take_while.call(null, pred, cljs.core.rest.call(null, s)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp = cljs.core._comparator.call(null, sc);
    return test.call(null, comp.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, null, cljs.core._GT__EQ_, null], true).call(null, test))) {
      var temp__4092__auto__ = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__4092__auto__)) {
        var vec__4592 = temp__4092__auto__;
        var e = cljs.core.nth.call(null, vec__4592, 0, null);
        var s = vec__4592;
        if(cljs.core.truth_(include.call(null, e))) {
          return s
        }else {
          return cljs.core.next.call(null, s)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__4092__auto__ = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__4092__auto__)) {
      var vec__4593 = temp__4092__auto__;
      var e = cljs.core.nth.call(null, vec__4593, 0, null);
      var s = vec__4593;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e)) ? s : cljs.core.next.call(null, s))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  subseq.cljs$core$IFn$_invoke$arity$3 = subseq__3;
  subseq.cljs$core$IFn$_invoke$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, null, cljs.core._LT__EQ_, null], true).call(null, test))) {
      var temp__4092__auto__ = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__4092__auto__)) {
        var vec__4596 = temp__4092__auto__;
        var e = cljs.core.nth.call(null, vec__4596, 0, null);
        var s = vec__4596;
        if(cljs.core.truth_(include.call(null, e))) {
          return s
        }else {
          return cljs.core.next.call(null, s)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__4092__auto__ = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__4092__auto__)) {
      var vec__4597 = temp__4092__auto__;
      var e = cljs.core.nth.call(null, vec__4597, 0, null);
      var s = vec__4597;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e)) ? s : cljs.core.next.call(null, s))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  rsubseq.cljs$core$IFn$_invoke$arity$3 = rsubseq__3;
  rsubseq.cljs$core$IFn$_invoke$arity$5 = rsubseq__5;
  return rsubseq
}();
goog.provide("cljs.core.Range");
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorStr = "cljs.core/Range";
cljs.core.Range.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var self__ = this;
  var h__2768__auto__ = self__.__hash;
  if(!(h__2768__auto__ == null)) {
    return h__2768__auto__
  }else {
    var h__2768__auto____$1 = cljs.core.hash_coll.call(null, rng);
    self__.__hash = h__2768__auto____$1;
    return h__2768__auto____$1
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var self__ = this;
  if(self__.step > 0) {
    if(self__.start + self__.step < self__.end) {
      return new cljs.core.Range(self__.meta, self__.start + self__.step, self__.end, self__.step, null)
    }else {
      return null
    }
  }else {
    if(self__.start + self__.step > self__.end) {
      return new cljs.core.Range(self__.meta, self__.start + self__.step, self__.end, self__.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var self__ = this;
  if(self__.step > 0) {
    if(self__.start < self__.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(self__.start > self__.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var self__ = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((self__.end - self__.start) / self__.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var self__ = this;
  return self__.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var self__ = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(self__.meta, self__.start + self__.step, self__.end, self__.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta__$1) {
  var self__ = this;
  return new cljs.core.Range(meta__$1, self__.start, self__.end, self__.step, self__.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var self__ = this;
  return self__.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var self__ = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return self__.start + n * self__.step
  }else {
    if(function() {
      var and__3941__auto__ = self__.start > self__.end;
      if(and__3941__auto__) {
        return self__.step === 0
      }else {
        return and__3941__auto__
      }
    }()) {
      return self__.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var self__ = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return self__.start + n * self__.step
  }else {
    if(function() {
      var and__3941__auto__ = self__.start > self__.end;
      if(and__3941__auto__) {
        return self__.step === 0
      }else {
        return and__3941__auto__
      }
    }()) {
      return self__.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  range.cljs$core$IFn$_invoke$arity$0 = range__0;
  range.cljs$core$IFn$_invoke$arity$1 = range__1;
  range.cljs$core$IFn$_invoke$arity$2 = range__2;
  range.cljs$core$IFn$_invoke$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto__ = cljs.core.seq.call(null, coll);
    if(temp__4092__auto__) {
      var s = temp__4092__auto__;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s), take_nth.call(null, n, cljs.core.drop.call(null, n, s)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto__ = cljs.core.seq.call(null, coll);
    if(temp__4092__auto__) {
      var s = temp__4092__auto__;
      var fst = cljs.core.first.call(null, s);
      var fv = f.call(null, fst);
      var run = cljs.core.cons.call(null, fst, cljs.core.take_while.call(null, function(fst, fv) {
        return function(p1__4598_SHARP_) {
          return cljs.core._EQ_.call(null, fv, f.call(null, p1__4598_SHARP_))
        }
      }(fst, fv), cljs.core.next.call(null, s)));
      return cljs.core.cons.call(null, run, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run), s))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core.get.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4090__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4090__auto__) {
        var s = temp__4090__auto__;
        return reductions.call(null, f, cljs.core.first.call(null, s), cljs.core.rest.call(null, s))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s)), cljs.core.rest.call(null, s))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  reductions.cljs$core$IFn$_invoke$arity$2 = reductions__2;
  reductions.cljs$core$IFn$_invoke$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__4609 = null;
      var G__4609__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__4609__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__4609__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__4609__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__4609__4 = function() {
        var G__4610__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__4610 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4610__delegate.call(this, x, y, z, args)
        };
        G__4610.cljs$lang$maxFixedArity = 3;
        G__4610.cljs$lang$applyTo = function(arglist__4611) {
          var x = cljs.core.first(arglist__4611);
          arglist__4611 = cljs.core.next(arglist__4611);
          var y = cljs.core.first(arglist__4611);
          arglist__4611 = cljs.core.next(arglist__4611);
          var z = cljs.core.first(arglist__4611);
          var args = cljs.core.rest(arglist__4611);
          return G__4610__delegate(x, y, z, args)
        };
        G__4610.cljs$core$IFn$_invoke$arity$variadic = G__4610__delegate;
        return G__4610
      }();
      G__4609 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__4609__0.call(this);
          case 1:
            return G__4609__1.call(this, x);
          case 2:
            return G__4609__2.call(this, x, y);
          case 3:
            return G__4609__3.call(this, x, y, z);
          default:
            return G__4609__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__4609.cljs$lang$maxFixedArity = 3;
      G__4609.cljs$lang$applyTo = G__4609__4.cljs$lang$applyTo;
      return G__4609
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__4612 = null;
      var G__4612__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__4612__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__4612__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__4612__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__4612__4 = function() {
        var G__4613__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__4613 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4613__delegate.call(this, x, y, z, args)
        };
        G__4613.cljs$lang$maxFixedArity = 3;
        G__4613.cljs$lang$applyTo = function(arglist__4614) {
          var x = cljs.core.first(arglist__4614);
          arglist__4614 = cljs.core.next(arglist__4614);
          var y = cljs.core.first(arglist__4614);
          arglist__4614 = cljs.core.next(arglist__4614);
          var z = cljs.core.first(arglist__4614);
          var args = cljs.core.rest(arglist__4614);
          return G__4613__delegate(x, y, z, args)
        };
        G__4613.cljs$core$IFn$_invoke$arity$variadic = G__4613__delegate;
        return G__4613
      }();
      G__4612 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__4612__0.call(this);
          case 1:
            return G__4612__1.call(this, x);
          case 2:
            return G__4612__2.call(this, x, y);
          case 3:
            return G__4612__3.call(this, x, y, z);
          default:
            return G__4612__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__4612.cljs$lang$maxFixedArity = 3;
      G__4612.cljs$lang$applyTo = G__4612__4.cljs$lang$applyTo;
      return G__4612
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__4615 = null;
      var G__4615__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__4615__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__4615__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__4615__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__4615__4 = function() {
        var G__4616__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__4616 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4616__delegate.call(this, x, y, z, args)
        };
        G__4616.cljs$lang$maxFixedArity = 3;
        G__4616.cljs$lang$applyTo = function(arglist__4617) {
          var x = cljs.core.first(arglist__4617);
          arglist__4617 = cljs.core.next(arglist__4617);
          var y = cljs.core.first(arglist__4617);
          arglist__4617 = cljs.core.next(arglist__4617);
          var z = cljs.core.first(arglist__4617);
          var args = cljs.core.rest(arglist__4617);
          return G__4616__delegate(x, y, z, args)
        };
        G__4616.cljs$core$IFn$_invoke$arity$variadic = G__4616__delegate;
        return G__4616
      }();
      G__4615 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__4615__0.call(this);
          case 1:
            return G__4615__1.call(this, x);
          case 2:
            return G__4615__2.call(this, x, y);
          case 3:
            return G__4615__3.call(this, x, y, z);
          default:
            return G__4615__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__4615.cljs$lang$maxFixedArity = 3;
      G__4615.cljs$lang$applyTo = G__4615__4.cljs$lang$applyTo;
      return G__4615
    }()
  };
  var juxt__4 = function() {
    var G__4618__delegate = function(f, g, h, fs) {
      var fs__$1 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__4619 = null;
        var G__4619__0 = function() {
          return cljs.core.reduce.call(null, function(p1__4599_SHARP_, p2__4600_SHARP_) {
            return cljs.core.conj.call(null, p1__4599_SHARP_, p2__4600_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__$1)
        };
        var G__4619__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__4601_SHARP_, p2__4602_SHARP_) {
            return cljs.core.conj.call(null, p1__4601_SHARP_, p2__4602_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__$1)
        };
        var G__4619__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__4603_SHARP_, p2__4604_SHARP_) {
            return cljs.core.conj.call(null, p1__4603_SHARP_, p2__4604_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__$1)
        };
        var G__4619__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__4605_SHARP_, p2__4606_SHARP_) {
            return cljs.core.conj.call(null, p1__4605_SHARP_, p2__4606_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__$1)
        };
        var G__4619__4 = function() {
          var G__4620__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__4607_SHARP_, p2__4608_SHARP_) {
              return cljs.core.conj.call(null, p1__4607_SHARP_, cljs.core.apply.call(null, p2__4608_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__$1)
          };
          var G__4620 = function(x, y, z, var_args) {
            var args = null;
            if(arguments.length > 3) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__4620__delegate.call(this, x, y, z, args)
          };
          G__4620.cljs$lang$maxFixedArity = 3;
          G__4620.cljs$lang$applyTo = function(arglist__4621) {
            var x = cljs.core.first(arglist__4621);
            arglist__4621 = cljs.core.next(arglist__4621);
            var y = cljs.core.first(arglist__4621);
            arglist__4621 = cljs.core.next(arglist__4621);
            var z = cljs.core.first(arglist__4621);
            var args = cljs.core.rest(arglist__4621);
            return G__4620__delegate(x, y, z, args)
          };
          G__4620.cljs$core$IFn$_invoke$arity$variadic = G__4620__delegate;
          return G__4620
        }();
        G__4619 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__4619__0.call(this);
            case 1:
              return G__4619__1.call(this, x);
            case 2:
              return G__4619__2.call(this, x, y);
            case 3:
              return G__4619__3.call(this, x, y, z);
            default:
              return G__4619__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw new Error("Invalid arity: " + arguments.length);
        };
        G__4619.cljs$lang$maxFixedArity = 3;
        G__4619.cljs$lang$applyTo = G__4619__4.cljs$lang$applyTo;
        return G__4619
      }()
    };
    var G__4618 = function(f, g, h, var_args) {
      var fs = null;
      if(arguments.length > 3) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4618__delegate.call(this, f, g, h, fs)
    };
    G__4618.cljs$lang$maxFixedArity = 3;
    G__4618.cljs$lang$applyTo = function(arglist__4622) {
      var f = cljs.core.first(arglist__4622);
      arglist__4622 = cljs.core.next(arglist__4622);
      var g = cljs.core.first(arglist__4622);
      arglist__4622 = cljs.core.next(arglist__4622);
      var h = cljs.core.first(arglist__4622);
      var fs = cljs.core.rest(arglist__4622);
      return G__4618__delegate(f, g, h, fs)
    };
    G__4618.cljs$core$IFn$_invoke$arity$variadic = G__4618__delegate;
    return G__4618
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$core$IFn$_invoke$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$core$IFn$_invoke$arity$1 = juxt__1;
  juxt.cljs$core$IFn$_invoke$arity$2 = juxt__2;
  juxt.cljs$core$IFn$_invoke$arity$3 = juxt__3;
  juxt.cljs$core$IFn$_invoke$arity$variadic = juxt__4.cljs$core$IFn$_invoke$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__4623 = cljs.core.next.call(null, coll);
        coll = G__4623;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3941__auto__ = cljs.core.seq.call(null, coll);
        if(and__3941__auto__) {
          return n > 0
        }else {
          return and__3941__auto__
        }
      }())) {
        var G__4624 = n - 1;
        var G__4625 = cljs.core.next.call(null, coll);
        n = G__4624;
        coll = G__4625;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  dorun.cljs$core$IFn$_invoke$arity$1 = dorun__1;
  dorun.cljs$core$IFn$_invoke$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  doall.cljs$core$IFn$_invoke$arity$1 = doall__1;
  doall.cljs$core$IFn$_invoke$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches), s)) {
    if(cljs.core.count.call(null, matches) === 1) {
      return cljs.core.first.call(null, matches)
    }else {
      return cljs.core.vec.call(null, matches)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches = re.exec(s);
  if(matches == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches) === 1) {
      return cljs.core.first.call(null, matches)
    }else {
      return cljs.core.vec.call(null, matches)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data = cljs.core.re_find.call(null, re, s);
  var match_idx = s.search(re);
  var match_str = cljs.core.coll_QMARK_.call(null, match_data) ? cljs.core.first.call(null, match_data) : match_data;
  var post_match = cljs.core.subs.call(null, s, match_idx + cljs.core.count.call(null, match_str));
  if(cljs.core.truth_(match_data)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data, re_seq.call(null, re, post_match))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__4627 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var _ = cljs.core.nth.call(null, vec__4627, 0, null);
  var flags = cljs.core.nth.call(null, vec__4627, 1, null);
  var pattern = cljs.core.nth.call(null, vec__4627, 2, null);
  return new RegExp(pattern, flags)
};
cljs.core.pr_sequential_writer = function pr_sequential_writer(writer, print_one, begin, sep, end, opts, coll) {
  cljs.core._write.call(null, writer, begin);
  if(cljs.core.seq.call(null, coll)) {
    print_one.call(null, cljs.core.first.call(null, coll), writer, opts)
  }else {
  }
  var seq__4632_4636 = cljs.core.seq.call(null, cljs.core.next.call(null, coll));
  var chunk__4633_4637 = null;
  var count__4634_4638 = 0;
  var i__4635_4639 = 0;
  while(true) {
    if(i__4635_4639 < count__4634_4638) {
      var o_4640 = cljs.core._nth.call(null, chunk__4633_4637, i__4635_4639);
      cljs.core._write.call(null, writer, sep);
      print_one.call(null, o_4640, writer, opts);
      var G__4641 = seq__4632_4636;
      var G__4642 = chunk__4633_4637;
      var G__4643 = count__4634_4638;
      var G__4644 = i__4635_4639 + 1;
      seq__4632_4636 = G__4641;
      chunk__4633_4637 = G__4642;
      count__4634_4638 = G__4643;
      i__4635_4639 = G__4644;
      continue
    }else {
      var temp__4092__auto___4645 = cljs.core.seq.call(null, seq__4632_4636);
      if(temp__4092__auto___4645) {
        var seq__4632_4646__$1 = temp__4092__auto___4645;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__4632_4646__$1)) {
          var c__3073__auto___4647 = cljs.core.chunk_first.call(null, seq__4632_4646__$1);
          var G__4648 = cljs.core.chunk_rest.call(null, seq__4632_4646__$1);
          var G__4649 = c__3073__auto___4647;
          var G__4650 = cljs.core.count.call(null, c__3073__auto___4647);
          var G__4651 = 0;
          seq__4632_4636 = G__4648;
          chunk__4633_4637 = G__4649;
          count__4634_4638 = G__4650;
          i__4635_4639 = G__4651;
          continue
        }else {
          var o_4652 = cljs.core.first.call(null, seq__4632_4646__$1);
          cljs.core._write.call(null, writer, sep);
          print_one.call(null, o_4652, writer, opts);
          var G__4653 = cljs.core.next.call(null, seq__4632_4646__$1);
          var G__4654 = null;
          var G__4655 = 0;
          var G__4656 = 0;
          seq__4632_4636 = G__4653;
          chunk__4633_4637 = G__4654;
          count__4634_4638 = G__4655;
          i__4635_4639 = G__4656;
          continue
        }
      }else {
      }
    }
    break
  }
  return cljs.core._write.call(null, writer, end)
};
cljs.core.write_all = function() {
  var write_all__delegate = function(writer, ss) {
    var seq__4661 = cljs.core.seq.call(null, ss);
    var chunk__4662 = null;
    var count__4663 = 0;
    var i__4664 = 0;
    while(true) {
      if(i__4664 < count__4663) {
        var s = cljs.core._nth.call(null, chunk__4662, i__4664);
        cljs.core._write.call(null, writer, s);
        var G__4665 = seq__4661;
        var G__4666 = chunk__4662;
        var G__4667 = count__4663;
        var G__4668 = i__4664 + 1;
        seq__4661 = G__4665;
        chunk__4662 = G__4666;
        count__4663 = G__4667;
        i__4664 = G__4668;
        continue
      }else {
        var temp__4092__auto__ = cljs.core.seq.call(null, seq__4661);
        if(temp__4092__auto__) {
          var seq__4661__$1 = temp__4092__auto__;
          if(cljs.core.chunked_seq_QMARK_.call(null, seq__4661__$1)) {
            var c__3073__auto__ = cljs.core.chunk_first.call(null, seq__4661__$1);
            var G__4669 = cljs.core.chunk_rest.call(null, seq__4661__$1);
            var G__4670 = c__3073__auto__;
            var G__4671 = cljs.core.count.call(null, c__3073__auto__);
            var G__4672 = 0;
            seq__4661 = G__4669;
            chunk__4662 = G__4670;
            count__4663 = G__4671;
            i__4664 = G__4672;
            continue
          }else {
            var s = cljs.core.first.call(null, seq__4661__$1);
            cljs.core._write.call(null, writer, s);
            var G__4673 = cljs.core.next.call(null, seq__4661__$1);
            var G__4674 = null;
            var G__4675 = 0;
            var G__4676 = 0;
            seq__4661 = G__4673;
            chunk__4662 = G__4674;
            count__4663 = G__4675;
            i__4664 = G__4676;
            continue
          }
        }else {
          return null
        }
      }
      break
    }
  };
  var write_all = function(writer, var_args) {
    var ss = null;
    if(arguments.length > 1) {
      ss = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return write_all__delegate.call(this, writer, ss)
  };
  write_all.cljs$lang$maxFixedArity = 1;
  write_all.cljs$lang$applyTo = function(arglist__4677) {
    var writer = cljs.core.first(arglist__4677);
    var ss = cljs.core.rest(arglist__4677);
    return write_all__delegate(writer, ss)
  };
  write_all.cljs$core$IFn$_invoke$arity$variadic = write_all__delegate;
  return write_all
}();
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.char_escapes = {'"':'\\"', "\\":"\\\\", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t"};
cljs.core.quote_string = function quote_string(s) {
  return[cljs.core.str('"'), cljs.core.str(s.replace(RegExp('[\\\\"\b\f\n\r\t]', "g"), function(match) {
    return cljs.core.char_escapes[match]
  })), cljs.core.str('"')].join("")
};
cljs.core.pr_writer = function pr_writer(obj, writer, opts) {
  if(obj == null) {
    return cljs.core._write.call(null, writer, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core._write.call(null, writer, "#<undefined>")
    }else {
      if("\ufdd0:else") {
        if(cljs.core.truth_(function() {
          var and__3941__auto__ = cljs.core.get.call(null, opts, "\ufdd0:meta");
          if(cljs.core.truth_(and__3941__auto__)) {
            var and__3941__auto____$1 = function() {
              var G__4680 = obj;
              if(G__4680) {
                if(function() {
                  var or__3943__auto__ = G__4680.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3943__auto__) {
                    return or__3943__auto__
                  }else {
                    return G__4680.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__4680.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__4680)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__4680)
              }
            }();
            if(cljs.core.truth_(and__3941__auto____$1)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3941__auto____$1
            }
          }else {
            return and__3941__auto__
          }
        }())) {
          cljs.core._write.call(null, writer, "^");
          pr_writer.call(null, cljs.core.meta.call(null, obj), writer, opts);
          cljs.core._write.call(null, writer, " ")
        }else {
        }
        if(obj == null) {
          return cljs.core._write.call(null, writer, "nil")
        }else {
          if(obj.cljs$lang$type) {
            return obj.cljs$lang$ctorPrWriter(obj, writer, opts)
          }else {
            if(function() {
              var G__4681 = obj;
              if(G__4681) {
                if(function() {
                  var or__3943__auto__ = G__4681.cljs$lang$protocol_mask$partition0$ & 2147483648;
                  if(or__3943__auto__) {
                    return or__3943__auto__
                  }else {
                    return G__4681.cljs$core$IPrintWithWriter$
                  }
                }()) {
                  return true
                }else {
                  return false
                }
              }else {
                return false
              }
            }()) {
              return cljs.core._pr_writer.call(null, obj, writer, opts)
            }else {
              if(function() {
                var or__3943__auto__ = cljs.core.type.call(null, obj) === Boolean;
                if(or__3943__auto__) {
                  return or__3943__auto__
                }else {
                  return typeof obj === "number"
                }
              }()) {
                return cljs.core._write.call(null, writer, [cljs.core.str(obj)].join(""))
              }else {
                if(obj instanceof Array) {
                  return cljs.core.pr_sequential_writer.call(null, writer, pr_writer, "#<Array [", ", ", "]>", opts, obj)
                }else {
                  if(goog.isString(obj)) {
                    if(cljs.core.keyword_QMARK_.call(null, obj)) {
                      cljs.core._write.call(null, writer, ":");
                      var temp__4092__auto___4682 = cljs.core.namespace.call(null, obj);
                      if(cljs.core.truth_(temp__4092__auto___4682)) {
                        var nspc_4683 = temp__4092__auto___4682;
                        cljs.core.write_all.call(null, writer, [cljs.core.str(nspc_4683)].join(""), "/")
                      }else {
                      }
                      return cljs.core._write.call(null, writer, cljs.core.name.call(null, obj))
                    }else {
                      if(obj instanceof cljs.core.Symbol) {
                        var temp__4092__auto___4684 = cljs.core.namespace.call(null, obj);
                        if(cljs.core.truth_(temp__4092__auto___4684)) {
                          var nspc_4685 = temp__4092__auto___4684;
                          cljs.core.write_all.call(null, writer, [cljs.core.str(nspc_4685)].join(""), "/")
                        }else {
                        }
                        return cljs.core._write.call(null, writer, cljs.core.name.call(null, obj))
                      }else {
                        if("\ufdd0:else") {
                          if(cljs.core.truth_((new cljs.core.Keyword("\ufdd0:readably")).call(null, opts))) {
                            return cljs.core._write.call(null, writer, cljs.core.quote_string.call(null, obj))
                          }else {
                            return cljs.core._write.call(null, writer, obj)
                          }
                        }else {
                          return null
                        }
                      }
                    }
                  }else {
                    if(cljs.core.fn_QMARK_.call(null, obj)) {
                      return cljs.core.write_all.call(null, writer, "#<", [cljs.core.str(obj)].join(""), ">")
                    }else {
                      if(obj instanceof Date) {
                        var normalize = function(n, len) {
                          var ns = [cljs.core.str(n)].join("");
                          while(true) {
                            if(cljs.core.count.call(null, ns) < len) {
                              var G__4686 = [cljs.core.str("0"), cljs.core.str(ns)].join("");
                              ns = G__4686;
                              continue
                            }else {
                              return ns
                            }
                            break
                          }
                        };
                        return cljs.core.write_all.call(null, writer, '#inst "', [cljs.core.str(obj.getUTCFullYear())].join(""), "-", normalize.call(null, obj.getUTCMonth() + 1, 2), "-", normalize.call(null, obj.getUTCDate(), 2), "T", normalize.call(null, obj.getUTCHours(), 2), ":", normalize.call(null, obj.getUTCMinutes(), 2), ":", normalize.call(null, obj.getUTCSeconds(), 2), ".", normalize.call(null, obj.getUTCMilliseconds(), 3), "-", '00:00"')
                      }else {
                        if(cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj))) {
                          return cljs.core.write_all.call(null, writer, '#"', obj.source, '"')
                        }else {
                          if("\ufdd0:else") {
                            return cljs.core.write_all.call(null, writer, "#<", [cljs.core.str(obj)].join(""), ">")
                          }else {
                            return null
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_seq_writer = function pr_seq_writer(objs, writer, opts) {
  cljs.core.pr_writer.call(null, cljs.core.first.call(null, objs), writer, opts);
  var seq__4691 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  var chunk__4692 = null;
  var count__4693 = 0;
  var i__4694 = 0;
  while(true) {
    if(i__4694 < count__4693) {
      var obj = cljs.core._nth.call(null, chunk__4692, i__4694);
      cljs.core._write.call(null, writer, " ");
      cljs.core.pr_writer.call(null, obj, writer, opts);
      var G__4695 = seq__4691;
      var G__4696 = chunk__4692;
      var G__4697 = count__4693;
      var G__4698 = i__4694 + 1;
      seq__4691 = G__4695;
      chunk__4692 = G__4696;
      count__4693 = G__4697;
      i__4694 = G__4698;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__4691);
      if(temp__4092__auto__) {
        var seq__4691__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__4691__$1)) {
          var c__3073__auto__ = cljs.core.chunk_first.call(null, seq__4691__$1);
          var G__4699 = cljs.core.chunk_rest.call(null, seq__4691__$1);
          var G__4700 = c__3073__auto__;
          var G__4701 = cljs.core.count.call(null, c__3073__auto__);
          var G__4702 = 0;
          seq__4691 = G__4699;
          chunk__4692 = G__4700;
          count__4693 = G__4701;
          i__4694 = G__4702;
          continue
        }else {
          var obj = cljs.core.first.call(null, seq__4691__$1);
          cljs.core._write.call(null, writer, " ");
          cljs.core.pr_writer.call(null, obj, writer, opts);
          var G__4703 = cljs.core.next.call(null, seq__4691__$1);
          var G__4704 = null;
          var G__4705 = 0;
          var G__4706 = 0;
          seq__4691 = G__4703;
          chunk__4692 = G__4704;
          count__4693 = G__4705;
          i__4694 = G__4706;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
};
cljs.core.pr_sb_with_opts = function pr_sb_with_opts(objs, opts) {
  var sb = new goog.string.StringBuffer;
  var writer = new cljs.core.StringBufferWriter(sb);
  cljs.core.pr_seq_writer.call(null, objs, writer, opts);
  cljs.core._flush.call(null, writer);
  return sb
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  if(cljs.core.empty_QMARK_.call(null, objs)) {
    return""
  }else {
    return[cljs.core.str(cljs.core.pr_sb_with_opts.call(null, objs, opts))].join("")
  }
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  if(cljs.core.empty_QMARK_.call(null, objs)) {
    return"\n"
  }else {
    var sb = cljs.core.pr_sb_with_opts.call(null, objs, opts);
    sb.append("\n");
    return[cljs.core.str(sb)].join("")
  }
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  return cljs.core.string_print.call(null, cljs.core.pr_str_with_opts.call(null, objs, opts))
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core.get.call(null, opts, "\ufdd0:flush-on-newline"))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__4707) {
    var objs = cljs.core.seq(arglist__4707);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$core$IFn$_invoke$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__4708) {
    var objs = cljs.core.seq(arglist__4708);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$core$IFn$_invoke$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__4709) {
    var objs = cljs.core.seq(arglist__4709);
    return pr__delegate(objs)
  };
  pr.cljs$core$IFn$_invoke$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0:readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__4710) {
    var objs = cljs.core.seq(arglist__4710);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$core$IFn$_invoke$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0:readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__4711) {
    var objs = cljs.core.seq(arglist__4711);
    return print_str__delegate(objs)
  };
  print_str.cljs$core$IFn$_invoke$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0:readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__4712) {
    var objs = cljs.core.seq(arglist__4712);
    return println__delegate(objs)
  };
  println.cljs$core$IFn$_invoke$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0:readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__4713) {
    var objs = cljs.core.seq(arglist__4713);
    return println_str__delegate(objs)
  };
  println_str.cljs$core$IFn$_invoke$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__4714) {
    var objs = cljs.core.seq(arglist__4714);
    return prn__delegate(objs)
  };
  prn.cljs$core$IFn$_invoke$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.printf = function() {
  var printf__delegate = function(fmt, args) {
    return cljs.core.print.call(null, cljs.core.apply.call(null, cljs.core.format, fmt, args))
  };
  var printf = function(fmt, var_args) {
    var args = null;
    if(arguments.length > 1) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return printf__delegate.call(this, fmt, args)
  };
  printf.cljs$lang$maxFixedArity = 1;
  printf.cljs$lang$applyTo = function(arglist__4715) {
    var fmt = cljs.core.first(arglist__4715);
    var args = cljs.core.rest(arglist__4715);
    return printf__delegate(fmt, args)
  };
  printf.cljs$core$IFn$_invoke$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.IndexedSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "#{", " ", "}", opts, coll)
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.List.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.EmptyList.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core._write.call(null, writer, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
cljs.core.Cons.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.Range.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
cljs.core.Subvec.prototype.cljs$core$IComparable$ = true;
cljs.core.Subvec.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
goog.provide("cljs.core.Atom");
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition0$ = 2153938944;
  this.cljs$lang$protocol_mask$partition1$ = 2
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorStr = "cljs.core/Atom";
cljs.core.Atom.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var self__ = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var self__ = this;
  var seq__4716 = cljs.core.seq.call(null, self__.watches);
  var chunk__4717 = null;
  var count__4718 = 0;
  var i__4719 = 0;
  while(true) {
    if(i__4719 < count__4718) {
      var vec__4720 = cljs.core._nth.call(null, chunk__4717, i__4719);
      var key = cljs.core.nth.call(null, vec__4720, 0, null);
      var f = cljs.core.nth.call(null, vec__4720, 1, null);
      f.call(null, key, this$, oldval, newval);
      var G__4722 = seq__4716;
      var G__4723 = chunk__4717;
      var G__4724 = count__4718;
      var G__4725 = i__4719 + 1;
      seq__4716 = G__4722;
      chunk__4717 = G__4723;
      count__4718 = G__4724;
      i__4719 = G__4725;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__4716);
      if(temp__4092__auto__) {
        var seq__4716__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__4716__$1)) {
          var c__3073__auto__ = cljs.core.chunk_first.call(null, seq__4716__$1);
          var G__4726 = cljs.core.chunk_rest.call(null, seq__4716__$1);
          var G__4727 = c__3073__auto__;
          var G__4728 = cljs.core.count.call(null, c__3073__auto__);
          var G__4729 = 0;
          seq__4716 = G__4726;
          chunk__4717 = G__4727;
          count__4718 = G__4728;
          i__4719 = G__4729;
          continue
        }else {
          var vec__4721 = cljs.core.first.call(null, seq__4716__$1);
          var key = cljs.core.nth.call(null, vec__4721, 0, null);
          var f = cljs.core.nth.call(null, vec__4721, 1, null);
          f.call(null, key, this$, oldval, newval);
          var G__4730 = cljs.core.next.call(null, seq__4716__$1);
          var G__4731 = null;
          var G__4732 = 0;
          var G__4733 = 0;
          seq__4716 = G__4730;
          chunk__4717 = G__4731;
          count__4718 = G__4732;
          i__4719 = G__4733;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var self__ = this;
  return this$.watches = cljs.core.assoc.call(null, self__.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var self__ = this;
  return this$.watches = cljs.core.dissoc.call(null, self__.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(a, writer, opts) {
  var self__ = this;
  cljs.core._write.call(null, writer, "#<Atom: ");
  cljs.core.pr_writer.call(null, self__.state, writer, opts);
  return cljs.core._write.call(null, writer, ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var self__ = this;
  return self__.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var self__ = this;
  return self__.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var self__ = this;
  return o === other
};
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__4737__delegate = function(x, p__4734) {
      var map__4736 = p__4734;
      var map__4736__$1 = cljs.core.seq_QMARK_.call(null, map__4736) ? cljs.core.apply.call(null, cljs.core.hash_map, map__4736) : map__4736;
      var validator = cljs.core.get.call(null, map__4736__$1, "\ufdd0:validator");
      var meta = cljs.core.get.call(null, map__4736__$1, "\ufdd0:meta");
      return new cljs.core.Atom(x, meta, validator, null)
    };
    var G__4737 = function(x, var_args) {
      var p__4734 = null;
      if(arguments.length > 1) {
        p__4734 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__4737__delegate.call(this, x, p__4734)
    };
    G__4737.cljs$lang$maxFixedArity = 1;
    G__4737.cljs$lang$applyTo = function(arglist__4738) {
      var x = cljs.core.first(arglist__4738);
      var p__4734 = cljs.core.rest(arglist__4738);
      return G__4737__delegate(x, p__4734)
    };
    G__4737.cljs$core$IFn$_invoke$arity$variadic = G__4737__delegate;
    return G__4737
  }();
  atom = function(x, var_args) {
    var p__4734 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$core$IFn$_invoke$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$core$IFn$_invoke$arity$1 = atom__1;
  atom.cljs$core$IFn$_invoke$arity$variadic = atom__2.cljs$core$IFn$_invoke$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__4092__auto___4739 = a.validator;
  if(cljs.core.truth_(temp__4092__auto___4739)) {
    var validate_4740 = temp__4092__auto___4739;
    if(cljs.core.truth_(validate_4740.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list(new cljs.core.Symbol(null, "validate", "validate", 1233162959, null), new cljs.core.Symbol(null, "new-value", "new-value", 972165309, null)), cljs.core.hash_map("\ufdd0:line", 6673, "\ufdd0:column", 13))))].join(""));
    }
  }else {
  }
  var old_value_4741 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value_4741, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__4742__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__4742 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(arguments.length > 5) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__4742__delegate.call(this, a, f, x, y, z, more)
    };
    G__4742.cljs$lang$maxFixedArity = 5;
    G__4742.cljs$lang$applyTo = function(arglist__4743) {
      var a = cljs.core.first(arglist__4743);
      arglist__4743 = cljs.core.next(arglist__4743);
      var f = cljs.core.first(arglist__4743);
      arglist__4743 = cljs.core.next(arglist__4743);
      var x = cljs.core.first(arglist__4743);
      arglist__4743 = cljs.core.next(arglist__4743);
      var y = cljs.core.first(arglist__4743);
      arglist__4743 = cljs.core.next(arglist__4743);
      var z = cljs.core.first(arglist__4743);
      var more = cljs.core.rest(arglist__4743);
      return G__4742__delegate(a, f, x, y, z, more)
    };
    G__4742.cljs$core$IFn$_invoke$arity$variadic = G__4742__delegate;
    return G__4742
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$core$IFn$_invoke$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$core$IFn$_invoke$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$core$IFn$_invoke$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$core$IFn$_invoke$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$core$IFn$_invoke$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$core$IFn$_invoke$arity$variadic = swap_BANG___6.cljs$core$IFn$_invoke$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(arguments.length > 2) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__4744) {
    var iref = cljs.core.first(arglist__4744);
    arglist__4744 = cljs.core.next(arglist__4744);
    var f = cljs.core.first(arglist__4744);
    var args = cljs.core.rest(arglist__4744);
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$core$IFn$_invoke$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  gensym.cljs$core$IFn$_invoke$arity$0 = gensym__0;
  gensym.cljs$core$IFn$_invoke$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
goog.provide("cljs.core.Delay");
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorStr = "cljs.core/Delay";
cljs.core.Delay.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var self__ = this;
  return(new cljs.core.Keyword("\ufdd0:done")).call(null, cljs.core.deref.call(null, self__.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var self__ = this;
  return(new cljs.core.Keyword("\ufdd0:value")).call(null, cljs.core.swap_BANG_.call(null, self__.state, function(p__4745) {
    var map__4746 = p__4745;
    var map__4746__$1 = cljs.core.seq_QMARK_.call(null, map__4746) ? cljs.core.apply.call(null, cljs.core.hash_map, map__4746) : map__4746;
    var curr_state = map__4746__$1;
    var done = cljs.core.get.call(null, map__4746__$1, "\ufdd0:done");
    if(cljs.core.truth_(done)) {
      return curr_state
    }else {
      return cljs.core.PersistentArrayMap.fromArray(["\ufdd0:done", true, "\ufdd0:value", self__.f.call(null)], true)
    }
  }))
};
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return x instanceof cljs.core.Delay
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.IEncodeJS = {};
cljs.core._clj__GT_js = function _clj__GT_js(x) {
  if(function() {
    var and__3941__auto__ = x;
    if(and__3941__auto__) {
      return x.cljs$core$IEncodeJS$_clj__GT_js$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return x.cljs$core$IEncodeJS$_clj__GT_js$arity$1(x)
  }else {
    var x__2942__auto__ = x == null ? null : x;
    return function() {
      var or__3943__auto__ = cljs.core._clj__GT_js[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._clj__GT_js["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IEncodeJS.-clj->js", x);
        }
      }
    }().call(null, x)
  }
};
cljs.core._key__GT_js = function _key__GT_js(x) {
  if(function() {
    var and__3941__auto__ = x;
    if(and__3941__auto__) {
      return x.cljs$core$IEncodeJS$_key__GT_js$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return x.cljs$core$IEncodeJS$_key__GT_js$arity$1(x)
  }else {
    var x__2942__auto__ = x == null ? null : x;
    return function() {
      var or__3943__auto__ = cljs.core._key__GT_js[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._key__GT_js["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IEncodeJS.-key->js", x);
        }
      }
    }().call(null, x)
  }
};
cljs.core.key__GT_js = function key__GT_js(k) {
  if(function() {
    var G__4748 = k;
    if(G__4748) {
      if(cljs.core.truth_(function() {
        var or__3943__auto__ = null;
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          return G__4748.cljs$core$IEncodeJS$
        }
      }())) {
        return true
      }else {
        if(!G__4748.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEncodeJS, G__4748)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEncodeJS, G__4748)
    }
  }()) {
    return cljs.core._clj__GT_js.call(null, k)
  }else {
    if(function() {
      var or__3943__auto__ = cljs.core.string_QMARK_.call(null, k);
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = typeof k === "number";
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          var or__3943__auto____$2 = cljs.core.keyword_QMARK_.call(null, k);
          if(or__3943__auto____$2) {
            return or__3943__auto____$2
          }else {
            return k instanceof cljs.core.Symbol
          }
        }
      }
    }()) {
      return cljs.core.clj__GT_js.call(null, k)
    }else {
      return cljs.core.pr_str.call(null, k)
    }
  }
};
cljs.core.clj__GT_js = function clj__GT_js(x) {
  if(x == null) {
    return null
  }else {
    if(function() {
      var G__4756 = x;
      if(G__4756) {
        if(cljs.core.truth_(function() {
          var or__3943__auto__ = null;
          if(cljs.core.truth_(or__3943__auto__)) {
            return or__3943__auto__
          }else {
            return G__4756.cljs$core$IEncodeJS$
          }
        }())) {
          return true
        }else {
          if(!G__4756.cljs$lang$protocol_mask$partition$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IEncodeJS, G__4756)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IEncodeJS, G__4756)
      }
    }()) {
      return cljs.core._clj__GT_js.call(null, x)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.name.call(null, x)
      }else {
        if(x instanceof cljs.core.Symbol) {
          return[cljs.core.str(x)].join("")
        }else {
          if(cljs.core.map_QMARK_.call(null, x)) {
            var m = {};
            var seq__4757_4763 = cljs.core.seq.call(null, x);
            var chunk__4758_4764 = null;
            var count__4759_4765 = 0;
            var i__4760_4766 = 0;
            while(true) {
              if(i__4760_4766 < count__4759_4765) {
                var vec__4761_4767 = cljs.core._nth.call(null, chunk__4758_4764, i__4760_4766);
                var k_4768 = cljs.core.nth.call(null, vec__4761_4767, 0, null);
                var v_4769 = cljs.core.nth.call(null, vec__4761_4767, 1, null);
                m[cljs.core.key__GT_js.call(null, k_4768)] = clj__GT_js.call(null, v_4769);
                var G__4770 = seq__4757_4763;
                var G__4771 = chunk__4758_4764;
                var G__4772 = count__4759_4765;
                var G__4773 = i__4760_4766 + 1;
                seq__4757_4763 = G__4770;
                chunk__4758_4764 = G__4771;
                count__4759_4765 = G__4772;
                i__4760_4766 = G__4773;
                continue
              }else {
                var temp__4092__auto___4774 = cljs.core.seq.call(null, seq__4757_4763);
                if(temp__4092__auto___4774) {
                  var seq__4757_4775__$1 = temp__4092__auto___4774;
                  if(cljs.core.chunked_seq_QMARK_.call(null, seq__4757_4775__$1)) {
                    var c__3073__auto___4776 = cljs.core.chunk_first.call(null, seq__4757_4775__$1);
                    var G__4777 = cljs.core.chunk_rest.call(null, seq__4757_4775__$1);
                    var G__4778 = c__3073__auto___4776;
                    var G__4779 = cljs.core.count.call(null, c__3073__auto___4776);
                    var G__4780 = 0;
                    seq__4757_4763 = G__4777;
                    chunk__4758_4764 = G__4778;
                    count__4759_4765 = G__4779;
                    i__4760_4766 = G__4780;
                    continue
                  }else {
                    var vec__4762_4781 = cljs.core.first.call(null, seq__4757_4775__$1);
                    var k_4782 = cljs.core.nth.call(null, vec__4762_4781, 0, null);
                    var v_4783 = cljs.core.nth.call(null, vec__4762_4781, 1, null);
                    m[cljs.core.key__GT_js.call(null, k_4782)] = clj__GT_js.call(null, v_4783);
                    var G__4784 = cljs.core.next.call(null, seq__4757_4775__$1);
                    var G__4785 = null;
                    var G__4786 = 0;
                    var G__4787 = 0;
                    seq__4757_4763 = G__4784;
                    chunk__4758_4764 = G__4785;
                    count__4759_4765 = G__4786;
                    i__4760_4766 = G__4787;
                    continue
                  }
                }else {
                }
              }
              break
            }
            return m
          }else {
            if(cljs.core.coll_QMARK_.call(null, x)) {
              return cljs.core.apply.call(null, cljs.core.array, cljs.core.map.call(null, clj__GT_js, x))
            }else {
              if("\ufdd0:else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.IEncodeClojure = {};
cljs.core._js__GT_clj = function _js__GT_clj(x, options) {
  if(function() {
    var and__3941__auto__ = x;
    if(and__3941__auto__) {
      return x.cljs$core$IEncodeClojure$_js__GT_clj$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return x.cljs$core$IEncodeClojure$_js__GT_clj$arity$2(x, options)
  }else {
    var x__2942__auto__ = x == null ? null : x;
    return function() {
      var or__3943__auto__ = cljs.core._js__GT_clj[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._js__GT_clj["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IEncodeClojure.-js->clj", x);
        }
      }
    }().call(null, x, options)
  }
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj = null;
  var js__GT_clj__1 = function(x) {
    return js__GT_clj.call(null, x, cljs.core.PersistentArrayMap.fromArray(["\ufdd0:keywordize-keys", false], true))
  };
  var js__GT_clj__2 = function() {
    var G__4808__delegate = function(x, opts) {
      if(function() {
        var G__4798 = cljs.core.IEncodeClojure;
        if(G__4798) {
          if(cljs.core.truth_(function() {
            var or__3943__auto__ = null;
            if(cljs.core.truth_(or__3943__auto__)) {
              return or__3943__auto__
            }else {
              return G__4798.cljs$core$x$
            }
          }())) {
            return true
          }else {
            if(!G__4798.cljs$lang$protocol_mask$partition$) {
              return cljs.core.type_satisfies_.call(null, x, G__4798)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, x, G__4798)
        }
      }()) {
        return cljs.core._js__GT_clj.call(null, x, cljs.core.apply.call(null, cljs.core.array_map, opts))
      }else {
        if(cljs.core.seq.call(null, opts)) {
          var map__4799 = opts;
          var map__4799__$1 = cljs.core.seq_QMARK_.call(null, map__4799) ? cljs.core.apply.call(null, cljs.core.hash_map, map__4799) : map__4799;
          var keywordize_keys = cljs.core.get.call(null, map__4799__$1, "\ufdd0:keywordize-keys");
          var keyfn = cljs.core.truth_(keywordize_keys) ? cljs.core.keyword : cljs.core.str;
          var f = function(map__4799, map__4799__$1, keywordize_keys, keyfn) {
            return function thisfn(x__$1) {
              if(cljs.core.seq_QMARK_.call(null, x__$1)) {
                return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x__$1))
              }else {
                if(cljs.core.coll_QMARK_.call(null, x__$1)) {
                  return cljs.core.into.call(null, cljs.core.empty.call(null, x__$1), cljs.core.map.call(null, thisfn, x__$1))
                }else {
                  if(x__$1 instanceof Array) {
                    return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x__$1))
                  }else {
                    if(cljs.core.type.call(null, x__$1) === Object) {
                      return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
                        var iter__3042__auto__ = function(map__4799, map__4799__$1, keywordize_keys, keyfn) {
                          return function iter__4804(s__4805) {
                            return new cljs.core.LazySeq(null, false, function(map__4799, map__4799__$1, keywordize_keys, keyfn) {
                              return function() {
                                var s__4805__$1 = s__4805;
                                while(true) {
                                  var temp__4092__auto__ = cljs.core.seq.call(null, s__4805__$1);
                                  if(temp__4092__auto__) {
                                    var s__4805__$2 = temp__4092__auto__;
                                    if(cljs.core.chunked_seq_QMARK_.call(null, s__4805__$2)) {
                                      var c__3040__auto__ = cljs.core.chunk_first.call(null, s__4805__$2);
                                      var size__3041__auto__ = cljs.core.count.call(null, c__3040__auto__);
                                      var b__4807 = cljs.core.chunk_buffer.call(null, size__3041__auto__);
                                      if(function() {
                                        var i__4806 = 0;
                                        while(true) {
                                          if(i__4806 < size__3041__auto__) {
                                            var k = cljs.core._nth.call(null, c__3040__auto__, i__4806);
                                            cljs.core.chunk_append.call(null, b__4807, cljs.core.PersistentVector.fromArray([keyfn.call(null, k), thisfn.call(null, x__$1[k])], true));
                                            var G__4809 = i__4806 + 1;
                                            i__4806 = G__4809;
                                            continue
                                          }else {
                                            return true
                                          }
                                          break
                                        }
                                      }()) {
                                        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__4807), iter__4804.call(null, cljs.core.chunk_rest.call(null, s__4805__$2)))
                                      }else {
                                        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__4807), null)
                                      }
                                    }else {
                                      var k = cljs.core.first.call(null, s__4805__$2);
                                      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn.call(null, k), thisfn.call(null, x__$1[k])], true), iter__4804.call(null, cljs.core.rest.call(null, s__4805__$2)))
                                    }
                                  }else {
                                    return null
                                  }
                                  break
                                }
                              }
                            }(map__4799, map__4799__$1, keywordize_keys, keyfn), null)
                          }
                        }(map__4799, map__4799__$1, keywordize_keys, keyfn);
                        return iter__3042__auto__.call(null, cljs.core.js_keys.call(null, x__$1))
                      }())
                    }else {
                      if("\ufdd0:else") {
                        return x__$1
                      }else {
                        return null
                      }
                    }
                  }
                }
              }
            }
          }(map__4799, map__4799__$1, keywordize_keys, keyfn);
          return f.call(null, x)
        }else {
          return null
        }
      }
    };
    var G__4808 = function(x, var_args) {
      var opts = null;
      if(arguments.length > 1) {
        opts = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__4808__delegate.call(this, x, opts)
    };
    G__4808.cljs$lang$maxFixedArity = 1;
    G__4808.cljs$lang$applyTo = function(arglist__4810) {
      var x = cljs.core.first(arglist__4810);
      var opts = cljs.core.rest(arglist__4810);
      return G__4808__delegate(x, opts)
    };
    G__4808.cljs$core$IFn$_invoke$arity$variadic = G__4808__delegate;
    return G__4808
  }();
  js__GT_clj = function(x, var_args) {
    var opts = var_args;
    switch(arguments.length) {
      case 1:
        return js__GT_clj__1.call(this, x);
      default:
        return js__GT_clj__2.cljs$core$IFn$_invoke$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = js__GT_clj__2.cljs$lang$applyTo;
  js__GT_clj.cljs$core$IFn$_invoke$arity$1 = js__GT_clj__1;
  js__GT_clj.cljs$core$IFn$_invoke$arity$variadic = js__GT_clj__2.cljs$core$IFn$_invoke$arity$variadic;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__4811__delegate = function(args) {
      var temp__4090__auto__ = cljs.core.get.call(null, cljs.core.deref.call(null, mem), args);
      if(cljs.core.truth_(temp__4090__auto__)) {
        var v = temp__4090__auto__;
        return v
      }else {
        var ret = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem, cljs.core.assoc, args, ret);
        return ret
      }
    };
    var G__4811 = function(var_args) {
      var args = null;
      if(arguments.length > 0) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__4811__delegate.call(this, args)
    };
    G__4811.cljs$lang$maxFixedArity = 0;
    G__4811.cljs$lang$applyTo = function(arglist__4812) {
      var args = cljs.core.seq(arglist__4812);
      return G__4811__delegate(args)
    };
    G__4811.cljs$core$IFn$_invoke$arity$variadic = G__4811__delegate;
    return G__4811
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret)) {
        var G__4813 = ret;
        f = G__4813;
        continue
      }else {
        return ret
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__4814__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__4814 = function(f, var_args) {
      var args = null;
      if(arguments.length > 1) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__4814__delegate.call(this, f, args)
    };
    G__4814.cljs$lang$maxFixedArity = 1;
    G__4814.cljs$lang$applyTo = function(arglist__4815) {
      var f = cljs.core.first(arglist__4815);
      var args = cljs.core.rest(arglist__4815);
      return G__4814__delegate(f, args)
    };
    G__4814.cljs$core$IFn$_invoke$arity$variadic = G__4814__delegate;
    return G__4814
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$core$IFn$_invoke$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$core$IFn$_invoke$arity$1 = trampoline__1;
  trampoline.cljs$core$IFn$_invoke$arity$variadic = trampoline__2.cljs$core$IFn$_invoke$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random.call(null) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  rand.cljs$core$IFn$_invoke$arity$0 = rand__0;
  rand.cljs$core$IFn$_invoke$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.call(null, Math.random.call(null) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.PersistentArrayMap.fromArray(["\ufdd0:parents", cljs.core.ObjMap.EMPTY, "\ufdd0:descendants", cljs.core.ObjMap.EMPTY, "\ufdd0:ancestors", cljs.core.ObjMap.EMPTY], true)
};
cljs.core._global_hierarchy = null;
cljs.core.get_global_hierarchy = function get_global_hierarchy() {
  if(cljs.core._global_hierarchy == null) {
    cljs.core._global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null))
  }else {
  }
  return cljs.core._global_hierarchy
};
cljs.core.swap_global_hierarchy_BANG_ = function() {
  var swap_global_hierarchy_BANG___delegate = function(f, args) {
    return cljs.core.apply.call(null, cljs.core.swap_BANG_, cljs.core.get_global_hierarchy.call(null), f, args)
  };
  var swap_global_hierarchy_BANG_ = function(f, var_args) {
    var args = null;
    if(arguments.length > 1) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return swap_global_hierarchy_BANG___delegate.call(this, f, args)
  };
  swap_global_hierarchy_BANG_.cljs$lang$maxFixedArity = 1;
  swap_global_hierarchy_BANG_.cljs$lang$applyTo = function(arglist__4816) {
    var f = cljs.core.first(arglist__4816);
    var args = cljs.core.rest(arglist__4816);
    return swap_global_hierarchy_BANG___delegate(f, args)
  };
  swap_global_hierarchy_BANG_.cljs$core$IFn$_invoke$arity$variadic = swap_global_hierarchy_BANG___delegate;
  return swap_global_hierarchy_BANG_
}();
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.get_global_hierarchy.call(null)), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3943__auto__ = cljs.core._EQ_.call(null, child, parent);
    if(or__3943__auto__) {
      return or__3943__auto__
    }else {
      var or__3943__auto____$1 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0:ancestors")).call(null, h).call(null, child), parent);
      if(or__3943__auto____$1) {
        return or__3943__auto____$1
      }else {
        var and__3941__auto__ = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3941__auto__) {
          var and__3941__auto____$1 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3941__auto____$1) {
            var and__3941__auto____$2 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3941__auto____$2) {
              var ret = true;
              var i = 0;
              while(true) {
                if(function() {
                  var or__3943__auto____$2 = cljs.core.not.call(null, ret);
                  if(or__3943__auto____$2) {
                    return or__3943__auto____$2
                  }else {
                    return i === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret
                }else {
                  var G__4817 = isa_QMARK_.call(null, h, child.call(null, i), parent.call(null, i));
                  var G__4818 = i + 1;
                  ret = G__4817;
                  i = G__4818;
                  continue
                }
                break
              }
            }else {
              return and__3941__auto____$2
            }
          }else {
            return and__3941__auto____$1
          }
        }else {
          return and__3941__auto__
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  isa_QMARK_.cljs$core$IFn$_invoke$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$core$IFn$_invoke$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.get_global_hierarchy.call(null)), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, (new cljs.core.Keyword("\ufdd0:parents")).call(null, h), tag))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  parents.cljs$core$IFn$_invoke$arity$1 = parents__1;
  parents.cljs$core$IFn$_invoke$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.get_global_hierarchy.call(null)), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, (new cljs.core.Keyword("\ufdd0:ancestors")).call(null, h), tag))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  ancestors.cljs$core$IFn$_invoke$arity$1 = ancestors__1;
  ancestors.cljs$core$IFn$_invoke$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.get_global_hierarchy.call(null)), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, (new cljs.core.Keyword("\ufdd0:descendants")).call(null, h), tag))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  descendants.cljs$core$IFn$_invoke$arity$1 = descendants__1;
  descendants.cljs$core$IFn$_invoke$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list(new cljs.core.Symbol(null, "namespace", "namespace", -388313324, null), new cljs.core.Symbol(null, "parent", "parent", 1659011683, null)), cljs.core.hash_map("\ufdd0:line", 7014, "\ufdd0:column", 12))))].join(""));
    }
    cljs.core.swap_global_hierarchy_BANG_.call(null, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list(new cljs.core.Symbol(null, "not=", "not=", -1637144189, null), new cljs.core.Symbol(null, "tag", "tag", -1640416941, null), new cljs.core.Symbol(null, "parent", "parent", 1659011683, null)), cljs.core.hash_map("\ufdd0:line", 7018, "\ufdd0:column", 12))))].join(""));
    }
    var tp = (new cljs.core.Keyword("\ufdd0:parents")).call(null, h);
    var td = (new cljs.core.Keyword("\ufdd0:descendants")).call(null, h);
    var ta = (new cljs.core.Keyword("\ufdd0:ancestors")).call(null, h);
    var tf = function(tp, td, ta) {
      return function(m, source, sources, target, targets) {
        return cljs.core.reduce.call(null, function(tp, td, ta) {
          return function(ret, k) {
            return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
          }
        }(tp, td, ta), m, cljs.core.cons.call(null, source, sources.call(null, source)))
      }
    }(tp, td, ta);
    var or__3943__auto__ = cljs.core.contains_QMARK_.call(null, tp.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.PersistentArrayMap.fromArray(["\ufdd0:parents", cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0:parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0:ancestors", tf.call(null, (new cljs.core.Keyword("\ufdd0:ancestors")).call(null, h), tag, td, parent, ta), "\ufdd0:descendants", tf.call(null, (new cljs.core.Keyword("\ufdd0:descendants")).call(null, h), parent, ta, tag, td)], 
      true)
    }();
    if(cljs.core.truth_(or__3943__auto__)) {
      return or__3943__auto__
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  derive.cljs$core$IFn$_invoke$arity$2 = derive__2;
  derive.cljs$core$IFn$_invoke$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_global_hierarchy_BANG_.call(null, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap = (new cljs.core.Keyword("\ufdd0:parents")).call(null, h);
    var childsParents = cljs.core.truth_(parentMap.call(null, tag)) ? cljs.core.disj.call(null, parentMap.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents)) ? cljs.core.assoc.call(null, parentMap, tag, childsParents) : cljs.core.dissoc.call(null, parentMap, tag);
    var deriv_seq = cljs.core.flatten.call(null, cljs.core.map.call(null, function(parentMap, childsParents, newParents) {
      return function(p1__4819_SHARP_) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, p1__4819_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__4819_SHARP_), cljs.core.second.call(null, p1__4819_SHARP_)))
      }
    }(parentMap, childsParents, newParents), cljs.core.seq.call(null, newParents)));
    if(cljs.core.contains_QMARK_.call(null, parentMap.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__4820_SHARP_, p2__4821_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__4820_SHARP_, p2__4821_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  underive.cljs$core$IFn$_invoke$arity$2 = underive__2;
  underive.cljs$core$IFn$_invoke$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3943__auto__ = cljs.core.truth_(function() {
    var and__3941__auto__ = xprefs;
    if(cljs.core.truth_(and__3941__auto__)) {
      return xprefs.call(null, y)
    }else {
      return and__3941__auto__
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3943__auto__)) {
    return or__3943__auto__
  }else {
    var or__3943__auto____$1 = function() {
      var ps = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps), prefer_table))) {
          }else {
          }
          var G__4822 = cljs.core.rest.call(null, ps);
          ps = G__4822;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3943__auto____$1)) {
      return or__3943__auto____$1
    }else {
      var or__3943__auto____$2 = function() {
        var ps = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps), y, prefer_table))) {
            }else {
            }
            var G__4823 = cljs.core.rest.call(null, ps);
            ps = G__4823;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3943__auto____$2)) {
        return or__3943__auto____$2
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3943__auto__ = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3943__auto__)) {
    return or__3943__auto__
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry = cljs.core.reduce.call(null, function(be, p__4826) {
    var vec__4827 = p__4826;
    var k = cljs.core.nth.call(null, vec__4827, 0, null);
    var _ = cljs.core.nth.call(null, vec__4827, 1, null);
    var e = vec__4827;
    if(cljs.core.isa_QMARK_.call(null, cljs.core.deref.call(null, hierarchy), dispatch_val, k)) {
      var be2 = cljs.core.truth_(function() {
        var or__3943__auto__ = be == null;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return cljs.core.dominates.call(null, k, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2), k, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry));
      return cljs.core.second.call(null, best_entry)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2942__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._reset[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._reset["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2942__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._add_method[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._add_method["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2942__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._remove_method[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._remove_method["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2942__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._prefer_method[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._prefer_method["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2942__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._get_method[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._get_method["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2942__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._methods[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._methods["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2942__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._prefers[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._prefers["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2942__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._dispatch[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._dispatch["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn = cljs.core._get_method.call(null, mf, dispatch_val);
  if(cljs.core.truth_(target_fn)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val)].join(""));
  }
  return cljs.core.apply.call(null, target_fn, args)
};
goog.provide("cljs.core.MultiFn");
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 256
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorStr = "cljs.core/MultiFn";
cljs.core.MultiFn.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var self__ = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var self__ = this;
  cljs.core.swap_BANG_.call(null, self__.method_table, function(mf__$1) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, self__.method_cache, function(mf__$1) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, self__.prefer_table, function(mf__$1) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, self__.cached_hierarchy, function(mf__$1) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var self__ = this;
  cljs.core.swap_BANG_.call(null, self__.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, self__.method_cache, self__.method_table, self__.cached_hierarchy, self__.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var self__ = this;
  cljs.core.swap_BANG_.call(null, self__.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, self__.method_cache, self__.method_table, self__.cached_hierarchy, self__.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var self__ = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, self__.cached_hierarchy), cljs.core.deref.call(null, self__.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, self__.method_cache, self__.method_table, self__.cached_hierarchy, self__.hierarchy)
  }
  var temp__4090__auto__ = cljs.core.deref.call(null, self__.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__4090__auto__)) {
    var target_fn = temp__4090__auto__;
    return target_fn
  }else {
    var temp__4090__auto____$1 = cljs.core.find_and_cache_best_method.call(null, self__.name, dispatch_val, self__.hierarchy, self__.method_table, self__.prefer_table, self__.method_cache, self__.cached_hierarchy);
    if(cljs.core.truth_(temp__4090__auto____$1)) {
      var target_fn = temp__4090__auto____$1;
      return target_fn
    }else {
      return cljs.core.deref.call(null, self__.method_table).call(null, self__.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var self__ = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, self__.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(self__.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, self__.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, self__.method_cache, self__.method_table, self__.cached_hierarchy, self__.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var self__ = this;
  return cljs.core.deref.call(null, self__.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var self__ = this;
  return cljs.core.deref.call(null, self__.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var self__ = this;
  return cljs.core.do_dispatch.call(null, mf, self__.dispatch_fn, args)
};
cljs.core.MultiFn.prototype.call = function() {
  var G__4828__delegate = function(_, args) {
    var self = this;
    return cljs.core._dispatch.call(null, self, args)
  };
  var G__4828 = function(_, var_args) {
    var args = null;
    if(arguments.length > 1) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__4828__delegate.call(this, _, args)
  };
  G__4828.cljs$lang$maxFixedArity = 1;
  G__4828.cljs$lang$applyTo = function(arglist__4829) {
    var _ = cljs.core.first(arglist__4829);
    var args = cljs.core.rest(arglist__4829);
    return G__4828__delegate(_, args)
  };
  G__4828.cljs$core$IFn$_invoke$arity$variadic = G__4828__delegate;
  return G__4828
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self = this;
  return cljs.core._dispatch.call(null, self, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
goog.provide("cljs.core.UUID");
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2153775104
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorStr = "cljs.core/UUID";
cljs.core.UUID.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var self__ = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(_, writer, ___$1) {
  var self__ = this;
  return cljs.core._write.call(null, writer, [cljs.core.str('#uuid "'), cljs.core.str(self__.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var self__ = this;
  var and__3941__auto__ = other instanceof cljs.core.UUID;
  if(and__3941__auto__) {
    return self__.uuid === other.uuid
  }else {
    return and__3941__auto__
  }
};
goog.provide("cljs.core.ExceptionInfo");
cljs.core.ExceptionInfo = function(message, data, cause) {
  this.message = message;
  this.data = data;
  this.cause = cause
};
cljs.core.ExceptionInfo.cljs$lang$type = true;
cljs.core.ExceptionInfo.cljs$lang$ctorStr = "cljs.core/ExceptionInfo";
cljs.core.ExceptionInfo.cljs$lang$ctorPrWriter = function(this__2885__auto__, writer__2886__auto__, opts__2887__auto__) {
  return cljs.core._write.call(null, writer__2886__auto__, "cljs.core/ExceptionInfo")
};
cljs.core.ExceptionInfo.prototype = new Error;
cljs.core.ExceptionInfo.prototype.constructor = cljs.core.ExceptionInfo;
cljs.core.ex_info = function() {
  var ex_info = null;
  var ex_info__2 = function(msg, map) {
    return new cljs.core.ExceptionInfo(msg, map, null)
  };
  var ex_info__3 = function(msg, map, cause) {
    return new cljs.core.ExceptionInfo(msg, map, cause)
  };
  ex_info = function(msg, map, cause) {
    switch(arguments.length) {
      case 2:
        return ex_info__2.call(this, msg, map);
      case 3:
        return ex_info__3.call(this, msg, map, cause)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  ex_info.cljs$core$IFn$_invoke$arity$2 = ex_info__2;
  ex_info.cljs$core$IFn$_invoke$arity$3 = ex_info__3;
  return ex_info
}();
cljs.core.ex_data = function ex_data(ex) {
  if(ex instanceof cljs.core.ExceptionInfo) {
    return ex.data
  }else {
    return null
  }
};
cljs.core.ex_message = function ex_message(ex) {
  if(ex instanceof Error) {
    return ex.message
  }else {
    return null
  }
};
cljs.core.ex_cause = function ex_cause(ex) {
  if(ex instanceof cljs.core.ExceptionInfo) {
    return ex.cause
  }else {
    return null
  }
};
cljs.core.comparator = function comparator(pred) {
  return function(x, y) {
    if(cljs.core.truth_(pred.call(null, x, y))) {
      return-1
    }else {
      if(cljs.core.truth_(pred.call(null, y, x))) {
        return 1
      }else {
        if("\ufdd0:else") {
          return 0
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.special_symbol_QMARK_ = function special_symbol_QMARK_(x) {
  return cljs.core.contains_QMARK_.call(null, cljs.core.set([new cljs.core.Symbol(null, "deftype*", "deftype*", -978581244, null), new cljs.core.Symbol(null, "new", "new", -1640422567, null), new cljs.core.Symbol(null, "try*", "try*", -1636962424, null), new cljs.core.Symbol(null, "quote", "quote", -1532577739, null), new cljs.core.Symbol(null, "&", "&", -1640531489, null), new cljs.core.Symbol(null, "set!", "set!", -1637004872, null), new cljs.core.Symbol(null, "recur", "recur", -1532142362, null), 
  new cljs.core.Symbol(null, ".", ".", -1640531481, null), new cljs.core.Symbol(null, "ns", "ns", -1640528002, null), new cljs.core.Symbol(null, "do", "do", -1640528316, null), new cljs.core.Symbol(null, "fn*", "fn*", -1640430053, null), new cljs.core.Symbol(null, "throw", "throw", -1530191713, null), new cljs.core.Symbol(null, "letfn*", "letfn*", 1548249632, null), new cljs.core.Symbol(null, "js*", "js*", -1640426054, null), new cljs.core.Symbol(null, "defrecord*", "defrecord*", 774272013, null), 
  new cljs.core.Symbol(null, "let*", "let*", -1637213400, null), new cljs.core.Symbol(null, "loop*", "loop*", -1537374273, null), new cljs.core.Symbol(null, "if", "if", -1640528170, null), new cljs.core.Symbol(null, "def", "def", -1640432194, null)]), x)
};
goog.provide("specljs.results");
goog.require("cljs.core");
goog.provide("specljs.results.PassResult");
specljs.results.PassResult = function(characteristic, seconds) {
  this.characteristic = characteristic;
  this.seconds = seconds
};
specljs.results.PassResult.cljs$lang$type = true;
specljs.results.PassResult.cljs$lang$ctorStr = "specljs.results/PassResult";
specljs.results.PassResult.cljs$lang$ctorPrWriter = function(this__2885__auto__, writer__2886__auto__, opts__2887__auto__) {
  return cljs.core._write.call(null, writer__2886__auto__, "specljs.results/PassResult")
};
goog.provide("specljs.results.FailResult");
specljs.results.FailResult = function(characteristic, seconds, failure) {
  this.characteristic = characteristic;
  this.seconds = seconds;
  this.failure = failure
};
specljs.results.FailResult.cljs$lang$type = true;
specljs.results.FailResult.cljs$lang$ctorStr = "specljs.results/FailResult";
specljs.results.FailResult.cljs$lang$ctorPrWriter = function(this__2885__auto__, writer__2886__auto__, opts__2887__auto__) {
  return cljs.core._write.call(null, writer__2886__auto__, "specljs.results/FailResult")
};
goog.provide("specljs.results.PendingResult");
specljs.results.PendingResult = function(characteristic, seconds, exception) {
  this.characteristic = characteristic;
  this.seconds = seconds;
  this.exception = exception
};
specljs.results.PendingResult.cljs$lang$type = true;
specljs.results.PendingResult.cljs$lang$ctorStr = "specljs.results/PendingResult";
specljs.results.PendingResult.cljs$lang$ctorPrWriter = function(this__2885__auto__, writer__2886__auto__, opts__2887__auto__) {
  return cljs.core._write.call(null, writer__2886__auto__, "specljs.results/PendingResult")
};
goog.provide("specljs.results.ErrorResult");
specljs.results.ErrorResult = function(characteristic, seconds, exception) {
  this.characteristic = characteristic;
  this.seconds = seconds;
  this.exception = exception
};
specljs.results.ErrorResult.cljs$lang$type = true;
specljs.results.ErrorResult.cljs$lang$ctorStr = "specljs.results/ErrorResult";
specljs.results.ErrorResult.cljs$lang$ctorPrWriter = function(this__2885__auto__, writer__2886__auto__, opts__2887__auto__) {
  return cljs.core._write.call(null, writer__2886__auto__, "specljs.results/ErrorResult")
};
specljs.results.pass_result = function pass_result(characteristic, seconds) {
  return new specljs.results.PassResult(characteristic, seconds)
};
specljs.results.fail_result = function fail_result(characteristic, seconds, failure) {
  return new specljs.results.FailResult(characteristic, seconds, failure)
};
specljs.results.pending_result = function pending_result(characteristic, seconds, exception) {
  return new specljs.results.PendingResult(characteristic, seconds, exception)
};
specljs.results.error_result = function error_result(exception) {
  return new specljs.results.ErrorResult(null, 0, exception)
};
specljs.results.pass_QMARK_ = function pass_QMARK_(result) {
  return cljs.core._EQ_.call(null, cljs.core.type.call(null, result), specljs.results.PassResult)
};
specljs.results.fail_QMARK_ = function fail_QMARK_(result) {
  return cljs.core._EQ_.call(null, cljs.core.type.call(null, result), specljs.results.FailResult)
};
specljs.results.pending_QMARK_ = function pending_QMARK_(result) {
  return cljs.core._EQ_.call(null, cljs.core.type.call(null, result), specljs.results.PendingResult)
};
specljs.results.error_QMARK_ = function error_QMARK_(result) {
  return cljs.core._EQ_.call(null, cljs.core.type.call(null, result), specljs.results.ErrorResult)
};
specljs.results.fail_count = function fail_count(results) {
  return cljs.core.reduce.call(null, function(p1__5354_SHARP_, p2__5353_SHARP_) {
    if(cljs.core.truth_(function() {
      var or__3943__auto__ = specljs.results.fail_QMARK_.call(null, p2__5353_SHARP_);
      if(cljs.core.truth_(or__3943__auto__)) {
        return or__3943__auto__
      }else {
        return specljs.results.error_QMARK_.call(null, p2__5353_SHARP_)
      }
    }())) {
      return p1__5354_SHARP_ + 1
    }else {
      return p1__5354_SHARP_
    }
  }, 0, results)
};
specljs.results.categorize = function categorize(results) {
  return cljs.core.reduce.call(null, function(tally, result) {
    if(cljs.core.truth_(specljs.results.pending_QMARK_.call(null, result))) {
      return cljs.core.update_in.call(null, tally, cljs.core.PersistentVector.fromArray(["\ufdd0:pending"], true), cljs.core.conj, result)
    }else {
      if(cljs.core.truth_(specljs.results.error_QMARK_.call(null, result))) {
        return cljs.core.update_in.call(null, tally, cljs.core.PersistentVector.fromArray(["\ufdd0:error"], true), cljs.core.conj, result)
      }else {
        if(cljs.core.truth_(specljs.results.fail_QMARK_.call(null, result))) {
          return cljs.core.update_in.call(null, tally, cljs.core.PersistentVector.fromArray(["\ufdd0:fail"], true), cljs.core.conj, result)
        }else {
          if("\ufdd0:else") {
            return cljs.core.update_in.call(null, tally, cljs.core.PersistentVector.fromArray(["\ufdd0:pass"], true), cljs.core.conj, result)
          }else {
            return null
          }
        }
      }
    }
  }, cljs.core.PersistentArrayMap.fromArray(["\ufdd0:pending", cljs.core.PersistentVector.EMPTY, "\ufdd0:fail", cljs.core.PersistentVector.EMPTY, "\ufdd0:pass", cljs.core.PersistentVector.EMPTY, "\ufdd0:error", cljs.core.PersistentVector.EMPTY], true), results)
};
goog.provide("clojure.string");
goog.require("cljs.core");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
clojure.string.seq_reverse = function seq_reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
clojure.string.reverse = function reverse(s) {
  return s.split("").reverse().join("")
};
clojure.string.replace = function replace(s, match, replacement) {
  if(cljs.core.string_QMARK_.call(null, match)) {
    return s.replace(new RegExp(goog.string.regExpEscape(match), "g"), replacement)
  }else {
    if(cljs.core.truth_(match.hasOwnProperty("source"))) {
      return s.replace(new RegExp(match.source, "g"), replacement)
    }else {
      if("\ufdd0:else") {
        throw[cljs.core.str("Invalid match arg: "), cljs.core.str(match)].join("");
      }else {
        return null
      }
    }
  }
};
clojure.string.replace_first = function replace_first(s, match, replacement) {
  return s.replace(match, replacement)
};
clojure.string.join = function() {
  var join = null;
  var join__1 = function(coll) {
    return cljs.core.apply.call(null, cljs.core.str, coll)
  };
  var join__2 = function(separator, coll) {
    return cljs.core.apply.call(null, cljs.core.str, cljs.core.interpose.call(null, separator, coll))
  };
  join = function(separator, coll) {
    switch(arguments.length) {
      case 1:
        return join__1.call(this, separator);
      case 2:
        return join__2.call(this, separator, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  join.cljs$core$IFn$_invoke$arity$1 = join__1;
  join.cljs$core$IFn$_invoke$arity$2 = join__2;
  return join
}();
clojure.string.upper_case = function upper_case(s) {
  return s.toUpperCase()
};
clojure.string.lower_case = function lower_case(s) {
  return s.toLowerCase()
};
clojure.string.capitalize = function capitalize(s) {
  if(cljs.core.count.call(null, s) < 2) {
    return clojure.string.upper_case.call(null, s)
  }else {
    return[cljs.core.str(clojure.string.upper_case.call(null, cljs.core.subs.call(null, s, 0, 1))), cljs.core.str(clojure.string.lower_case.call(null, cljs.core.subs.call(null, s, 1)))].join("")
  }
};
clojure.string.split = function() {
  var split = null;
  var split__2 = function(s, re) {
    return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
  };
  var split__3 = function(s, re, limit) {
    if(limit < 1) {
      return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
    }else {
      var s__$1 = s;
      var limit__$1 = limit;
      var parts = cljs.core.PersistentVector.EMPTY;
      while(true) {
        if(cljs.core._EQ_.call(null, limit__$1, 1)) {
          return cljs.core.conj.call(null, parts, s__$1)
        }else {
          var temp__4090__auto__ = cljs.core.re_find.call(null, re, s__$1);
          if(cljs.core.truth_(temp__4090__auto__)) {
            var m = temp__4090__auto__;
            var index = s__$1.indexOf(m);
            var G__4830 = s__$1.substring(index + cljs.core.count.call(null, m));
            var G__4831 = limit__$1 - 1;
            var G__4832 = cljs.core.conj.call(null, parts, s__$1.substring(0, index));
            s__$1 = G__4830;
            limit__$1 = G__4831;
            parts = G__4832;
            continue
          }else {
            return cljs.core.conj.call(null, parts, s__$1)
          }
        }
        break
      }
    }
  };
  split = function(s, re, limit) {
    switch(arguments.length) {
      case 2:
        return split__2.call(this, s, re);
      case 3:
        return split__3.call(this, s, re, limit)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  split.cljs$core$IFn$_invoke$arity$2 = split__2;
  split.cljs$core$IFn$_invoke$arity$3 = split__3;
  return split
}();
clojure.string.split_lines = function split_lines(s) {
  return clojure.string.split.call(null, s, /\n|\r\n/)
};
clojure.string.trim = function trim(s) {
  return goog.string.trim(s)
};
clojure.string.triml = function triml(s) {
  return goog.string.trimLeft(s)
};
clojure.string.trimr = function trimr(s) {
  return goog.string.trimRight(s)
};
clojure.string.trim_newline = function trim_newline(s) {
  var index = s.length;
  while(true) {
    if(index === 0) {
      return""
    }else {
      var ch = cljs.core.get.call(null, s, index - 1);
      if(function() {
        var or__3943__auto__ = cljs.core._EQ_.call(null, ch, "\n");
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return cljs.core._EQ_.call(null, ch, "\r")
        }
      }()) {
        var G__4833 = index - 1;
        index = G__4833;
        continue
      }else {
        return s.substring(0, index)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  return goog.string.isEmptySafe(s)
};
clojure.string.escape = function escape(s, cmap) {
  var buffer = new goog.string.StringBuffer;
  var length = s.length;
  var index = 0;
  while(true) {
    if(cljs.core._EQ_.call(null, length, index)) {
      return buffer.toString()
    }else {
      var ch = s.charAt(index);
      var temp__4090__auto___4834 = cljs.core.get.call(null, cmap, ch);
      if(cljs.core.truth_(temp__4090__auto___4834)) {
        var replacement_4835 = temp__4090__auto___4834;
        buffer.append([cljs.core.str(replacement_4835)].join(""))
      }else {
        buffer.append(ch)
      }
      var G__4836 = index + 1;
      index = G__4836;
      continue
    }
    break
  }
};
goog.provide("specljs.platform");
goog.require("cljs.core");
goog.require("clojure.string");
specljs.platform.endl = "\n";
specljs.platform.file_separator = "/";
specljs.platform.re_type = cljs.core.type.call(null, /./);
specljs.platform.re_QMARK_ = function re_QMARK_(obj) {
  return cljs.core._EQ_.call(null, specljs.platform.re_type, cljs.core.type.call(null, obj))
};
goog.provide("specljs.platform.SpecFailure");
specljs.platform.SpecFailure = function(message) {
  this.message = message
};
specljs.platform.SpecFailure.cljs$lang$type = true;
specljs.platform.SpecFailure.cljs$lang$ctorStr = "specljs.platform/SpecFailure";
specljs.platform.SpecFailure.cljs$lang$ctorPrWriter = function(this__2885__auto__, writer__2886__auto__, opts__2887__auto__) {
  return cljs.core._write.call(null, writer__2886__auto__, "specljs.platform/SpecFailure")
};
specljs.platform.SpecFailure.prototype = new Error;
specljs.platform.SpecFailure.prototype.constructor = specljs.platform.SpecFailure;
goog.provide("specljs.platform.SpecPending");
specljs.platform.SpecPending = function(message) {
  this.message = message
};
specljs.platform.SpecPending.cljs$lang$type = true;
specljs.platform.SpecPending.cljs$lang$ctorStr = "specljs.platform/SpecPending";
specljs.platform.SpecPending.cljs$lang$ctorPrWriter = function(this__2885__auto__, writer__2886__auto__, opts__2887__auto__) {
  return cljs.core._write.call(null, writer__2886__auto__, "specljs.platform/SpecPending")
};
specljs.platform.throwable = Object;
specljs.platform.exception = Error;
specljs.platform.failure = specljs.platform.SpecFailure;
specljs.platform.pending = specljs.platform.SpecPending;
specljs.platform.pending_QMARK_ = function pending_QMARK_(e) {
  return cljs.core.isa_QMARK_.call(null, cljs.core.type.call(null, e), specljs.platform.SpecPending)
};
specljs.platform.failure_QMARK_ = function failure_QMARK_(e) {
  return cljs.core.isa_QMARK_.call(null, cljs.core.type.call(null, e), specljs.platform.SpecFailure)
};
specljs.platform.error_message = function error_message(e) {
  return e.message
};
specljs.platform.failure_source = function failure_source(e) {
  if(cljs.core.truth_(e.fileName)) {
    return[cljs.core.str(e.fileName), cljs.core.str(":"), cljs.core.str(function() {
      var or__3943__auto__ = e.lineNumber;
      if(cljs.core.truth_(or__3943__auto__)) {
        return or__3943__auto__
      }else {
        return"?"
      }
    }())].join("")
  }else {
    if(cljs.core.truth_(e.stack)) {
      return clojure.string.trim.call(null, cljs.core.nth.call(null, clojure.string.split_lines.call(null, e.stack), cljs.core.count.call(null, clojure.string.split_lines.call(null, e.message))))
    }else {
      if("\ufdd0:else") {
        return"unkown-file:?"
      }else {
        return null
      }
    }
  }
};
specljs.platform.stack_trace = function stack_trace(e) {
  return cljs.core.rest.call(null, clojure.string.split_lines.call(null, function() {
    var or__3943__auto__ = e.stack;
    if(cljs.core.truth_(or__3943__auto__)) {
      return or__3943__auto__
    }else {
      return e.toString()
    }
  }()))
};
specljs.platform.cause = function cause(e) {
  return null
};
specljs.platform.print_stack_trace = function print_stack_trace(e) {
  return cljs.core.println.call(null, function() {
    var or__3943__auto__ = e.stack;
    if(cljs.core.truth_(or__3943__auto__)) {
      return or__3943__auto__
    }else {
      return"missing stack trace"
    }
  }())
};
specljs.platform.elide_level_QMARK_ = function elide_level_QMARK_(stack_element) {
  return false
};
specljs.platform.type_name = function type_name(t) {
  if(cljs.core.truth_(t)) {
    return t.name
  }else {
    return"nil"
  }
};
specljs.platform.format_seconds = function format_seconds(secs) {
  return secs.toFixed(5)
};
specljs.platform.current_time = function current_time() {
  return(new Date).getTime()
};
specljs.platform.secs_since = function secs_since(start) {
  return((new Date).getTime() - start) / 1E3
};
cljs.core._STAR_print_fn_STAR_ = function(thing) {
  return console.log(thing)
};
specljs.platform.dynamically_invoke = function dynamically_invoke(ns_name, fn_name) {
  var code = cljs.core.format.call(null, "%s.%s();", clojure.string.replace.call(null, ns_name, "-", "_"), clojure.string.replace.call(null, fn_name, "-", "_"));
  return eval(code)
};
goog.provide("specljs.config");
goog.require("cljs.core");
goog.require("specljs.platform");
goog.require("specljs.platform");
specljs.config.default_reporters = cljs.core.atom.call(null, null);
specljs.config.active_reporters = function active_reporters() {
  if(cljs.core.truth_(specljs.config._STAR_reporters_STAR_)) {
    return specljs.config._STAR_reporters_STAR_
  }else {
    var temp__4090__auto__ = cljs.core.deref.call(null, specljs.config.default_reporters);
    if(cljs.core.truth_(temp__4090__auto__)) {
      var reporters = temp__4090__auto__;
      return reporters
    }else {
      throw new Error("*reporters* is unbound and no default value has been provided");
    }
  }
};
specljs.config.default_runner = cljs.core.atom.call(null, null);
specljs.config.default_runner_fn = cljs.core.atom.call(null, null);
specljs.config.active_runner = function active_runner() {
  if(cljs.core.truth_(specljs.config._STAR_runner_STAR_)) {
    return specljs.config._STAR_runner_STAR_
  }else {
    var temp__4090__auto__ = cljs.core.deref.call(null, specljs.config.default_runner);
    if(cljs.core.truth_(temp__4090__auto__)) {
      var runner = temp__4090__auto__;
      return runner
    }else {
      throw new Error("*runner* is unbound and no default value has been provided");
    }
  }
};
specljs.config._STAR_color_QMARK__STAR_ = false;
specljs.config._STAR_full_stack_trace_QMARK__STAR_ = false;
specljs.config._STAR_tag_filter_STAR_ = cljs.core.PersistentArrayMap.fromArray(["\ufdd0:include", cljs.core.PersistentHashSet.EMPTY, "\ufdd0:exclude", cljs.core.PersistentHashSet.EMPTY], true);
specljs.config.default_config = cljs.core.PersistentArrayMap.fromArray(["\ufdd0:specs", cljs.core.PersistentVector.fromArray(["spec"], true), "\ufdd0:runner", "standard", "\ufdd0:reporters", cljs.core.PersistentVector.fromArray(["progress"], true), "\ufdd0:tags", cljs.core.PersistentVector.EMPTY], true);
specljs.config.load_runner = function load_runner(name) {
  try {
    return specljs.platform.dynamically_invoke.call(null, [cljs.core.str("specljs.run."), cljs.core.str(name)].join(""), [cljs.core.str("new-"), cljs.core.str(name), cljs.core.str("-runner")].join(""))
  }catch(e5332) {
    if(e5332 instanceof Error) {
      var e = e5332;
      throw new Error([cljs.core.str("Failed to load runner: "), cljs.core.str(name)].join(""), e);
    }else {
      if("\ufdd0:else") {
        throw e5332;
      }else {
        return null
      }
    }
  }
};
specljs.config.load_reporter = function load_reporter(name) {
  try {
    return specljs.platform.dynamically_invoke.call(null, [cljs.core.str("specljs.report."), cljs.core.str(name)].join(""), [cljs.core.str("new-"), cljs.core.str(name), cljs.core.str("-reporter")].join(""))
  }catch(e5334) {
    if(e5334 instanceof Error) {
      var e = e5334;
      throw new Error([cljs.core.str("Failed to load reporter: "), cljs.core.str(name)].join(""), e);
    }else {
      if("\ufdd0:else") {
        throw e5334;
      }else {
        return null
      }
    }
  }
};
specljs.config.parse_tags = function parse_tags(values) {
  var result = cljs.core.PersistentArrayMap.fromArray(["\ufdd0:includes", cljs.core.PersistentHashSet.EMPTY, "\ufdd0:excludes", cljs.core.PersistentHashSet.EMPTY], true);
  var values__$1 = values;
  while(true) {
    if(cljs.core.seq.call(null, values__$1)) {
      var value = cljs.core.name.call(null, cljs.core.first.call(null, values__$1));
      if(cljs.core._EQ_.call(null, "~", cljs.core.first.call(null, value))) {
        var G__5335 = cljs.core.update_in.call(null, result, cljs.core.PersistentVector.fromArray(["\ufdd0:excludes"], true), cljs.core.conj, cljs.core.keyword.call(null, cljs.core.apply.call(null, cljs.core.str, cljs.core.rest.call(null, value))));
        var G__5336 = cljs.core.rest.call(null, values__$1);
        result = G__5335;
        values__$1 = G__5336;
        continue
      }else {
        var G__5337 = cljs.core.update_in.call(null, result, cljs.core.PersistentVector.fromArray(["\ufdd0:includes"], true), cljs.core.conj, cljs.core.keyword.call(null, value));
        var G__5338 = cljs.core.rest.call(null, values__$1);
        result = G__5337;
        values__$1 = G__5338;
        continue
      }
    }else {
      return result
    }
    break
  }
};
specljs.config.with_config = function with_config(config, action) {
  var _STAR_runner_STAR_5346 = specljs.config._STAR_runner_STAR_;
  var _STAR_reporters_STAR_5347 = specljs.config._STAR_reporters_STAR_;
  var _STAR_specs_STAR_5348 = specljs.config._STAR_specs_STAR_;
  var _STAR_color_QMARK__STAR_5349 = specljs.config._STAR_color_QMARK__STAR_;
  var _STAR_full_stack_trace_QMARK__STAR_5350 = specljs.config._STAR_full_stack_trace_QMARK__STAR_;
  var _STAR_tag_filter_STAR_5351 = specljs.config._STAR_tag_filter_STAR_;
  try {
    specljs.config._STAR_runner_STAR_ = cljs.core.truth_((new cljs.core.Keyword("\ufdd0:runner")).call(null, config)) ? function() {
      cljs.core.println.call(null, "loading runner in config");
      return specljs.config.load_runner.call(null, (new cljs.core.Keyword("\ufdd0:runner")).call(null, config))
    }() : specljs.config.active_runner.call(null);
    specljs.config._STAR_reporters_STAR_ = cljs.core.truth_((new cljs.core.Keyword("\ufdd0:reporters")).call(null, config)) ? cljs.core.mapv.call(null, specljs.config.load_reporter, (new cljs.core.Keyword("\ufdd0:reporters")).call(null, config)) : specljs.config.active_reporters.call(null);
    specljs.config._STAR_specs_STAR_ = (new cljs.core.Keyword("\ufdd0:specs")).call(null, config);
    specljs.config._STAR_color_QMARK__STAR_ = (new cljs.core.Keyword("\ufdd0:color")).call(null, config);
    specljs.config._STAR_full_stack_trace_QMARK__STAR_ = !((new cljs.core.Keyword("\ufdd0:stacktrace")).call(null, config) == null);
    specljs.config._STAR_tag_filter_STAR_ = specljs.config.parse_tags.call(null, (new cljs.core.Keyword("\ufdd0:tags")).call(null, config));
    return action.call(null)
  }finally {
    specljs.config._STAR_tag_filter_STAR_ = _STAR_tag_filter_STAR_5351;
    specljs.config._STAR_full_stack_trace_QMARK__STAR_ = _STAR_full_stack_trace_QMARK__STAR_5350;
    specljs.config._STAR_color_QMARK__STAR_ = _STAR_color_QMARK__STAR_5349;
    specljs.config._STAR_specs_STAR_ = _STAR_specs_STAR_5348;
    specljs.config._STAR_reporters_STAR_ = _STAR_reporters_STAR_5347;
    specljs.config._STAR_runner_STAR_ = _STAR_runner_STAR_5346
  }
};
goog.provide("clojure.set");
goog.require("cljs.core");
clojure.set.bubble_max_key = function bubble_max_key(k, coll) {
  var max = cljs.core.apply.call(null, cljs.core.max_key, k, coll);
  return cljs.core.cons.call(null, max, cljs.core.remove.call(null, function(p1__4905_SHARP_) {
    return max === p1__4905_SHARP_
  }, coll))
};
clojure.set.union = function() {
  var union = null;
  var union__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var union__1 = function(s1) {
    return s1
  };
  var union__2 = function(s1, s2) {
    if(cljs.core.count.call(null, s1) < cljs.core.count.call(null, s2)) {
      return cljs.core.reduce.call(null, cljs.core.conj, s2, s1)
    }else {
      return cljs.core.reduce.call(null, cljs.core.conj, s1, s2)
    }
  };
  var union__3 = function() {
    var G__4907__delegate = function(s1, s2, sets) {
      var bubbled_sets = clojure.set.bubble_max_key.call(null, cljs.core.count, cljs.core.conj.call(null, sets, s2, s1));
      return cljs.core.reduce.call(null, cljs.core.into, cljs.core.first.call(null, bubbled_sets), cljs.core.rest.call(null, bubbled_sets))
    };
    var G__4907 = function(s1, s2, var_args) {
      var sets = null;
      if(arguments.length > 2) {
        sets = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4907__delegate.call(this, s1, s2, sets)
    };
    G__4907.cljs$lang$maxFixedArity = 2;
    G__4907.cljs$lang$applyTo = function(arglist__4908) {
      var s1 = cljs.core.first(arglist__4908);
      arglist__4908 = cljs.core.next(arglist__4908);
      var s2 = cljs.core.first(arglist__4908);
      var sets = cljs.core.rest(arglist__4908);
      return G__4907__delegate(s1, s2, sets)
    };
    G__4907.cljs$core$IFn$_invoke$arity$variadic = G__4907__delegate;
    return G__4907
  }();
  union = function(s1, s2, var_args) {
    var sets = var_args;
    switch(arguments.length) {
      case 0:
        return union__0.call(this);
      case 1:
        return union__1.call(this, s1);
      case 2:
        return union__2.call(this, s1, s2);
      default:
        return union__3.cljs$core$IFn$_invoke$arity$variadic(s1, s2, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  union.cljs$lang$maxFixedArity = 2;
  union.cljs$lang$applyTo = union__3.cljs$lang$applyTo;
  union.cljs$core$IFn$_invoke$arity$0 = union__0;
  union.cljs$core$IFn$_invoke$arity$1 = union__1;
  union.cljs$core$IFn$_invoke$arity$2 = union__2;
  union.cljs$core$IFn$_invoke$arity$variadic = union__3.cljs$core$IFn$_invoke$arity$variadic;
  return union
}();
clojure.set.intersection = function() {
  var intersection = null;
  var intersection__1 = function(s1) {
    return s1
  };
  var intersection__2 = function(s1, s2) {
    while(true) {
      if(cljs.core.count.call(null, s2) < cljs.core.count.call(null, s1)) {
        var G__4909 = s2;
        var G__4910 = s1;
        s1 = G__4909;
        s2 = G__4910;
        continue
      }else {
        return cljs.core.reduce.call(null, function(s1, s2) {
          return function(result, item) {
            if(cljs.core.contains_QMARK_.call(null, s2, item)) {
              return result
            }else {
              return cljs.core.disj.call(null, result, item)
            }
          }
        }(s1, s2), s1, s1)
      }
      break
    }
  };
  var intersection__3 = function() {
    var G__4911__delegate = function(s1, s2, sets) {
      var bubbled_sets = clojure.set.bubble_max_key.call(null, function(p1__4906_SHARP_) {
        return-cljs.core.count.call(null, p1__4906_SHARP_)
      }, cljs.core.conj.call(null, sets, s2, s1));
      return cljs.core.reduce.call(null, intersection, cljs.core.first.call(null, bubbled_sets), cljs.core.rest.call(null, bubbled_sets))
    };
    var G__4911 = function(s1, s2, var_args) {
      var sets = null;
      if(arguments.length > 2) {
        sets = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4911__delegate.call(this, s1, s2, sets)
    };
    G__4911.cljs$lang$maxFixedArity = 2;
    G__4911.cljs$lang$applyTo = function(arglist__4912) {
      var s1 = cljs.core.first(arglist__4912);
      arglist__4912 = cljs.core.next(arglist__4912);
      var s2 = cljs.core.first(arglist__4912);
      var sets = cljs.core.rest(arglist__4912);
      return G__4911__delegate(s1, s2, sets)
    };
    G__4911.cljs$core$IFn$_invoke$arity$variadic = G__4911__delegate;
    return G__4911
  }();
  intersection = function(s1, s2, var_args) {
    var sets = var_args;
    switch(arguments.length) {
      case 1:
        return intersection__1.call(this, s1);
      case 2:
        return intersection__2.call(this, s1, s2);
      default:
        return intersection__3.cljs$core$IFn$_invoke$arity$variadic(s1, s2, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  intersection.cljs$lang$maxFixedArity = 2;
  intersection.cljs$lang$applyTo = intersection__3.cljs$lang$applyTo;
  intersection.cljs$core$IFn$_invoke$arity$1 = intersection__1;
  intersection.cljs$core$IFn$_invoke$arity$2 = intersection__2;
  intersection.cljs$core$IFn$_invoke$arity$variadic = intersection__3.cljs$core$IFn$_invoke$arity$variadic;
  return intersection
}();
clojure.set.difference = function() {
  var difference = null;
  var difference__1 = function(s1) {
    return s1
  };
  var difference__2 = function(s1, s2) {
    if(cljs.core.count.call(null, s1) < cljs.core.count.call(null, s2)) {
      return cljs.core.reduce.call(null, function(result, item) {
        if(cljs.core.contains_QMARK_.call(null, s2, item)) {
          return cljs.core.disj.call(null, result, item)
        }else {
          return result
        }
      }, s1, s1)
    }else {
      return cljs.core.reduce.call(null, cljs.core.disj, s1, s2)
    }
  };
  var difference__3 = function() {
    var G__4913__delegate = function(s1, s2, sets) {
      return cljs.core.reduce.call(null, difference, s1, cljs.core.conj.call(null, sets, s2))
    };
    var G__4913 = function(s1, s2, var_args) {
      var sets = null;
      if(arguments.length > 2) {
        sets = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4913__delegate.call(this, s1, s2, sets)
    };
    G__4913.cljs$lang$maxFixedArity = 2;
    G__4913.cljs$lang$applyTo = function(arglist__4914) {
      var s1 = cljs.core.first(arglist__4914);
      arglist__4914 = cljs.core.next(arglist__4914);
      var s2 = cljs.core.first(arglist__4914);
      var sets = cljs.core.rest(arglist__4914);
      return G__4913__delegate(s1, s2, sets)
    };
    G__4913.cljs$core$IFn$_invoke$arity$variadic = G__4913__delegate;
    return G__4913
  }();
  difference = function(s1, s2, var_args) {
    var sets = var_args;
    switch(arguments.length) {
      case 1:
        return difference__1.call(this, s1);
      case 2:
        return difference__2.call(this, s1, s2);
      default:
        return difference__3.cljs$core$IFn$_invoke$arity$variadic(s1, s2, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  difference.cljs$lang$maxFixedArity = 2;
  difference.cljs$lang$applyTo = difference__3.cljs$lang$applyTo;
  difference.cljs$core$IFn$_invoke$arity$1 = difference__1;
  difference.cljs$core$IFn$_invoke$arity$2 = difference__2;
  difference.cljs$core$IFn$_invoke$arity$variadic = difference__3.cljs$core$IFn$_invoke$arity$variadic;
  return difference
}();
clojure.set.select = function select(pred, xset) {
  return cljs.core.reduce.call(null, function(s, k) {
    if(cljs.core.truth_(pred.call(null, k))) {
      return s
    }else {
      return cljs.core.disj.call(null, s, k)
    }
  }, xset, xset)
};
clojure.set.project = function project(xrel, ks) {
  return cljs.core.set.call(null, cljs.core.map.call(null, function(p1__4915_SHARP_) {
    return cljs.core.select_keys.call(null, p1__4915_SHARP_, ks)
  }, xrel))
};
clojure.set.rename_keys = function rename_keys(map, kmap) {
  return cljs.core.reduce.call(null, function(m, p__4919) {
    var vec__4920 = p__4919;
    var old = cljs.core.nth.call(null, vec__4920, 0, null);
    var new$ = cljs.core.nth.call(null, vec__4920, 1, null);
    if(function() {
      var and__3941__auto__ = cljs.core.not_EQ_.call(null, old, new$);
      if(and__3941__auto__) {
        return cljs.core.contains_QMARK_.call(null, m, old)
      }else {
        return and__3941__auto__
      }
    }()) {
      return cljs.core.dissoc.call(null, cljs.core.assoc.call(null, m, new$, cljs.core.get.call(null, m, old)), old)
    }else {
      return m
    }
  }, map, kmap)
};
clojure.set.rename = function rename(xrel, kmap) {
  return cljs.core.set.call(null, cljs.core.map.call(null, function(p1__4916_SHARP_) {
    return clojure.set.rename_keys.call(null, p1__4916_SHARP_, kmap)
  }, xrel))
};
clojure.set.index = function index(xrel, ks) {
  return cljs.core.reduce.call(null, function(m, x) {
    var ik = cljs.core.select_keys.call(null, x, ks);
    return cljs.core.assoc.call(null, m, ik, cljs.core.conj.call(null, cljs.core.get.call(null, m, ik, cljs.core.PersistentHashSet.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, xrel)
};
clojure.set.map_invert = function map_invert(m) {
  return cljs.core.reduce.call(null, function(m__$1, p__4927) {
    var vec__4928 = p__4927;
    var k = cljs.core.nth.call(null, vec__4928, 0, null);
    var v = cljs.core.nth.call(null, vec__4928, 1, null);
    return cljs.core.assoc.call(null, m__$1, v, k)
  }, cljs.core.ObjMap.EMPTY, m)
};
clojure.set.join = function() {
  var join = null;
  var join__2 = function(xrel, yrel) {
    if(function() {
      var and__3941__auto__ = cljs.core.seq.call(null, xrel);
      if(and__3941__auto__) {
        return cljs.core.seq.call(null, yrel)
      }else {
        return and__3941__auto__
      }
    }()) {
      var ks = clojure.set.intersection.call(null, cljs.core.set.call(null, cljs.core.keys.call(null, cljs.core.first.call(null, xrel))), cljs.core.set.call(null, cljs.core.keys.call(null, cljs.core.first.call(null, yrel))));
      var vec__4932 = cljs.core.count.call(null, xrel) <= cljs.core.count.call(null, yrel) ? cljs.core.PersistentVector.fromArray([xrel, yrel], true) : cljs.core.PersistentVector.fromArray([yrel, xrel], true);
      var r = cljs.core.nth.call(null, vec__4932, 0, null);
      var s = cljs.core.nth.call(null, vec__4932, 1, null);
      var idx = clojure.set.index.call(null, r, ks);
      return cljs.core.reduce.call(null, function(ret, x) {
        var found = idx.call(null, cljs.core.select_keys.call(null, x, ks));
        if(cljs.core.truth_(found)) {
          return cljs.core.reduce.call(null, function(p1__4921_SHARP_, p2__4922_SHARP_) {
            return cljs.core.conj.call(null, p1__4921_SHARP_, cljs.core.merge.call(null, p2__4922_SHARP_, x))
          }, ret, found)
        }else {
          return ret
        }
      }, cljs.core.PersistentHashSet.EMPTY, s)
    }else {
      return cljs.core.PersistentHashSet.EMPTY
    }
  };
  var join__3 = function(xrel, yrel, km) {
    var vec__4933 = cljs.core.count.call(null, xrel) <= cljs.core.count.call(null, yrel) ? cljs.core.PersistentVector.fromArray([xrel, yrel, clojure.set.map_invert.call(null, km)], true) : cljs.core.PersistentVector.fromArray([yrel, xrel, km], true);
    var r = cljs.core.nth.call(null, vec__4933, 0, null);
    var s = cljs.core.nth.call(null, vec__4933, 1, null);
    var k = cljs.core.nth.call(null, vec__4933, 2, null);
    var idx = clojure.set.index.call(null, r, cljs.core.vals.call(null, k));
    return cljs.core.reduce.call(null, function(ret, x) {
      var found = idx.call(null, clojure.set.rename_keys.call(null, cljs.core.select_keys.call(null, x, cljs.core.keys.call(null, k)), k));
      if(cljs.core.truth_(found)) {
        return cljs.core.reduce.call(null, function(p1__4923_SHARP_, p2__4924_SHARP_) {
          return cljs.core.conj.call(null, p1__4923_SHARP_, cljs.core.merge.call(null, p2__4924_SHARP_, x))
        }, ret, found)
      }else {
        return ret
      }
    }, cljs.core.PersistentHashSet.EMPTY, s)
  };
  join = function(xrel, yrel, km) {
    switch(arguments.length) {
      case 2:
        return join__2.call(this, xrel, yrel);
      case 3:
        return join__3.call(this, xrel, yrel, km)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  join.cljs$core$IFn$_invoke$arity$2 = join__2;
  join.cljs$core$IFn$_invoke$arity$3 = join__3;
  return join
}();
clojure.set.subset_QMARK_ = function subset_QMARK_(set1, set2) {
  var and__3941__auto__ = cljs.core.count.call(null, set1) <= cljs.core.count.call(null, set2);
  if(and__3941__auto__) {
    return cljs.core.every_QMARK_.call(null, function(p1__4929_SHARP_) {
      return cljs.core.contains_QMARK_.call(null, set2, p1__4929_SHARP_)
    }, set1)
  }else {
    return and__3941__auto__
  }
};
clojure.set.superset_QMARK_ = function superset_QMARK_(set1, set2) {
  var and__3941__auto__ = cljs.core.count.call(null, set1) >= cljs.core.count.call(null, set2);
  if(and__3941__auto__) {
    return cljs.core.every_QMARK_.call(null, function(p1__4934_SHARP_) {
      return cljs.core.contains_QMARK_.call(null, set1, p1__4934_SHARP_)
    }, set2)
  }else {
    return and__3941__auto__
  }
};
goog.provide("specljs.tags");
goog.require("cljs.core");
goog.require("specljs.config");
goog.require("clojure.string");
goog.require("clojure.set");
goog.require("specljs.config");
goog.require("clojure.string");
goog.require("clojure.set");
specljs.tags.pass_includes_QMARK_ = function pass_includes_QMARK_(includes, tags) {
  if(cljs.core.empty_QMARK_.call(null, includes)) {
    return true
  }else {
    return cljs.core._EQ_.call(null, includes, clojure.set.intersection.call(null, includes, cljs.core.set.call(null, tags)))
  }
};
specljs.tags.pass_excludes_QMARK_ = function pass_excludes_QMARK_(excludes, tags) {
  if(cljs.core.empty_QMARK_.call(null, excludes)) {
    return true
  }else {
    return cljs.core.not.call(null, cljs.core.some.call(null, function(p1__4899_SHARP_) {
      return cljs.core.contains_QMARK_.call(null, excludes, p1__4899_SHARP_)
    }, tags))
  }
};
specljs.tags.pass_tag_filter_QMARK_ = function() {
  var pass_tag_filter_QMARK_ = null;
  var pass_tag_filter_QMARK___1 = function(tags) {
    return pass_tag_filter_QMARK_.call(null, specljs.config._STAR_tag_filter_STAR_, tags)
  };
  var pass_tag_filter_QMARK___2 = function(filter, tags) {
    var and__3941__auto__ = specljs.tags.pass_includes_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0:includes")).call(null, filter), tags);
    if(cljs.core.truth_(and__3941__auto__)) {
      return specljs.tags.pass_excludes_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0:excludes")).call(null, filter), tags)
    }else {
      return and__3941__auto__
    }
  };
  pass_tag_filter_QMARK_ = function(filter, tags) {
    switch(arguments.length) {
      case 1:
        return pass_tag_filter_QMARK___1.call(this, filter);
      case 2:
        return pass_tag_filter_QMARK___2.call(this, filter, tags)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  pass_tag_filter_QMARK_.cljs$core$IFn$_invoke$arity$1 = pass_tag_filter_QMARK___1;
  pass_tag_filter_QMARK_.cljs$core$IFn$_invoke$arity$2 = pass_tag_filter_QMARK___2;
  return pass_tag_filter_QMARK_
}();
specljs.tags.tags_for = function tags_for(context) {
  if(cljs.core.truth_(context)) {
    return clojure.set.union.call(null, tags_for.call(null, cljs.core.deref.call(null, context.parent)), cljs.core.deref.call(null, context.tags))
  }else {
    return cljs.core.PersistentHashSet.EMPTY
  }
};
specljs.tags.tag_sets_for = function tag_sets_for(context) {
  var context_seq = cljs.core.tree_seq.call(null, function(p1__4900_SHARP_) {
    return!(p1__4900_SHARP_ == null)
  }, function(p1__4901_SHARP_) {
    return cljs.core.deref.call(null, p1__4901_SHARP_.children)
  }, context);
  return cljs.core.map.call(null, specljs.tags.tags_for, context_seq)
};
specljs.tags.context_with_tags_seq = function context_with_tags_seq(context) {
  var context_seq = cljs.core.tree_seq.call(null, function(p1__4902_SHARP_) {
    return!(p1__4902_SHARP_ == null)
  }, function(p1__4903_SHARP_) {
    return cljs.core.deref.call(null, p1__4903_SHARP_.children)
  }, context);
  return cljs.core.map.call(null, function(p1__4904_SHARP_) {
    return cljs.core.hash_map.call(null, "\ufdd0:context", p1__4904_SHARP_, "\ufdd0:tag-set", specljs.tags.tags_for.call(null, p1__4904_SHARP_))
  }, context_seq)
};
specljs.tags.describe_filter = function() {
  var describe_filter = null;
  var describe_filter__0 = function() {
    return describe_filter.call(null, specljs.config._STAR_tag_filter_STAR_)
  };
  var describe_filter__1 = function(filter) {
    var includes = cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.name, (new cljs.core.Keyword("\ufdd0:includes")).call(null, filter)));
    var excludes = cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.name, (new cljs.core.Keyword("\ufdd0:excludes")).call(null, filter)));
    if(function() {
      var or__3943__auto__ = includes;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return excludes
      }
    }()) {
      return[cljs.core.str("Filtering tags."), cljs.core.str(includes ? [cljs.core.str(" Including: "), cljs.core.str(clojure.string.join.call(null, ", ", includes)), cljs.core.str(".")].join("") : null), cljs.core.str(excludes ? [cljs.core.str(" Excluding: "), cljs.core.str(clojure.string.join.call(null, ", ", excludes)), cljs.core.str(".")].join("") : null)].join("")
    }else {
      return null
    }
  };
  describe_filter = function(filter) {
    switch(arguments.length) {
      case 0:
        return describe_filter__0.call(this);
      case 1:
        return describe_filter__1.call(this, filter)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  describe_filter.cljs$core$IFn$_invoke$arity$0 = describe_filter__0;
  describe_filter.cljs$core$IFn$_invoke$arity$1 = describe_filter__1;
  return describe_filter
}();
goog.provide("specljs.components");
goog.require("cljs.core");
specljs.components.SpecComponent = {};
specljs.components.install = function install(this$, description) {
  if(function() {
    var and__3941__auto__ = this$;
    if(and__3941__auto__) {
      return this$.specljs$components$SpecComponent$install$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return this$.specljs$components$SpecComponent$install$arity$2(this$, description)
  }else {
    var x__2942__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3943__auto__ = specljs.components.install[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = specljs.components.install["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "SpecComponent.install", this$);
        }
      }
    }().call(null, this$, description)
  }
};
specljs.components.SpecComponent["object"] = true;
specljs.components.install["object"] = function(this$, description) {
  return null
};
cljs.core.PersistentVector.prototype.specljs$components$SpecComponent$ = true;
cljs.core.PersistentVector.prototype.specljs$components$SpecComponent$install$arity$2 = function(this$, description) {
  var seq__4935 = cljs.core.seq.call(null, cljs.core.seq.call(null, this$));
  var chunk__4936 = null;
  var count__4937 = 0;
  var i__4938 = 0;
  while(true) {
    if(i__4938 < count__4937) {
      var component = cljs.core._nth.call(null, chunk__4936, i__4938);
      specljs.components.install.call(null, component, description);
      var G__4951 = seq__4935;
      var G__4952 = chunk__4936;
      var G__4953 = count__4937;
      var G__4954 = i__4938 + 1;
      seq__4935 = G__4951;
      chunk__4936 = G__4952;
      count__4937 = G__4953;
      i__4938 = G__4954;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__4935);
      if(temp__4092__auto__) {
        var seq__4935__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__4935__$1)) {
          var c__3073__auto__ = cljs.core.chunk_first.call(null, seq__4935__$1);
          var G__4955 = cljs.core.chunk_rest.call(null, seq__4935__$1);
          var G__4956 = c__3073__auto__;
          var G__4957 = cljs.core.count.call(null, c__3073__auto__);
          var G__4958 = 0;
          seq__4935 = G__4955;
          chunk__4936 = G__4956;
          count__4937 = G__4957;
          i__4938 = G__4958;
          continue
        }else {
          var component = cljs.core.first.call(null, seq__4935__$1);
          specljs.components.install.call(null, component, description);
          var G__4959 = cljs.core.next.call(null, seq__4935__$1);
          var G__4960 = null;
          var G__4961 = 0;
          var G__4962 = 0;
          seq__4935 = G__4959;
          chunk__4936 = G__4960;
          count__4937 = G__4961;
          i__4938 = G__4962;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
};
cljs.core.EmptyList.prototype.specljs$components$SpecComponent$ = true;
cljs.core.EmptyList.prototype.specljs$components$SpecComponent$install$arity$2 = function(this$, description) {
  var seq__4939 = cljs.core.seq.call(null, cljs.core.seq.call(null, this$));
  var chunk__4940 = null;
  var count__4941 = 0;
  var i__4942 = 0;
  while(true) {
    if(i__4942 < count__4941) {
      var component = cljs.core._nth.call(null, chunk__4940, i__4942);
      specljs.components.install.call(null, component, description);
      var G__4963 = seq__4939;
      var G__4964 = chunk__4940;
      var G__4965 = count__4941;
      var G__4966 = i__4942 + 1;
      seq__4939 = G__4963;
      chunk__4940 = G__4964;
      count__4941 = G__4965;
      i__4942 = G__4966;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__4939);
      if(temp__4092__auto__) {
        var seq__4939__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__4939__$1)) {
          var c__3073__auto__ = cljs.core.chunk_first.call(null, seq__4939__$1);
          var G__4967 = cljs.core.chunk_rest.call(null, seq__4939__$1);
          var G__4968 = c__3073__auto__;
          var G__4969 = cljs.core.count.call(null, c__3073__auto__);
          var G__4970 = 0;
          seq__4939 = G__4967;
          chunk__4940 = G__4968;
          count__4941 = G__4969;
          i__4942 = G__4970;
          continue
        }else {
          var component = cljs.core.first.call(null, seq__4939__$1);
          specljs.components.install.call(null, component, description);
          var G__4971 = cljs.core.next.call(null, seq__4939__$1);
          var G__4972 = null;
          var G__4973 = 0;
          var G__4974 = 0;
          seq__4939 = G__4971;
          chunk__4940 = G__4972;
          count__4941 = G__4973;
          i__4942 = G__4974;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
};
cljs.core.List.prototype.specljs$components$SpecComponent$ = true;
cljs.core.List.prototype.specljs$components$SpecComponent$install$arity$2 = function(this$, description) {
  var seq__4943 = cljs.core.seq.call(null, cljs.core.seq.call(null, this$));
  var chunk__4944 = null;
  var count__4945 = 0;
  var i__4946 = 0;
  while(true) {
    if(i__4946 < count__4945) {
      var component = cljs.core._nth.call(null, chunk__4944, i__4946);
      specljs.components.install.call(null, component, description);
      var G__4975 = seq__4943;
      var G__4976 = chunk__4944;
      var G__4977 = count__4945;
      var G__4978 = i__4946 + 1;
      seq__4943 = G__4975;
      chunk__4944 = G__4976;
      count__4945 = G__4977;
      i__4946 = G__4978;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__4943);
      if(temp__4092__auto__) {
        var seq__4943__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__4943__$1)) {
          var c__3073__auto__ = cljs.core.chunk_first.call(null, seq__4943__$1);
          var G__4979 = cljs.core.chunk_rest.call(null, seq__4943__$1);
          var G__4980 = c__3073__auto__;
          var G__4981 = cljs.core.count.call(null, c__3073__auto__);
          var G__4982 = 0;
          seq__4943 = G__4979;
          chunk__4944 = G__4980;
          count__4945 = G__4981;
          i__4946 = G__4982;
          continue
        }else {
          var component = cljs.core.first.call(null, seq__4943__$1);
          specljs.components.install.call(null, component, description);
          var G__4983 = cljs.core.next.call(null, seq__4943__$1);
          var G__4984 = null;
          var G__4985 = 0;
          var G__4986 = 0;
          seq__4943 = G__4983;
          chunk__4944 = G__4984;
          count__4945 = G__4985;
          i__4946 = G__4986;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
};
cljs.core.LazySeq.prototype.specljs$components$SpecComponent$ = true;
cljs.core.LazySeq.prototype.specljs$components$SpecComponent$install$arity$2 = function(this$, description) {
  var seq__4947 = cljs.core.seq.call(null, cljs.core.seq.call(null, this$));
  var chunk__4948 = null;
  var count__4949 = 0;
  var i__4950 = 0;
  while(true) {
    if(i__4950 < count__4949) {
      var component = cljs.core._nth.call(null, chunk__4948, i__4950);
      specljs.components.install.call(null, component, description);
      var G__4987 = seq__4947;
      var G__4988 = chunk__4948;
      var G__4989 = count__4949;
      var G__4990 = i__4950 + 1;
      seq__4947 = G__4987;
      chunk__4948 = G__4988;
      count__4949 = G__4989;
      i__4950 = G__4990;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__4947);
      if(temp__4092__auto__) {
        var seq__4947__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__4947__$1)) {
          var c__3073__auto__ = cljs.core.chunk_first.call(null, seq__4947__$1);
          var G__4991 = cljs.core.chunk_rest.call(null, seq__4947__$1);
          var G__4992 = c__3073__auto__;
          var G__4993 = cljs.core.count.call(null, c__3073__auto__);
          var G__4994 = 0;
          seq__4947 = G__4991;
          chunk__4948 = G__4992;
          count__4949 = G__4993;
          i__4950 = G__4994;
          continue
        }else {
          var component = cljs.core.first.call(null, seq__4947__$1);
          specljs.components.install.call(null, component, description);
          var G__4995 = cljs.core.next.call(null, seq__4947__$1);
          var G__4996 = null;
          var G__4997 = 0;
          var G__4998 = 0;
          seq__4947 = G__4995;
          chunk__4948 = G__4996;
          count__4949 = G__4997;
          i__4950 = G__4998;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
};
goog.provide("specljs.components.Description");
specljs.components.Description = function(name, ns, parent, children, charcteristics, tags, befores, before_alls, afters, after_alls, withs, with_alls, arounds) {
  this.name = name;
  this.ns = ns;
  this.parent = parent;
  this.children = children;
  this.charcteristics = charcteristics;
  this.tags = tags;
  this.befores = befores;
  this.before_alls = before_alls;
  this.afters = afters;
  this.after_alls = after_alls;
  this.withs = withs;
  this.with_alls = with_alls;
  this.arounds = arounds
};
specljs.components.Description.cljs$lang$type = true;
specljs.components.Description.cljs$lang$ctorStr = "specljs.components/Description";
specljs.components.Description.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "specljs.components/Description")
};
specljs.components.Description.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return[cljs.core.str("Description: "), cljs.core.str('"'), cljs.core.str(self__.name), cljs.core.str('"')].join("")
};
specljs.components.Description.prototype.specljs$components$SpecComponent$ = true;
specljs.components.Description.prototype.specljs$components$SpecComponent$install$arity$2 = function(this$, description) {
  var self__ = this;
  cljs.core.reset_BANG_.call(null, this$.parent, description);
  return cljs.core.swap_BANG_.call(null, description.children, cljs.core.conj, this$)
};
specljs.components.new_description = function new_description(name, ns) {
  return new specljs.components.Description(name, ns, cljs.core.atom.call(null, null), cljs.core.atom.call(null, cljs.core.PersistentVector.EMPTY), cljs.core.atom.call(null, cljs.core.PersistentVector.EMPTY), cljs.core.atom.call(null, cljs.core.PersistentHashSet.EMPTY), cljs.core.atom.call(null, cljs.core.PersistentVector.EMPTY), cljs.core.atom.call(null, cljs.core.PersistentVector.EMPTY), cljs.core.atom.call(null, cljs.core.PersistentVector.EMPTY), cljs.core.atom.call(null, cljs.core.PersistentVector.EMPTY), 
  cljs.core.atom.call(null, cljs.core.PersistentVector.EMPTY), cljs.core.atom.call(null, cljs.core.PersistentVector.EMPTY), cljs.core.atom.call(null, cljs.core.PersistentVector.EMPTY))
};
goog.provide("specljs.components.Characteristic");
specljs.components.Characteristic = function(name, parent, body) {
  this.name = name;
  this.parent = parent;
  this.body = body
};
specljs.components.Characteristic.cljs$lang$type = true;
specljs.components.Characteristic.cljs$lang$ctorStr = "specljs.components/Characteristic";
specljs.components.Characteristic.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "specljs.components/Characteristic")
};
specljs.components.Characteristic.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return[cljs.core.str('"'), cljs.core.str(self__.name), cljs.core.str('"')].join("")
};
specljs.components.Characteristic.prototype.specljs$components$SpecComponent$ = true;
specljs.components.Characteristic.prototype.specljs$components$SpecComponent$install$arity$2 = function(this$, description) {
  var self__ = this;
  cljs.core.reset_BANG_.call(null, this$.parent, description);
  return cljs.core.swap_BANG_.call(null, description.charcteristics, cljs.core.conj, this$)
};
specljs.components.new_characteristic = function() {
  var new_characteristic = null;
  var new_characteristic__2 = function(name, body) {
    return new specljs.components.Characteristic(name, cljs.core.atom.call(null, null), body)
  };
  var new_characteristic__3 = function(name, description, body) {
    return new specljs.components.Characteristic(name, cljs.core.atom.call(null, description), body)
  };
  new_characteristic = function(name, description, body) {
    switch(arguments.length) {
      case 2:
        return new_characteristic__2.call(this, name, description);
      case 3:
        return new_characteristic__3.call(this, name, description, body)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  new_characteristic.cljs$core$IFn$_invoke$arity$2 = new_characteristic__2;
  new_characteristic.cljs$core$IFn$_invoke$arity$3 = new_characteristic__3;
  return new_characteristic
}();
goog.provide("specljs.components.Before");
specljs.components.Before = function(body) {
  this.body = body
};
specljs.components.Before.cljs$lang$type = true;
specljs.components.Before.cljs$lang$ctorStr = "specljs.components/Before";
specljs.components.Before.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "specljs.components/Before")
};
specljs.components.Before.prototype.specljs$components$SpecComponent$ = true;
specljs.components.Before.prototype.specljs$components$SpecComponent$install$arity$2 = function(this$, description) {
  var self__ = this;
  return cljs.core.swap_BANG_.call(null, description.befores, cljs.core.conj, this$)
};
specljs.components.new_before = function new_before(body) {
  return new specljs.components.Before(body)
};
goog.provide("specljs.components.After");
specljs.components.After = function(body) {
  this.body = body
};
specljs.components.After.cljs$lang$type = true;
specljs.components.After.cljs$lang$ctorStr = "specljs.components/After";
specljs.components.After.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "specljs.components/After")
};
specljs.components.After.prototype.specljs$components$SpecComponent$ = true;
specljs.components.After.prototype.specljs$components$SpecComponent$install$arity$2 = function(this$, description) {
  var self__ = this;
  return cljs.core.swap_BANG_.call(null, description.afters, cljs.core.conj, this$)
};
specljs.components.new_after = function new_after(body) {
  return new specljs.components.After(body)
};
goog.provide("specljs.components.Around");
specljs.components.Around = function(body) {
  this.body = body
};
specljs.components.Around.cljs$lang$type = true;
specljs.components.Around.cljs$lang$ctorStr = "specljs.components/Around";
specljs.components.Around.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "specljs.components/Around")
};
specljs.components.Around.prototype.specljs$components$SpecComponent$ = true;
specljs.components.Around.prototype.specljs$components$SpecComponent$install$arity$2 = function(this$, description) {
  var self__ = this;
  return cljs.core.swap_BANG_.call(null, description.arounds, cljs.core.conj, this$)
};
specljs.components.new_around = function new_around(body) {
  return new specljs.components.Around(body)
};
goog.provide("specljs.components.BeforeAll");
specljs.components.BeforeAll = function(body) {
  this.body = body
};
specljs.components.BeforeAll.cljs$lang$type = true;
specljs.components.BeforeAll.cljs$lang$ctorStr = "specljs.components/BeforeAll";
specljs.components.BeforeAll.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "specljs.components/BeforeAll")
};
specljs.components.BeforeAll.prototype.specljs$components$SpecComponent$ = true;
specljs.components.BeforeAll.prototype.specljs$components$SpecComponent$install$arity$2 = function(this$, description) {
  var self__ = this;
  return cljs.core.swap_BANG_.call(null, description.before_alls, cljs.core.conj, this$)
};
specljs.components.new_before_all = function new_before_all(body) {
  return new specljs.components.BeforeAll(body)
};
goog.provide("specljs.components.AfterAll");
specljs.components.AfterAll = function(body) {
  this.body = body
};
specljs.components.AfterAll.cljs$lang$type = true;
specljs.components.AfterAll.cljs$lang$ctorStr = "specljs.components/AfterAll";
specljs.components.AfterAll.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "specljs.components/AfterAll")
};
specljs.components.AfterAll.prototype.specljs$components$SpecComponent$ = true;
specljs.components.AfterAll.prototype.specljs$components$SpecComponent$install$arity$2 = function(this$, description) {
  var self__ = this;
  return cljs.core.swap_BANG_.call(null, description.after_alls, cljs.core.conj, this$)
};
specljs.components.new_after_all = function new_after_all(body) {
  return new specljs.components.AfterAll(body)
};
goog.provide("specljs.components.With");
specljs.components.With = function(name, unique_name, body, value, bang) {
  this.name = name;
  this.unique_name = unique_name;
  this.body = body;
  this.value = value;
  this.bang = bang;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
specljs.components.With.cljs$lang$type = true;
specljs.components.With.cljs$lang$ctorStr = "specljs.components/With";
specljs.components.With.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "specljs.components/With")
};
specljs.components.With.prototype.cljs$core$IDeref$_deref$arity$1 = function(this$) {
  var self__ = this;
  if(cljs.core._EQ_.call(null, "\ufdd0:specljs.components/none", cljs.core.deref.call(null, self__.value))) {
    cljs.core.reset_BANG_.call(null, self__.value, self__.body.call(null))
  }else {
  }
  return cljs.core.deref.call(null, self__.value)
};
specljs.components.With.prototype.specljs$components$SpecComponent$ = true;
specljs.components.With.prototype.specljs$components$SpecComponent$install$arity$2 = function(this$, description) {
  var self__ = this;
  return cljs.core.swap_BANG_.call(null, description.withs, cljs.core.conj, this$)
};
specljs.components.reset_with = function reset_with(with$) {
  cljs.core.reset_BANG_.call(null, with$.value, "\ufdd0:specljs.components/none");
  if(cljs.core.truth_(with$.bang)) {
    return cljs.core.deref.call(null, with$)
  }else {
    return null
  }
};
specljs.components.new_with = function new_with(name, unique_name, body, bang) {
  var with$ = new specljs.components.With(name, unique_name, body, cljs.core.atom.call(null, "\ufdd0:specljs.components/none"), bang);
  if(cljs.core.truth_(bang)) {
    cljs.core.deref.call(null, with$)
  }else {
  }
  return with$
};
goog.provide("specljs.components.WithAll");
specljs.components.WithAll = function(name, unique_name, body, value, bang) {
  this.name = name;
  this.unique_name = unique_name;
  this.body = body;
  this.value = value;
  this.bang = bang;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
specljs.components.WithAll.cljs$lang$type = true;
specljs.components.WithAll.cljs$lang$ctorStr = "specljs.components/WithAll";
specljs.components.WithAll.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "specljs.components/WithAll")
};
specljs.components.WithAll.prototype.cljs$core$IDeref$_deref$arity$1 = function(this$) {
  var self__ = this;
  if(cljs.core._EQ_.call(null, "\ufdd0:specljs.components/none", cljs.core.deref.call(null, self__.value))) {
    cljs.core.reset_BANG_.call(null, self__.value, self__.body.call(null))
  }else {
  }
  return cljs.core.deref.call(null, self__.value)
};
specljs.components.WithAll.prototype.specljs$components$SpecComponent$ = true;
specljs.components.WithAll.prototype.specljs$components$SpecComponent$install$arity$2 = function(this$, description) {
  var self__ = this;
  return cljs.core.swap_BANG_.call(null, description.with_alls, cljs.core.conj, this$)
};
specljs.components.new_with_all = function new_with_all(name, unique_name, body, bang) {
  var with_all = new specljs.components.WithAll(name, unique_name, body, cljs.core.atom.call(null, "\ufdd0:specljs.components/none"), bang);
  if(cljs.core.truth_(bang)) {
    cljs.core.deref.call(null, with_all)
  }else {
  }
  return with_all
};
goog.provide("specljs.components.Tag");
specljs.components.Tag = function(name) {
  this.name = name
};
specljs.components.Tag.cljs$lang$type = true;
specljs.components.Tag.cljs$lang$ctorStr = "specljs.components/Tag";
specljs.components.Tag.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "specljs.components/Tag")
};
specljs.components.Tag.prototype.specljs$components$SpecComponent$ = true;
specljs.components.Tag.prototype.specljs$components$SpecComponent$install$arity$2 = function(this$, description) {
  var self__ = this;
  return cljs.core.swap_BANG_.call(null, description.tags, cljs.core.conj, self__.name)
};
specljs.components.new_tag = function new_tag(name) {
  return new specljs.components.Tag(name)
};
goog.provide("specljs.reporting");
goog.require("cljs.core");
goog.require("clojure.string");
goog.require("specljs.results");
goog.require("specljs.config");
goog.require("specljs.platform");
goog.require("specljs.results");
goog.require("specljs.platform");
goog.require("specljs.config");
goog.require("clojure.string");
specljs.reporting.tally_time = function tally_time(results) {
  return cljs.core.apply.call(null, cljs.core._PLUS_, cljs.core.map.call(null, function(p1__5143_SHARP_) {
    return p1__5143_SHARP_.seconds
  }, results))
};
specljs.reporting.Reporter = {};
specljs.reporting.report_message = function report_message(reporter, message) {
  if(function() {
    var and__3941__auto__ = reporter;
    if(and__3941__auto__) {
      return reporter.specljs$reporting$Reporter$report_message$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return reporter.specljs$reporting$Reporter$report_message$arity$2(reporter, message)
  }else {
    var x__2942__auto__ = reporter == null ? null : reporter;
    return function() {
      var or__3943__auto__ = specljs.reporting.report_message[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = specljs.reporting.report_message["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "Reporter.report-message", reporter);
        }
      }
    }().call(null, reporter, message)
  }
};
specljs.reporting.report_description = function report_description(this$, description) {
  if(function() {
    var and__3941__auto__ = this$;
    if(and__3941__auto__) {
      return this$.specljs$reporting$Reporter$report_description$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return this$.specljs$reporting$Reporter$report_description$arity$2(this$, description)
  }else {
    var x__2942__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3943__auto__ = specljs.reporting.report_description[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = specljs.reporting.report_description["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "Reporter.report-description", this$);
        }
      }
    }().call(null, this$, description)
  }
};
specljs.reporting.report_pass = function report_pass(this$, result) {
  if(function() {
    var and__3941__auto__ = this$;
    if(and__3941__auto__) {
      return this$.specljs$reporting$Reporter$report_pass$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return this$.specljs$reporting$Reporter$report_pass$arity$2(this$, result)
  }else {
    var x__2942__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3943__auto__ = specljs.reporting.report_pass[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = specljs.reporting.report_pass["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "Reporter.report-pass", this$);
        }
      }
    }().call(null, this$, result)
  }
};
specljs.reporting.report_pending = function report_pending(this$, result) {
  if(function() {
    var and__3941__auto__ = this$;
    if(and__3941__auto__) {
      return this$.specljs$reporting$Reporter$report_pending$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return this$.specljs$reporting$Reporter$report_pending$arity$2(this$, result)
  }else {
    var x__2942__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3943__auto__ = specljs.reporting.report_pending[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = specljs.reporting.report_pending["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "Reporter.report-pending", this$);
        }
      }
    }().call(null, this$, result)
  }
};
specljs.reporting.report_fail = function report_fail(this$, result) {
  if(function() {
    var and__3941__auto__ = this$;
    if(and__3941__auto__) {
      return this$.specljs$reporting$Reporter$report_fail$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return this$.specljs$reporting$Reporter$report_fail$arity$2(this$, result)
  }else {
    var x__2942__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3943__auto__ = specljs.reporting.report_fail[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = specljs.reporting.report_fail["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "Reporter.report-fail", this$);
        }
      }
    }().call(null, this$, result)
  }
};
specljs.reporting.report_runs = function report_runs(this$, results) {
  if(function() {
    var and__3941__auto__ = this$;
    if(and__3941__auto__) {
      return this$.specljs$reporting$Reporter$report_runs$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return this$.specljs$reporting$Reporter$report_runs$arity$2(this$, results)
  }else {
    var x__2942__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3943__auto__ = specljs.reporting.report_runs[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = specljs.reporting.report_runs["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "Reporter.report-runs", this$);
        }
      }
    }().call(null, this$, results)
  }
};
specljs.reporting.report_error = function report_error(this$, exception) {
  if(function() {
    var and__3941__auto__ = this$;
    if(and__3941__auto__) {
      return this$.specljs$reporting$Reporter$report_error$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return this$.specljs$reporting$Reporter$report_error$arity$2(this$, exception)
  }else {
    var x__2942__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3943__auto__ = specljs.reporting.report_error[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = specljs.reporting.report_error["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "Reporter.report-error", this$);
        }
      }
    }().call(null, this$, exception)
  }
};
specljs.reporting.report_run = function() {
  var method_table__3130__auto__ = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var prefer_table__3131__auto__ = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var method_cache__3132__auto__ = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var cached_hierarchy__3133__auto__ = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var hierarchy__3134__auto__ = cljs.core.get.call(null, cljs.core.ObjMap.EMPTY, "\ufdd0:hierarchy", cljs.core.get_global_hierarchy.call(null));
  return new cljs.core.MultiFn("report-run", function(result, reporters) {
    return cljs.core.type.call(null, result)
  }, "\ufdd0:default", hierarchy__3134__auto__, method_table__3130__auto__, prefer_table__3131__auto__, method_cache__3132__auto__, cached_hierarchy__3133__auto__)
}();
cljs.core._add_method.call(null, specljs.reporting.report_run, specljs.results.PassResult, function(result, reporters) {
  var seq__5144 = cljs.core.seq.call(null, reporters);
  var chunk__5145 = null;
  var count__5146 = 0;
  var i__5147 = 0;
  while(true) {
    if(i__5147 < count__5146) {
      var reporter = cljs.core._nth.call(null, chunk__5145, i__5147);
      specljs.reporting.report_pass.call(null, reporter, result);
      var G__5148 = seq__5144;
      var G__5149 = chunk__5145;
      var G__5150 = count__5146;
      var G__5151 = i__5147 + 1;
      seq__5144 = G__5148;
      chunk__5145 = G__5149;
      count__5146 = G__5150;
      i__5147 = G__5151;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__5144);
      if(temp__4092__auto__) {
        var seq__5144__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__5144__$1)) {
          var c__3073__auto__ = cljs.core.chunk_first.call(null, seq__5144__$1);
          var G__5152 = cljs.core.chunk_rest.call(null, seq__5144__$1);
          var G__5153 = c__3073__auto__;
          var G__5154 = cljs.core.count.call(null, c__3073__auto__);
          var G__5155 = 0;
          seq__5144 = G__5152;
          chunk__5145 = G__5153;
          count__5146 = G__5154;
          i__5147 = G__5155;
          continue
        }else {
          var reporter = cljs.core.first.call(null, seq__5144__$1);
          specljs.reporting.report_pass.call(null, reporter, result);
          var G__5156 = cljs.core.next.call(null, seq__5144__$1);
          var G__5157 = null;
          var G__5158 = 0;
          var G__5159 = 0;
          seq__5144 = G__5156;
          chunk__5145 = G__5157;
          count__5146 = G__5158;
          i__5147 = G__5159;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
});
cljs.core._add_method.call(null, specljs.reporting.report_run, specljs.results.FailResult, function(result, reporters) {
  var seq__5160 = cljs.core.seq.call(null, reporters);
  var chunk__5161 = null;
  var count__5162 = 0;
  var i__5163 = 0;
  while(true) {
    if(i__5163 < count__5162) {
      var reporter = cljs.core._nth.call(null, chunk__5161, i__5163);
      specljs.reporting.report_fail.call(null, reporter, result);
      var G__5164 = seq__5160;
      var G__5165 = chunk__5161;
      var G__5166 = count__5162;
      var G__5167 = i__5163 + 1;
      seq__5160 = G__5164;
      chunk__5161 = G__5165;
      count__5162 = G__5166;
      i__5163 = G__5167;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__5160);
      if(temp__4092__auto__) {
        var seq__5160__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__5160__$1)) {
          var c__3073__auto__ = cljs.core.chunk_first.call(null, seq__5160__$1);
          var G__5168 = cljs.core.chunk_rest.call(null, seq__5160__$1);
          var G__5169 = c__3073__auto__;
          var G__5170 = cljs.core.count.call(null, c__3073__auto__);
          var G__5171 = 0;
          seq__5160 = G__5168;
          chunk__5161 = G__5169;
          count__5162 = G__5170;
          i__5163 = G__5171;
          continue
        }else {
          var reporter = cljs.core.first.call(null, seq__5160__$1);
          specljs.reporting.report_fail.call(null, reporter, result);
          var G__5172 = cljs.core.next.call(null, seq__5160__$1);
          var G__5173 = null;
          var G__5174 = 0;
          var G__5175 = 0;
          seq__5160 = G__5172;
          chunk__5161 = G__5173;
          count__5162 = G__5174;
          i__5163 = G__5175;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
});
cljs.core._add_method.call(null, specljs.reporting.report_run, specljs.results.PendingResult, function(result, reporters) {
  var seq__5176 = cljs.core.seq.call(null, reporters);
  var chunk__5177 = null;
  var count__5178 = 0;
  var i__5179 = 0;
  while(true) {
    if(i__5179 < count__5178) {
      var reporter = cljs.core._nth.call(null, chunk__5177, i__5179);
      specljs.reporting.report_pending.call(null, reporter, result);
      var G__5180 = seq__5176;
      var G__5181 = chunk__5177;
      var G__5182 = count__5178;
      var G__5183 = i__5179 + 1;
      seq__5176 = G__5180;
      chunk__5177 = G__5181;
      count__5178 = G__5182;
      i__5179 = G__5183;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__5176);
      if(temp__4092__auto__) {
        var seq__5176__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__5176__$1)) {
          var c__3073__auto__ = cljs.core.chunk_first.call(null, seq__5176__$1);
          var G__5184 = cljs.core.chunk_rest.call(null, seq__5176__$1);
          var G__5185 = c__3073__auto__;
          var G__5186 = cljs.core.count.call(null, c__3073__auto__);
          var G__5187 = 0;
          seq__5176 = G__5184;
          chunk__5177 = G__5185;
          count__5178 = G__5186;
          i__5179 = G__5187;
          continue
        }else {
          var reporter = cljs.core.first.call(null, seq__5176__$1);
          specljs.reporting.report_pending.call(null, reporter, result);
          var G__5188 = cljs.core.next.call(null, seq__5176__$1);
          var G__5189 = null;
          var G__5190 = 0;
          var G__5191 = 0;
          seq__5176 = G__5188;
          chunk__5177 = G__5189;
          count__5178 = G__5190;
          i__5179 = G__5191;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
});
cljs.core._add_method.call(null, specljs.reporting.report_run, specljs.results.ErrorResult, function(result, reporters) {
  var seq__5192 = cljs.core.seq.call(null, reporters);
  var chunk__5193 = null;
  var count__5194 = 0;
  var i__5195 = 0;
  while(true) {
    if(i__5195 < count__5194) {
      var reporter = cljs.core._nth.call(null, chunk__5193, i__5195);
      specljs.reporting.report_error.call(null, reporter, result);
      var G__5196 = seq__5192;
      var G__5197 = chunk__5193;
      var G__5198 = count__5194;
      var G__5199 = i__5195 + 1;
      seq__5192 = G__5196;
      chunk__5193 = G__5197;
      count__5194 = G__5198;
      i__5195 = G__5199;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__5192);
      if(temp__4092__auto__) {
        var seq__5192__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__5192__$1)) {
          var c__3073__auto__ = cljs.core.chunk_first.call(null, seq__5192__$1);
          var G__5200 = cljs.core.chunk_rest.call(null, seq__5192__$1);
          var G__5201 = c__3073__auto__;
          var G__5202 = cljs.core.count.call(null, c__3073__auto__);
          var G__5203 = 0;
          seq__5192 = G__5200;
          chunk__5193 = G__5201;
          count__5194 = G__5202;
          i__5195 = G__5203;
          continue
        }else {
          var reporter = cljs.core.first.call(null, seq__5192__$1);
          specljs.reporting.report_error.call(null, reporter, result);
          var G__5204 = cljs.core.next.call(null, seq__5192__$1);
          var G__5205 = null;
          var G__5206 = 0;
          var G__5207 = 0;
          seq__5192 = G__5204;
          chunk__5193 = G__5205;
          count__5194 = G__5206;
          i__5195 = G__5207;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
});
specljs.reporting.stylizer = function stylizer(code) {
  return function(text) {
    if(cljs.core.truth_(specljs.config._STAR_color_QMARK__STAR_)) {
      return[cljs.core.str("\u001b["), cljs.core.str(code), cljs.core.str("m"), cljs.core.str(text), cljs.core.str("\u001b[0m")].join("")
    }else {
      return text
    }
  }
};
specljs.reporting.red = specljs.reporting.stylizer.call(null, "31");
specljs.reporting.green = specljs.reporting.stylizer.call(null, "32");
specljs.reporting.yellow = specljs.reporting.stylizer.call(null, "33");
specljs.reporting.grey = specljs.reporting.stylizer.call(null, "90");
specljs.reporting.print_elides = function print_elides(n) {
  if(n > 0) {
    return cljs.core.println.call(null, "\t...", n, "stack levels elided ...")
  }else {
    return null
  }
};
specljs.reporting.print_stack_levels = function print_stack_levels(exception) {
  var levels_5208 = specljs.platform.stack_trace.call(null, exception);
  var elides_5209 = 0;
  while(true) {
    if(cljs.core.seq.call(null, levels_5208)) {
      var level_5210 = cljs.core.first.call(null, levels_5208);
      if(cljs.core.truth_(specljs.platform.elide_level_QMARK_.call(null, level_5210))) {
        var G__5211 = cljs.core.rest.call(null, levels_5208);
        var G__5212 = elides_5209 + 1;
        levels_5208 = G__5211;
        elides_5209 = G__5212;
        continue
      }else {
        specljs.reporting.print_elides.call(null, elides_5209);
        cljs.core.println.call(null, [cljs.core.str(level_5210)].join(""));
        var G__5213 = cljs.core.rest.call(null, levels_5208);
        var G__5214 = 0;
        levels_5208 = G__5213;
        elides_5209 = G__5214;
        continue
      }
    }else {
      specljs.reporting.print_elides.call(null, elides_5209)
    }
    break
  }
  var temp__4090__auto__ = specljs.platform.cause.call(null, exception);
  if(cljs.core.truth_(temp__4090__auto__)) {
    var cause = temp__4090__auto__;
    return specljs.reporting.print_exception.call(null, "Caused by:", cause)
  }else {
    return null
  }
};
specljs.reporting.print_exception = function print_exception(prefix, exception) {
  if(cljs.core.truth_(prefix)) {
    cljs.core.println.call(null, prefix, [cljs.core.str(exception)].join(""))
  }else {
    cljs.core.println.call(null, [cljs.core.str(exception)].join(""))
  }
  return specljs.reporting.print_stack_levels.call(null, exception)
};
specljs.reporting.stack_trace_str = function stack_trace_str(exception) {
  var sb__3170__auto__ = new goog.string.StringBuffer;
  var _STAR_print_fn_STAR_5218_5220 = cljs.core._STAR_print_fn_STAR_;
  try {
    cljs.core._STAR_print_fn_STAR_ = function(x__3171__auto__) {
      return sb__3170__auto__.append(x__3171__auto__)
    };
    if(cljs.core.truth_(specljs.config._STAR_full_stack_trace_QMARK__STAR_)) {
      specljs.platform.print_stack_trace.call(null, exception)
    }else {
      specljs.reporting.print_exception.call(null, null, exception)
    }
  }finally {
    cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR_5218_5220
  }
  return[cljs.core.str(sb__3170__auto__)].join("")
};
specljs.reporting.prefix = function() {
  var prefix__delegate = function(pre, args) {
    var value = cljs.core.apply.call(null, cljs.core.str, args);
    var lines = clojure.string.split.call(null, value, /[\r\n]+/);
    var prefixed_lines = cljs.core.map.call(null, function(value, lines) {
      return function(p1__5215_SHARP_) {
        return[cljs.core.str(pre), cljs.core.str(p1__5215_SHARP_)].join("")
      }
    }(value, lines), lines);
    return clojure.string.join.call(null, specljs.platform.endl, prefixed_lines)
  };
  var prefix = function(pre, var_args) {
    var args = null;
    if(arguments.length > 1) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return prefix__delegate.call(this, pre, args)
  };
  prefix.cljs$lang$maxFixedArity = 1;
  prefix.cljs$lang$applyTo = function(arglist__5221) {
    var pre = cljs.core.first(arglist__5221);
    var args = cljs.core.rest(arglist__5221);
    return prefix__delegate(pre, args)
  };
  prefix.cljs$core$IFn$_invoke$arity$variadic = prefix__delegate;
  return prefix
}();
specljs.reporting.indent = function() {
  var indent__delegate = function(n, args) {
    var spaces = n * 2 | 0;
    var indention = cljs.core.reduce.call(null, function(spaces) {
      return function(p, _) {
        return[cljs.core.str(" "), cljs.core.str(p)].join("")
      }
    }(spaces), "", cljs.core.range.call(null, spaces));
    return cljs.core.apply.call(null, specljs.reporting.prefix, indention, args)
  };
  var indent = function(n, var_args) {
    var args = null;
    if(arguments.length > 1) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return indent__delegate.call(this, n, args)
  };
  indent.cljs$lang$maxFixedArity = 1;
  indent.cljs$lang$applyTo = function(arglist__5222) {
    var n = cljs.core.first(arglist__5222);
    var args = cljs.core.rest(arglist__5222);
    return indent__delegate(n, args)
  };
  indent.cljs$core$IFn$_invoke$arity$variadic = indent__delegate;
  return indent
}();
specljs.reporting.report_description_STAR_ = function report_description_STAR_(reporters, description) {
  var seq__5227 = cljs.core.seq.call(null, reporters);
  var chunk__5228 = null;
  var count__5229 = 0;
  var i__5230 = 0;
  while(true) {
    if(i__5230 < count__5229) {
      var reporter = cljs.core._nth.call(null, chunk__5228, i__5230);
      specljs.reporting.report_description.call(null, reporter, description);
      var G__5231 = seq__5227;
      var G__5232 = chunk__5228;
      var G__5233 = count__5229;
      var G__5234 = i__5230 + 1;
      seq__5227 = G__5231;
      chunk__5228 = G__5232;
      count__5229 = G__5233;
      i__5230 = G__5234;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__5227);
      if(temp__4092__auto__) {
        var seq__5227__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__5227__$1)) {
          var c__3073__auto__ = cljs.core.chunk_first.call(null, seq__5227__$1);
          var G__5235 = cljs.core.chunk_rest.call(null, seq__5227__$1);
          var G__5236 = c__3073__auto__;
          var G__5237 = cljs.core.count.call(null, c__3073__auto__);
          var G__5238 = 0;
          seq__5227 = G__5235;
          chunk__5228 = G__5236;
          count__5229 = G__5237;
          i__5230 = G__5238;
          continue
        }else {
          var reporter = cljs.core.first.call(null, seq__5227__$1);
          specljs.reporting.report_description.call(null, reporter, description);
          var G__5239 = cljs.core.next.call(null, seq__5227__$1);
          var G__5240 = null;
          var G__5241 = 0;
          var G__5242 = 0;
          seq__5227 = G__5239;
          chunk__5228 = G__5240;
          count__5229 = G__5241;
          i__5230 = G__5242;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
};
specljs.reporting.report_runs_STAR_ = function report_runs_STAR_(reporters, results) {
  var seq__5247 = cljs.core.seq.call(null, reporters);
  var chunk__5248 = null;
  var count__5249 = 0;
  var i__5250 = 0;
  while(true) {
    if(i__5250 < count__5249) {
      var reporter = cljs.core._nth.call(null, chunk__5248, i__5250);
      specljs.reporting.report_runs.call(null, reporter, results);
      var G__5251 = seq__5247;
      var G__5252 = chunk__5248;
      var G__5253 = count__5249;
      var G__5254 = i__5250 + 1;
      seq__5247 = G__5251;
      chunk__5248 = G__5252;
      count__5249 = G__5253;
      i__5250 = G__5254;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__5247);
      if(temp__4092__auto__) {
        var seq__5247__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__5247__$1)) {
          var c__3073__auto__ = cljs.core.chunk_first.call(null, seq__5247__$1);
          var G__5255 = cljs.core.chunk_rest.call(null, seq__5247__$1);
          var G__5256 = c__3073__auto__;
          var G__5257 = cljs.core.count.call(null, c__3073__auto__);
          var G__5258 = 0;
          seq__5247 = G__5255;
          chunk__5248 = G__5256;
          count__5249 = G__5257;
          i__5250 = G__5258;
          continue
        }else {
          var reporter = cljs.core.first.call(null, seq__5247__$1);
          specljs.reporting.report_runs.call(null, reporter, results);
          var G__5259 = cljs.core.next.call(null, seq__5247__$1);
          var G__5260 = null;
          var G__5261 = 0;
          var G__5262 = 0;
          seq__5247 = G__5259;
          chunk__5248 = G__5260;
          count__5249 = G__5261;
          i__5250 = G__5262;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
};
specljs.reporting.report_message_STAR_ = function report_message_STAR_(reporters, message) {
  var seq__5267 = cljs.core.seq.call(null, reporters);
  var chunk__5268 = null;
  var count__5269 = 0;
  var i__5270 = 0;
  while(true) {
    if(i__5270 < count__5269) {
      var reporter = cljs.core._nth.call(null, chunk__5268, i__5270);
      specljs.reporting.report_message.call(null, reporter, message);
      var G__5271 = seq__5267;
      var G__5272 = chunk__5268;
      var G__5273 = count__5269;
      var G__5274 = i__5270 + 1;
      seq__5267 = G__5271;
      chunk__5268 = G__5272;
      count__5269 = G__5273;
      i__5270 = G__5274;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__5267);
      if(temp__4092__auto__) {
        var seq__5267__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__5267__$1)) {
          var c__3073__auto__ = cljs.core.chunk_first.call(null, seq__5267__$1);
          var G__5275 = cljs.core.chunk_rest.call(null, seq__5267__$1);
          var G__5276 = c__3073__auto__;
          var G__5277 = cljs.core.count.call(null, c__3073__auto__);
          var G__5278 = 0;
          seq__5267 = G__5275;
          chunk__5268 = G__5276;
          count__5269 = G__5277;
          i__5270 = G__5278;
          continue
        }else {
          var reporter = cljs.core.first.call(null, seq__5267__$1);
          specljs.reporting.report_message.call(null, reporter, message);
          var G__5279 = cljs.core.next.call(null, seq__5267__$1);
          var G__5280 = null;
          var G__5281 = 0;
          var G__5282 = 0;
          seq__5267 = G__5279;
          chunk__5268 = G__5280;
          count__5269 = G__5281;
          i__5270 = G__5282;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
};
specljs.reporting.report_error_STAR_ = function report_error_STAR_(reporters, exception) {
  var seq__5287 = cljs.core.seq.call(null, reporters);
  var chunk__5288 = null;
  var count__5289 = 0;
  var i__5290 = 0;
  while(true) {
    if(i__5290 < count__5289) {
      var reporter = cljs.core._nth.call(null, chunk__5288, i__5290);
      specljs.reporting.report_error.call(null, reporter, exception);
      var G__5291 = seq__5287;
      var G__5292 = chunk__5288;
      var G__5293 = count__5289;
      var G__5294 = i__5290 + 1;
      seq__5287 = G__5291;
      chunk__5288 = G__5292;
      count__5289 = G__5293;
      i__5290 = G__5294;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__5287);
      if(temp__4092__auto__) {
        var seq__5287__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__5287__$1)) {
          var c__3073__auto__ = cljs.core.chunk_first.call(null, seq__5287__$1);
          var G__5295 = cljs.core.chunk_rest.call(null, seq__5287__$1);
          var G__5296 = c__3073__auto__;
          var G__5297 = cljs.core.count.call(null, c__3073__auto__);
          var G__5298 = 0;
          seq__5287 = G__5295;
          chunk__5288 = G__5296;
          count__5289 = G__5297;
          i__5290 = G__5298;
          continue
        }else {
          var reporter = cljs.core.first.call(null, seq__5287__$1);
          specljs.reporting.report_error.call(null, reporter, exception);
          var G__5299 = cljs.core.next.call(null, seq__5287__$1);
          var G__5300 = null;
          var G__5301 = 0;
          var G__5302 = 0;
          seq__5287 = G__5299;
          chunk__5288 = G__5300;
          count__5289 = G__5301;
          i__5290 = G__5302;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
};
goog.provide("specljs.running");
goog.require("cljs.core");
goog.require("specljs.components");
goog.require("specljs.config");
goog.require("specljs.results");
goog.require("specljs.reporting");
goog.require("specljs.tags");
goog.require("specljs.platform");
goog.require("specljs.tags");
goog.require("specljs.results");
goog.require("specljs.reporting");
goog.require("specljs.platform");
goog.require("specljs.config");
goog.require("specljs.components");
goog.require("clojure.string");
specljs.running.eval_components = function eval_components(components) {
  var seq__5003 = cljs.core.seq.call(null, components);
  var chunk__5004 = null;
  var count__5005 = 0;
  var i__5006 = 0;
  while(true) {
    if(i__5006 < count__5005) {
      var component = cljs.core._nth.call(null, chunk__5004, i__5006);
      component.body.call(null);
      var G__5007 = seq__5003;
      var G__5008 = chunk__5004;
      var G__5009 = count__5005;
      var G__5010 = i__5006 + 1;
      seq__5003 = G__5007;
      chunk__5004 = G__5008;
      count__5005 = G__5009;
      i__5006 = G__5010;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__5003);
      if(temp__4092__auto__) {
        var seq__5003__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__5003__$1)) {
          var c__3073__auto__ = cljs.core.chunk_first.call(null, seq__5003__$1);
          var G__5011 = cljs.core.chunk_rest.call(null, seq__5003__$1);
          var G__5012 = c__3073__auto__;
          var G__5013 = cljs.core.count.call(null, c__3073__auto__);
          var G__5014 = 0;
          seq__5003 = G__5011;
          chunk__5004 = G__5012;
          count__5005 = G__5013;
          i__5006 = G__5014;
          continue
        }else {
          var component = cljs.core.first.call(null, seq__5003__$1);
          component.body.call(null);
          var G__5015 = cljs.core.next.call(null, seq__5003__$1);
          var G__5016 = null;
          var G__5017 = 0;
          var G__5018 = 0;
          seq__5003 = G__5015;
          chunk__5004 = G__5016;
          count__5005 = G__5017;
          i__5006 = G__5018;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
};
specljs.running.nested_fns = function nested_fns(base, fns) {
  if(cljs.core.seq.call(null, fns)) {
    return cljs.core.partial.call(null, cljs.core.first.call(null, fns), nested_fns.call(null, base, cljs.core.rest.call(null, fns)))
  }else {
    return base
  }
};
specljs.running.eval_characteristic = function eval_characteristic(befores, body, afters) {
  specljs.running.eval_components.call(null, befores);
  try {
    return body.call(null)
  }finally {
    specljs.running.eval_components.call(null, afters)
  }
};
specljs.running.reset_withs = function reset_withs(withs) {
  var seq__5025 = cljs.core.seq.call(null, withs);
  var chunk__5026 = null;
  var count__5027 = 0;
  var i__5028 = 0;
  while(true) {
    if(i__5028 < count__5027) {
      var with$ = cljs.core._nth.call(null, chunk__5026, i__5028);
      specljs.components.reset_with.call(null, with$);
      var G__5029 = seq__5025;
      var G__5030 = chunk__5026;
      var G__5031 = count__5027;
      var G__5032 = i__5028 + 1;
      seq__5025 = G__5029;
      chunk__5026 = G__5030;
      count__5027 = G__5031;
      i__5028 = G__5032;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__5025);
      if(temp__4092__auto__) {
        var seq__5025__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__5025__$1)) {
          var c__3073__auto__ = cljs.core.chunk_first.call(null, seq__5025__$1);
          var G__5033 = cljs.core.chunk_rest.call(null, seq__5025__$1);
          var G__5034 = c__3073__auto__;
          var G__5035 = cljs.core.count.call(null, c__3073__auto__);
          var G__5036 = 0;
          seq__5025 = G__5033;
          chunk__5026 = G__5034;
          count__5027 = G__5035;
          i__5028 = G__5036;
          continue
        }else {
          var with$ = cljs.core.first.call(null, seq__5025__$1);
          specljs.components.reset_with.call(null, with$);
          var G__5037 = cljs.core.next.call(null, seq__5025__$1);
          var G__5038 = null;
          var G__5039 = 0;
          var G__5040 = 0;
          seq__5025 = G__5037;
          chunk__5026 = G__5038;
          count__5027 = G__5039;
          i__5028 = G__5040;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
};
specljs.running.collect_components = function collect_components(getter, description) {
  var description__$1 = description;
  var components = cljs.core.PersistentVector.EMPTY;
  while(true) {
    if(cljs.core.truth_(description__$1)) {
      var G__5041 = cljs.core.deref.call(null, description__$1.parent);
      var G__5042 = cljs.core.concat.call(null, getter.call(null, description__$1), components);
      description__$1 = G__5041;
      components = G__5042;
      continue
    }else {
      return components
    }
    break
  }
};
specljs.running.report_result = function report_result(result_constructor, characteristic, start_time, reporters, failure) {
  var present_args = cljs.core.filter.call(null, cljs.core.identity, cljs.core.PersistentVector.fromArray([characteristic, specljs.platform.secs_since.call(null, start_time), failure], true));
  var result = cljs.core.apply.call(null, result_constructor, present_args);
  specljs.reporting.report_run.call(null, result, reporters);
  return result
};
specljs.running.do_characteristic = function do_characteristic(characteristic, reporters) {
  var description = cljs.core.deref.call(null, characteristic.parent);
  var befores = specljs.running.collect_components.call(null, function(description) {
    return function(p1__5043_SHARP_) {
      return cljs.core.deref.call(null, p1__5043_SHARP_.befores)
    }
  }(description), description);
  var afters = specljs.running.collect_components.call(null, function(description, befores) {
    return function(p1__5044_SHARP_) {
      return cljs.core.deref.call(null, p1__5044_SHARP_.afters)
    }
  }(description, befores), description);
  var core_body = characteristic.body;
  var before_and_after_body = function(description, befores, afters, core_body) {
    return function() {
      return specljs.running.eval_characteristic.call(null, befores, core_body, afters)
    }
  }(description, befores, afters, core_body);
  var arounds = specljs.running.collect_components.call(null, function(description, befores, afters, core_body, before_and_after_body) {
    return function(p1__5045_SHARP_) {
      return cljs.core.deref.call(null, p1__5045_SHARP_.arounds)
    }
  }(description, befores, afters, core_body, before_and_after_body), description);
  var full_body = specljs.running.nested_fns.call(null, before_and_after_body, cljs.core.map.call(null, function(description, befores, afters, core_body, before_and_after_body, arounds) {
    return function(p1__5046_SHARP_) {
      return p1__5046_SHARP_.body
    }
  }(description, befores, afters, core_body, before_and_after_body, arounds), arounds));
  var withs = specljs.running.collect_components.call(null, function(description, befores, afters, core_body, before_and_after_body, arounds, full_body) {
    return function(p1__5047_SHARP_) {
      return cljs.core.deref.call(null, p1__5047_SHARP_.withs)
    }
  }(description, befores, afters, core_body, before_and_after_body, arounds, full_body), description);
  var start_time = specljs.platform.current_time.call(null);
  try {
    full_body.call(null);
    return specljs.running.report_result.call(null, specljs.results.pass_result, characteristic, start_time, reporters, null)
  }catch(e5049) {
    if(e5049 instanceof Object) {
      var e = e5049;
      if(cljs.core.truth_(specljs.platform.pending_QMARK_.call(null, e))) {
        return specljs.running.report_result.call(null, specljs.results.pending_result, characteristic, start_time, reporters, e)
      }else {
        return specljs.running.report_result.call(null, specljs.results.fail_result, characteristic, start_time, reporters, e)
      }
    }else {
      if("\ufdd0:else") {
        throw e5049;
      }else {
        return null
      }
    }
  }finally {
    specljs.running.reset_withs.call(null, withs)
  }
};
specljs.running.do_characteristics = function do_characteristics(characteristics, reporters) {
  return cljs.core.doall.call(null, function() {
    var iter__3042__auto__ = function iter__5054(s__5055) {
      return new cljs.core.LazySeq(null, false, function() {
        var s__5055__$1 = s__5055;
        while(true) {
          var temp__4092__auto__ = cljs.core.seq.call(null, s__5055__$1);
          if(temp__4092__auto__) {
            var s__5055__$2 = temp__4092__auto__;
            if(cljs.core.chunked_seq_QMARK_.call(null, s__5055__$2)) {
              var c__3040__auto__ = cljs.core.chunk_first.call(null, s__5055__$2);
              var size__3041__auto__ = cljs.core.count.call(null, c__3040__auto__);
              var b__5057 = cljs.core.chunk_buffer.call(null, size__3041__auto__);
              if(function() {
                var i__5056 = 0;
                while(true) {
                  if(i__5056 < size__3041__auto__) {
                    var characteristic = cljs.core._nth.call(null, c__3040__auto__, i__5056);
                    cljs.core.chunk_append.call(null, b__5057, specljs.running.do_characteristic.call(null, characteristic, reporters));
                    var G__5058 = i__5056 + 1;
                    i__5056 = G__5058;
                    continue
                  }else {
                    return true
                  }
                  break
                }
              }()) {
                return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__5057), iter__5054.call(null, cljs.core.chunk_rest.call(null, s__5055__$2)))
              }else {
                return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__5057), null)
              }
            }else {
              var characteristic = cljs.core.first.call(null, s__5055__$2);
              return cljs.core.cons.call(null, specljs.running.do_characteristic.call(null, characteristic, reporters), iter__5054.call(null, cljs.core.rest.call(null, s__5055__$2)))
            }
          }else {
            return null
          }
          break
        }
      }, null)
    };
    return iter__3042__auto__.call(null, characteristics)
  }())
};
specljs.running.do_child_contexts = function do_child_contexts(context, results, reporters) {
  var results__$1 = results;
  var contexts = cljs.core.deref.call(null, context.children);
  while(true) {
    if(cljs.core.seq.call(null, contexts)) {
      var G__5059 = cljs.core.concat.call(null, results__$1, specljs.running.do_description.call(null, cljs.core.first.call(null, contexts), reporters));
      var G__5060 = cljs.core.rest.call(null, contexts);
      results__$1 = G__5059;
      contexts = G__5060;
      continue
    }else {
      specljs.running.eval_components.call(null, cljs.core.deref.call(null, context.after_alls));
      return results__$1
    }
    break
  }
};
specljs.running.results_for_context = function results_for_context(context, reporters) {
  if(cljs.core.truth_(specljs.tags.pass_tag_filter_QMARK_.call(null, specljs.tags.tags_for.call(null, context)))) {
    return specljs.running.do_characteristics.call(null, cljs.core.deref.call(null, context.charcteristics), reporters)
  }else {
    return cljs.core.PersistentVector.EMPTY
  }
};
specljs.running.with_withs_bound = function with_withs_bound(description, body) {
  var withs = cljs.core.concat.call(null, cljs.core.deref.call(null, description.withs), cljs.core.deref.call(null, description.with_alls));
  var ns = clojure.string.replace.call(null, description.ns, "-", "_");
  var var_names = cljs.core.map.call(null, function(withs, ns) {
    return function(p1__5061_SHARP_) {
      return[cljs.core.str(ns), cljs.core.str("."), cljs.core.str(cljs.core.name.call(null, p1__5061_SHARP_.name))].join("")
    }
  }(withs, ns), withs);
  var unique_names = cljs.core.map.call(null, function(withs, ns, var_names) {
    return function(p1__5062_SHARP_) {
      return[cljs.core.str(ns), cljs.core.str("."), cljs.core.str(cljs.core.name.call(null, p1__5062_SHARP_.unique_name))].join("")
    }
  }(withs, ns, var_names), withs);
  var seq__5076_5089 = cljs.core.seq.call(null, cljs.core.partition.call(null, 2, cljs.core.interleave.call(null, var_names, unique_names)));
  var chunk__5077_5090 = null;
  var count__5078_5091 = 0;
  var i__5079_5092 = 0;
  while(true) {
    if(i__5079_5092 < count__5078_5091) {
      var vec__5080_5093 = cljs.core._nth.call(null, chunk__5077_5090, i__5079_5092);
      var n_5094 = cljs.core.nth.call(null, vec__5080_5093, 0, null);
      var un_5095 = cljs.core.nth.call(null, vec__5080_5093, 1, null);
      var code_5096 = [cljs.core.str(n_5094), cljs.core.str(" = "), cljs.core.str(un_5095), cljs.core.str(";")].join("");
      eval(code_5096);
      var G__5097 = seq__5076_5089;
      var G__5098 = chunk__5077_5090;
      var G__5099 = count__5078_5091;
      var G__5100 = i__5079_5092 + 1;
      seq__5076_5089 = G__5097;
      chunk__5077_5090 = G__5098;
      count__5078_5091 = G__5099;
      i__5079_5092 = G__5100;
      continue
    }else {
      var temp__4092__auto___5101 = cljs.core.seq.call(null, seq__5076_5089);
      if(temp__4092__auto___5101) {
        var seq__5076_5102__$1 = temp__4092__auto___5101;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__5076_5102__$1)) {
          var c__3073__auto___5103 = cljs.core.chunk_first.call(null, seq__5076_5102__$1);
          var G__5104 = cljs.core.chunk_rest.call(null, seq__5076_5102__$1);
          var G__5105 = c__3073__auto___5103;
          var G__5106 = cljs.core.count.call(null, c__3073__auto___5103);
          var G__5107 = 0;
          seq__5076_5089 = G__5104;
          chunk__5077_5090 = G__5105;
          count__5078_5091 = G__5106;
          i__5079_5092 = G__5107;
          continue
        }else {
          var vec__5081_5108 = cljs.core.first.call(null, seq__5076_5102__$1);
          var n_5109 = cljs.core.nth.call(null, vec__5081_5108, 0, null);
          var un_5110 = cljs.core.nth.call(null, vec__5081_5108, 1, null);
          var code_5111 = [cljs.core.str(n_5109), cljs.core.str(" = "), cljs.core.str(un_5110), cljs.core.str(";")].join("");
          eval(code_5111);
          var G__5112 = cljs.core.next.call(null, seq__5076_5102__$1);
          var G__5113 = null;
          var G__5114 = 0;
          var G__5115 = 0;
          seq__5076_5089 = G__5112;
          chunk__5077_5090 = G__5113;
          count__5078_5091 = G__5114;
          i__5079_5092 = G__5115;
          continue
        }
      }else {
      }
    }
    break
  }
  try {
    return body.call(null)
  }finally {
    var seq__5083_5116 = cljs.core.seq.call(null, var_names);
    var chunk__5084_5117 = null;
    var count__5085_5118 = 0;
    var i__5086_5119 = 0;
    while(true) {
      if(i__5086_5119 < count__5085_5118) {
        var vec__5087_5120 = cljs.core._nth.call(null, chunk__5084_5117, i__5086_5119);
        var n_5121 = cljs.core.nth.call(null, vec__5087_5120, 0, null);
        var code_5122 = [cljs.core.str(n_5121), cljs.core.str(" = null;")].join("");
        eval(code_5122);
        var G__5123 = seq__5083_5116;
        var G__5124 = chunk__5084_5117;
        var G__5125 = count__5085_5118;
        var G__5126 = i__5086_5119 + 1;
        seq__5083_5116 = G__5123;
        chunk__5084_5117 = G__5124;
        count__5085_5118 = G__5125;
        i__5086_5119 = G__5126;
        continue
      }else {
        var temp__4092__auto___5127 = cljs.core.seq.call(null, seq__5083_5116);
        if(temp__4092__auto___5127) {
          var seq__5083_5128__$1 = temp__4092__auto___5127;
          if(cljs.core.chunked_seq_QMARK_.call(null, seq__5083_5128__$1)) {
            var c__3073__auto___5129 = cljs.core.chunk_first.call(null, seq__5083_5128__$1);
            var G__5130 = cljs.core.chunk_rest.call(null, seq__5083_5128__$1);
            var G__5131 = c__3073__auto___5129;
            var G__5132 = cljs.core.count.call(null, c__3073__auto___5129);
            var G__5133 = 0;
            seq__5083_5116 = G__5130;
            chunk__5084_5117 = G__5131;
            count__5085_5118 = G__5132;
            i__5086_5119 = G__5133;
            continue
          }else {
            var vec__5088_5134 = cljs.core.first.call(null, seq__5083_5128__$1);
            var n_5135 = cljs.core.nth.call(null, vec__5088_5134, 0, null);
            var code_5136 = [cljs.core.str(n_5135), cljs.core.str(" = null;")].join("");
            eval(code_5136);
            var G__5137 = cljs.core.next.call(null, seq__5083_5128__$1);
            var G__5138 = null;
            var G__5139 = 0;
            var G__5140 = 0;
            seq__5083_5116 = G__5137;
            chunk__5084_5117 = G__5138;
            count__5085_5118 = G__5139;
            i__5086_5119 = G__5140;
            continue
          }
        }else {
        }
      }
      break
    }
  }
};
specljs.running.do_description = function do_description(description, reporters) {
  var tag_sets = specljs.tags.tag_sets_for.call(null, description);
  if(cljs.core.truth_(cljs.core.some.call(null, specljs.tags.pass_tag_filter_QMARK_, tag_sets))) {
    specljs.reporting.report_description_STAR_.call(null, reporters, description);
    return specljs.running.with_withs_bound.call(null, description, function() {
      specljs.running.eval_components.call(null, cljs.core.deref.call(null, description.before_alls));
      try {
        var results = specljs.running.results_for_context.call(null, description, reporters);
        return specljs.running.do_child_contexts.call(null, description, results, reporters)
      }finally {
        specljs.running.reset_withs.call(null, cljs.core.deref.call(null, description.with_alls))
      }
    })
  }else {
    return null
  }
};
specljs.running.process_compile_error = function process_compile_error(runner, e) {
  var error_result = specljs.results.error_result.call(null, e);
  cljs.core.swap_BANG_.call(null, runner.results, cljs.core.conj, error_result);
  return specljs.reporting.report_run.call(null, error_result, specljs.config.active_reporters.call(null))
};
specljs.running.Runner = {};
specljs.running.run_directories = function run_directories(this$, directories, reporters) {
  if(function() {
    var and__3941__auto__ = this$;
    if(and__3941__auto__) {
      return this$.specljs$running$Runner$run_directories$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return this$.specljs$running$Runner$run_directories$arity$3(this$, directories, reporters)
  }else {
    var x__2942__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3943__auto__ = specljs.running.run_directories[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = specljs.running.run_directories["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "Runner.run-directories", this$);
        }
      }
    }().call(null, this$, directories, reporters)
  }
};
specljs.running.submit_description = function submit_description(this$, description) {
  if(function() {
    var and__3941__auto__ = this$;
    if(and__3941__auto__) {
      return this$.specljs$running$Runner$submit_description$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return this$.specljs$running$Runner$submit_description$arity$2(this$, description)
  }else {
    var x__2942__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3943__auto__ = specljs.running.submit_description[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = specljs.running.submit_description["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "Runner.submit-description", this$);
        }
      }
    }().call(null, this$, description)
  }
};
specljs.running.run_description = function run_description(this$, description, reporters) {
  if(function() {
    var and__3941__auto__ = this$;
    if(and__3941__auto__) {
      return this$.specljs$running$Runner$run_description$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return this$.specljs$running$Runner$run_description$arity$3(this$, description, reporters)
  }else {
    var x__2942__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3943__auto__ = specljs.running.run_description[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = specljs.running.run_description["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "Runner.run-description", this$);
        }
      }
    }().call(null, this$, description, reporters)
  }
};
specljs.running.run_and_report = function run_and_report(this$, reporters) {
  if(function() {
    var and__3941__auto__ = this$;
    if(and__3941__auto__) {
      return this$.specljs$running$Runner$run_and_report$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return this$.specljs$running$Runner$run_and_report$arity$2(this$, reporters)
  }else {
    var x__2942__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3943__auto__ = specljs.running.run_and_report[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = specljs.running.run_and_report["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "Runner.run-and-report", this$);
        }
      }
    }().call(null, this$, reporters)
  }
};
goog.provide("specljs.report.progress");
goog.require("cljs.core");
goog.require("specljs.platform");
goog.require("specljs.config");
goog.require("specljs.reporting");
goog.require("specljs.results");
goog.require("clojure.string");
goog.require("specljs.results");
goog.require("specljs.reporting");
goog.require("specljs.platform");
goog.require("specljs.config");
specljs.report.progress.full_name = function full_name(characteristic) {
  var context = cljs.core.deref.call(null, characteristic.parent);
  var name = characteristic.name;
  while(true) {
    if(cljs.core.truth_(context)) {
      var G__4837 = cljs.core.deref.call(null, context.parent);
      var G__4838 = [cljs.core.str(context.name), cljs.core.str(" "), cljs.core.str(name)].join("");
      context = G__4837;
      name = G__4838;
      continue
    }else {
      return name
    }
    break
  }
};
specljs.report.progress.print_failure = function print_failure(id, result) {
  var characteristic = result.characteristic;
  var failure = result.failure;
  cljs.core.println.call(null);
  cljs.core.println.call(null, specljs.reporting.indent.call(null, 1, id, ") ", specljs.report.progress.full_name.call(null, characteristic)));
  cljs.core.println.call(null, specljs.reporting.red.call(null, specljs.reporting.indent.call(null, 2.5, specljs.platform.error_message.call(null, failure))));
  if(cljs.core.isa_QMARK_.call(null, cljs.core.type.call(null, failure), specljs.platform.failure)) {
    return cljs.core.println.call(null, specljs.reporting.grey.call(null, specljs.reporting.indent.call(null, 2.5, specljs.platform.failure_source.call(null, failure))))
  }else {
    return cljs.core.println.call(null, specljs.reporting.grey.call(null, specljs.reporting.indent.call(null, 2.5, specljs.reporting.stack_trace_str.call(null, failure))))
  }
};
specljs.report.progress.print_failures = function print_failures(failures) {
  if(cljs.core.seq.call(null, failures)) {
    cljs.core.println.call(null);
    cljs.core.println.call(null, "Failures:")
  }else {
  }
  var n__3120__auto__ = cljs.core.count.call(null, failures);
  var i = 0;
  while(true) {
    if(i < n__3120__auto__) {
      specljs.report.progress.print_failure.call(null, i + 1, cljs.core.nth.call(null, failures, i));
      var G__4839 = i + 1;
      i = G__4839;
      continue
    }else {
      return null
    }
    break
  }
};
specljs.report.progress.print_pendings = function print_pendings(pending_results) {
  if(cljs.core.seq.call(null, pending_results)) {
    cljs.core.println.call(null);
    cljs.core.println.call(null, "Pending:")
  }else {
  }
  var seq__4844 = cljs.core.seq.call(null, pending_results);
  var chunk__4845 = null;
  var count__4846 = 0;
  var i__4847 = 0;
  while(true) {
    if(i__4847 < count__4846) {
      var result = cljs.core._nth.call(null, chunk__4845, i__4847);
      cljs.core.println.call(null);
      cljs.core.println.call(null, specljs.reporting.yellow.call(null, [cljs.core.str("  "), cljs.core.str(specljs.report.progress.full_name.call(null, result.characteristic))].join("")));
      cljs.core.println.call(null, specljs.reporting.grey.call(null, [cljs.core.str("    ; "), cljs.core.str(specljs.platform.error_message.call(null, result.exception))].join("")));
      cljs.core.println.call(null, specljs.reporting.grey.call(null, [cljs.core.str("    ; "), cljs.core.str(specljs.platform.failure_source.call(null, result.exception))].join("")));
      var G__4848 = seq__4844;
      var G__4849 = chunk__4845;
      var G__4850 = count__4846;
      var G__4851 = i__4847 + 1;
      seq__4844 = G__4848;
      chunk__4845 = G__4849;
      count__4846 = G__4850;
      i__4847 = G__4851;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__4844);
      if(temp__4092__auto__) {
        var seq__4844__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__4844__$1)) {
          var c__3073__auto__ = cljs.core.chunk_first.call(null, seq__4844__$1);
          var G__4852 = cljs.core.chunk_rest.call(null, seq__4844__$1);
          var G__4853 = c__3073__auto__;
          var G__4854 = cljs.core.count.call(null, c__3073__auto__);
          var G__4855 = 0;
          seq__4844 = G__4852;
          chunk__4845 = G__4853;
          count__4846 = G__4854;
          i__4847 = G__4855;
          continue
        }else {
          var result = cljs.core.first.call(null, seq__4844__$1);
          cljs.core.println.call(null);
          cljs.core.println.call(null, specljs.reporting.yellow.call(null, [cljs.core.str("  "), cljs.core.str(specljs.report.progress.full_name.call(null, result.characteristic))].join("")));
          cljs.core.println.call(null, specljs.reporting.grey.call(null, [cljs.core.str("    ; "), cljs.core.str(specljs.platform.error_message.call(null, result.exception))].join("")));
          cljs.core.println.call(null, specljs.reporting.grey.call(null, [cljs.core.str("    ; "), cljs.core.str(specljs.platform.failure_source.call(null, result.exception))].join("")));
          var G__4856 = cljs.core.next.call(null, seq__4844__$1);
          var G__4857 = null;
          var G__4858 = 0;
          var G__4859 = 0;
          seq__4844 = G__4856;
          chunk__4845 = G__4857;
          count__4846 = G__4858;
          i__4847 = G__4859;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
};
specljs.report.progress.print_errors = function print_errors(error_results) {
  if(cljs.core.seq.call(null, error_results)) {
    cljs.core.println.call(null);
    cljs.core.println.call(null, "Errors:")
  }else {
  }
  var seq__4866_4872 = cljs.core.seq.call(null, cljs.core.partition.call(null, 2, cljs.core.interleave.call(null, cljs.core.iterate.call(null, cljs.core.inc, 1), error_results)));
  var chunk__4867_4873 = null;
  var count__4868_4874 = 0;
  var i__4869_4875 = 0;
  while(true) {
    if(i__4869_4875 < count__4868_4874) {
      var vec__4870_4876 = cljs.core._nth.call(null, chunk__4867_4873, i__4869_4875);
      var number_4877 = cljs.core.nth.call(null, vec__4870_4876, 0, null);
      var result_4878 = cljs.core.nth.call(null, vec__4870_4876, 1, null);
      cljs.core.println.call(null);
      cljs.core.println.call(null, specljs.reporting.indent.call(null, 1, number_4877, ") ", specljs.reporting.red.call(null, [cljs.core.str(result_4878.exception)].join(""))));
      cljs.core.println.call(null, specljs.reporting.grey.call(null, specljs.reporting.indent.call(null, 2.5, specljs.reporting.stack_trace_str.call(null, result_4878.exception))));
      var G__4879 = seq__4866_4872;
      var G__4880 = chunk__4867_4873;
      var G__4881 = count__4868_4874;
      var G__4882 = i__4869_4875 + 1;
      seq__4866_4872 = G__4879;
      chunk__4867_4873 = G__4880;
      count__4868_4874 = G__4881;
      i__4869_4875 = G__4882;
      continue
    }else {
      var temp__4092__auto___4883 = cljs.core.seq.call(null, seq__4866_4872);
      if(temp__4092__auto___4883) {
        var seq__4866_4884__$1 = temp__4092__auto___4883;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__4866_4884__$1)) {
          var c__3073__auto___4885 = cljs.core.chunk_first.call(null, seq__4866_4884__$1);
          var G__4886 = cljs.core.chunk_rest.call(null, seq__4866_4884__$1);
          var G__4887 = c__3073__auto___4885;
          var G__4888 = cljs.core.count.call(null, c__3073__auto___4885);
          var G__4889 = 0;
          seq__4866_4872 = G__4886;
          chunk__4867_4873 = G__4887;
          count__4868_4874 = G__4888;
          i__4869_4875 = G__4889;
          continue
        }else {
          var vec__4871_4890 = cljs.core.first.call(null, seq__4866_4884__$1);
          var number_4891 = cljs.core.nth.call(null, vec__4871_4890, 0, null);
          var result_4892 = cljs.core.nth.call(null, vec__4871_4890, 1, null);
          cljs.core.println.call(null);
          cljs.core.println.call(null, specljs.reporting.indent.call(null, 1, number_4891, ") ", specljs.reporting.red.call(null, [cljs.core.str(result_4892.exception)].join(""))));
          cljs.core.println.call(null, specljs.reporting.grey.call(null, specljs.reporting.indent.call(null, 2.5, specljs.reporting.stack_trace_str.call(null, result_4892.exception))));
          var G__4893 = cljs.core.next.call(null, seq__4866_4884__$1);
          var G__4894 = null;
          var G__4895 = 0;
          var G__4896 = 0;
          seq__4866_4872 = G__4893;
          chunk__4867_4873 = G__4894;
          count__4868_4874 = G__4895;
          i__4869_4875 = G__4896;
          continue
        }
      }else {
      }
    }
    break
  }
  return cljs.core.flush.call(null)
};
specljs.report.progress.print_duration = function print_duration(results) {
  cljs.core.println.call(null);
  return cljs.core.println.call(null, "Finished in", specljs.platform.format_seconds.call(null, specljs.reporting.tally_time.call(null, results)), "seconds")
};
specljs.report.progress.color_fn_for = function color_fn_for(result_map) {
  if(cljs.core.not_EQ_.call(null, 0, cljs.core.count.call(null, cljs.core.concat.call(null, (new cljs.core.Keyword("\ufdd0:fail")).call(null, result_map), (new cljs.core.Keyword("\ufdd0:error")).call(null, result_map))))) {
    return specljs.reporting.red
  }else {
    if(cljs.core.not_EQ_.call(null, 0, cljs.core.count.call(null, (new cljs.core.Keyword("\ufdd0:pending")).call(null, result_map)))) {
      return specljs.reporting.yellow
    }else {
      if("\ufdd0:else") {
        return specljs.reporting.green
      }else {
        return null
      }
    }
  }
};
specljs.report.progress.apply_pending_tally = function apply_pending_tally(report, tally) {
  if((new cljs.core.Keyword("\ufdd0:pending")).call(null, tally) > 0) {
    return cljs.core.conj.call(null, report, [cljs.core.str((new cljs.core.Keyword("\ufdd0:pending")).call(null, tally)), cljs.core.str(" pending")].join(""))
  }else {
    return report
  }
};
specljs.report.progress.apply_error_tally = function apply_error_tally(report, tally) {
  if((new cljs.core.Keyword("\ufdd0:error")).call(null, tally) > 0) {
    return cljs.core.conj.call(null, report, [cljs.core.str((new cljs.core.Keyword("\ufdd0:error")).call(null, tally)), cljs.core.str(" errors")].join(""))
  }else {
    return report
  }
};
specljs.report.progress.describe_counts_for = function describe_counts_for(result_map) {
  var tally = cljs.core.zipmap.call(null, cljs.core.keys.call(null, result_map), cljs.core.map.call(null, cljs.core.count, cljs.core.vals.call(null, result_map)));
  var always_on_counts = cljs.core.PersistentVector.fromArray([[cljs.core.str(cljs.core.apply.call(null, cljs.core._PLUS_, cljs.core.vals.call(null, tally))), cljs.core.str(" examples")].join(""), [cljs.core.str((new cljs.core.Keyword("\ufdd0:fail")).call(null, tally)), cljs.core.str(" failures")].join("")], true);
  return clojure.string.join.call(null, ", ", specljs.report.progress.apply_error_tally.call(null, specljs.report.progress.apply_pending_tally.call(null, always_on_counts, tally), tally))
};
specljs.report.progress.print_tally = function print_tally(result_map) {
  var color_fn = specljs.report.progress.color_fn_for.call(null, result_map);
  return cljs.core.println.call(null, color_fn.call(null, specljs.report.progress.describe_counts_for.call(null, result_map)))
};
specljs.report.progress.print_summary = function print_summary(results) {
  var result_map = specljs.results.categorize.call(null, results);
  specljs.report.progress.print_failures.call(null, (new cljs.core.Keyword("\ufdd0:fail")).call(null, result_map));
  specljs.report.progress.print_pendings.call(null, (new cljs.core.Keyword("\ufdd0:pending")).call(null, result_map));
  specljs.report.progress.print_errors.call(null, (new cljs.core.Keyword("\ufdd0:error")).call(null, result_map));
  specljs.report.progress.print_duration.call(null, results);
  return specljs.report.progress.print_tally.call(null, result_map)
};
goog.provide("specljs.report.progress.ProgressReporter");
specljs.report.progress.ProgressReporter = function() {
};
specljs.report.progress.ProgressReporter.cljs$lang$type = true;
specljs.report.progress.ProgressReporter.cljs$lang$ctorStr = "specljs.report.progress/ProgressReporter";
specljs.report.progress.ProgressReporter.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "specljs.report.progress/ProgressReporter")
};
specljs.report.progress.ProgressReporter.prototype.specljs$reporting$Reporter$ = true;
specljs.report.progress.ProgressReporter.prototype.specljs$reporting$Reporter$report_message$arity$2 = function(this$, message) {
  var self__ = this;
  cljs.core.println.call(null, message);
  return cljs.core.flush.call(null)
};
specljs.report.progress.ProgressReporter.prototype.specljs$reporting$Reporter$report_description$arity$2 = function(this$, description) {
  var self__ = this;
  return null
};
specljs.report.progress.ProgressReporter.prototype.specljs$reporting$Reporter$report_pass$arity$2 = function(this$, result) {
  var self__ = this;
  cljs.core.print.call(null, specljs.reporting.green.call(null, "."));
  return cljs.core.flush.call(null)
};
specljs.report.progress.ProgressReporter.prototype.specljs$reporting$Reporter$report_pending$arity$2 = function(this$, result) {
  var self__ = this;
  cljs.core.print.call(null, specljs.reporting.yellow.call(null, "*"));
  return cljs.core.flush.call(null)
};
specljs.report.progress.ProgressReporter.prototype.specljs$reporting$Reporter$report_fail$arity$2 = function(this$, result) {
  var self__ = this;
  cljs.core.print.call(null, specljs.reporting.red.call(null, "F"));
  return cljs.core.flush.call(null)
};
specljs.report.progress.ProgressReporter.prototype.specljs$reporting$Reporter$report_error$arity$2 = function(this$, result) {
  var self__ = this;
  cljs.core.print.call(null, specljs.reporting.red.call(null, "E"));
  return cljs.core.flush.call(null)
};
specljs.report.progress.ProgressReporter.prototype.specljs$reporting$Reporter$report_runs$arity$2 = function(this$, results) {
  var self__ = this;
  cljs.core.println.call(null);
  return specljs.report.progress.print_summary.call(null, results)
};
specljs.report.progress.new_progress_reporter = function new_progress_reporter() {
  return new specljs.report.progress.ProgressReporter
};
cljs.core.reset_BANG_.call(null, specljs.config.default_reporters, cljs.core.PersistentVector.fromArray([specljs.report.progress.new_progress_reporter.call(null)], true));
goog.provide("specljs.run.standard");
goog.require("cljs.core");
goog.require("specljs.tags");
goog.require("specljs.running");
goog.require("specljs.reporting");
goog.require("specljs.config");
goog.require("specljs.results");
goog.require("specljs.tags");
goog.require("specljs.running");
goog.require("specljs.results");
goog.require("specljs.reporting");
goog.require("specljs.report.progress");
goog.require("specljs.config");
goog.require("specljs.components");
specljs.run.standard.counter = cljs.core.atom.call(null, 0);
goog.provide("specljs.run.standard.StandardRunner");
specljs.run.standard.StandardRunner = function(num, descriptions, results) {
  this.num = num;
  this.descriptions = descriptions;
  this.results = results
};
specljs.run.standard.StandardRunner.cljs$lang$type = true;
specljs.run.standard.StandardRunner.cljs$lang$ctorStr = "specljs.run.standard/StandardRunner";
specljs.run.standard.StandardRunner.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "specljs.run.standard/StandardRunner")
};
specljs.run.standard.StandardRunner.prototype.specljs$running$Runner$ = true;
specljs.run.standard.StandardRunner.prototype.specljs$running$Runner$run_directories$arity$3 = function(this$, directories, reporters) {
  var self__ = this;
  return alert("StandardRunner.run-directories:  I don't know how to do this.")
};
specljs.run.standard.StandardRunner.prototype.specljs$running$Runner$submit_description$arity$2 = function(this$, description) {
  var self__ = this;
  return cljs.core.swap_BANG_.call(null, self__.descriptions, cljs.core.conj, description)
};
specljs.run.standard.StandardRunner.prototype.specljs$running$Runner$run_description$arity$3 = function(this$, description, reporters) {
  var self__ = this;
  var run_results = specljs.running.do_description.call(null, description, reporters);
  return cljs.core.swap_BANG_.call(null, self__.results, cljs.core.into, run_results)
};
specljs.run.standard.StandardRunner.prototype.specljs$running$Runner$run_and_report$arity$2 = function(this$, reporters) {
  var self__ = this;
  var seq__5303_5307 = cljs.core.seq.call(null, cljs.core.deref.call(null, self__.descriptions));
  var chunk__5304_5308 = null;
  var count__5305_5309 = 0;
  var i__5306_5310 = 0;
  while(true) {
    if(i__5306_5310 < count__5305_5309) {
      var description_5311 = cljs.core._nth.call(null, chunk__5304_5308, i__5306_5310);
      this$.specljs$running$Runner$run_description$arity$3(this$, description_5311, reporters);
      var G__5312 = seq__5303_5307;
      var G__5313 = chunk__5304_5308;
      var G__5314 = count__5305_5309;
      var G__5315 = i__5306_5310 + 1;
      seq__5303_5307 = G__5312;
      chunk__5304_5308 = G__5313;
      count__5305_5309 = G__5314;
      i__5306_5310 = G__5315;
      continue
    }else {
      var temp__4092__auto___5316 = cljs.core.seq.call(null, seq__5303_5307);
      if(temp__4092__auto___5316) {
        var seq__5303_5317__$1 = temp__4092__auto___5316;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__5303_5317__$1)) {
          var c__3073__auto___5318 = cljs.core.chunk_first.call(null, seq__5303_5317__$1);
          var G__5319 = cljs.core.chunk_rest.call(null, seq__5303_5317__$1);
          var G__5320 = c__3073__auto___5318;
          var G__5321 = cljs.core.count.call(null, c__3073__auto___5318);
          var G__5322 = 0;
          seq__5303_5307 = G__5319;
          chunk__5304_5308 = G__5320;
          count__5305_5309 = G__5321;
          i__5306_5310 = G__5322;
          continue
        }else {
          var description_5323 = cljs.core.first.call(null, seq__5303_5317__$1);
          this$.specljs$running$Runner$run_description$arity$3(this$, description_5323, reporters);
          var G__5324 = cljs.core.next.call(null, seq__5303_5317__$1);
          var G__5325 = null;
          var G__5326 = 0;
          var G__5327 = 0;
          seq__5303_5307 = G__5324;
          chunk__5304_5308 = G__5325;
          count__5305_5309 = G__5326;
          i__5306_5310 = G__5327;
          continue
        }
      }else {
      }
    }
    break
  }
  return specljs.reporting.report_runs_STAR_.call(null, reporters, cljs.core.deref.call(null, self__.results))
};
specljs.components.Description.prototype.cljs$core$IPrintWithWriter$ = true;
specljs.components.Description.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(x, writer, opts) {
  return cljs.core._write.call(null, writer, cljs.core.format.call(null, "#<specljs.component.Description(name: %s)>", x.name))
};
specljs.run.standard.StandardRunner.prototype.cljs$core$IPrintWithWriter$ = true;
specljs.run.standard.StandardRunner.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(x, writer, opts) {
  cljs.core._write.call(null, writer, [cljs.core.str("#<specljs.run.standard.StandardRunner(num: "), cljs.core.str(x.num), cljs.core.str(", descriptions: ")].join(""));
  cljs.core._pr_writer.call(null, cljs.core.deref.call(null, x.descriptions), writer, opts);
  return cljs.core._write.call(null, writer, ")>")
};
specljs.run.standard.new_standard_runner = function new_standard_runner() {
  return new specljs.run.standard.StandardRunner(cljs.core.swap_BANG_.call(null, specljs.run.standard.counter, cljs.core.inc), cljs.core.atom.call(null, cljs.core.PersistentVector.EMPTY), cljs.core.atom.call(null, cljs.core.PersistentVector.EMPTY))
};
cljs.core.reset_BANG_.call(null, specljs.config.default_runner_fn, specljs.run.standard.new_standard_runner);
cljs.core.reset_BANG_.call(null, specljs.config.default_runner, specljs.run.standard.new_standard_runner.call(null));
specljs.run.standard.armed = false;
specljs.run.standard.run_specs = function() {
  var run_specs__delegate = function(configurations) {
    if(cljs.core.truth_(specljs.run.standard.armed)) {
      var config = cljs.core.apply.call(null, cljs.core.hash_map, configurations);
      var config__$1 = cljs.core.merge.call(null, cljs.core.dissoc.call(null, specljs.config.default_config, "\ufdd0:runner"), config);
      return specljs.config.with_config.call(null, config__$1, function() {
        var temp__4090__auto___5328 = specljs.tags.describe_filter.call(null);
        if(cljs.core.truth_(temp__4090__auto___5328)) {
          var filter_msg_5329 = temp__4090__auto___5328;
          specljs.reporting.report_message_STAR_.call(null, specljs.config.active_reporters.call(null), filter_msg_5329)
        }else {
        }
        specljs.running.run_and_report.call(null, specljs.config.active_runner.call(null), specljs.config.active_reporters.call(null));
        return specljs.results.fail_count.call(null, cljs.core.deref.call(null, specljs.config.active_runner.call(null).results))
      })
    }else {
      return null
    }
  };
  var run_specs = function(var_args) {
    var configurations = null;
    if(arguments.length > 0) {
      configurations = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return run_specs__delegate.call(this, configurations)
  };
  run_specs.cljs$lang$maxFixedArity = 0;
  run_specs.cljs$lang$applyTo = function(arglist__5330) {
    var configurations = cljs.core.seq(arglist__5330);
    return run_specs__delegate(configurations)
  };
  run_specs.cljs$core$IFn$_invoke$arity$variadic = run_specs__delegate;
  return run_specs
}();
goog.provide("specljs.report.silent");
goog.require("cljs.core");
goog.require("specljs.reporting");
goog.provide("specljs.report.silent.SilentReporter");
specljs.report.silent.SilentReporter = function(passes, fails, results) {
  this.passes = passes;
  this.fails = fails;
  this.results = results
};
specljs.report.silent.SilentReporter.cljs$lang$type = true;
specljs.report.silent.SilentReporter.cljs$lang$ctorStr = "specljs.report.silent/SilentReporter";
specljs.report.silent.SilentReporter.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "specljs.report.silent/SilentReporter")
};
specljs.report.silent.SilentReporter.prototype.specljs$reporting$Reporter$ = true;
specljs.report.silent.SilentReporter.prototype.specljs$reporting$Reporter$report_message$arity$2 = function(this$, message) {
  var self__ = this;
  return null
};
specljs.report.silent.SilentReporter.prototype.specljs$reporting$Reporter$report_description$arity$2 = function(this$, description) {
  var self__ = this;
  return null
};
specljs.report.silent.SilentReporter.prototype.specljs$reporting$Reporter$report_pass$arity$2 = function(this$, result) {
  var self__ = this;
  return null
};
specljs.report.silent.SilentReporter.prototype.specljs$reporting$Reporter$report_pending$arity$2 = function(this$, result) {
  var self__ = this;
  return null
};
specljs.report.silent.SilentReporter.prototype.specljs$reporting$Reporter$report_fail$arity$2 = function(this$, result) {
  var self__ = this;
  return null
};
specljs.report.silent.SilentReporter.prototype.specljs$reporting$Reporter$report_runs$arity$2 = function(this$, results__$1) {
  var self__ = this;
  return null
};
specljs.report.silent.SilentReporter.prototype.specljs$reporting$Reporter$report_error$arity$2 = function(this$, exception) {
  var self__ = this;
  return null
};
specljs.report.silent.new_silent_reporter = function new_silent_reporter() {
  return new specljs.report.silent.SilentReporter(cljs.core.atom.call(null, 0), cljs.core.atom.call(null, 0), cljs.core.atom.call(null, null))
};
goog.provide("specljs.report.documentation");
goog.require("cljs.core");
goog.require("specljs.report.progress");
goog.require("specljs.config");
goog.require("specljs.platform");
goog.require("specljs.reporting");
goog.require("specljs.results");
goog.require("specljs.results");
goog.require("specljs.reporting");
goog.require("specljs.report.progress");
goog.require("specljs.platform");
goog.require("specljs.config");
specljs.report.documentation.level_of = function level_of(component) {
  var component__$1 = cljs.core.deref.call(null, component.parent);
  var level = 0;
  while(true) {
    if(cljs.core.truth_(component__$1)) {
      var G__4897 = cljs.core.deref.call(null, component__$1.parent);
      var G__4898 = level + 1;
      component__$1 = G__4897;
      level = G__4898;
      continue
    }else {
      return level
    }
    break
  }
};
goog.provide("specljs.report.documentation.DocumentationReporter");
specljs.report.documentation.DocumentationReporter = function() {
};
specljs.report.documentation.DocumentationReporter.cljs$lang$type = true;
specljs.report.documentation.DocumentationReporter.cljs$lang$ctorStr = "specljs.report.documentation/DocumentationReporter";
specljs.report.documentation.DocumentationReporter.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "specljs.report.documentation/DocumentationReporter")
};
specljs.report.documentation.DocumentationReporter.prototype.specljs$reporting$Reporter$ = true;
specljs.report.documentation.DocumentationReporter.prototype.specljs$reporting$Reporter$report_message$arity$2 = function(this$, message) {
  var self__ = this;
  cljs.core.println.call(null, message);
  return cljs.core.flush.call(null)
};
specljs.report.documentation.DocumentationReporter.prototype.specljs$reporting$Reporter$report_description$arity$2 = function(this$, description) {
  var self__ = this;
  var level = specljs.report.documentation.level_of.call(null, description);
  if(level === 0) {
    cljs.core.println.call(null)
  }else {
  }
  cljs.core.println.call(null, [cljs.core.str(specljs.reporting.indent.call(null, level)), cljs.core.str(description.name)].join(""));
  return cljs.core.flush.call(null)
};
specljs.report.documentation.DocumentationReporter.prototype.specljs$reporting$Reporter$report_pass$arity$2 = function(this$, result) {
  var self__ = this;
  var characteristic = result.characteristic;
  var level = specljs.report.documentation.level_of.call(null, characteristic);
  cljs.core.println.call(null, specljs.reporting.green.call(null, specljs.reporting.indent.call(null, level - 1, "- ", characteristic.name)));
  return cljs.core.flush.call(null)
};
specljs.report.documentation.DocumentationReporter.prototype.specljs$reporting$Reporter$report_pending$arity$2 = function(this$, result) {
  var self__ = this;
  var characteristic = result.characteristic;
  var level = specljs.report.documentation.level_of.call(null, characteristic);
  cljs.core.println.call(null, specljs.reporting.yellow.call(null, specljs.reporting.indent.call(null, level - 1, "- ", characteristic.name, " (PENDING: ", specljs.platform.error_message.call(null, result.exception), ")")));
  return cljs.core.flush.call(null)
};
specljs.report.documentation.DocumentationReporter.prototype.specljs$reporting$Reporter$report_fail$arity$2 = function(this$, result) {
  var self__ = this;
  var characteristic = result.characteristic;
  var level = specljs.report.documentation.level_of.call(null, characteristic);
  cljs.core.println.call(null, specljs.reporting.red.call(null, specljs.reporting.indent.call(null, level - 1, "- ", characteristic.name, " (FAILED)")));
  return cljs.core.flush.call(null)
};
specljs.report.documentation.DocumentationReporter.prototype.specljs$reporting$Reporter$report_error$arity$2 = function(this$, result) {
  var self__ = this;
  return cljs.core.println.call(null, specljs.reporting.red.call(null, result.exception.toString()))
};
specljs.report.documentation.DocumentationReporter.prototype.specljs$reporting$Reporter$report_runs$arity$2 = function(this$, results) {
  var self__ = this;
  return specljs.report.progress.print_summary.call(null, results)
};
specljs.report.documentation.new_documentation_reporter = function new_documentation_reporter() {
  return new specljs.report.documentation.DocumentationReporter
};
goog.provide("specljs.version");
goog.require("cljs.core");
goog.require("clojure.string");
specljs.version.major = 2;
specljs.version.minor = 7;
specljs.version.tiny = 3;
specljs.version.snapshot = false;
specljs.version.string = [cljs.core.str(clojure.string.join.call(null, ".", cljs.core.filter.call(null, cljs.core.identity, cljs.core.PersistentVector.fromArray([specljs.version.major, specljs.version.minor, specljs.version.tiny], true)))), cljs.core.str(cljs.core.truth_(specljs.version.snapshot) ? "-SNAPSHOT" : "")].join("");
specljs.version.summary = [cljs.core.str("specljs "), cljs.core.str(specljs.version.string)].join("");
goog.provide("specljs.core");
goog.require("cljs.core");
goog.require("specljs.results");
goog.require("specljs.config");
goog.require("specljs.run.standard");
goog.require("specljs.report.silent");
goog.require("specljs.platform");
goog.require("specljs.reporting");
goog.require("specljs.running");
goog.require("specljs.components");
goog.require("specljs.tags");
goog.require("specljs.report.documentation");
goog.require("specljs.report.progress");
goog.require("specljs.version");
goog.provide("cljs.core.async.impl.protocols");
goog.require("cljs.core");
cljs.core.async.impl.protocols.ReadPort = {};
cljs.core.async.impl.protocols.take_BANG_ = function take_BANG_(port, fn1_handler) {
  if(function() {
    var and__3941__auto__ = port;
    if(and__3941__auto__) {
      return port.cljs$core$async$impl$protocols$ReadPort$take_BANG_$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return port.cljs$core$async$impl$protocols$ReadPort$take_BANG_$arity$2(port, fn1_handler)
  }else {
    var x__2942__auto__ = port == null ? null : port;
    return function() {
      var or__3943__auto__ = cljs.core.async.impl.protocols.take_BANG_[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core.async.impl.protocols.take_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ReadPort.take!", port);
        }
      }
    }().call(null, port, fn1_handler)
  }
};
cljs.core.async.impl.protocols.WritePort = {};
cljs.core.async.impl.protocols.put_BANG_ = function put_BANG_(port, val, fn0_handler) {
  if(function() {
    var and__3941__auto__ = port;
    if(and__3941__auto__) {
      return port.cljs$core$async$impl$protocols$WritePort$put_BANG_$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return port.cljs$core$async$impl$protocols$WritePort$put_BANG_$arity$3(port, val, fn0_handler)
  }else {
    var x__2942__auto__ = port == null ? null : port;
    return function() {
      var or__3943__auto__ = cljs.core.async.impl.protocols.put_BANG_[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core.async.impl.protocols.put_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "WritePort.put!", port);
        }
      }
    }().call(null, port, val, fn0_handler)
  }
};
cljs.core.async.impl.protocols.Channel = {};
cljs.core.async.impl.protocols.close_BANG_ = function close_BANG_(chan) {
  if(function() {
    var and__3941__auto__ = chan;
    if(and__3941__auto__) {
      return chan.cljs$core$async$impl$protocols$Channel$close_BANG_$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return chan.cljs$core$async$impl$protocols$Channel$close_BANG_$arity$1(chan)
  }else {
    var x__2942__auto__ = chan == null ? null : chan;
    return function() {
      var or__3943__auto__ = cljs.core.async.impl.protocols.close_BANG_[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core.async.impl.protocols.close_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "Channel.close!", chan);
        }
      }
    }().call(null, chan)
  }
};
cljs.core.async.impl.protocols.Handler = {};
cljs.core.async.impl.protocols.active_QMARK_ = function active_QMARK_(h) {
  if(function() {
    var and__3941__auto__ = h;
    if(and__3941__auto__) {
      return h.cljs$core$async$impl$protocols$Handler$active_QMARK_$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return h.cljs$core$async$impl$protocols$Handler$active_QMARK_$arity$1(h)
  }else {
    var x__2942__auto__ = h == null ? null : h;
    return function() {
      var or__3943__auto__ = cljs.core.async.impl.protocols.active_QMARK_[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core.async.impl.protocols.active_QMARK_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "Handler.active?", h);
        }
      }
    }().call(null, h)
  }
};
cljs.core.async.impl.protocols.commit = function commit(h) {
  if(function() {
    var and__3941__auto__ = h;
    if(and__3941__auto__) {
      return h.cljs$core$async$impl$protocols$Handler$commit$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return h.cljs$core$async$impl$protocols$Handler$commit$arity$1(h)
  }else {
    var x__2942__auto__ = h == null ? null : h;
    return function() {
      var or__3943__auto__ = cljs.core.async.impl.protocols.commit[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core.async.impl.protocols.commit["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "Handler.commit", h);
        }
      }
    }().call(null, h)
  }
};
cljs.core.async.impl.protocols.Buffer = {};
cljs.core.async.impl.protocols.full_QMARK_ = function full_QMARK_(b) {
  if(function() {
    var and__3941__auto__ = b;
    if(and__3941__auto__) {
      return b.cljs$core$async$impl$protocols$Buffer$full_QMARK_$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return b.cljs$core$async$impl$protocols$Buffer$full_QMARK_$arity$1(b)
  }else {
    var x__2942__auto__ = b == null ? null : b;
    return function() {
      var or__3943__auto__ = cljs.core.async.impl.protocols.full_QMARK_[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core.async.impl.protocols.full_QMARK_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "Buffer.full?", b);
        }
      }
    }().call(null, b)
  }
};
cljs.core.async.impl.protocols.remove_BANG_ = function remove_BANG_(b) {
  if(function() {
    var and__3941__auto__ = b;
    if(and__3941__auto__) {
      return b.cljs$core$async$impl$protocols$Buffer$remove_BANG_$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return b.cljs$core$async$impl$protocols$Buffer$remove_BANG_$arity$1(b)
  }else {
    var x__2942__auto__ = b == null ? null : b;
    return function() {
      var or__3943__auto__ = cljs.core.async.impl.protocols.remove_BANG_[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core.async.impl.protocols.remove_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "Buffer.remove!", b);
        }
      }
    }().call(null, b)
  }
};
cljs.core.async.impl.protocols.add_BANG_ = function add_BANG_(b, itm) {
  if(function() {
    var and__3941__auto__ = b;
    if(and__3941__auto__) {
      return b.cljs$core$async$impl$protocols$Buffer$add_BANG_$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return b.cljs$core$async$impl$protocols$Buffer$add_BANG_$arity$2(b, itm)
  }else {
    var x__2942__auto__ = b == null ? null : b;
    return function() {
      var or__3943__auto__ = cljs.core.async.impl.protocols.add_BANG_[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core.async.impl.protocols.add_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "Buffer.add!", b);
        }
      }
    }().call(null, b, itm)
  }
};
goog.provide("cljs.core.async.impl.ioc_helpers");
goog.require("cljs.core");
goog.require("cljs.core.async.impl.protocols");
cljs.core.async.impl.ioc_helpers.FN_IDX = 0;
cljs.core.async.impl.ioc_helpers.STATE_IDX = 1;
cljs.core.async.impl.ioc_helpers.VALUE_IDX = 2;
cljs.core.async.impl.ioc_helpers.BINDINGS_IDX = 3;
cljs.core.async.impl.ioc_helpers.USER_START_IDX = 4;
cljs.core.async.impl.ioc_helpers.aset_object = function aset_object(arr, idx, o) {
  return arr[idx][o]
};
cljs.core.async.impl.ioc_helpers.aget_object = function aget_object(arr, idx) {
  return arr[idx]
};
cljs.core.async.impl.ioc_helpers.finished_QMARK_ = function finished_QMARK_(state_array) {
  return state_array[cljs.core.async.impl.ioc_helpers.STATE_IDX] === "\ufdd0:finished"
};
cljs.core.async.impl.ioc_helpers.fn_handler = function fn_handler(f) {
  if(void 0 === cljs.core.async.impl.ioc_helpers.t5187) {
    goog.provide("cljs.core.async.impl.ioc_helpers.t5187");
    cljs.core.async.impl.ioc_helpers.t5187 = function(f, fn_handler, meta5188) {
      this.f = f;
      this.fn_handler = fn_handler;
      this.meta5188 = meta5188;
      this.cljs$lang$protocol_mask$partition1$ = 0;
      this.cljs$lang$protocol_mask$partition0$ = 393216
    };
    cljs.core.async.impl.ioc_helpers.t5187.cljs$lang$type = true;
    cljs.core.async.impl.ioc_helpers.t5187.cljs$lang$ctorStr = "cljs.core.async.impl.ioc-helpers/t5187";
    cljs.core.async.impl.ioc_helpers.t5187.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
      return cljs.core._write.call(null, writer__2883__auto__, "cljs.core.async.impl.ioc-helpers/t5187")
    };
    cljs.core.async.impl.ioc_helpers.t5187.prototype.cljs$core$async$impl$protocols$Handler$ = true;
    cljs.core.async.impl.ioc_helpers.t5187.prototype.cljs$core$async$impl$protocols$Handler$active_QMARK_$arity$1 = function(_) {
      var self__ = this;
      return true
    };
    cljs.core.async.impl.ioc_helpers.t5187.prototype.cljs$core$async$impl$protocols$Handler$commit$arity$1 = function(_) {
      var self__ = this;
      return self__.f
    };
    cljs.core.async.impl.ioc_helpers.t5187.prototype.cljs$core$IMeta$_meta$arity$1 = function(_5189) {
      var self__ = this;
      return self__.meta5188
    };
    cljs.core.async.impl.ioc_helpers.t5187.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(_5189, meta5188__$1) {
      var self__ = this;
      return new cljs.core.async.impl.ioc_helpers.t5187(self__.f, self__.fn_handler, meta5188__$1)
    }
  }else {
  }
  return new cljs.core.async.impl.ioc_helpers.t5187(f, fn_handler, null)
};
cljs.core.async.impl.ioc_helpers.run_state_machine = function run_state_machine(state) {
  return cljs.core.async.impl.ioc_helpers.aget_object.call(null, state, cljs.core.async.impl.ioc_helpers.FN_IDX).call(null, state)
};
cljs.core.async.impl.ioc_helpers.take_BANG_ = function take_BANG_(state, blk, c) {
  var temp__4090__auto__ = cljs.core.async.impl.protocols.take_BANG_.call(null, c, cljs.core.async.impl.ioc_helpers.fn_handler.call(null, function(x) {
    var statearr_5192_5194 = state;
    statearr_5192_5194[cljs.core.async.impl.ioc_helpers.VALUE_IDX] = x;
    statearr_5192_5194[cljs.core.async.impl.ioc_helpers.STATE_IDX] = blk;
    return cljs.core.async.impl.ioc_helpers.run_state_machine.call(null, state)
  }));
  if(cljs.core.truth_(temp__4090__auto__)) {
    var cb = temp__4090__auto__;
    var statearr_5193_5195 = state;
    statearr_5193_5195[cljs.core.async.impl.ioc_helpers.VALUE_IDX] = cljs.core.deref.call(null, cb);
    statearr_5193_5195[cljs.core.async.impl.ioc_helpers.STATE_IDX] = blk;
    return"\ufdd0:recur"
  }else {
    return null
  }
};
cljs.core.async.impl.ioc_helpers.put_BANG_ = function put_BANG_(state, blk, c, val) {
  var temp__4090__auto__ = cljs.core.async.impl.protocols.put_BANG_.call(null, c, val, cljs.core.async.impl.ioc_helpers.fn_handler.call(null, function() {
    var statearr_5198_5200 = state;
    statearr_5198_5200[cljs.core.async.impl.ioc_helpers.VALUE_IDX] = null;
    statearr_5198_5200[cljs.core.async.impl.ioc_helpers.STATE_IDX] = blk;
    return cljs.core.async.impl.ioc_helpers.run_state_machine.call(null, state)
  }));
  if(cljs.core.truth_(temp__4090__auto__)) {
    var cb = temp__4090__auto__;
    var statearr_5199_5201 = state;
    statearr_5199_5201[cljs.core.async.impl.ioc_helpers.VALUE_IDX] = cljs.core.deref.call(null, cb);
    statearr_5199_5201[cljs.core.async.impl.ioc_helpers.STATE_IDX] = blk;
    return"\ufdd0:recur"
  }else {
    return null
  }
};
cljs.core.async.impl.ioc_helpers.ioc_alts_BANG_ = function() {
  var ioc_alts_BANG___delegate = function(state, cont_block, ports, p__5202) {
    var map__5207 = p__5202;
    var map__5207__$1 = cljs.core.seq_QMARK_.call(null, map__5207) ? cljs.core.apply.call(null, cljs.core.hash_map, map__5207) : map__5207;
    var opts = map__5207__$1;
    var statearr_5208_5211 = state;
    statearr_5208_5211[cljs.core.async.impl.ioc_helpers.STATE_IDX] = cont_block;
    var temp__4092__auto__ = cljs.core.async.do_alts.call(null, function(val) {
      var statearr_5209_5212 = state;
      statearr_5209_5212[cljs.core.async.impl.ioc_helpers.VALUE_IDX] = val;
      return cljs.core.async.impl.ioc_helpers.run_state_machine.call(null, state)
    }, ports, opts);
    if(cljs.core.truth_(temp__4092__auto__)) {
      var cb = temp__4092__auto__;
      var statearr_5210_5213 = state;
      statearr_5210_5213[cljs.core.async.impl.ioc_helpers.VALUE_IDX] = cljs.core.deref.call(null, cb);
      return"\ufdd0:recur"
    }else {
      return null
    }
  };
  var ioc_alts_BANG_ = function(state, cont_block, ports, var_args) {
    var p__5202 = null;
    if(arguments.length > 3) {
      p__5202 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return ioc_alts_BANG___delegate.call(this, state, cont_block, ports, p__5202)
  };
  ioc_alts_BANG_.cljs$lang$maxFixedArity = 3;
  ioc_alts_BANG_.cljs$lang$applyTo = function(arglist__5214) {
    var state = cljs.core.first(arglist__5214);
    arglist__5214 = cljs.core.next(arglist__5214);
    var cont_block = cljs.core.first(arglist__5214);
    arglist__5214 = cljs.core.next(arglist__5214);
    var ports = cljs.core.first(arglist__5214);
    var p__5202 = cljs.core.rest(arglist__5214);
    return ioc_alts_BANG___delegate(state, cont_block, ports, p__5202)
  };
  ioc_alts_BANG_.cljs$core$IFn$_invoke$arity$variadic = ioc_alts_BANG___delegate;
  return ioc_alts_BANG_
}();
cljs.core.async.impl.ioc_helpers.return_chan = function return_chan(state, value) {
  var c = state[cljs.core.async.impl.ioc_helpers.USER_START_IDX];
  if(value == null) {
  }else {
    cljs.core.async.impl.protocols.put_BANG_.call(null, c, value, cljs.core.async.impl.ioc_helpers.fn_handler.call(null, function() {
      return null
    }))
  }
  cljs.core.async.impl.protocols.close_BANG_.call(null, c);
  return c
};
goog.provide("cljs.core.async.impl.dispatch");
goog.require("cljs.core");
cljs.core.async.impl.dispatch.message_channel = null;
cljs.core.async.impl.dispatch.tasks = null;
if(typeof MessageChannel !== "undefined") {
  cljs.core.async.impl.dispatch.message_channel = new MessageChannel;
  cljs.core.async.impl.dispatch.tasks = [];
  cljs.core.async.impl.dispatch.message_channel.port1.onmessage = function(msg) {
    return cljs.core.async.impl.dispatch.tasks.shift().call(null)
  }
}else {
}
cljs.core.async.impl.dispatch.queue_task = function queue_task(f) {
  cljs.core.async.impl.dispatch.tasks.push(f);
  return cljs.core.async.impl.dispatch.message_channel.port2.postMessage(0)
};
cljs.core.async.impl.dispatch.run = function run(f) {
  if(typeof MessageChannel !== "undefined") {
    return cljs.core.async.impl.dispatch.queue_task.call(null, f)
  }else {
    if(typeof setImmediate !== "undefined") {
      return setImmediate(f)
    }else {
      if("\ufdd0:else") {
        return setTimeout(f, 0)
      }else {
        return null
      }
    }
  }
};
cljs.core.async.impl.dispatch.queue_delay = function queue_delay(f, delay) {
  return setTimeout(f, delay)
};
goog.provide("cljs.core.async.impl.channels");
goog.require("cljs.core");
goog.require("cljs.core.async.impl.dispatch");
goog.require("cljs.core.async.impl.protocols");
cljs.core.async.impl.channels.box = function box(val) {
  if(void 0 === cljs.core.async.impl.channels.t5162) {
    goog.provide("cljs.core.async.impl.channels.t5162");
    cljs.core.async.impl.channels.t5162 = function(val, box, meta5163) {
      this.val = val;
      this.box = box;
      this.meta5163 = meta5163;
      this.cljs$lang$protocol_mask$partition1$ = 0;
      this.cljs$lang$protocol_mask$partition0$ = 425984
    };
    cljs.core.async.impl.channels.t5162.cljs$lang$type = true;
    cljs.core.async.impl.channels.t5162.cljs$lang$ctorStr = "cljs.core.async.impl.channels/t5162";
    cljs.core.async.impl.channels.t5162.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
      return cljs.core._write.call(null, writer__2883__auto__, "cljs.core.async.impl.channels/t5162")
    };
    cljs.core.async.impl.channels.t5162.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
      var self__ = this;
      return self__.val
    };
    cljs.core.async.impl.channels.t5162.prototype.cljs$core$IMeta$_meta$arity$1 = function(_5164) {
      var self__ = this;
      return self__.meta5163
    };
    cljs.core.async.impl.channels.t5162.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(_5164, meta5163__$1) {
      var self__ = this;
      return new cljs.core.async.impl.channels.t5162(self__.val, self__.box, meta5163__$1)
    }
  }else {
  }
  return new cljs.core.async.impl.channels.t5162(val, box, null)
};
cljs.core.async.impl.channels.MMC = {};
cljs.core.async.impl.channels.cleanup = function cleanup(_) {
  if(function() {
    var and__3941__auto__ = _;
    if(and__3941__auto__) {
      return _.cljs$core$async$impl$channels$MMC$cleanup$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return _.cljs$core$async$impl$channels$MMC$cleanup$arity$1(_)
  }else {
    var x__2942__auto__ = _ == null ? null : _;
    return function() {
      var or__3943__auto__ = cljs.core.async.impl.channels.cleanup[goog.typeOf(x__2942__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core.async.impl.channels.cleanup["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "MMC.cleanup", _);
        }
      }
    }().call(null, _)
  }
};
goog.provide("cljs.core.async.impl.channels.ManyToManyChannel");
cljs.core.async.impl.channels.ManyToManyChannel = function(takes, puts, buf, closed) {
  this.takes = takes;
  this.puts = puts;
  this.buf = buf;
  this.closed = closed
};
cljs.core.async.impl.channels.ManyToManyChannel.cljs$lang$type = true;
cljs.core.async.impl.channels.ManyToManyChannel.cljs$lang$ctorStr = "cljs.core.async.impl.channels/ManyToManyChannel";
cljs.core.async.impl.channels.ManyToManyChannel.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core.async.impl.channels/ManyToManyChannel")
};
cljs.core.async.impl.channels.ManyToManyChannel.prototype.cljs$core$async$impl$protocols$Channel$ = true;
cljs.core.async.impl.channels.ManyToManyChannel.prototype.cljs$core$async$impl$protocols$Channel$close_BANG_$arity$1 = function(this$) {
  var self__ = this;
  this$.cljs$core$async$impl$channels$MMC$cleanup$arity$1(this$);
  if(cljs.core.truth_(cljs.core.deref.call(null, self__.closed))) {
    return null
  }else {
    cljs.core.reset_BANG_.call(null, self__.closed, true);
    var n__3120__auto___5169 = self__.takes.length;
    var idx_5170 = 0;
    while(true) {
      if(idx_5170 < n__3120__auto___5169) {
        var taker_5171 = self__.takes[idx_5170];
        var take_cb_5172 = function() {
          var and__3941__auto__ = cljs.core.async.impl.protocols.active_QMARK_.call(null, taker_5171);
          if(cljs.core.truth_(and__3941__auto__)) {
            return cljs.core.async.impl.protocols.commit.call(null, taker_5171)
          }else {
            return and__3941__auto__
          }
        }();
        if(cljs.core.truth_(take_cb_5172)) {
          cljs.core.async.impl.dispatch.run.call(null, function(idx_5170, taker_5171, take_cb_5172) {
            return function() {
              return take_cb_5172.call(null, null)
            }
          }(idx_5170, taker_5171, take_cb_5172))
        }else {
        }
        var G__5173 = idx_5170 + 1;
        idx_5170 = G__5173;
        continue
      }else {
      }
      break
    }
    return null
  }
};
cljs.core.async.impl.channels.ManyToManyChannel.prototype.cljs$core$async$impl$protocols$ReadPort$ = true;
cljs.core.async.impl.channels.ManyToManyChannel.prototype.cljs$core$async$impl$protocols$ReadPort$take_BANG_$arity$2 = function(this$, handler) {
  var self__ = this;
  this$.cljs$core$async$impl$channels$MMC$cleanup$arity$1(this$);
  if(cljs.core.truth_(function() {
    var and__3941__auto__ = self__.buf;
    if(cljs.core.truth_(and__3941__auto__)) {
      return cljs.core.count.call(null, self__.buf) > 0
    }else {
      return and__3941__auto__
    }
  }())) {
    var temp__4090__auto__ = function() {
      var and__3941__auto__ = cljs.core.async.impl.protocols.active_QMARK_.call(null, handler);
      if(cljs.core.truth_(and__3941__auto__)) {
        return cljs.core.async.impl.protocols.commit.call(null, handler)
      }else {
        return and__3941__auto__
      }
    }();
    if(cljs.core.truth_(temp__4090__auto__)) {
      var take_cb = temp__4090__auto__;
      return cljs.core.async.impl.channels.box.call(null, cljs.core.async.impl.protocols.remove_BANG_.call(null, self__.buf))
    }else {
      return null
    }
  }else {
    var vec__5165 = function() {
      var put_idx = 0;
      while(true) {
        if(put_idx < self__.puts.length) {
          var vec__5166 = self__.puts[put_idx];
          var putter = cljs.core.nth.call(null, vec__5166, 0, null);
          var val = cljs.core.nth.call(null, vec__5166, 1, null);
          var temp__4090__auto__ = cljs.core.truth_(function() {
            var and__3941__auto__ = cljs.core.async.impl.protocols.active_QMARK_.call(null, handler);
            if(cljs.core.truth_(and__3941__auto__)) {
              return cljs.core.async.impl.protocols.active_QMARK_.call(null, putter)
            }else {
              return and__3941__auto__
            }
          }()) ? cljs.core.PersistentVector.fromArray([cljs.core.async.impl.protocols.commit.call(null, handler), cljs.core.async.impl.protocols.commit.call(null, putter), val], true) : null;
          if(cljs.core.truth_(temp__4090__auto__)) {
            var ret = temp__4090__auto__;
            self__.puts.splice(put_idx, 1);
            return ret
          }else {
            var G__5174 = put_idx + 1;
            put_idx = G__5174;
            continue
          }
        }else {
          return null
        }
        break
      }
    }();
    var take_cb = cljs.core.nth.call(null, vec__5165, 0, null);
    var put_cb = cljs.core.nth.call(null, vec__5165, 1, null);
    var val = cljs.core.nth.call(null, vec__5165, 2, null);
    if(cljs.core.truth_(function() {
      var and__3941__auto__ = put_cb;
      if(cljs.core.truth_(and__3941__auto__)) {
        return take_cb
      }else {
        return and__3941__auto__
      }
    }())) {
      cljs.core.async.impl.dispatch.run.call(null, put_cb);
      return cljs.core.async.impl.channels.box.call(null, val)
    }else {
      if(cljs.core.truth_(cljs.core.deref.call(null, self__.closed))) {
        var temp__4090__auto__ = function() {
          var and__3941__auto__ = cljs.core.async.impl.protocols.active_QMARK_.call(null, handler);
          if(cljs.core.truth_(and__3941__auto__)) {
            return cljs.core.async.impl.protocols.commit.call(null, handler)
          }else {
            return and__3941__auto__
          }
        }();
        if(cljs.core.truth_(temp__4090__auto__)) {
          var take_cb__$1 = temp__4090__auto__;
          return cljs.core.async.impl.channels.box.call(null, null)
        }else {
          return null
        }
      }else {
        self__.takes.unshift(handler);
        return null
      }
    }
  }
};
cljs.core.async.impl.channels.ManyToManyChannel.prototype.cljs$core$async$impl$protocols$WritePort$ = true;
cljs.core.async.impl.channels.ManyToManyChannel.prototype.cljs$core$async$impl$protocols$WritePort$put_BANG_$arity$3 = function(this$, val, handler) {
  var self__ = this;
  if(!(val == null)) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Can't put nil in on a channel"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list(new cljs.core.Symbol(null, "not", "not", -1640422260, null), cljs.core.with_meta(cljs.core.list(new cljs.core.Symbol(null, "nil?", "nil?", -1637150201, null), new cljs.core.Symbol(null, "val", "val", -1640415014, null)), cljs.core.hash_map("\ufdd0:line", 43, "\ufdd0:column", 18))), cljs.core.hash_map("\ufdd0:line", 
    43, "\ufdd0:column", 13))))].join(""));
  }
  this$.cljs$core$async$impl$channels$MMC$cleanup$arity$1(this$);
  if(cljs.core.truth_(cljs.core.deref.call(null, self__.closed))) {
    return cljs.core.async.impl.channels.box.call(null, null)
  }else {
    var vec__5167 = function() {
      var taker_idx = 0;
      while(true) {
        if(taker_idx < self__.takes.length) {
          var taker = self__.takes[taker_idx];
          if(cljs.core.truth_(function() {
            var and__3941__auto__ = cljs.core.async.impl.protocols.active_QMARK_.call(null, taker);
            if(cljs.core.truth_(and__3941__auto__)) {
              return cljs.core.async.impl.protocols.active_QMARK_.call(null, handler)
            }else {
              return and__3941__auto__
            }
          }())) {
            self__.takes.splice(taker_idx, 1);
            return cljs.core.PersistentVector.fromArray([cljs.core.async.impl.protocols.commit.call(null, handler), cljs.core.async.impl.protocols.commit.call(null, taker)], true)
          }else {
            var G__5175 = taker_idx + 1;
            taker_idx = G__5175;
            continue
          }
        }else {
          return null
        }
        break
      }
    }();
    var put_cb = cljs.core.nth.call(null, vec__5167, 0, null);
    var take_cb = cljs.core.nth.call(null, vec__5167, 1, null);
    if(cljs.core.truth_(function() {
      var and__3941__auto__ = put_cb;
      if(cljs.core.truth_(and__3941__auto__)) {
        return take_cb
      }else {
        return and__3941__auto__
      }
    }())) {
      cljs.core.async.impl.dispatch.run.call(null, function() {
        return take_cb.call(null, val)
      });
      return cljs.core.async.impl.channels.box.call(null, null)
    }else {
      if(cljs.core.truth_(function() {
        var and__3941__auto__ = self__.buf;
        if(cljs.core.truth_(and__3941__auto__)) {
          return cljs.core.not.call(null, cljs.core.async.impl.protocols.full_QMARK_.call(null, self__.buf))
        }else {
          return and__3941__auto__
        }
      }())) {
        var put_cb__$1 = function() {
          var and__3941__auto__ = cljs.core.async.impl.protocols.active_QMARK_.call(null, handler);
          if(cljs.core.truth_(and__3941__auto__)) {
            return cljs.core.async.impl.protocols.commit.call(null, handler)
          }else {
            return and__3941__auto__
          }
        }();
        if(cljs.core.truth_(put_cb__$1)) {
          cljs.core.async.impl.protocols.add_BANG_.call(null, self__.buf, val);
          return cljs.core.async.impl.channels.box.call(null, null)
        }else {
          return null
        }
      }else {
        self__.puts.unshift(cljs.core.PersistentVector.fromArray([handler, val], true));
        return null
      }
    }
  }
};
cljs.core.async.impl.channels.ManyToManyChannel.prototype.cljs$core$async$impl$channels$MMC$ = true;
cljs.core.async.impl.channels.ManyToManyChannel.prototype.cljs$core$async$impl$channels$MMC$cleanup$arity$1 = function(_) {
  var self__ = this;
  var idx_5176 = 0;
  while(true) {
    if(idx_5176 < self__.puts.length) {
      var vec__5168_5177 = self__.puts[idx_5176];
      var itm_5178 = cljs.core.nth.call(null, vec__5168_5177, 0, null);
      var val_5179 = cljs.core.nth.call(null, vec__5168_5177, 1, null);
      if(cljs.core.truth_(cljs.core.async.impl.protocols.active_QMARK_.call(null, itm_5178))) {
        var G__5180 = idx_5176 + 1;
        idx_5176 = G__5180;
        continue
      }else {
        self__.puts.splice(idx_5176, 1);
        var G__5181 = idx_5176;
        idx_5176 = G__5181;
        continue
      }
    }else {
    }
    break
  }
  var idx = 0;
  while(true) {
    if(idx < self__.takes.length) {
      var itm = self__.takes[idx];
      if(cljs.core.truth_(cljs.core.async.impl.protocols.active_QMARK_.call(null, itm))) {
        var G__5182 = idx + 1;
        idx = G__5182;
        continue
      }else {
        self__.takes.splice(idx, 1);
        var G__5183 = idx;
        idx = G__5183;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.async.impl.channels.chan = function chan(buf) {
  return new cljs.core.async.impl.channels.ManyToManyChannel(new Array(0), new Array(0), buf, cljs.core.atom.call(null, null))
};
goog.provide("cljs.core.async.impl.timers");
goog.require("cljs.core");
goog.require("cljs.core.async.impl.dispatch");
goog.require("cljs.core.async.impl.channels");
goog.require("cljs.core.async.impl.protocols");
cljs.core.async.impl.timers.MAX_LEVEL = 15;
cljs.core.async.impl.timers.P = 1 / 2;
cljs.core.async.impl.timers.random_level = function() {
  var random_level = null;
  var random_level__0 = function() {
    return random_level.call(null, 0)
  };
  var random_level__1 = function(level) {
    while(true) {
      if(function() {
        var and__3941__auto__ = Math.random() < cljs.core.async.impl.timers.P;
        if(and__3941__auto__) {
          return level < cljs.core.async.impl.timers.MAX_LEVEL
        }else {
          return and__3941__auto__
        }
      }()) {
        var G__5135 = level + 1;
        level = G__5135;
        continue
      }else {
        return level
      }
      break
    }
  };
  random_level = function(level) {
    switch(arguments.length) {
      case 0:
        return random_level__0.call(this);
      case 1:
        return random_level__1.call(this, level)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  random_level.cljs$core$IFn$_invoke$arity$0 = random_level__0;
  random_level.cljs$core$IFn$_invoke$arity$1 = random_level__1;
  return random_level
}();
goog.provide("cljs.core.async.impl.timers.SkipListNode");
cljs.core.async.impl.timers.SkipListNode = function(key, val, forward) {
  this.key = key;
  this.val = val;
  this.forward = forward;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155872256
};
cljs.core.async.impl.timers.SkipListNode.cljs$lang$type = true;
cljs.core.async.impl.timers.SkipListNode.cljs$lang$ctorStr = "cljs.core.async.impl.timers/SkipListNode";
cljs.core.async.impl.timers.SkipListNode.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core.async.impl.timers/SkipListNode")
};
cljs.core.async.impl.timers.SkipListNode.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var self__ = this;
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
cljs.core.async.impl.timers.SkipListNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.list.call(null, self__.key, self__.val)
};
cljs.core.async.impl.timers.skip_list_node = function() {
  var skip_list_node = null;
  var skip_list_node__1 = function(level) {
    return skip_list_node.call(null, null, null, level)
  };
  var skip_list_node__3 = function(k, v, level) {
    var arr = new Array(level + 1);
    var i_5136 = 0;
    while(true) {
      if(i_5136 < arr.length) {
        arr[i_5136] = null;
        var G__5137 = i_5136 + 1;
        i_5136 = G__5137;
        continue
      }else {
      }
      break
    }
    return new cljs.core.async.impl.timers.SkipListNode(k, v, arr)
  };
  skip_list_node = function(k, v, level) {
    switch(arguments.length) {
      case 1:
        return skip_list_node__1.call(this, k);
      case 3:
        return skip_list_node__3.call(this, k, v, level)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  skip_list_node.cljs$core$IFn$_invoke$arity$1 = skip_list_node__1;
  skip_list_node.cljs$core$IFn$_invoke$arity$3 = skip_list_node__3;
  return skip_list_node
}();
cljs.core.async.impl.timers.least_greater_node = function() {
  var least_greater_node = null;
  var least_greater_node__3 = function(x, k, level) {
    return least_greater_node.call(null, x, k, level, null)
  };
  var least_greater_node__4 = function(x, k, level, update) {
    while(true) {
      if(!(level < 0)) {
        var x__$1 = function() {
          var x__$1 = x;
          while(true) {
            var temp__4090__auto__ = x__$1.forward[level];
            if(cljs.core.truth_(temp__4090__auto__)) {
              var x_SINGLEQUOTE_ = temp__4090__auto__;
              if(x_SINGLEQUOTE_.key < k) {
                var G__5138 = x_SINGLEQUOTE_;
                x__$1 = G__5138;
                continue
              }else {
                return x__$1
              }
            }else {
              return x__$1
            }
            break
          }
        }();
        if(update == null) {
        }else {
          update[level] = x__$1
        }
        var G__5139 = x__$1;
        var G__5140 = k;
        var G__5141 = level - 1;
        var G__5142 = update;
        x = G__5139;
        k = G__5140;
        level = G__5141;
        update = G__5142;
        continue
      }else {
        return x
      }
      break
    }
  };
  least_greater_node = function(x, k, level, update) {
    switch(arguments.length) {
      case 3:
        return least_greater_node__3.call(this, x, k, level);
      case 4:
        return least_greater_node__4.call(this, x, k, level, update)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  least_greater_node.cljs$core$IFn$_invoke$arity$3 = least_greater_node__3;
  least_greater_node.cljs$core$IFn$_invoke$arity$4 = least_greater_node__4;
  return least_greater_node
}();
goog.provide("cljs.core.async.impl.timers.SkipList");
cljs.core.async.impl.timers.SkipList = function(header, level) {
  this.header = header;
  this.level = level;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155872256
};
cljs.core.async.impl.timers.SkipList.cljs$lang$type = true;
cljs.core.async.impl.timers.SkipList.cljs$lang$ctorStr = "cljs.core.async.impl.timers/SkipList";
cljs.core.async.impl.timers.SkipList.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core.async.impl.timers/SkipList")
};
cljs.core.async.impl.timers.SkipList.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var self__ = this;
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.async.impl.timers.SkipList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  var iter = function iter(node) {
    return new cljs.core.LazySeq(null, false, function() {
      if(node == null) {
        return null
      }else {
        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([node.key, node.val], true), iter.call(null, node.forward[0]))
      }
    }, null)
  };
  return iter.call(null, self__.header.forward[0])
};
cljs.core.async.impl.timers.SkipList.prototype.put = function(k, v) {
  var self__ = this;
  var coll = this;
  var update = new Array(cljs.core.async.impl.timers.MAX_LEVEL);
  var x = cljs.core.async.impl.timers.least_greater_node.call(null, self__.header, k, self__.level, update);
  var x__$1 = x.forward[0];
  if(function() {
    var and__3941__auto__ = !(x__$1 == null);
    if(and__3941__auto__) {
      return x__$1.key === k
    }else {
      return and__3941__auto__
    }
  }()) {
    return x__$1.val = v
  }else {
    var new_level = cljs.core.async.impl.timers.random_level.call(null);
    if(new_level > self__.level) {
      var i_5143 = self__.level + 1;
      while(true) {
        if(i_5143 <= new_level + 1) {
          update[i_5143] = self__.header;
          var G__5144 = i_5143 + 1;
          i_5143 = G__5144;
          continue
        }else {
        }
        break
      }
      self__.level = new_level
    }else {
    }
    var x__$2 = cljs.core.async.impl.timers.skip_list_node.call(null, k, v, new Array(new_level));
    var i = 0;
    while(true) {
      if(i <= self__.level) {
        var links = update[i].forward;
        x__$2.forward[i] = links[i];
        return links[i] = x__$2
      }else {
        return null
      }
      break
    }
  }
};
cljs.core.async.impl.timers.SkipList.prototype.remove = function(k) {
  var self__ = this;
  var coll = this;
  var update = new Array(cljs.core.async.impl.timers.MAX_LEVEL);
  var x = cljs.core.async.impl.timers.least_greater_node.call(null, self__.header, k, self__.level, update);
  var x__$1 = x.forward[0];
  if(function() {
    var and__3941__auto__ = !(x__$1 == null);
    if(and__3941__auto__) {
      return x__$1.key === k
    }else {
      return and__3941__auto__
    }
  }()) {
    var i_5145 = 0;
    while(true) {
      if(i_5145 <= self__.level) {
        var links_5146 = update[i_5145].forward;
        if(links_5146[i_5145] === x__$1) {
          links_5146[i_5145] = x__$1.forward[i_5145];
          var G__5147 = i_5145 + 1;
          i_5145 = G__5147;
          continue
        }else {
          var G__5148 = i_5145 + 1;
          i_5145 = G__5148;
          continue
        }
      }else {
      }
      break
    }
    while(true) {
      if(function() {
        var and__3941__auto__ = self__.level > 0;
        if(and__3941__auto__) {
          return self__.header.forward[self__.level] == null
        }else {
          return and__3941__auto__
        }
      }()) {
        self__.level = self__.level - 1;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.async.impl.timers.SkipList.prototype.ceilingEntry = function(k) {
  var self__ = this;
  var coll = this;
  var x = self__.header;
  var level__$1 = self__.level;
  while(true) {
    if(!(level__$1 < 0)) {
      var nx = function() {
        var x__$1 = x;
        while(true) {
          var x_SINGLEQUOTE_ = x__$1.forward[level__$1];
          if(x_SINGLEQUOTE_ == null) {
            return null
          }else {
            if(x_SINGLEQUOTE_.key >= k) {
              return x_SINGLEQUOTE_
            }else {
              var G__5149 = x_SINGLEQUOTE_;
              x__$1 = G__5149;
              continue
            }
          }
          break
        }
      }();
      if(!(nx == null)) {
        var G__5150 = nx;
        var G__5151 = level__$1 - 1;
        x = G__5150;
        level__$1 = G__5151;
        continue
      }else {
        var G__5152 = x;
        var G__5153 = level__$1 - 1;
        x = G__5152;
        level__$1 = G__5153;
        continue
      }
    }else {
      if(x === self__.header) {
        return null
      }else {
        return x
      }
    }
    break
  }
};
cljs.core.async.impl.timers.SkipList.prototype.floorEntry = function(k) {
  var self__ = this;
  var coll = this;
  var x = self__.header;
  var level__$1 = self__.level;
  while(true) {
    if(!(level__$1 < 0)) {
      var nx = function() {
        var x__$1 = x;
        while(true) {
          var x_SINGLEQUOTE_ = x__$1.forward[level__$1];
          if(!(x_SINGLEQUOTE_ == null)) {
            if(x_SINGLEQUOTE_.key > k) {
              return x__$1
            }else {
              var G__5154 = x_SINGLEQUOTE_;
              x__$1 = G__5154;
              continue
            }
          }else {
            if(level__$1 === 0) {
              return x__$1
            }else {
              return null
            }
          }
          break
        }
      }();
      if(cljs.core.truth_(nx)) {
        var G__5155 = nx;
        var G__5156 = level__$1 - 1;
        x = G__5155;
        level__$1 = G__5156;
        continue
      }else {
        var G__5157 = x;
        var G__5158 = level__$1 - 1;
        x = G__5157;
        level__$1 = G__5158;
        continue
      }
    }else {
      if(x === self__.header) {
        return null
      }else {
        return x
      }
    }
    break
  }
};
cljs.core.async.impl.timers.skip_list = function skip_list() {
  return new cljs.core.async.impl.timers.SkipList(cljs.core.async.impl.timers.skip_list_node.call(null, 0), 0)
};
cljs.core.async.impl.timers.timeouts_map = cljs.core.async.impl.timers.skip_list.call(null);
cljs.core.async.impl.timers.TIMEOUT_RESOLUTION_MS = 10;
cljs.core.async.impl.timers.timeout = function timeout(msecs) {
  var timeout__$1 = (new Date).valueOf() + msecs;
  var me = cljs.core.async.impl.timers.timeouts_map.ceilingEntry(timeout__$1);
  var or__3943__auto__ = cljs.core.truth_(function() {
    var and__3941__auto__ = me;
    if(cljs.core.truth_(and__3941__auto__)) {
      return me.key < timeout__$1 + cljs.core.async.impl.timers.TIMEOUT_RESOLUTION_MS
    }else {
      return and__3941__auto__
    }
  }()) ? me.val : null;
  if(cljs.core.truth_(or__3943__auto__)) {
    return or__3943__auto__
  }else {
    var timeout_channel = cljs.core.async.impl.channels.chan.call(null, null);
    cljs.core.async.impl.timers.timeouts_map.put(timeout__$1, timeout_channel);
    cljs.core.async.impl.dispatch.queue_delay.call(null, function() {
      cljs.core.async.impl.timers.timeouts_map.remove(timeout__$1);
      return cljs.core.async.impl.protocols.close_BANG_.call(null, timeout_channel)
    }, msecs);
    return timeout_channel
  }
};
goog.provide("cljs.core.async.impl.buffers");
goog.require("cljs.core");
goog.require("cljs.core.async.impl.protocols");
goog.provide("cljs.core.async.impl.buffers.FixedBuffer");
cljs.core.async.impl.buffers.FixedBuffer = function(buf, n) {
  this.buf = buf;
  this.n = n;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.async.impl.buffers.FixedBuffer.cljs$lang$type = true;
cljs.core.async.impl.buffers.FixedBuffer.cljs$lang$ctorStr = "cljs.core.async.impl.buffers/FixedBuffer";
cljs.core.async.impl.buffers.FixedBuffer.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core.async.impl.buffers/FixedBuffer")
};
cljs.core.async.impl.buffers.FixedBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(this$) {
  var self__ = this;
  return self__.buf.length
};
cljs.core.async.impl.buffers.FixedBuffer.prototype.cljs$core$async$impl$protocols$Buffer$ = true;
cljs.core.async.impl.buffers.FixedBuffer.prototype.cljs$core$async$impl$protocols$Buffer$full_QMARK_$arity$1 = function(this$) {
  var self__ = this;
  return cljs.core._EQ_.call(null, self__.buf.length, self__.n)
};
cljs.core.async.impl.buffers.FixedBuffer.prototype.cljs$core$async$impl$protocols$Buffer$remove_BANG_$arity$1 = function(this$) {
  var self__ = this;
  return self__.buf.pop()
};
cljs.core.async.impl.buffers.FixedBuffer.prototype.cljs$core$async$impl$protocols$Buffer$add_BANG_$arity$2 = function(this$, itm) {
  var self__ = this;
  if(cljs.core.not.call(null, this$.cljs$core$async$impl$protocols$Buffer$full_QMARK_$arity$1(this$))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Can't add to a full buffer"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list(new cljs.core.Symbol(null, "not", "not", -1640422260, null), cljs.core.with_meta(cljs.core.list(new cljs.core.Symbol("impl", "full?", "impl/full?", -1337857039, null), new cljs.core.Symbol(null, "this", "this", -1636972457, null)), cljs.core.hash_map("\ufdd0:line", 19, "\ufdd0:column", 18))), cljs.core.hash_map("\ufdd0:line", 
    19, "\ufdd0:column", 13))))].join(""));
  }
  return self__.buf.unshift(itm)
};
cljs.core.async.impl.buffers.fixed_buffer = function fixed_buffer(n) {
  return new cljs.core.async.impl.buffers.FixedBuffer(new Array(0), n)
};
goog.provide("cljs.core.async.impl.buffers.DroppingBuffer");
cljs.core.async.impl.buffers.DroppingBuffer = function(buf, n) {
  this.buf = buf;
  this.n = n;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.async.impl.buffers.DroppingBuffer.cljs$lang$type = true;
cljs.core.async.impl.buffers.DroppingBuffer.cljs$lang$ctorStr = "cljs.core.async.impl.buffers/DroppingBuffer";
cljs.core.async.impl.buffers.DroppingBuffer.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core.async.impl.buffers/DroppingBuffer")
};
cljs.core.async.impl.buffers.DroppingBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(this$) {
  var self__ = this;
  return self__.buf.length
};
cljs.core.async.impl.buffers.DroppingBuffer.prototype.cljs$core$async$impl$protocols$Buffer$ = true;
cljs.core.async.impl.buffers.DroppingBuffer.prototype.cljs$core$async$impl$protocols$Buffer$full_QMARK_$arity$1 = function(this$) {
  var self__ = this;
  return false
};
cljs.core.async.impl.buffers.DroppingBuffer.prototype.cljs$core$async$impl$protocols$Buffer$remove_BANG_$arity$1 = function(this$) {
  var self__ = this;
  return self__.buf.pop()
};
cljs.core.async.impl.buffers.DroppingBuffer.prototype.cljs$core$async$impl$protocols$Buffer$add_BANG_$arity$2 = function(this$, itm) {
  var self__ = this;
  if(cljs.core._EQ_.call(null, self__.buf.length, self__.n)) {
    return null
  }else {
    return self__.buf.unshift(itm)
  }
};
cljs.core.async.impl.buffers.dropping_buffer = function dropping_buffer(n) {
  return new cljs.core.async.impl.buffers.DroppingBuffer(new Array(0), n)
};
goog.provide("cljs.core.async.impl.buffers.SlidingBuffer");
cljs.core.async.impl.buffers.SlidingBuffer = function(buf, n) {
  this.buf = buf;
  this.n = n;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.async.impl.buffers.SlidingBuffer.cljs$lang$type = true;
cljs.core.async.impl.buffers.SlidingBuffer.cljs$lang$ctorStr = "cljs.core.async.impl.buffers/SlidingBuffer";
cljs.core.async.impl.buffers.SlidingBuffer.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
  return cljs.core._write.call(null, writer__2883__auto__, "cljs.core.async.impl.buffers/SlidingBuffer")
};
cljs.core.async.impl.buffers.SlidingBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(this$) {
  var self__ = this;
  return self__.buf.length
};
cljs.core.async.impl.buffers.SlidingBuffer.prototype.cljs$core$async$impl$protocols$Buffer$ = true;
cljs.core.async.impl.buffers.SlidingBuffer.prototype.cljs$core$async$impl$protocols$Buffer$full_QMARK_$arity$1 = function(this$) {
  var self__ = this;
  return false
};
cljs.core.async.impl.buffers.SlidingBuffer.prototype.cljs$core$async$impl$protocols$Buffer$remove_BANG_$arity$1 = function(this$) {
  var self__ = this;
  return self__.buf.pop()
};
cljs.core.async.impl.buffers.SlidingBuffer.prototype.cljs$core$async$impl$protocols$Buffer$add_BANG_$arity$2 = function(this$, itm) {
  var self__ = this;
  if(cljs.core._EQ_.call(null, self__.buf.length, self__.n)) {
    this$.cljs$core$async$impl$protocols$Buffer$remove_BANG_$arity$1(this$)
  }else {
  }
  return self__.buf.unshift(itm)
};
cljs.core.async.impl.buffers.sliding_buffer = function sliding_buffer(n) {
  return new cljs.core.async.impl.buffers.SlidingBuffer(new Array(0), n)
};
goog.provide("cljs.core.async");
goog.require("cljs.core");
goog.require("cljs.core.async.impl.ioc_helpers");
goog.require("cljs.core.async.impl.dispatch");
goog.require("cljs.core.async.impl.timers");
goog.require("cljs.core.async.impl.buffers");
goog.require("cljs.core.async.impl.channels");
goog.require("cljs.core.async.impl.protocols");
cljs.core.async.fn_handler = function fn_handler(f) {
  if(void 0 === cljs.core.async.t5109) {
    goog.provide("cljs.core.async.t5109");
    cljs.core.async.t5109 = function(f, fn_handler, meta5110) {
      this.f = f;
      this.fn_handler = fn_handler;
      this.meta5110 = meta5110;
      this.cljs$lang$protocol_mask$partition1$ = 0;
      this.cljs$lang$protocol_mask$partition0$ = 393216
    };
    cljs.core.async.t5109.cljs$lang$type = true;
    cljs.core.async.t5109.cljs$lang$ctorStr = "cljs.core.async/t5109";
    cljs.core.async.t5109.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
      return cljs.core._write.call(null, writer__2883__auto__, "cljs.core.async/t5109")
    };
    cljs.core.async.t5109.prototype.cljs$core$async$impl$protocols$Handler$ = true;
    cljs.core.async.t5109.prototype.cljs$core$async$impl$protocols$Handler$active_QMARK_$arity$1 = function(_) {
      var self__ = this;
      return true
    };
    cljs.core.async.t5109.prototype.cljs$core$async$impl$protocols$Handler$commit$arity$1 = function(_) {
      var self__ = this;
      return self__.f
    };
    cljs.core.async.t5109.prototype.cljs$core$IMeta$_meta$arity$1 = function(_5111) {
      var self__ = this;
      return self__.meta5110
    };
    cljs.core.async.t5109.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(_5111, meta5110__$1) {
      var self__ = this;
      return new cljs.core.async.t5109(self__.f, self__.fn_handler, meta5110__$1)
    }
  }else {
  }
  return new cljs.core.async.t5109(f, fn_handler, null)
};
cljs.core.async.buffer = function buffer(n) {
  return cljs.core.async.impl.buffers.fixed_buffer.call(null, n)
};
cljs.core.async.dropping_buffer = function dropping_buffer(n) {
  return cljs.core.async.impl.buffers.dropping_buffer.call(null, n)
};
cljs.core.async.sliding_buffer = function sliding_buffer(n) {
  return cljs.core.async.impl.buffers.sliding_buffer.call(null, n)
};
cljs.core.async.chan = function() {
  var chan = null;
  var chan__0 = function() {
    return chan.call(null, null)
  };
  var chan__1 = function(buf_or_n) {
    return cljs.core.async.impl.channels.chan.call(null, typeof buf_or_n === "number" ? cljs.core.async.buffer.call(null, buf_or_n) : buf_or_n)
  };
  chan = function(buf_or_n) {
    switch(arguments.length) {
      case 0:
        return chan__0.call(this);
      case 1:
        return chan__1.call(this, buf_or_n)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  chan.cljs$core$IFn$_invoke$arity$0 = chan__0;
  chan.cljs$core$IFn$_invoke$arity$1 = chan__1;
  return chan
}();
cljs.core.async.timeout = function timeout(msecs) {
  return cljs.core.async.impl.timers.timeout.call(null, msecs)
};
cljs.core.async._LT__BANG_ = function _LT__BANG_(port) {
  if(null) {
    return null
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("<! used not in (go ...) block"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, null))].join(""));
  }
};
cljs.core.async.take_BANG_ = function() {
  var take_BANG_ = null;
  var take_BANG___2 = function(port, fn1) {
    return take_BANG_.call(null, port, fn1, true)
  };
  var take_BANG___3 = function(port, fn1, on_caller_QMARK_) {
    var ret = cljs.core.async.impl.protocols.take_BANG_.call(null, port, cljs.core.async.fn_handler.call(null, fn1));
    if(cljs.core.truth_(ret)) {
      var val_5112 = cljs.core.deref.call(null, ret);
      if(cljs.core.truth_(on_caller_QMARK_)) {
        fn1.call(null, val_5112)
      }else {
        cljs.core.async.impl.dispatch.run.call(null, function() {
          return fn1.call(null, val_5112)
        })
      }
    }else {
    }
    return null
  };
  take_BANG_ = function(port, fn1, on_caller_QMARK_) {
    switch(arguments.length) {
      case 2:
        return take_BANG___2.call(this, port, fn1);
      case 3:
        return take_BANG___3.call(this, port, fn1, on_caller_QMARK_)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  take_BANG_.cljs$core$IFn$_invoke$arity$2 = take_BANG___2;
  take_BANG_.cljs$core$IFn$_invoke$arity$3 = take_BANG___3;
  return take_BANG_
}();
cljs.core.async.nop = function nop() {
  return null
};
cljs.core.async._GT__BANG_ = function _GT__BANG_(port, val) {
  if(null) {
    return null
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(">! used not in (go ...) block"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, null))].join(""));
  }
};
cljs.core.async.put_BANG_ = function() {
  var put_BANG_ = null;
  var put_BANG___2 = function(port, val) {
    return put_BANG_.call(null, port, val, cljs.core.async.nop)
  };
  var put_BANG___3 = function(port, val, fn0) {
    return put_BANG_.call(null, port, val, fn0, true)
  };
  var put_BANG___4 = function(port, val, fn0, on_caller_QMARK_) {
    var ret = cljs.core.async.impl.protocols.put_BANG_.call(null, port, val, cljs.core.async.fn_handler.call(null, fn0));
    if(cljs.core.truth_(function() {
      var and__3941__auto__ = ret;
      if(cljs.core.truth_(and__3941__auto__)) {
        return cljs.core.not_EQ_.call(null, fn0, cljs.core.async.nop)
      }else {
        return and__3941__auto__
      }
    }())) {
      if(cljs.core.truth_(on_caller_QMARK_)) {
        fn0.call(null)
      }else {
        cljs.core.async.impl.dispatch.run.call(null, fn0)
      }
    }else {
    }
    return null
  };
  put_BANG_ = function(port, val, fn0, on_caller_QMARK_) {
    switch(arguments.length) {
      case 2:
        return put_BANG___2.call(this, port, val);
      case 3:
        return put_BANG___3.call(this, port, val, fn0);
      case 4:
        return put_BANG___4.call(this, port, val, fn0, on_caller_QMARK_)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  put_BANG_.cljs$core$IFn$_invoke$arity$2 = put_BANG___2;
  put_BANG_.cljs$core$IFn$_invoke$arity$3 = put_BANG___3;
  put_BANG_.cljs$core$IFn$_invoke$arity$4 = put_BANG___4;
  return put_BANG_
}();
cljs.core.async.close_BANG_ = function close_BANG_(port) {
  return cljs.core.async.impl.protocols.close_BANG_.call(null, port)
};
cljs.core.async.random_array = function random_array(n) {
  var a = new Array(n);
  var n__3120__auto___5113 = n;
  var x_5114 = 0;
  while(true) {
    if(x_5114 < n__3120__auto___5113) {
      a[x_5114] = 0;
      var G__5115 = x_5114 + 1;
      x_5114 = G__5115;
      continue
    }else {
    }
    break
  }
  var i = 1;
  while(true) {
    if(cljs.core._EQ_.call(null, i, n)) {
      return a
    }else {
      var j = cljs.core.rand_int.call(null, i);
      a[i] = a[j];
      a[j] = i;
      var G__5116 = i + 1;
      i = G__5116;
      continue
    }
    break
  }
};
cljs.core.async.alt_flag = function alt_flag() {
  var flag = cljs.core.atom.call(null, true);
  if(void 0 === cljs.core.async.t5120) {
    goog.provide("cljs.core.async.t5120");
    cljs.core.async.t5120 = function(flag, alt_flag, meta5121) {
      this.flag = flag;
      this.alt_flag = alt_flag;
      this.meta5121 = meta5121;
      this.cljs$lang$protocol_mask$partition1$ = 0;
      this.cljs$lang$protocol_mask$partition0$ = 393216
    };
    cljs.core.async.t5120.cljs$lang$type = true;
    cljs.core.async.t5120.cljs$lang$ctorStr = "cljs.core.async/t5120";
    cljs.core.async.t5120.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
      return cljs.core._write.call(null, writer__2883__auto__, "cljs.core.async/t5120")
    };
    cljs.core.async.t5120.prototype.cljs$core$async$impl$protocols$Handler$ = true;
    cljs.core.async.t5120.prototype.cljs$core$async$impl$protocols$Handler$active_QMARK_$arity$1 = function(_) {
      var self__ = this;
      return cljs.core.deref.call(null, self__.flag)
    };
    cljs.core.async.t5120.prototype.cljs$core$async$impl$protocols$Handler$commit$arity$1 = function(_) {
      var self__ = this;
      cljs.core.reset_BANG_.call(null, self__.flag, null);
      return true
    };
    cljs.core.async.t5120.prototype.cljs$core$IMeta$_meta$arity$1 = function(_5122) {
      var self__ = this;
      return self__.meta5121
    };
    cljs.core.async.t5120.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(_5122, meta5121__$1) {
      var self__ = this;
      return new cljs.core.async.t5120(self__.flag, self__.alt_flag, meta5121__$1)
    }
  }else {
  }
  return new cljs.core.async.t5120(flag, alt_flag, null)
};
cljs.core.async.alt_handler = function alt_handler(flag, cb) {
  if(void 0 === cljs.core.async.t5127) {
    goog.provide("cljs.core.async.t5127");
    cljs.core.async.t5127 = function(cb, flag, alt_handler, meta5128) {
      this.cb = cb;
      this.flag = flag;
      this.alt_handler = alt_handler;
      this.meta5128 = meta5128;
      this.cljs$lang$protocol_mask$partition1$ = 0;
      this.cljs$lang$protocol_mask$partition0$ = 393216
    };
    cljs.core.async.t5127.cljs$lang$type = true;
    cljs.core.async.t5127.cljs$lang$ctorStr = "cljs.core.async/t5127";
    cljs.core.async.t5127.cljs$lang$ctorPrWriter = function(this__2882__auto__, writer__2883__auto__, opt__2884__auto__) {
      return cljs.core._write.call(null, writer__2883__auto__, "cljs.core.async/t5127")
    };
    cljs.core.async.t5127.prototype.cljs$core$async$impl$protocols$Handler$ = true;
    cljs.core.async.t5127.prototype.cljs$core$async$impl$protocols$Handler$active_QMARK_$arity$1 = function(_) {
      var self__ = this;
      return cljs.core.async.impl.protocols.active_QMARK_.call(null, self__.flag)
    };
    cljs.core.async.t5127.prototype.cljs$core$async$impl$protocols$Handler$commit$arity$1 = function(_) {
      var self__ = this;
      cljs.core.async.impl.protocols.commit.call(null, self__.flag);
      return self__.cb
    };
    cljs.core.async.t5127.prototype.cljs$core$IMeta$_meta$arity$1 = function(_5129) {
      var self__ = this;
      return self__.meta5128
    };
    cljs.core.async.t5127.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(_5129, meta5128__$1) {
      var self__ = this;
      return new cljs.core.async.t5127(self__.cb, self__.flag, self__.alt_handler, meta5128__$1)
    }
  }else {
  }
  return new cljs.core.async.t5127(cb, flag, alt_handler, null)
};
cljs.core.async.do_alts = function do_alts(fret, ports, opts) {
  var flag = cljs.core.async.alt_flag.call(null);
  var n = cljs.core.count.call(null, ports);
  var idxs = cljs.core.async.random_array.call(null, n);
  var priority = (new cljs.core.Keyword("\ufdd0:priority")).call(null, opts);
  var ret = function() {
    var i = 0;
    while(true) {
      if(i < n) {
        var idx = cljs.core.truth_(priority) ? i : idxs[i];
        var port = cljs.core.nth.call(null, ports, idx);
        var wport = cljs.core.vector_QMARK_.call(null, port) ? port.call(null, 0) : null;
        var vbox = cljs.core.truth_(wport) ? function() {
          var val = port.call(null, 1);
          return cljs.core.async.impl.protocols.put_BANG_.call(null, wport, val, cljs.core.async.alt_handler.call(null, flag, function(i, val, idx, port, wport, flag, n, idxs, priority) {
            return function() {
              return fret.call(null, cljs.core.PersistentVector.fromArray([null, wport], true))
            }
          }(i, val, idx, port, wport, flag, n, idxs, priority)))
        }() : cljs.core.async.impl.protocols.take_BANG_.call(null, port, cljs.core.async.alt_handler.call(null, flag, function(i, idx, port, wport, flag, n, idxs, priority) {
          return function(p1__5123_SHARP_) {
            return fret.call(null, cljs.core.PersistentVector.fromArray([p1__5123_SHARP_, port], true))
          }
        }(i, idx, port, wport, flag, n, idxs, priority)));
        if(cljs.core.truth_(vbox)) {
          return cljs.core.async.impl.channels.box.call(null, cljs.core.PersistentVector.fromArray([cljs.core.deref.call(null, vbox), function() {
            var or__3943__auto__ = wport;
            if(cljs.core.truth_(or__3943__auto__)) {
              return or__3943__auto__
            }else {
              return port
            }
          }()], true))
        }else {
          var G__5130 = i + 1;
          i = G__5130;
          continue
        }
      }else {
        return null
      }
      break
    }
  }();
  var or__3943__auto__ = ret;
  if(cljs.core.truth_(or__3943__auto__)) {
    return or__3943__auto__
  }else {
    if(cljs.core.contains_QMARK_.call(null, opts, "\ufdd0:default")) {
      var temp__4092__auto__ = function() {
        var and__3941__auto__ = cljs.core.async.impl.protocols.active_QMARK_.call(null, flag);
        if(cljs.core.truth_(and__3941__auto__)) {
          return cljs.core.async.impl.protocols.commit.call(null, flag)
        }else {
          return and__3941__auto__
        }
      }();
      if(cljs.core.truth_(temp__4092__auto__)) {
        var got = temp__4092__auto__;
        return cljs.core.async.impl.channels.box.call(null, cljs.core.PersistentVector.fromArray([(new cljs.core.Keyword("\ufdd0:default")).call(null, opts), "\ufdd0:default"], true))
      }else {
        return null
      }
    }else {
      return null
    }
  }
};
cljs.core.async.alts_BANG_ = function() {
  var alts_BANG___delegate = function(ports, p__5131) {
    var map__5133 = p__5131;
    var map__5133__$1 = cljs.core.seq_QMARK_.call(null, map__5133) ? cljs.core.apply.call(null, cljs.core.hash_map, map__5133) : map__5133;
    var opts = map__5133__$1;
    if(null) {
      return null
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("alts! used not in (go ...) block"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, null))].join(""));
    }
  };
  var alts_BANG_ = function(ports, var_args) {
    var p__5131 = null;
    if(arguments.length > 1) {
      p__5131 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return alts_BANG___delegate.call(this, ports, p__5131)
  };
  alts_BANG_.cljs$lang$maxFixedArity = 1;
  alts_BANG_.cljs$lang$applyTo = function(arglist__5134) {
    var ports = cljs.core.first(arglist__5134);
    var p__5131 = cljs.core.rest(arglist__5134);
    return alts_BANG___delegate(ports, p__5131)
  };
  alts_BANG_.cljs$core$IFn$_invoke$arity$variadic = alts_BANG___delegate;
  return alts_BANG_
}();
goog.provide("query_service.core");
goog.require("cljs.core");
goog.require("cljs.core.async");
query_service.core.x = 5;
query_service.core.nil_or_empty_QMARK_ = function nil_or_empty_QMARK_(x) {
  if(function() {
    var or__3943__auto__ = x == null;
    if(or__3943__auto__) {
      return or__3943__auto__
    }else {
      return cljs.core._EQ_.call(null, cljs.core.count.call(null, x), 0)
    }
  }()) {
    return true
  }else {
    return false
  }
};
query_service.core.validate_register_pane = function validate_register_pane(pane_name, fields, facets) {
  if(cljs.core.truth_(function() {
    var and__3941__auto__ = query_service.core.nil_or_empty_QMARK_.call(null, fields);
    if(cljs.core.truth_(and__3941__auto__)) {
      return query_service.core.nil_or_empty_QMARK_.call(null, facets)
    }else {
      return and__3941__auto__
    }
  }())) {
    throw new Error("Either fields or facets must be specified");
  }else {
  }
  if(pane_name == null) {
    throw new Error("Pane-name must be specified");
  }else {
    return null
  }
};
query_service.core.register_pane = function() {
  var register_pane__delegate = function(p__4597) {
    var map__4599 = p__4597;
    var map__4599__$1 = cljs.core.seq_QMARK_.call(null, map__4599) ? cljs.core.apply.call(null, cljs.core.hash_map, map__4599) : map__4599;
    var facets = cljs.core.get.call(null, map__4599__$1, "\ufdd0:facets");
    var fields = cljs.core.get.call(null, map__4599__$1, "\ufdd0:fields");
    var channel = cljs.core.get.call(null, map__4599__$1, "\ufdd0:channel");
    var pane_name = cljs.core.get.call(null, map__4599__$1, "\ufdd0:pane-name");
    query_service.core.validate_register_pane.call(null, pane_name, fields, facets);
    return cljs.core.PersistentArrayMap.fromArray(["\ufdd0:from-pane", cljs.core.async.chan.call(null), "\ufdd0:to-pane", cljs.core.async.chan.call(null)], true)
  };
  var register_pane = function(var_args) {
    var p__4597 = null;
    if(arguments.length > 0) {
      p__4597 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return register_pane__delegate.call(this, p__4597)
  };
  register_pane.cljs$lang$maxFixedArity = 0;
  register_pane.cljs$lang$applyTo = function(arglist__4600) {
    var p__4597 = cljs.core.seq(arglist__4600);
    return register_pane__delegate(p__4597)
  };
  register_pane.cljs$core$IFn$_invoke$arity$variadic = register_pane__delegate;
  return register_pane
}();
goog.provide("query_service.core_spec");
goog.require("cljs.core");
goog.require("query_service.core");
goog.require("cljs.core.async");
goog.require("specljs.core");
var description__4857__auto___5112 = specljs.components.new_description.call(null, "A ClojureScript test", "query-service.core-spec");
var _STAR_parent_description_STAR_5106_5113 = specljs.config._STAR_parent_description_STAR_;
try {
  specljs.config._STAR_parent_description_STAR_ = description__4857__auto___5112;
  var seq__5108_5114 = cljs.core.seq.call(null, cljs.core.list.call(null, specljs.components.new_characteristic.call(null, "fails. Fix it!", function() {
    var expected__4937__auto__ = 1;
    var actual__4938__auto__ = 1;
    if(!cljs.core._EQ_.call(null, expected__4937__auto__, actual__4938__auto__)) {
      throw new specljs.platform.SpecFailure([cljs.core.str("Expected: "), cljs.core.str(expected__4937__auto__ == null ? "nil" : cljs.core.pr_str.call(null, expected__4937__auto__)), cljs.core.str(specljs.platform.endl), cljs.core.str("     got: "), cljs.core.str(actual__4938__auto__ == null ? "nil" : cljs.core.pr_str.call(null, actual__4938__auto__)), cljs.core.str(" (using =)")].join(""));
    }else {
      return null
    }
  })));
  var chunk__5109_5115 = null;
  var count__5110_5116 = 0;
  var i__5111_5117 = 0;
  while(true) {
    if(i__5111_5117 < count__5110_5116) {
      var component__4858__auto___5118 = cljs.core._nth.call(null, chunk__5109_5115, i__5111_5117);
      specljs.components.install.call(null, component__4858__auto___5118, description__4857__auto___5112);
      var G__5119 = seq__5108_5114;
      var G__5120 = chunk__5109_5115;
      var G__5121 = count__5110_5116;
      var G__5122 = i__5111_5117 + 1;
      seq__5108_5114 = G__5119;
      chunk__5109_5115 = G__5120;
      count__5110_5116 = G__5121;
      i__5111_5117 = G__5122;
      continue
    }else {
      var temp__4092__auto___5123 = cljs.core.seq.call(null, seq__5108_5114);
      if(temp__4092__auto___5123) {
        var seq__5108_5124__$1 = temp__4092__auto___5123;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__5108_5124__$1)) {
          var c__3073__auto___5125 = cljs.core.chunk_first.call(null, seq__5108_5124__$1);
          var G__5126 = cljs.core.chunk_rest.call(null, seq__5108_5124__$1);
          var G__5127 = c__3073__auto___5125;
          var G__5128 = cljs.core.count.call(null, c__3073__auto___5125);
          var G__5129 = 0;
          seq__5108_5114 = G__5126;
          chunk__5109_5115 = G__5127;
          count__5110_5116 = G__5128;
          i__5111_5117 = G__5129;
          continue
        }else {
          var component__4858__auto___5130 = cljs.core.first.call(null, seq__5108_5124__$1);
          specljs.components.install.call(null, component__4858__auto___5130, description__4857__auto___5112);
          var G__5131 = cljs.core.next.call(null, seq__5108_5124__$1);
          var G__5132 = null;
          var G__5133 = 0;
          var G__5134 = 0;
          seq__5108_5114 = G__5131;
          chunk__5109_5115 = G__5132;
          count__5110_5116 = G__5133;
          i__5111_5117 = G__5134;
          continue
        }
      }else {
      }
    }
    break
  }
}finally {
  specljs.config._STAR_parent_description_STAR_ = _STAR_parent_description_STAR_5106_5113
}
if(cljs.core.not.call(null, specljs.config._STAR_parent_description_STAR_)) {
  specljs.running.submit_description.call(null, specljs.config.active_runner.call(null), description__4857__auto___5112)
}else {
}
var description__4857__auto___5145 = specljs.components.new_description.call(null, "register-pane should return a map with :to-pane and :from-pane channels", "query-service.core-spec");
var _STAR_parent_description_STAR_5135_5146 = specljs.config._STAR_parent_description_STAR_;
try {
  specljs.config._STAR_parent_description_STAR_ = description__4857__auto___5145;
  var seq__5137_5147 = cljs.core.seq.call(null, cljs.core.list.call(null, specljs.components.new_characteristic.call(null, "accepts specified constructor, returns channels", function() {
    var ret_channels = query_service.core.register_pane.call(null, "\ufdd0:pane-name", "test-pane", "\ufdd0:fields", cljs.core.PersistentVector.fromArray(["test-field"], true));
    var expected__4961__auto___5151 = (new cljs.core.Keyword("\ufdd0:from-pane")).call(null, ret_channels);
    var actual__4962__auto___5152 = null;
    if(cljs.core._EQ_.call(null, expected__4961__auto___5151, actual__4962__auto___5152)) {
      throw new specljs.platform.SpecFailure([cljs.core.str("Expected: "), cljs.core.str(expected__4961__auto___5151 == null ? "nil" : cljs.core.pr_str.call(null, expected__4961__auto___5151)), cljs.core.str(specljs.platform.endl), cljs.core.str("not to =: "), cljs.core.str(actual__4962__auto___5152 == null ? "nil" : cljs.core.pr_str.call(null, actual__4962__auto___5152))].join(""));
    }else {
    }
    var expected__4961__auto__ = (new cljs.core.Keyword("\ufdd0:to-pane")).call(null, ret_channels);
    var actual__4962__auto__ = null;
    if(cljs.core._EQ_.call(null, expected__4961__auto__, actual__4962__auto__)) {
      throw new specljs.platform.SpecFailure([cljs.core.str("Expected: "), cljs.core.str(expected__4961__auto__ == null ? "nil" : cljs.core.pr_str.call(null, expected__4961__auto__)), cljs.core.str(specljs.platform.endl), cljs.core.str("not to =: "), cljs.core.str(actual__4962__auto__ == null ? "nil" : cljs.core.pr_str.call(null, actual__4962__auto__))].join(""));
    }else {
      return null
    }
  }), specljs.components.new_characteristic.call(null, "requires :pane-name to be specified", function() {
    try {
      query_service.core.register_pane.call(null, "\ufdd0:fields", cljs.core.PersistentVector.fromArray(["test-field"], true));
      throw function() {
        var expected_name__5058__auto__ = specljs.platform.type_name.call(null, Error);
        var expected_gaps__5059__auto__ = cljs.core.apply.call(null, cljs.core.str, cljs.core.repeat.call(null, cljs.core.count.call(null, expected_name__5058__auto__), " "));
        var actual_string__5060__auto__ = null ? cljs.core.pr_str.call(null, null) : "<nothing thrown>";
        return new specljs.platform.SpecFailure([cljs.core.str("Expected "), cljs.core.str(expected_name__5058__auto__), cljs.core.str(" thrown from: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list(new cljs.core.Symbol("qs", "register-pane", "qs/register-pane", 1218446385, null), "\ufdd0:fields", cljs.core.vec(["test-field"])), cljs.core.hash_map("\ufdd0:line", 18, "\ufdd0:column", 28)))), cljs.core.str(specljs.platform.endl), cljs.core.str("         "), cljs.core.str(expected_gaps__5059__auto__), 
        cljs.core.str("     but got: "), cljs.core.str(actual_string__5060__auto__)].join(""))
      }();
    }catch(e5141) {
      if(e5141 instanceof Object) {
        var e__5066__auto__ = e5141;
        if(cljs.core.truth_(specljs.platform.failure_QMARK_.call(null, e__5066__auto__))) {
          throw e__5066__auto__;
        }else {
          if(!cljs.core.isa_QMARK_.call(null, cljs.core.type.call(null, e__5066__auto__), Error)) {
            throw function() {
              var expected_name__5058__auto__ = specljs.platform.type_name.call(null, Error);
              var expected_gaps__5059__auto__ = cljs.core.apply.call(null, cljs.core.str, cljs.core.repeat.call(null, cljs.core.count.call(null, expected_name__5058__auto__), " "));
              var actual_string__5060__auto__ = cljs.core.truth_(e__5066__auto__) ? cljs.core.pr_str.call(null, e__5066__auto__) : "<nothing thrown>";
              return new specljs.platform.SpecFailure([cljs.core.str("Expected "), cljs.core.str(expected_name__5058__auto__), cljs.core.str(" thrown from: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list(new cljs.core.Symbol("qs", "register-pane", "qs/register-pane", 1218446385, null), "\ufdd0:fields", cljs.core.vec(["test-field"])), cljs.core.hash_map("\ufdd0:line", 18, "\ufdd0:column", 28)))), cljs.core.str(specljs.platform.endl), cljs.core.str("         "), cljs.core.str(expected_gaps__5059__auto__), 
              cljs.core.str("     but got: "), cljs.core.str(actual_string__5060__auto__)].join(""))
            }();
          }else {
            if("\ufdd0:else") {
              return e__5066__auto__
            }else {
              return null
            }
          }
        }
      }else {
        if("\ufdd0:else") {
          throw e5141;
        }else {
          return null
        }
      }
    }
  }), specljs.components.new_characteristic.call(null, "requires either :fields or :facets to be specified", function() {
    try {
      query_service.core.register_pane.call(null, "\ufdd0:pane-name", "test-pane");
      throw function() {
        var expected_name__5058__auto__ = specljs.platform.type_name.call(null, Error);
        var expected_gaps__5059__auto__ = cljs.core.apply.call(null, cljs.core.str, cljs.core.repeat.call(null, cljs.core.count.call(null, expected_name__5058__auto__), " "));
        var actual_string__5060__auto__ = null ? cljs.core.pr_str.call(null, null) : "<nothing thrown>";
        return new specljs.platform.SpecFailure([cljs.core.str("Expected "), cljs.core.str(expected_name__5058__auto__), cljs.core.str(" thrown from: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list(new cljs.core.Symbol("qs", "register-pane", "qs/register-pane", 1218446385, null), "\ufdd0:pane-name", "test-pane"), cljs.core.hash_map("\ufdd0:line", 20, "\ufdd0:column", 28)))), cljs.core.str(specljs.platform.endl), cljs.core.str("         "), cljs.core.str(expected_gaps__5059__auto__), 
        cljs.core.str("     but got: "), cljs.core.str(actual_string__5060__auto__)].join(""))
      }();
    }catch(e5142) {
      if(e5142 instanceof Object) {
        var e__5066__auto__ = e5142;
        if(cljs.core.truth_(specljs.platform.failure_QMARK_.call(null, e__5066__auto__))) {
          throw e__5066__auto__;
        }else {
          if(!cljs.core.isa_QMARK_.call(null, cljs.core.type.call(null, e__5066__auto__), Error)) {
            throw function() {
              var expected_name__5058__auto__ = specljs.platform.type_name.call(null, Error);
              var expected_gaps__5059__auto__ = cljs.core.apply.call(null, cljs.core.str, cljs.core.repeat.call(null, cljs.core.count.call(null, expected_name__5058__auto__), " "));
              var actual_string__5060__auto__ = cljs.core.truth_(e__5066__auto__) ? cljs.core.pr_str.call(null, e__5066__auto__) : "<nothing thrown>";
              return new specljs.platform.SpecFailure([cljs.core.str("Expected "), cljs.core.str(expected_name__5058__auto__), cljs.core.str(" thrown from: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list(new cljs.core.Symbol("qs", "register-pane", "qs/register-pane", 1218446385, null), "\ufdd0:pane-name", "test-pane"), cljs.core.hash_map("\ufdd0:line", 20, "\ufdd0:column", 28)))), cljs.core.str(specljs.platform.endl), cljs.core.str("         "), cljs.core.str(expected_gaps__5059__auto__), 
              cljs.core.str("     but got: "), cljs.core.str(actual_string__5060__auto__)].join(""))
            }();
          }else {
            if("\ufdd0:else") {
              return e__5066__auto__
            }else {
              return null
            }
          }
        }
      }else {
        if("\ufdd0:else") {
          throw e5142;
        }else {
          return null
        }
      }
    }
  }), specljs.components.new_characteristic.call(null, "accepts :fields w/o :facets", function() {
    try {
      return query_service.core.register_pane.call(null, "\ufdd0:pane-name", "test-pane", "\ufdd0:fields", cljs.core.PersistentVector.fromArray(["test-field"], true))
    }catch(e5143) {
      if(e5143 instanceof Object) {
        var e__5074__auto__ = e5143;
        throw new specljs.platform.SpecFailure([cljs.core.str("Expected nothing thrown from: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list(new cljs.core.Symbol("qs", "register-pane", "qs/register-pane", 1218446385, null), "\ufdd0:pane-name", "test-pane", "\ufdd0:fields", cljs.core.vec(["test-field"])), cljs.core.hash_map("\ufdd0:line", 22, "\ufdd0:column", 23)))), cljs.core.str(specljs.platform.endl), cljs.core.str("                     but got: "), cljs.core.str(cljs.core.pr_str.call(null, 
        e__5074__auto__))].join(""));
      }else {
        if("\ufdd0:else") {
          throw e5143;
        }else {
          return null
        }
      }
    }
  }), specljs.components.new_characteristic.call(null, "accepts :facets w/o :fields", function() {
    try {
      return query_service.core.register_pane.call(null, "\ufdd0:pane-name", "test-pane", "\ufdd0:facets", cljs.core.PersistentVector.fromArray(["test-facet"], true))
    }catch(e5144) {
      if(e5144 instanceof Object) {
        var e__5074__auto__ = e5144;
        throw new specljs.platform.SpecFailure([cljs.core.str("Expected nothing thrown from: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list(new cljs.core.Symbol("qs", "register-pane", "qs/register-pane", 1218446385, null), "\ufdd0:pane-name", "test-pane", "\ufdd0:facets", cljs.core.vec(["test-facet"])), cljs.core.hash_map("\ufdd0:line", 24, "\ufdd0:column", 23)))), cljs.core.str(specljs.platform.endl), cljs.core.str("                     but got: "), cljs.core.str(cljs.core.pr_str.call(null, 
        e__5074__auto__))].join(""));
      }else {
        if("\ufdd0:else") {
          throw e5144;
        }else {
          return null
        }
      }
    }
  }), specljs.components.new_characteristic.call(null, "returns the same channel in :from-pane if optional :channel is specified", function() {
    var existing_channel = cljs.core.async.chan.call(null);
    var expected__4937__auto__ = (new cljs.core.Keyword("\ufdd0:from-pane")).call(null, query_service.core.register_pane.call(null, "\ufdd0:pane-name", "test-pane", "\ufdd0:fields", cljs.core.PersistentVector.fromArray(["test-field"], true), "\ufdd0:channel", existing_channel));
    var actual__4938__auto__ = existing_channel;
    if(!cljs.core._EQ_.call(null, expected__4937__auto__, actual__4938__auto__)) {
      throw new specljs.platform.SpecFailure([cljs.core.str("Expected: "), cljs.core.str(expected__4937__auto__ == null ? "nil" : cljs.core.pr_str.call(null, expected__4937__auto__)), cljs.core.str(specljs.platform.endl), cljs.core.str("     got: "), cljs.core.str(actual__4938__auto__ == null ? "nil" : cljs.core.pr_str.call(null, actual__4938__auto__)), cljs.core.str(" (using =)")].join(""));
    }else {
      return null
    }
  })));
  var chunk__5138_5148 = null;
  var count__5139_5149 = 0;
  var i__5140_5150 = 0;
  while(true) {
    if(i__5140_5150 < count__5139_5149) {
      var component__4858__auto___5153 = cljs.core._nth.call(null, chunk__5138_5148, i__5140_5150);
      specljs.components.install.call(null, component__4858__auto___5153, description__4857__auto___5145);
      var G__5154 = seq__5137_5147;
      var G__5155 = chunk__5138_5148;
      var G__5156 = count__5139_5149;
      var G__5157 = i__5140_5150 + 1;
      seq__5137_5147 = G__5154;
      chunk__5138_5148 = G__5155;
      count__5139_5149 = G__5156;
      i__5140_5150 = G__5157;
      continue
    }else {
      var temp__4092__auto___5158 = cljs.core.seq.call(null, seq__5137_5147);
      if(temp__4092__auto___5158) {
        var seq__5137_5159__$1 = temp__4092__auto___5158;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__5137_5159__$1)) {
          var c__3073__auto___5160 = cljs.core.chunk_first.call(null, seq__5137_5159__$1);
          var G__5161 = cljs.core.chunk_rest.call(null, seq__5137_5159__$1);
          var G__5162 = c__3073__auto___5160;
          var G__5163 = cljs.core.count.call(null, c__3073__auto___5160);
          var G__5164 = 0;
          seq__5137_5147 = G__5161;
          chunk__5138_5148 = G__5162;
          count__5139_5149 = G__5163;
          i__5140_5150 = G__5164;
          continue
        }else {
          var component__4858__auto___5165 = cljs.core.first.call(null, seq__5137_5159__$1);
          specljs.components.install.call(null, component__4858__auto___5165, description__4857__auto___5145);
          var G__5166 = cljs.core.next.call(null, seq__5137_5159__$1);
          var G__5167 = null;
          var G__5168 = 0;
          var G__5169 = 0;
          seq__5137_5147 = G__5166;
          chunk__5138_5148 = G__5167;
          count__5139_5149 = G__5168;
          i__5140_5150 = G__5169;
          continue
        }
      }else {
      }
    }
    break
  }
}finally {
  specljs.config._STAR_parent_description_STAR_ = _STAR_parent_description_STAR_5135_5146
}
if(cljs.core.not.call(null, specljs.config._STAR_parent_description_STAR_)) {
  specljs.running.submit_description.call(null, specljs.config.active_runner.call(null), description__4857__auto___5145)
}else {
}
;