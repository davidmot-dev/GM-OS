import require$$0$6, { ipcMain, protocol, app, dialog, shell, screen, BrowserWindow, net } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as require$$0 from "fs";
import require$$0__default from "fs";
import require$$0$1 from "constants";
import require$$0$2 from "stream";
import require$$4 from "util";
import require$$5 from "assert";
import require$$1 from "path";
import http from "node:http";
import https from "node:https";
import { createRequire } from "node:module";
import os from "node:os";
import require$$0$3, { spawn } from "child_process";
import require$$1$1 from "os";
import require$$0$4 from "events";
import require$$0$5 from "http";
import require$$1$2 from "https";
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var fs$1 = {};
var universalify = {};
var hasRequiredUniversalify;
function requireUniversalify() {
  if (hasRequiredUniversalify) return universalify;
  hasRequiredUniversalify = 1;
  universalify.fromCallback = function(fn) {
    return Object.defineProperty(function(...args) {
      if (typeof args[args.length - 1] === "function") fn.apply(this, args);
      else {
        return new Promise((resolve, reject) => {
          args.push((err, res) => err != null ? reject(err) : resolve(res));
          fn.apply(this, args);
        });
      }
    }, "name", { value: fn.name });
  };
  universalify.fromPromise = function(fn) {
    return Object.defineProperty(function(...args) {
      const cb = args[args.length - 1];
      if (typeof cb !== "function") return fn.apply(this, args);
      else {
        args.pop();
        fn.apply(this, args).then((r) => cb(null, r), cb);
      }
    }, "name", { value: fn.name });
  };
  return universalify;
}
var polyfills;
var hasRequiredPolyfills;
function requirePolyfills() {
  if (hasRequiredPolyfills) return polyfills;
  hasRequiredPolyfills = 1;
  var constants = require$$0$1;
  var origCwd = process.cwd;
  var cwd = null;
  var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform;
  process.cwd = function() {
    if (!cwd)
      cwd = origCwd.call(process);
    return cwd;
  };
  try {
    process.cwd();
  } catch (er) {
  }
  if (typeof process.chdir === "function") {
    var chdir = process.chdir;
    process.chdir = function(d) {
      cwd = null;
      chdir.call(process, d);
    };
    if (Object.setPrototypeOf) Object.setPrototypeOf(process.chdir, chdir);
  }
  polyfills = patch;
  function patch(fs2) {
    if (constants.hasOwnProperty("O_SYMLINK") && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
      patchLchmod(fs2);
    }
    if (!fs2.lutimes) {
      patchLutimes(fs2);
    }
    fs2.chown = chownFix(fs2.chown);
    fs2.fchown = chownFix(fs2.fchown);
    fs2.lchown = chownFix(fs2.lchown);
    fs2.chmod = chmodFix(fs2.chmod);
    fs2.fchmod = chmodFix(fs2.fchmod);
    fs2.lchmod = chmodFix(fs2.lchmod);
    fs2.chownSync = chownFixSync(fs2.chownSync);
    fs2.fchownSync = chownFixSync(fs2.fchownSync);
    fs2.lchownSync = chownFixSync(fs2.lchownSync);
    fs2.chmodSync = chmodFixSync(fs2.chmodSync);
    fs2.fchmodSync = chmodFixSync(fs2.fchmodSync);
    fs2.lchmodSync = chmodFixSync(fs2.lchmodSync);
    fs2.stat = statFix(fs2.stat);
    fs2.fstat = statFix(fs2.fstat);
    fs2.lstat = statFix(fs2.lstat);
    fs2.statSync = statFixSync(fs2.statSync);
    fs2.fstatSync = statFixSync(fs2.fstatSync);
    fs2.lstatSync = statFixSync(fs2.lstatSync);
    if (fs2.chmod && !fs2.lchmod) {
      fs2.lchmod = function(path2, mode, cb) {
        if (cb) process.nextTick(cb);
      };
      fs2.lchmodSync = function() {
      };
    }
    if (fs2.chown && !fs2.lchown) {
      fs2.lchown = function(path2, uid, gid, cb) {
        if (cb) process.nextTick(cb);
      };
      fs2.lchownSync = function() {
      };
    }
    if (platform === "win32") {
      fs2.rename = typeof fs2.rename !== "function" ? fs2.rename : (function(fs$rename) {
        function rename(from, to, cb) {
          var start = Date.now();
          var backoff = 0;
          fs$rename(from, to, function CB(er) {
            if (er && (er.code === "EACCES" || er.code === "EPERM" || er.code === "EBUSY") && Date.now() - start < 6e4) {
              setTimeout(function() {
                fs2.stat(to, function(stater, st) {
                  if (stater && stater.code === "ENOENT")
                    fs$rename(from, to, CB);
                  else
                    cb(er);
                });
              }, backoff);
              if (backoff < 100)
                backoff += 10;
              return;
            }
            if (cb) cb(er);
          });
        }
        if (Object.setPrototypeOf) Object.setPrototypeOf(rename, fs$rename);
        return rename;
      })(fs2.rename);
    }
    fs2.read = typeof fs2.read !== "function" ? fs2.read : (function(fs$read) {
      function read(fd, buffer, offset, length, position, callback_) {
        var callback;
        if (callback_ && typeof callback_ === "function") {
          var eagCounter = 0;
          callback = function(er, _, __) {
            if (er && er.code === "EAGAIN" && eagCounter < 10) {
              eagCounter++;
              return fs$read.call(fs2, fd, buffer, offset, length, position, callback);
            }
            callback_.apply(this, arguments);
          };
        }
        return fs$read.call(fs2, fd, buffer, offset, length, position, callback);
      }
      if (Object.setPrototypeOf) Object.setPrototypeOf(read, fs$read);
      return read;
    })(fs2.read);
    fs2.readSync = typeof fs2.readSync !== "function" ? fs2.readSync : /* @__PURE__ */ (function(fs$readSync) {
      return function(fd, buffer, offset, length, position) {
        var eagCounter = 0;
        while (true) {
          try {
            return fs$readSync.call(fs2, fd, buffer, offset, length, position);
          } catch (er) {
            if (er.code === "EAGAIN" && eagCounter < 10) {
              eagCounter++;
              continue;
            }
            throw er;
          }
        }
      };
    })(fs2.readSync);
    function patchLchmod(fs22) {
      fs22.lchmod = function(path2, mode, callback) {
        fs22.open(
          path2,
          constants.O_WRONLY | constants.O_SYMLINK,
          mode,
          function(err, fd) {
            if (err) {
              if (callback) callback(err);
              return;
            }
            fs22.fchmod(fd, mode, function(err2) {
              fs22.close(fd, function(err22) {
                if (callback) callback(err2 || err22);
              });
            });
          }
        );
      };
      fs22.lchmodSync = function(path2, mode) {
        var fd = fs22.openSync(path2, constants.O_WRONLY | constants.O_SYMLINK, mode);
        var threw = true;
        var ret;
        try {
          ret = fs22.fchmodSync(fd, mode);
          threw = false;
        } finally {
          if (threw) {
            try {
              fs22.closeSync(fd);
            } catch (er) {
            }
          } else {
            fs22.closeSync(fd);
          }
        }
        return ret;
      };
    }
    function patchLutimes(fs22) {
      if (constants.hasOwnProperty("O_SYMLINK") && fs22.futimes) {
        fs22.lutimes = function(path2, at, mt, cb) {
          fs22.open(path2, constants.O_SYMLINK, function(er, fd) {
            if (er) {
              if (cb) cb(er);
              return;
            }
            fs22.futimes(fd, at, mt, function(er2) {
              fs22.close(fd, function(er22) {
                if (cb) cb(er2 || er22);
              });
            });
          });
        };
        fs22.lutimesSync = function(path2, at, mt) {
          var fd = fs22.openSync(path2, constants.O_SYMLINK);
          var ret;
          var threw = true;
          try {
            ret = fs22.futimesSync(fd, at, mt);
            threw = false;
          } finally {
            if (threw) {
              try {
                fs22.closeSync(fd);
              } catch (er) {
              }
            } else {
              fs22.closeSync(fd);
            }
          }
          return ret;
        };
      } else if (fs22.futimes) {
        fs22.lutimes = function(_a, _b, _c, cb) {
          if (cb) process.nextTick(cb);
        };
        fs22.lutimesSync = function() {
        };
      }
    }
    function chmodFix(orig) {
      if (!orig) return orig;
      return function(target, mode, cb) {
        return orig.call(fs2, target, mode, function(er) {
          if (chownErOk(er)) er = null;
          if (cb) cb.apply(this, arguments);
        });
      };
    }
    function chmodFixSync(orig) {
      if (!orig) return orig;
      return function(target, mode) {
        try {
          return orig.call(fs2, target, mode);
        } catch (er) {
          if (!chownErOk(er)) throw er;
        }
      };
    }
    function chownFix(orig) {
      if (!orig) return orig;
      return function(target, uid, gid, cb) {
        return orig.call(fs2, target, uid, gid, function(er) {
          if (chownErOk(er)) er = null;
          if (cb) cb.apply(this, arguments);
        });
      };
    }
    function chownFixSync(orig) {
      if (!orig) return orig;
      return function(target, uid, gid) {
        try {
          return orig.call(fs2, target, uid, gid);
        } catch (er) {
          if (!chownErOk(er)) throw er;
        }
      };
    }
    function statFix(orig) {
      if (!orig) return orig;
      return function(target, options, cb) {
        if (typeof options === "function") {
          cb = options;
          options = null;
        }
        function callback(er, stats) {
          if (stats) {
            if (stats.uid < 0) stats.uid += 4294967296;
            if (stats.gid < 0) stats.gid += 4294967296;
          }
          if (cb) cb.apply(this, arguments);
        }
        return options ? orig.call(fs2, target, options, callback) : orig.call(fs2, target, callback);
      };
    }
    function statFixSync(orig) {
      if (!orig) return orig;
      return function(target, options) {
        var stats = options ? orig.call(fs2, target, options) : orig.call(fs2, target);
        if (stats) {
          if (stats.uid < 0) stats.uid += 4294967296;
          if (stats.gid < 0) stats.gid += 4294967296;
        }
        return stats;
      };
    }
    function chownErOk(er) {
      if (!er)
        return true;
      if (er.code === "ENOSYS")
        return true;
      var nonroot = !process.getuid || process.getuid() !== 0;
      if (nonroot) {
        if (er.code === "EINVAL" || er.code === "EPERM")
          return true;
      }
      return false;
    }
  }
  return polyfills;
}
var legacyStreams;
var hasRequiredLegacyStreams;
function requireLegacyStreams() {
  if (hasRequiredLegacyStreams) return legacyStreams;
  hasRequiredLegacyStreams = 1;
  var Stream = require$$0$2.Stream;
  legacyStreams = legacy;
  function legacy(fs2) {
    return {
      ReadStream,
      WriteStream
    };
    function ReadStream(path2, options) {
      if (!(this instanceof ReadStream)) return new ReadStream(path2, options);
      Stream.call(this);
      var self2 = this;
      this.path = path2;
      this.fd = null;
      this.readable = true;
      this.paused = false;
      this.flags = "r";
      this.mode = 438;
      this.bufferSize = 64 * 1024;
      options = options || {};
      var keys = Object.keys(options);
      for (var index = 0, length = keys.length; index < length; index++) {
        var key = keys[index];
        this[key] = options[key];
      }
      if (this.encoding) this.setEncoding(this.encoding);
      if (this.start !== void 0) {
        if ("number" !== typeof this.start) {
          throw TypeError("start must be a Number");
        }
        if (this.end === void 0) {
          this.end = Infinity;
        } else if ("number" !== typeof this.end) {
          throw TypeError("end must be a Number");
        }
        if (this.start > this.end) {
          throw new Error("start must be <= end");
        }
        this.pos = this.start;
      }
      if (this.fd !== null) {
        process.nextTick(function() {
          self2._read();
        });
        return;
      }
      fs2.open(this.path, this.flags, this.mode, function(err, fd) {
        if (err) {
          self2.emit("error", err);
          self2.readable = false;
          return;
        }
        self2.fd = fd;
        self2.emit("open", fd);
        self2._read();
      });
    }
    function WriteStream(path2, options) {
      if (!(this instanceof WriteStream)) return new WriteStream(path2, options);
      Stream.call(this);
      this.path = path2;
      this.fd = null;
      this.writable = true;
      this.flags = "w";
      this.encoding = "binary";
      this.mode = 438;
      this.bytesWritten = 0;
      options = options || {};
      var keys = Object.keys(options);
      for (var index = 0, length = keys.length; index < length; index++) {
        var key = keys[index];
        this[key] = options[key];
      }
      if (this.start !== void 0) {
        if ("number" !== typeof this.start) {
          throw TypeError("start must be a Number");
        }
        if (this.start < 0) {
          throw new Error("start must be >= zero");
        }
        this.pos = this.start;
      }
      this.busy = false;
      this._queue = [];
      if (this.fd === null) {
        this._open = fs2.open;
        this._queue.push([this._open, this.path, this.flags, this.mode, void 0]);
        this.flush();
      }
    }
  }
  return legacyStreams;
}
var clone_1;
var hasRequiredClone;
function requireClone() {
  if (hasRequiredClone) return clone_1;
  hasRequiredClone = 1;
  clone_1 = clone;
  var getPrototypeOf = Object.getPrototypeOf || function(obj) {
    return obj.__proto__;
  };
  function clone(obj) {
    if (obj === null || typeof obj !== "object")
      return obj;
    if (obj instanceof Object)
      var copy2 = { __proto__: getPrototypeOf(obj) };
    else
      var copy2 = /* @__PURE__ */ Object.create(null);
    Object.getOwnPropertyNames(obj).forEach(function(key) {
      Object.defineProperty(copy2, key, Object.getOwnPropertyDescriptor(obj, key));
    });
    return copy2;
  }
  return clone_1;
}
var gracefulFs;
var hasRequiredGracefulFs;
function requireGracefulFs() {
  if (hasRequiredGracefulFs) return gracefulFs;
  hasRequiredGracefulFs = 1;
  var fs2 = require$$0__default;
  var polyfills2 = requirePolyfills();
  var legacy = requireLegacyStreams();
  var clone = requireClone();
  var util = require$$4;
  var gracefulQueue;
  var previousSymbol;
  if (typeof Symbol === "function" && typeof Symbol.for === "function") {
    gracefulQueue = /* @__PURE__ */ Symbol.for("graceful-fs.queue");
    previousSymbol = /* @__PURE__ */ Symbol.for("graceful-fs.previous");
  } else {
    gracefulQueue = "___graceful-fs.queue";
    previousSymbol = "___graceful-fs.previous";
  }
  function noop() {
  }
  function publishQueue(context, queue2) {
    Object.defineProperty(context, gracefulQueue, {
      get: function() {
        return queue2;
      }
    });
  }
  var debug = noop;
  if (util.debuglog)
    debug = util.debuglog("gfs4");
  else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || ""))
    debug = function() {
      var m = util.format.apply(util, arguments);
      m = "GFS4: " + m.split(/\n/).join("\nGFS4: ");
      console.error(m);
    };
  if (!fs2[gracefulQueue]) {
    var queue = commonjsGlobal[gracefulQueue] || [];
    publishQueue(fs2, queue);
    fs2.close = (function(fs$close) {
      function close(fd, cb) {
        return fs$close.call(fs2, fd, function(err) {
          if (!err) {
            resetQueue();
          }
          if (typeof cb === "function")
            cb.apply(this, arguments);
        });
      }
      Object.defineProperty(close, previousSymbol, {
        value: fs$close
      });
      return close;
    })(fs2.close);
    fs2.closeSync = (function(fs$closeSync) {
      function closeSync(fd) {
        fs$closeSync.apply(fs2, arguments);
        resetQueue();
      }
      Object.defineProperty(closeSync, previousSymbol, {
        value: fs$closeSync
      });
      return closeSync;
    })(fs2.closeSync);
    if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || "")) {
      process.on("exit", function() {
        debug(fs2[gracefulQueue]);
        require$$5.equal(fs2[gracefulQueue].length, 0);
      });
    }
  }
  if (!commonjsGlobal[gracefulQueue]) {
    publishQueue(commonjsGlobal, fs2[gracefulQueue]);
  }
  gracefulFs = patch(clone(fs2));
  if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !fs2.__patched) {
    gracefulFs = patch(fs2);
    fs2.__patched = true;
  }
  function patch(fs22) {
    polyfills2(fs22);
    fs22.gracefulify = patch;
    fs22.createReadStream = createReadStream;
    fs22.createWriteStream = createWriteStream;
    var fs$readFile = fs22.readFile;
    fs22.readFile = readFile;
    function readFile(path2, options, cb) {
      if (typeof options === "function")
        cb = options, options = null;
      return go$readFile(path2, options, cb);
      function go$readFile(path22, options2, cb2, startTime) {
        return fs$readFile(path22, options2, function(err) {
          if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
            enqueue([go$readFile, [path22, options2, cb2], err, startTime || Date.now(), Date.now()]);
          else {
            if (typeof cb2 === "function")
              cb2.apply(this, arguments);
          }
        });
      }
    }
    var fs$writeFile = fs22.writeFile;
    fs22.writeFile = writeFile;
    function writeFile(path2, data, options, cb) {
      if (typeof options === "function")
        cb = options, options = null;
      return go$writeFile(path2, data, options, cb);
      function go$writeFile(path22, data2, options2, cb2, startTime) {
        return fs$writeFile(path22, data2, options2, function(err) {
          if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
            enqueue([go$writeFile, [path22, data2, options2, cb2], err, startTime || Date.now(), Date.now()]);
          else {
            if (typeof cb2 === "function")
              cb2.apply(this, arguments);
          }
        });
      }
    }
    var fs$appendFile = fs22.appendFile;
    if (fs$appendFile)
      fs22.appendFile = appendFile;
    function appendFile(path2, data, options, cb) {
      if (typeof options === "function")
        cb = options, options = null;
      return go$appendFile(path2, data, options, cb);
      function go$appendFile(path22, data2, options2, cb2, startTime) {
        return fs$appendFile(path22, data2, options2, function(err) {
          if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
            enqueue([go$appendFile, [path22, data2, options2, cb2], err, startTime || Date.now(), Date.now()]);
          else {
            if (typeof cb2 === "function")
              cb2.apply(this, arguments);
          }
        });
      }
    }
    var fs$copyFile = fs22.copyFile;
    if (fs$copyFile)
      fs22.copyFile = copyFile;
    function copyFile(src2, dest, flags, cb) {
      if (typeof flags === "function") {
        cb = flags;
        flags = 0;
      }
      return go$copyFile(src2, dest, flags, cb);
      function go$copyFile(src22, dest2, flags2, cb2, startTime) {
        return fs$copyFile(src22, dest2, flags2, function(err) {
          if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
            enqueue([go$copyFile, [src22, dest2, flags2, cb2], err, startTime || Date.now(), Date.now()]);
          else {
            if (typeof cb2 === "function")
              cb2.apply(this, arguments);
          }
        });
      }
    }
    var fs$readdir = fs22.readdir;
    fs22.readdir = readdir;
    var noReaddirOptionVersions = /^v[0-5]\./;
    function readdir(path2, options, cb) {
      if (typeof options === "function")
        cb = options, options = null;
      var go$readdir = noReaddirOptionVersions.test(process.version) ? function go$readdir2(path22, options2, cb2, startTime) {
        return fs$readdir(path22, fs$readdirCallback(
          path22,
          options2,
          cb2,
          startTime
        ));
      } : function go$readdir2(path22, options2, cb2, startTime) {
        return fs$readdir(path22, options2, fs$readdirCallback(
          path22,
          options2,
          cb2,
          startTime
        ));
      };
      return go$readdir(path2, options, cb);
      function fs$readdirCallback(path22, options2, cb2, startTime) {
        return function(err, files) {
          if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
            enqueue([
              go$readdir,
              [path22, options2, cb2],
              err,
              startTime || Date.now(),
              Date.now()
            ]);
          else {
            if (files && files.sort)
              files.sort();
            if (typeof cb2 === "function")
              cb2.call(this, err, files);
          }
        };
      }
    }
    if (process.version.substr(0, 4) === "v0.8") {
      var legStreams = legacy(fs22);
      ReadStream = legStreams.ReadStream;
      WriteStream = legStreams.WriteStream;
    }
    var fs$ReadStream = fs22.ReadStream;
    if (fs$ReadStream) {
      ReadStream.prototype = Object.create(fs$ReadStream.prototype);
      ReadStream.prototype.open = ReadStream$open;
    }
    var fs$WriteStream = fs22.WriteStream;
    if (fs$WriteStream) {
      WriteStream.prototype = Object.create(fs$WriteStream.prototype);
      WriteStream.prototype.open = WriteStream$open;
    }
    Object.defineProperty(fs22, "ReadStream", {
      get: function() {
        return ReadStream;
      },
      set: function(val) {
        ReadStream = val;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(fs22, "WriteStream", {
      get: function() {
        return WriteStream;
      },
      set: function(val) {
        WriteStream = val;
      },
      enumerable: true,
      configurable: true
    });
    var FileReadStream = ReadStream;
    Object.defineProperty(fs22, "FileReadStream", {
      get: function() {
        return FileReadStream;
      },
      set: function(val) {
        FileReadStream = val;
      },
      enumerable: true,
      configurable: true
    });
    var FileWriteStream = WriteStream;
    Object.defineProperty(fs22, "FileWriteStream", {
      get: function() {
        return FileWriteStream;
      },
      set: function(val) {
        FileWriteStream = val;
      },
      enumerable: true,
      configurable: true
    });
    function ReadStream(path2, options) {
      if (this instanceof ReadStream)
        return fs$ReadStream.apply(this, arguments), this;
      else
        return ReadStream.apply(Object.create(ReadStream.prototype), arguments);
    }
    function ReadStream$open() {
      var that = this;
      open(that.path, that.flags, that.mode, function(err, fd) {
        if (err) {
          if (that.autoClose)
            that.destroy();
          that.emit("error", err);
        } else {
          that.fd = fd;
          that.emit("open", fd);
          that.read();
        }
      });
    }
    function WriteStream(path2, options) {
      if (this instanceof WriteStream)
        return fs$WriteStream.apply(this, arguments), this;
      else
        return WriteStream.apply(Object.create(WriteStream.prototype), arguments);
    }
    function WriteStream$open() {
      var that = this;
      open(that.path, that.flags, that.mode, function(err, fd) {
        if (err) {
          that.destroy();
          that.emit("error", err);
        } else {
          that.fd = fd;
          that.emit("open", fd);
        }
      });
    }
    function createReadStream(path2, options) {
      return new fs22.ReadStream(path2, options);
    }
    function createWriteStream(path2, options) {
      return new fs22.WriteStream(path2, options);
    }
    var fs$open = fs22.open;
    fs22.open = open;
    function open(path2, flags, mode, cb) {
      if (typeof mode === "function")
        cb = mode, mode = null;
      return go$open(path2, flags, mode, cb);
      function go$open(path22, flags2, mode2, cb2, startTime) {
        return fs$open(path22, flags2, mode2, function(err, fd) {
          if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
            enqueue([go$open, [path22, flags2, mode2, cb2], err, startTime || Date.now(), Date.now()]);
          else {
            if (typeof cb2 === "function")
              cb2.apply(this, arguments);
          }
        });
      }
    }
    return fs22;
  }
  function enqueue(elem) {
    debug("ENQUEUE", elem[0].name, elem[1]);
    fs2[gracefulQueue].push(elem);
    retry();
  }
  var retryTimer;
  function resetQueue() {
    var now = Date.now();
    for (var i = 0; i < fs2[gracefulQueue].length; ++i) {
      if (fs2[gracefulQueue][i].length > 2) {
        fs2[gracefulQueue][i][3] = now;
        fs2[gracefulQueue][i][4] = now;
      }
    }
    retry();
  }
  function retry() {
    clearTimeout(retryTimer);
    retryTimer = void 0;
    if (fs2[gracefulQueue].length === 0)
      return;
    var elem = fs2[gracefulQueue].shift();
    var fn = elem[0];
    var args = elem[1];
    var err = elem[2];
    var startTime = elem[3];
    var lastTime = elem[4];
    if (startTime === void 0) {
      debug("RETRY", fn.name, args);
      fn.apply(null, args);
    } else if (Date.now() - startTime >= 6e4) {
      debug("TIMEOUT", fn.name, args);
      var cb = args.pop();
      if (typeof cb === "function")
        cb.call(null, err);
    } else {
      var sinceAttempt = Date.now() - lastTime;
      var sinceStart = Math.max(lastTime - startTime, 1);
      var desiredDelay = Math.min(sinceStart * 1.2, 100);
      if (sinceAttempt >= desiredDelay) {
        debug("RETRY", fn.name, args);
        fn.apply(null, args.concat([startTime]));
      } else {
        fs2[gracefulQueue].push(elem);
      }
    }
    if (retryTimer === void 0) {
      retryTimer = setTimeout(retry, 0);
    }
  }
  return gracefulFs;
}
var hasRequiredFs;
function requireFs() {
  if (hasRequiredFs) return fs$1;
  hasRequiredFs = 1;
  (function(exports$1) {
    const u = requireUniversalify().fromCallback;
    const fs2 = requireGracefulFs();
    const api = [
      "access",
      "appendFile",
      "chmod",
      "chown",
      "close",
      "copyFile",
      "cp",
      "fchmod",
      "fchown",
      "fdatasync",
      "fstat",
      "fsync",
      "ftruncate",
      "futimes",
      "glob",
      "lchmod",
      "lchown",
      "lutimes",
      "link",
      "lstat",
      "mkdir",
      "mkdtemp",
      "open",
      "opendir",
      "readdir",
      "readFile",
      "readlink",
      "realpath",
      "rename",
      "rm",
      "rmdir",
      "stat",
      "statfs",
      "symlink",
      "truncate",
      "unlink",
      "utimes",
      "writeFile"
    ].filter((key) => {
      return typeof fs2[key] === "function";
    });
    Object.assign(exports$1, fs2);
    api.forEach((method) => {
      exports$1[method] = u(fs2[method]);
    });
    exports$1.exists = function(filename, callback) {
      if (typeof callback === "function") {
        return fs2.exists(filename, callback);
      }
      return new Promise((resolve) => {
        return fs2.exists(filename, resolve);
      });
    };
    exports$1.read = function(fd, buffer, offset, length, position, callback) {
      if (typeof callback === "function") {
        return fs2.read(fd, buffer, offset, length, position, callback);
      }
      return new Promise((resolve, reject) => {
        fs2.read(fd, buffer, offset, length, position, (err, bytesRead, buffer2) => {
          if (err) return reject(err);
          resolve({ bytesRead, buffer: buffer2 });
        });
      });
    };
    exports$1.write = function(fd, buffer, ...args) {
      if (typeof args[args.length - 1] === "function") {
        return fs2.write(fd, buffer, ...args);
      }
      return new Promise((resolve, reject) => {
        fs2.write(fd, buffer, ...args, (err, bytesWritten, buffer2) => {
          if (err) return reject(err);
          resolve({ bytesWritten, buffer: buffer2 });
        });
      });
    };
    exports$1.readv = function(fd, buffers, ...args) {
      if (typeof args[args.length - 1] === "function") {
        return fs2.readv(fd, buffers, ...args);
      }
      return new Promise((resolve, reject) => {
        fs2.readv(fd, buffers, ...args, (err, bytesRead, buffers2) => {
          if (err) return reject(err);
          resolve({ bytesRead, buffers: buffers2 });
        });
      });
    };
    exports$1.writev = function(fd, buffers, ...args) {
      if (typeof args[args.length - 1] === "function") {
        return fs2.writev(fd, buffers, ...args);
      }
      return new Promise((resolve, reject) => {
        fs2.writev(fd, buffers, ...args, (err, bytesWritten, buffers2) => {
          if (err) return reject(err);
          resolve({ bytesWritten, buffers: buffers2 });
        });
      });
    };
    if (typeof fs2.realpath.native === "function") {
      exports$1.realpath.native = u(fs2.realpath.native);
    } else {
      process.emitWarning(
        "fs.realpath.native is not a function. Is fs being monkey-patched?",
        "Warning",
        "fs-extra-WARN0003"
      );
    }
  })(fs$1);
  return fs$1;
}
var makeDir = {};
var utils$1 = {};
var hasRequiredUtils$1;
function requireUtils$1() {
  if (hasRequiredUtils$1) return utils$1;
  hasRequiredUtils$1 = 1;
  const path2 = require$$1;
  utils$1.checkPath = function checkPath(pth) {
    if (process.platform === "win32") {
      const pathHasInvalidWinCharacters = /[<>:"|?*]/.test(pth.replace(path2.parse(pth).root, ""));
      if (pathHasInvalidWinCharacters) {
        const error = new Error(`Path contains invalid characters: ${pth}`);
        error.code = "EINVAL";
        throw error;
      }
    }
  };
  return utils$1;
}
var hasRequiredMakeDir;
function requireMakeDir() {
  if (hasRequiredMakeDir) return makeDir;
  hasRequiredMakeDir = 1;
  const fs2 = /* @__PURE__ */ requireFs();
  const { checkPath } = /* @__PURE__ */ requireUtils$1();
  const getMode = (options) => {
    const defaults = { mode: 511 };
    if (typeof options === "number") return options;
    return { ...defaults, ...options }.mode;
  };
  makeDir.makeDir = async (dir, options) => {
    checkPath(dir);
    return fs2.mkdir(dir, {
      mode: getMode(options),
      recursive: true
    });
  };
  makeDir.makeDirSync = (dir, options) => {
    checkPath(dir);
    return fs2.mkdirSync(dir, {
      mode: getMode(options),
      recursive: true
    });
  };
  return makeDir;
}
var mkdirs;
var hasRequiredMkdirs;
function requireMkdirs() {
  if (hasRequiredMkdirs) return mkdirs;
  hasRequiredMkdirs = 1;
  const u = requireUniversalify().fromPromise;
  const { makeDir: _makeDir, makeDirSync } = /* @__PURE__ */ requireMakeDir();
  const makeDir2 = u(_makeDir);
  mkdirs = {
    mkdirs: makeDir2,
    mkdirsSync: makeDirSync,
    // alias
    mkdirp: makeDir2,
    mkdirpSync: makeDirSync,
    ensureDir: makeDir2,
    ensureDirSync: makeDirSync
  };
  return mkdirs;
}
var pathExists_1;
var hasRequiredPathExists;
function requirePathExists() {
  if (hasRequiredPathExists) return pathExists_1;
  hasRequiredPathExists = 1;
  const u = requireUniversalify().fromPromise;
  const fs2 = /* @__PURE__ */ requireFs();
  function pathExists(path2) {
    return fs2.access(path2).then(() => true).catch(() => false);
  }
  pathExists_1 = {
    pathExists: u(pathExists),
    pathExistsSync: fs2.existsSync
  };
  return pathExists_1;
}
var utimes;
var hasRequiredUtimes;
function requireUtimes() {
  if (hasRequiredUtimes) return utimes;
  hasRequiredUtimes = 1;
  const fs2 = /* @__PURE__ */ requireFs();
  const u = requireUniversalify().fromPromise;
  async function utimesMillis(path2, atime, mtime) {
    const fd = await fs2.open(path2, "r+");
    let closeErr = null;
    try {
      await fs2.futimes(fd, atime, mtime);
    } finally {
      try {
        await fs2.close(fd);
      } catch (e) {
        closeErr = e;
      }
    }
    if (closeErr) {
      throw closeErr;
    }
  }
  function utimesMillisSync(path2, atime, mtime) {
    const fd = fs2.openSync(path2, "r+");
    fs2.futimesSync(fd, atime, mtime);
    return fs2.closeSync(fd);
  }
  utimes = {
    utimesMillis: u(utimesMillis),
    utimesMillisSync
  };
  return utimes;
}
var stat;
var hasRequiredStat;
function requireStat() {
  if (hasRequiredStat) return stat;
  hasRequiredStat = 1;
  const fs2 = /* @__PURE__ */ requireFs();
  const path2 = require$$1;
  const u = requireUniversalify().fromPromise;
  function getStats(src2, dest, opts) {
    const statFunc = opts.dereference ? (file2) => fs2.stat(file2, { bigint: true }) : (file2) => fs2.lstat(file2, { bigint: true });
    return Promise.all([
      statFunc(src2),
      statFunc(dest).catch((err) => {
        if (err.code === "ENOENT") return null;
        throw err;
      })
    ]).then(([srcStat, destStat]) => ({ srcStat, destStat }));
  }
  function getStatsSync(src2, dest, opts) {
    let destStat;
    const statFunc = opts.dereference ? (file2) => fs2.statSync(file2, { bigint: true }) : (file2) => fs2.lstatSync(file2, { bigint: true });
    const srcStat = statFunc(src2);
    try {
      destStat = statFunc(dest);
    } catch (err) {
      if (err.code === "ENOENT") return { srcStat, destStat: null };
      throw err;
    }
    return { srcStat, destStat };
  }
  async function checkPaths(src2, dest, funcName, opts) {
    const { srcStat, destStat } = await getStats(src2, dest, opts);
    if (destStat) {
      if (areIdentical(srcStat, destStat)) {
        const srcBaseName = path2.basename(src2);
        const destBaseName = path2.basename(dest);
        if (funcName === "move" && srcBaseName !== destBaseName && srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
          return { srcStat, destStat, isChangingCase: true };
        }
        throw new Error("Source and destination must not be the same.");
      }
      if (srcStat.isDirectory() && !destStat.isDirectory()) {
        throw new Error(`Cannot overwrite non-directory '${dest}' with directory '${src2}'.`);
      }
      if (!srcStat.isDirectory() && destStat.isDirectory()) {
        throw new Error(`Cannot overwrite directory '${dest}' with non-directory '${src2}'.`);
      }
    }
    if (srcStat.isDirectory() && isSrcSubdir(src2, dest)) {
      throw new Error(errMsg(src2, dest, funcName));
    }
    return { srcStat, destStat };
  }
  function checkPathsSync(src2, dest, funcName, opts) {
    const { srcStat, destStat } = getStatsSync(src2, dest, opts);
    if (destStat) {
      if (areIdentical(srcStat, destStat)) {
        const srcBaseName = path2.basename(src2);
        const destBaseName = path2.basename(dest);
        if (funcName === "move" && srcBaseName !== destBaseName && srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
          return { srcStat, destStat, isChangingCase: true };
        }
        throw new Error("Source and destination must not be the same.");
      }
      if (srcStat.isDirectory() && !destStat.isDirectory()) {
        throw new Error(`Cannot overwrite non-directory '${dest}' with directory '${src2}'.`);
      }
      if (!srcStat.isDirectory() && destStat.isDirectory()) {
        throw new Error(`Cannot overwrite directory '${dest}' with non-directory '${src2}'.`);
      }
    }
    if (srcStat.isDirectory() && isSrcSubdir(src2, dest)) {
      throw new Error(errMsg(src2, dest, funcName));
    }
    return { srcStat, destStat };
  }
  async function checkParentPaths(src2, srcStat, dest, funcName) {
    const srcParent = path2.resolve(path2.dirname(src2));
    const destParent = path2.resolve(path2.dirname(dest));
    if (destParent === srcParent || destParent === path2.parse(destParent).root) return;
    let destStat;
    try {
      destStat = await fs2.stat(destParent, { bigint: true });
    } catch (err) {
      if (err.code === "ENOENT") return;
      throw err;
    }
    if (areIdentical(srcStat, destStat)) {
      throw new Error(errMsg(src2, dest, funcName));
    }
    return checkParentPaths(src2, srcStat, destParent, funcName);
  }
  function checkParentPathsSync(src2, srcStat, dest, funcName) {
    const srcParent = path2.resolve(path2.dirname(src2));
    const destParent = path2.resolve(path2.dirname(dest));
    if (destParent === srcParent || destParent === path2.parse(destParent).root) return;
    let destStat;
    try {
      destStat = fs2.statSync(destParent, { bigint: true });
    } catch (err) {
      if (err.code === "ENOENT") return;
      throw err;
    }
    if (areIdentical(srcStat, destStat)) {
      throw new Error(errMsg(src2, dest, funcName));
    }
    return checkParentPathsSync(src2, srcStat, destParent, funcName);
  }
  function areIdentical(srcStat, destStat) {
    return destStat.ino !== void 0 && destStat.dev !== void 0 && destStat.ino === srcStat.ino && destStat.dev === srcStat.dev;
  }
  function isSrcSubdir(src2, dest) {
    const srcArr = path2.resolve(src2).split(path2.sep).filter((i) => i);
    const destArr = path2.resolve(dest).split(path2.sep).filter((i) => i);
    return srcArr.every((cur, i) => destArr[i] === cur);
  }
  function errMsg(src2, dest, funcName) {
    return `Cannot ${funcName} '${src2}' to a subdirectory of itself, '${dest}'.`;
  }
  stat = {
    // checkPaths
    checkPaths: u(checkPaths),
    checkPathsSync,
    // checkParent
    checkParentPaths: u(checkParentPaths),
    checkParentPathsSync,
    // Misc
    isSrcSubdir,
    areIdentical
  };
  return stat;
}
var async;
var hasRequiredAsync;
function requireAsync() {
  if (hasRequiredAsync) return async;
  hasRequiredAsync = 1;
  async function asyncIteratorConcurrentProcess(iterator, fn) {
    const promises = [];
    for await (const item of iterator) {
      promises.push(
        fn(item).then(
          () => null,
          (err) => err ?? new Error("unknown error")
        )
      );
    }
    await Promise.all(
      promises.map(
        (promise) => promise.then((possibleErr) => {
          if (possibleErr !== null) throw possibleErr;
        })
      )
    );
  }
  async = {
    asyncIteratorConcurrentProcess
  };
  return async;
}
var copy_1;
var hasRequiredCopy$1;
function requireCopy$1() {
  if (hasRequiredCopy$1) return copy_1;
  hasRequiredCopy$1 = 1;
  const fs2 = /* @__PURE__ */ requireFs();
  const path2 = require$$1;
  const { mkdirs: mkdirs2 } = /* @__PURE__ */ requireMkdirs();
  const { pathExists } = /* @__PURE__ */ requirePathExists();
  const { utimesMillis } = /* @__PURE__ */ requireUtimes();
  const stat2 = /* @__PURE__ */ requireStat();
  const { asyncIteratorConcurrentProcess } = /* @__PURE__ */ requireAsync();
  async function copy2(src2, dest, opts = {}) {
    if (typeof opts === "function") {
      opts = { filter: opts };
    }
    opts.clobber = "clobber" in opts ? !!opts.clobber : true;
    opts.overwrite = "overwrite" in opts ? !!opts.overwrite : opts.clobber;
    if (opts.preserveTimestamps && process.arch === "ia32") {
      process.emitWarning(
        "Using the preserveTimestamps option in 32-bit node is not recommended;\n\n	see https://github.com/jprichardson/node-fs-extra/issues/269",
        "Warning",
        "fs-extra-WARN0001"
      );
    }
    const { srcStat, destStat } = await stat2.checkPaths(src2, dest, "copy", opts);
    await stat2.checkParentPaths(src2, srcStat, dest, "copy");
    const include = await runFilter(src2, dest, opts);
    if (!include) return;
    const destParent = path2.dirname(dest);
    const dirExists = await pathExists(destParent);
    if (!dirExists) {
      await mkdirs2(destParent);
    }
    await getStatsAndPerformCopy(destStat, src2, dest, opts);
  }
  async function runFilter(src2, dest, opts) {
    if (!opts.filter) return true;
    return opts.filter(src2, dest);
  }
  async function getStatsAndPerformCopy(destStat, src2, dest, opts) {
    const statFn = opts.dereference ? fs2.stat : fs2.lstat;
    const srcStat = await statFn(src2);
    if (srcStat.isDirectory()) return onDir(srcStat, destStat, src2, dest, opts);
    if (srcStat.isFile() || srcStat.isCharacterDevice() || srcStat.isBlockDevice()) return onFile(srcStat, destStat, src2, dest, opts);
    if (srcStat.isSymbolicLink()) return onLink(destStat, src2, dest, opts);
    if (srcStat.isSocket()) throw new Error(`Cannot copy a socket file: ${src2}`);
    if (srcStat.isFIFO()) throw new Error(`Cannot copy a FIFO pipe: ${src2}`);
    throw new Error(`Unknown file: ${src2}`);
  }
  async function onFile(srcStat, destStat, src2, dest, opts) {
    if (!destStat) return copyFile(srcStat, src2, dest, opts);
    if (opts.overwrite) {
      await fs2.unlink(dest);
      return copyFile(srcStat, src2, dest, opts);
    }
    if (opts.errorOnExist) {
      throw new Error(`'${dest}' already exists`);
    }
  }
  async function copyFile(srcStat, src2, dest, opts) {
    await fs2.copyFile(src2, dest);
    if (opts.preserveTimestamps) {
      if (fileIsNotWritable(srcStat.mode)) {
        await makeFileWritable(dest, srcStat.mode);
      }
      const updatedSrcStat = await fs2.stat(src2);
      await utimesMillis(dest, updatedSrcStat.atime, updatedSrcStat.mtime);
    }
    return fs2.chmod(dest, srcStat.mode);
  }
  function fileIsNotWritable(srcMode) {
    return (srcMode & 128) === 0;
  }
  function makeFileWritable(dest, srcMode) {
    return fs2.chmod(dest, srcMode | 128);
  }
  async function onDir(srcStat, destStat, src2, dest, opts) {
    if (!destStat) {
      await fs2.mkdir(dest);
    }
    await asyncIteratorConcurrentProcess(await fs2.opendir(src2), async (item) => {
      const srcItem = path2.join(src2, item.name);
      const destItem = path2.join(dest, item.name);
      const include = await runFilter(srcItem, destItem, opts);
      if (include) {
        const { destStat: destStat2 } = await stat2.checkPaths(srcItem, destItem, "copy", opts);
        await getStatsAndPerformCopy(destStat2, srcItem, destItem, opts);
      }
    });
    if (!destStat) {
      await fs2.chmod(dest, srcStat.mode);
    }
  }
  async function onLink(destStat, src2, dest, opts) {
    let resolvedSrc = await fs2.readlink(src2);
    if (opts.dereference) {
      resolvedSrc = path2.resolve(process.cwd(), resolvedSrc);
    }
    if (!destStat) {
      return fs2.symlink(resolvedSrc, dest);
    }
    let resolvedDest = null;
    try {
      resolvedDest = await fs2.readlink(dest);
    } catch (e) {
      if (e.code === "EINVAL" || e.code === "UNKNOWN") return fs2.symlink(resolvedSrc, dest);
      throw e;
    }
    if (opts.dereference) {
      resolvedDest = path2.resolve(process.cwd(), resolvedDest);
    }
    if (resolvedSrc !== resolvedDest) {
      if (stat2.isSrcSubdir(resolvedSrc, resolvedDest)) {
        throw new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`);
      }
      if (stat2.isSrcSubdir(resolvedDest, resolvedSrc)) {
        throw new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`);
      }
    }
    await fs2.unlink(dest);
    return fs2.symlink(resolvedSrc, dest);
  }
  copy_1 = copy2;
  return copy_1;
}
var copySync_1;
var hasRequiredCopySync;
function requireCopySync() {
  if (hasRequiredCopySync) return copySync_1;
  hasRequiredCopySync = 1;
  const fs2 = requireGracefulFs();
  const path2 = require$$1;
  const mkdirsSync = requireMkdirs().mkdirsSync;
  const utimesMillisSync = requireUtimes().utimesMillisSync;
  const stat2 = /* @__PURE__ */ requireStat();
  function copySync(src2, dest, opts) {
    if (typeof opts === "function") {
      opts = { filter: opts };
    }
    opts = opts || {};
    opts.clobber = "clobber" in opts ? !!opts.clobber : true;
    opts.overwrite = "overwrite" in opts ? !!opts.overwrite : opts.clobber;
    if (opts.preserveTimestamps && process.arch === "ia32") {
      process.emitWarning(
        "Using the preserveTimestamps option in 32-bit node is not recommended;\n\n	see https://github.com/jprichardson/node-fs-extra/issues/269",
        "Warning",
        "fs-extra-WARN0002"
      );
    }
    const { srcStat, destStat } = stat2.checkPathsSync(src2, dest, "copy", opts);
    stat2.checkParentPathsSync(src2, srcStat, dest, "copy");
    if (opts.filter && !opts.filter(src2, dest)) return;
    const destParent = path2.dirname(dest);
    if (!fs2.existsSync(destParent)) mkdirsSync(destParent);
    return getStats(destStat, src2, dest, opts);
  }
  function getStats(destStat, src2, dest, opts) {
    const statSync = opts.dereference ? fs2.statSync : fs2.lstatSync;
    const srcStat = statSync(src2);
    if (srcStat.isDirectory()) return onDir(srcStat, destStat, src2, dest, opts);
    else if (srcStat.isFile() || srcStat.isCharacterDevice() || srcStat.isBlockDevice()) return onFile(srcStat, destStat, src2, dest, opts);
    else if (srcStat.isSymbolicLink()) return onLink(destStat, src2, dest, opts);
    else if (srcStat.isSocket()) throw new Error(`Cannot copy a socket file: ${src2}`);
    else if (srcStat.isFIFO()) throw new Error(`Cannot copy a FIFO pipe: ${src2}`);
    throw new Error(`Unknown file: ${src2}`);
  }
  function onFile(srcStat, destStat, src2, dest, opts) {
    if (!destStat) return copyFile(srcStat, src2, dest, opts);
    return mayCopyFile(srcStat, src2, dest, opts);
  }
  function mayCopyFile(srcStat, src2, dest, opts) {
    if (opts.overwrite) {
      fs2.unlinkSync(dest);
      return copyFile(srcStat, src2, dest, opts);
    } else if (opts.errorOnExist) {
      throw new Error(`'${dest}' already exists`);
    }
  }
  function copyFile(srcStat, src2, dest, opts) {
    fs2.copyFileSync(src2, dest);
    if (opts.preserveTimestamps) handleTimestamps(srcStat.mode, src2, dest);
    return setDestMode(dest, srcStat.mode);
  }
  function handleTimestamps(srcMode, src2, dest) {
    if (fileIsNotWritable(srcMode)) makeFileWritable(dest, srcMode);
    return setDestTimestamps(src2, dest);
  }
  function fileIsNotWritable(srcMode) {
    return (srcMode & 128) === 0;
  }
  function makeFileWritable(dest, srcMode) {
    return setDestMode(dest, srcMode | 128);
  }
  function setDestMode(dest, srcMode) {
    return fs2.chmodSync(dest, srcMode);
  }
  function setDestTimestamps(src2, dest) {
    const updatedSrcStat = fs2.statSync(src2);
    return utimesMillisSync(dest, updatedSrcStat.atime, updatedSrcStat.mtime);
  }
  function onDir(srcStat, destStat, src2, dest, opts) {
    if (!destStat) return mkDirAndCopy(srcStat.mode, src2, dest, opts);
    return copyDir(src2, dest, opts);
  }
  function mkDirAndCopy(srcMode, src2, dest, opts) {
    fs2.mkdirSync(dest);
    copyDir(src2, dest, opts);
    return setDestMode(dest, srcMode);
  }
  function copyDir(src2, dest, opts) {
    const dir = fs2.opendirSync(src2);
    try {
      let dirent;
      while ((dirent = dir.readSync()) !== null) {
        copyDirItem(dirent.name, src2, dest, opts);
      }
    } finally {
      dir.closeSync();
    }
  }
  function copyDirItem(item, src2, dest, opts) {
    const srcItem = path2.join(src2, item);
    const destItem = path2.join(dest, item);
    if (opts.filter && !opts.filter(srcItem, destItem)) return;
    const { destStat } = stat2.checkPathsSync(srcItem, destItem, "copy", opts);
    return getStats(destStat, srcItem, destItem, opts);
  }
  function onLink(destStat, src2, dest, opts) {
    let resolvedSrc = fs2.readlinkSync(src2);
    if (opts.dereference) {
      resolvedSrc = path2.resolve(process.cwd(), resolvedSrc);
    }
    if (!destStat) {
      return fs2.symlinkSync(resolvedSrc, dest);
    } else {
      let resolvedDest;
      try {
        resolvedDest = fs2.readlinkSync(dest);
      } catch (err) {
        if (err.code === "EINVAL" || err.code === "UNKNOWN") return fs2.symlinkSync(resolvedSrc, dest);
        throw err;
      }
      if (opts.dereference) {
        resolvedDest = path2.resolve(process.cwd(), resolvedDest);
      }
      if (resolvedSrc !== resolvedDest) {
        if (stat2.isSrcSubdir(resolvedSrc, resolvedDest)) {
          throw new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`);
        }
        if (stat2.isSrcSubdir(resolvedDest, resolvedSrc)) {
          throw new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`);
        }
      }
      return copyLink(resolvedSrc, dest);
    }
  }
  function copyLink(resolvedSrc, dest) {
    fs2.unlinkSync(dest);
    return fs2.symlinkSync(resolvedSrc, dest);
  }
  copySync_1 = copySync;
  return copySync_1;
}
var copy;
var hasRequiredCopy;
function requireCopy() {
  if (hasRequiredCopy) return copy;
  hasRequiredCopy = 1;
  const u = requireUniversalify().fromPromise;
  copy = {
    copy: u(/* @__PURE__ */ requireCopy$1()),
    copySync: /* @__PURE__ */ requireCopySync()
  };
  return copy;
}
var remove_1;
var hasRequiredRemove;
function requireRemove() {
  if (hasRequiredRemove) return remove_1;
  hasRequiredRemove = 1;
  const fs2 = requireGracefulFs();
  const u = requireUniversalify().fromCallback;
  function remove(path2, callback) {
    fs2.rm(path2, { recursive: true, force: true }, callback);
  }
  function removeSync(path2) {
    fs2.rmSync(path2, { recursive: true, force: true });
  }
  remove_1 = {
    remove: u(remove),
    removeSync
  };
  return remove_1;
}
var empty;
var hasRequiredEmpty;
function requireEmpty() {
  if (hasRequiredEmpty) return empty;
  hasRequiredEmpty = 1;
  const u = requireUniversalify().fromPromise;
  const fs2 = /* @__PURE__ */ requireFs();
  const path2 = require$$1;
  const mkdir = /* @__PURE__ */ requireMkdirs();
  const remove = /* @__PURE__ */ requireRemove();
  const emptyDir = u(async function emptyDir2(dir) {
    let items;
    try {
      items = await fs2.readdir(dir);
    } catch {
      return mkdir.mkdirs(dir);
    }
    return Promise.all(items.map((item) => remove.remove(path2.join(dir, item))));
  });
  function emptyDirSync(dir) {
    let items;
    try {
      items = fs2.readdirSync(dir);
    } catch {
      return mkdir.mkdirsSync(dir);
    }
    items.forEach((item) => {
      item = path2.join(dir, item);
      remove.removeSync(item);
    });
  }
  empty = {
    emptyDirSync,
    emptydirSync: emptyDirSync,
    emptyDir,
    emptydir: emptyDir
  };
  return empty;
}
var file$1;
var hasRequiredFile$2;
function requireFile$2() {
  if (hasRequiredFile$2) return file$1;
  hasRequiredFile$2 = 1;
  const u = requireUniversalify().fromPromise;
  const path2 = require$$1;
  const fs2 = /* @__PURE__ */ requireFs();
  const mkdir = /* @__PURE__ */ requireMkdirs();
  async function createFile(file2) {
    let stats;
    try {
      stats = await fs2.stat(file2);
    } catch {
    }
    if (stats && stats.isFile()) return;
    const dir = path2.dirname(file2);
    let dirStats = null;
    try {
      dirStats = await fs2.stat(dir);
    } catch (err) {
      if (err.code === "ENOENT") {
        await mkdir.mkdirs(dir);
        await fs2.writeFile(file2, "");
        return;
      } else {
        throw err;
      }
    }
    if (dirStats.isDirectory()) {
      await fs2.writeFile(file2, "");
    } else {
      await fs2.readdir(dir);
    }
  }
  function createFileSync(file2) {
    let stats;
    try {
      stats = fs2.statSync(file2);
    } catch {
    }
    if (stats && stats.isFile()) return;
    const dir = path2.dirname(file2);
    try {
      if (!fs2.statSync(dir).isDirectory()) {
        fs2.readdirSync(dir);
      }
    } catch (err) {
      if (err && err.code === "ENOENT") mkdir.mkdirsSync(dir);
      else throw err;
    }
    fs2.writeFileSync(file2, "");
  }
  file$1 = {
    createFile: u(createFile),
    createFileSync
  };
  return file$1;
}
var link;
var hasRequiredLink;
function requireLink() {
  if (hasRequiredLink) return link;
  hasRequiredLink = 1;
  const u = requireUniversalify().fromPromise;
  const path2 = require$$1;
  const fs2 = /* @__PURE__ */ requireFs();
  const mkdir = /* @__PURE__ */ requireMkdirs();
  const { pathExists } = /* @__PURE__ */ requirePathExists();
  const { areIdentical } = /* @__PURE__ */ requireStat();
  async function createLink(srcpath, dstpath) {
    let dstStat;
    try {
      dstStat = await fs2.lstat(dstpath);
    } catch {
    }
    let srcStat;
    try {
      srcStat = await fs2.lstat(srcpath);
    } catch (err) {
      err.message = err.message.replace("lstat", "ensureLink");
      throw err;
    }
    if (dstStat && areIdentical(srcStat, dstStat)) return;
    const dir = path2.dirname(dstpath);
    const dirExists = await pathExists(dir);
    if (!dirExists) {
      await mkdir.mkdirs(dir);
    }
    await fs2.link(srcpath, dstpath);
  }
  function createLinkSync(srcpath, dstpath) {
    let dstStat;
    try {
      dstStat = fs2.lstatSync(dstpath);
    } catch {
    }
    try {
      const srcStat = fs2.lstatSync(srcpath);
      if (dstStat && areIdentical(srcStat, dstStat)) return;
    } catch (err) {
      err.message = err.message.replace("lstat", "ensureLink");
      throw err;
    }
    const dir = path2.dirname(dstpath);
    const dirExists = fs2.existsSync(dir);
    if (dirExists) return fs2.linkSync(srcpath, dstpath);
    mkdir.mkdirsSync(dir);
    return fs2.linkSync(srcpath, dstpath);
  }
  link = {
    createLink: u(createLink),
    createLinkSync
  };
  return link;
}
var symlinkPaths_1;
var hasRequiredSymlinkPaths;
function requireSymlinkPaths() {
  if (hasRequiredSymlinkPaths) return symlinkPaths_1;
  hasRequiredSymlinkPaths = 1;
  const path2 = require$$1;
  const fs2 = /* @__PURE__ */ requireFs();
  const { pathExists } = /* @__PURE__ */ requirePathExists();
  const u = requireUniversalify().fromPromise;
  async function symlinkPaths(srcpath, dstpath) {
    if (path2.isAbsolute(srcpath)) {
      try {
        await fs2.lstat(srcpath);
      } catch (err) {
        err.message = err.message.replace("lstat", "ensureSymlink");
        throw err;
      }
      return {
        toCwd: srcpath,
        toDst: srcpath
      };
    }
    const dstdir = path2.dirname(dstpath);
    const relativeToDst = path2.join(dstdir, srcpath);
    const exists = await pathExists(relativeToDst);
    if (exists) {
      return {
        toCwd: relativeToDst,
        toDst: srcpath
      };
    }
    try {
      await fs2.lstat(srcpath);
    } catch (err) {
      err.message = err.message.replace("lstat", "ensureSymlink");
      throw err;
    }
    return {
      toCwd: srcpath,
      toDst: path2.relative(dstdir, srcpath)
    };
  }
  function symlinkPathsSync(srcpath, dstpath) {
    if (path2.isAbsolute(srcpath)) {
      const exists2 = fs2.existsSync(srcpath);
      if (!exists2) throw new Error("absolute srcpath does not exist");
      return {
        toCwd: srcpath,
        toDst: srcpath
      };
    }
    const dstdir = path2.dirname(dstpath);
    const relativeToDst = path2.join(dstdir, srcpath);
    const exists = fs2.existsSync(relativeToDst);
    if (exists) {
      return {
        toCwd: relativeToDst,
        toDst: srcpath
      };
    }
    const srcExists = fs2.existsSync(srcpath);
    if (!srcExists) throw new Error("relative srcpath does not exist");
    return {
      toCwd: srcpath,
      toDst: path2.relative(dstdir, srcpath)
    };
  }
  symlinkPaths_1 = {
    symlinkPaths: u(symlinkPaths),
    symlinkPathsSync
  };
  return symlinkPaths_1;
}
var symlinkType_1;
var hasRequiredSymlinkType;
function requireSymlinkType() {
  if (hasRequiredSymlinkType) return symlinkType_1;
  hasRequiredSymlinkType = 1;
  const fs2 = /* @__PURE__ */ requireFs();
  const u = requireUniversalify().fromPromise;
  async function symlinkType(srcpath, type) {
    if (type) return type;
    let stats;
    try {
      stats = await fs2.lstat(srcpath);
    } catch {
      return "file";
    }
    return stats && stats.isDirectory() ? "dir" : "file";
  }
  function symlinkTypeSync(srcpath, type) {
    if (type) return type;
    let stats;
    try {
      stats = fs2.lstatSync(srcpath);
    } catch {
      return "file";
    }
    return stats && stats.isDirectory() ? "dir" : "file";
  }
  symlinkType_1 = {
    symlinkType: u(symlinkType),
    symlinkTypeSync
  };
  return symlinkType_1;
}
var symlink;
var hasRequiredSymlink;
function requireSymlink() {
  if (hasRequiredSymlink) return symlink;
  hasRequiredSymlink = 1;
  const u = requireUniversalify().fromPromise;
  const path2 = require$$1;
  const fs2 = /* @__PURE__ */ requireFs();
  const { mkdirs: mkdirs2, mkdirsSync } = /* @__PURE__ */ requireMkdirs();
  const { symlinkPaths, symlinkPathsSync } = /* @__PURE__ */ requireSymlinkPaths();
  const { symlinkType, symlinkTypeSync } = /* @__PURE__ */ requireSymlinkType();
  const { pathExists } = /* @__PURE__ */ requirePathExists();
  const { areIdentical } = /* @__PURE__ */ requireStat();
  async function createSymlink(srcpath, dstpath, type) {
    let stats;
    try {
      stats = await fs2.lstat(dstpath);
    } catch {
    }
    if (stats && stats.isSymbolicLink()) {
      let srcStat;
      if (path2.isAbsolute(srcpath)) {
        srcStat = await fs2.stat(srcpath);
      } else {
        const dstdir = path2.dirname(dstpath);
        const relativeToDst = path2.join(dstdir, srcpath);
        try {
          srcStat = await fs2.stat(relativeToDst);
        } catch {
          srcStat = await fs2.stat(srcpath);
        }
      }
      const dstStat = await fs2.stat(dstpath);
      if (areIdentical(srcStat, dstStat)) return;
    }
    const relative = await symlinkPaths(srcpath, dstpath);
    srcpath = relative.toDst;
    const toType = await symlinkType(relative.toCwd, type);
    const dir = path2.dirname(dstpath);
    if (!await pathExists(dir)) {
      await mkdirs2(dir);
    }
    return fs2.symlink(srcpath, dstpath, toType);
  }
  function createSymlinkSync(srcpath, dstpath, type) {
    let stats;
    try {
      stats = fs2.lstatSync(dstpath);
    } catch {
    }
    if (stats && stats.isSymbolicLink()) {
      let srcStat;
      if (path2.isAbsolute(srcpath)) {
        srcStat = fs2.statSync(srcpath);
      } else {
        const dstdir = path2.dirname(dstpath);
        const relativeToDst = path2.join(dstdir, srcpath);
        try {
          srcStat = fs2.statSync(relativeToDst);
        } catch {
          srcStat = fs2.statSync(srcpath);
        }
      }
      const dstStat = fs2.statSync(dstpath);
      if (areIdentical(srcStat, dstStat)) return;
    }
    const relative = symlinkPathsSync(srcpath, dstpath);
    srcpath = relative.toDst;
    type = symlinkTypeSync(relative.toCwd, type);
    const dir = path2.dirname(dstpath);
    const exists = fs2.existsSync(dir);
    if (exists) return fs2.symlinkSync(srcpath, dstpath, type);
    mkdirsSync(dir);
    return fs2.symlinkSync(srcpath, dstpath, type);
  }
  symlink = {
    createSymlink: u(createSymlink),
    createSymlinkSync
  };
  return symlink;
}
var ensure;
var hasRequiredEnsure;
function requireEnsure() {
  if (hasRequiredEnsure) return ensure;
  hasRequiredEnsure = 1;
  const { createFile, createFileSync } = /* @__PURE__ */ requireFile$2();
  const { createLink, createLinkSync } = /* @__PURE__ */ requireLink();
  const { createSymlink, createSymlinkSync } = /* @__PURE__ */ requireSymlink();
  ensure = {
    // file
    createFile,
    createFileSync,
    ensureFile: createFile,
    ensureFileSync: createFileSync,
    // link
    createLink,
    createLinkSync,
    ensureLink: createLink,
    ensureLinkSync: createLinkSync,
    // symlink
    createSymlink,
    createSymlinkSync,
    ensureSymlink: createSymlink,
    ensureSymlinkSync: createSymlinkSync
  };
  return ensure;
}
var utils;
var hasRequiredUtils;
function requireUtils() {
  if (hasRequiredUtils) return utils;
  hasRequiredUtils = 1;
  function stringify(obj, { EOL = "\n", finalEOL = true, replacer = null, spaces } = {}) {
    const EOF = finalEOL ? EOL : "";
    const str = JSON.stringify(obj, replacer, spaces);
    return str.replace(/\n/g, EOL) + EOF;
  }
  function stripBom(content) {
    if (Buffer.isBuffer(content)) content = content.toString("utf8");
    return content.replace(/^\uFEFF/, "");
  }
  utils = { stringify, stripBom };
  return utils;
}
var jsonfile$1;
var hasRequiredJsonfile$1;
function requireJsonfile$1() {
  if (hasRequiredJsonfile$1) return jsonfile$1;
  hasRequiredJsonfile$1 = 1;
  let _fs;
  try {
    _fs = requireGracefulFs();
  } catch (_) {
    _fs = require$$0__default;
  }
  const universalify2 = requireUniversalify();
  const { stringify, stripBom } = requireUtils();
  async function _readFile(file2, options = {}) {
    if (typeof options === "string") {
      options = { encoding: options };
    }
    const fs2 = options.fs || _fs;
    const shouldThrow = "throws" in options ? options.throws : true;
    let data = await universalify2.fromCallback(fs2.readFile)(file2, options);
    data = stripBom(data);
    let obj;
    try {
      obj = JSON.parse(data, options ? options.reviver : null);
    } catch (err) {
      if (shouldThrow) {
        err.message = `${file2}: ${err.message}`;
        throw err;
      } else {
        return null;
      }
    }
    return obj;
  }
  const readFile = universalify2.fromPromise(_readFile);
  function readFileSync(file2, options = {}) {
    if (typeof options === "string") {
      options = { encoding: options };
    }
    const fs2 = options.fs || _fs;
    const shouldThrow = "throws" in options ? options.throws : true;
    try {
      let content = fs2.readFileSync(file2, options);
      content = stripBom(content);
      return JSON.parse(content, options.reviver);
    } catch (err) {
      if (shouldThrow) {
        err.message = `${file2}: ${err.message}`;
        throw err;
      } else {
        return null;
      }
    }
  }
  async function _writeFile(file2, obj, options = {}) {
    const fs2 = options.fs || _fs;
    const str = stringify(obj, options);
    await universalify2.fromCallback(fs2.writeFile)(file2, str, options);
  }
  const writeFile = universalify2.fromPromise(_writeFile);
  function writeFileSync(file2, obj, options = {}) {
    const fs2 = options.fs || _fs;
    const str = stringify(obj, options);
    return fs2.writeFileSync(file2, str, options);
  }
  jsonfile$1 = {
    readFile,
    readFileSync,
    writeFile,
    writeFileSync
  };
  return jsonfile$1;
}
var jsonfile;
var hasRequiredJsonfile;
function requireJsonfile() {
  if (hasRequiredJsonfile) return jsonfile;
  hasRequiredJsonfile = 1;
  const jsonFile = requireJsonfile$1();
  jsonfile = {
    // jsonfile exports
    readJson: jsonFile.readFile,
    readJsonSync: jsonFile.readFileSync,
    writeJson: jsonFile.writeFile,
    writeJsonSync: jsonFile.writeFileSync
  };
  return jsonfile;
}
var outputFile_1;
var hasRequiredOutputFile;
function requireOutputFile() {
  if (hasRequiredOutputFile) return outputFile_1;
  hasRequiredOutputFile = 1;
  const u = requireUniversalify().fromPromise;
  const fs2 = /* @__PURE__ */ requireFs();
  const path2 = require$$1;
  const mkdir = /* @__PURE__ */ requireMkdirs();
  const pathExists = requirePathExists().pathExists;
  async function outputFile(file2, data, encoding = "utf-8") {
    const dir = path2.dirname(file2);
    if (!await pathExists(dir)) {
      await mkdir.mkdirs(dir);
    }
    return fs2.writeFile(file2, data, encoding);
  }
  function outputFileSync(file2, ...args) {
    const dir = path2.dirname(file2);
    if (!fs2.existsSync(dir)) {
      mkdir.mkdirsSync(dir);
    }
    fs2.writeFileSync(file2, ...args);
  }
  outputFile_1 = {
    outputFile: u(outputFile),
    outputFileSync
  };
  return outputFile_1;
}
var outputJson_1;
var hasRequiredOutputJson;
function requireOutputJson() {
  if (hasRequiredOutputJson) return outputJson_1;
  hasRequiredOutputJson = 1;
  const { stringify } = requireUtils();
  const { outputFile } = /* @__PURE__ */ requireOutputFile();
  async function outputJson(file2, data, options = {}) {
    const str = stringify(data, options);
    await outputFile(file2, str, options);
  }
  outputJson_1 = outputJson;
  return outputJson_1;
}
var outputJsonSync_1;
var hasRequiredOutputJsonSync;
function requireOutputJsonSync() {
  if (hasRequiredOutputJsonSync) return outputJsonSync_1;
  hasRequiredOutputJsonSync = 1;
  const { stringify } = requireUtils();
  const { outputFileSync } = /* @__PURE__ */ requireOutputFile();
  function outputJsonSync(file2, data, options) {
    const str = stringify(data, options);
    outputFileSync(file2, str, options);
  }
  outputJsonSync_1 = outputJsonSync;
  return outputJsonSync_1;
}
var json;
var hasRequiredJson;
function requireJson() {
  if (hasRequiredJson) return json;
  hasRequiredJson = 1;
  const u = requireUniversalify().fromPromise;
  const jsonFile = /* @__PURE__ */ requireJsonfile();
  jsonFile.outputJson = u(/* @__PURE__ */ requireOutputJson());
  jsonFile.outputJsonSync = /* @__PURE__ */ requireOutputJsonSync();
  jsonFile.outputJSON = jsonFile.outputJson;
  jsonFile.outputJSONSync = jsonFile.outputJsonSync;
  jsonFile.writeJSON = jsonFile.writeJson;
  jsonFile.writeJSONSync = jsonFile.writeJsonSync;
  jsonFile.readJSON = jsonFile.readJson;
  jsonFile.readJSONSync = jsonFile.readJsonSync;
  json = jsonFile;
  return json;
}
var move_1;
var hasRequiredMove$1;
function requireMove$1() {
  if (hasRequiredMove$1) return move_1;
  hasRequiredMove$1 = 1;
  const fs2 = /* @__PURE__ */ requireFs();
  const path2 = require$$1;
  const { copy: copy2 } = /* @__PURE__ */ requireCopy();
  const { remove } = /* @__PURE__ */ requireRemove();
  const { mkdirp } = /* @__PURE__ */ requireMkdirs();
  const { pathExists } = /* @__PURE__ */ requirePathExists();
  const stat2 = /* @__PURE__ */ requireStat();
  async function move2(src2, dest, opts = {}) {
    const overwrite = opts.overwrite || opts.clobber || false;
    const { srcStat, isChangingCase = false } = await stat2.checkPaths(src2, dest, "move", opts);
    await stat2.checkParentPaths(src2, srcStat, dest, "move");
    const destParent = path2.dirname(dest);
    const parsedParentPath = path2.parse(destParent);
    if (parsedParentPath.root !== destParent) {
      await mkdirp(destParent);
    }
    return doRename(src2, dest, overwrite, isChangingCase);
  }
  async function doRename(src2, dest, overwrite, isChangingCase) {
    if (!isChangingCase) {
      if (overwrite) {
        await remove(dest);
      } else if (await pathExists(dest)) {
        throw new Error("dest already exists.");
      }
    }
    try {
      await fs2.rename(src2, dest);
    } catch (err) {
      if (err.code !== "EXDEV") {
        throw err;
      }
      await moveAcrossDevice(src2, dest, overwrite);
    }
  }
  async function moveAcrossDevice(src2, dest, overwrite) {
    const opts = {
      overwrite,
      errorOnExist: true,
      preserveTimestamps: true
    };
    await copy2(src2, dest, opts);
    return remove(src2);
  }
  move_1 = move2;
  return move_1;
}
var moveSync_1;
var hasRequiredMoveSync;
function requireMoveSync() {
  if (hasRequiredMoveSync) return moveSync_1;
  hasRequiredMoveSync = 1;
  const fs2 = requireGracefulFs();
  const path2 = require$$1;
  const copySync = requireCopy().copySync;
  const removeSync = requireRemove().removeSync;
  const mkdirpSync = requireMkdirs().mkdirpSync;
  const stat2 = /* @__PURE__ */ requireStat();
  function moveSync(src2, dest, opts) {
    opts = opts || {};
    const overwrite = opts.overwrite || opts.clobber || false;
    const { srcStat, isChangingCase = false } = stat2.checkPathsSync(src2, dest, "move", opts);
    stat2.checkParentPathsSync(src2, srcStat, dest, "move");
    if (!isParentRoot(dest)) mkdirpSync(path2.dirname(dest));
    return doRename(src2, dest, overwrite, isChangingCase);
  }
  function isParentRoot(dest) {
    const parent = path2.dirname(dest);
    const parsedPath = path2.parse(parent);
    return parsedPath.root === parent;
  }
  function doRename(src2, dest, overwrite, isChangingCase) {
    if (isChangingCase) return rename(src2, dest, overwrite);
    if (overwrite) {
      removeSync(dest);
      return rename(src2, dest, overwrite);
    }
    if (fs2.existsSync(dest)) throw new Error("dest already exists.");
    return rename(src2, dest, overwrite);
  }
  function rename(src2, dest, overwrite) {
    try {
      fs2.renameSync(src2, dest);
    } catch (err) {
      if (err.code !== "EXDEV") throw err;
      return moveAcrossDevice(src2, dest, overwrite);
    }
  }
  function moveAcrossDevice(src2, dest, overwrite) {
    const opts = {
      overwrite,
      errorOnExist: true,
      preserveTimestamps: true
    };
    copySync(src2, dest, opts);
    return removeSync(src2);
  }
  moveSync_1 = moveSync;
  return moveSync_1;
}
var move;
var hasRequiredMove;
function requireMove() {
  if (hasRequiredMove) return move;
  hasRequiredMove = 1;
  const u = requireUniversalify().fromPromise;
  move = {
    move: u(/* @__PURE__ */ requireMove$1()),
    moveSync: /* @__PURE__ */ requireMoveSync()
  };
  return move;
}
var lib;
var hasRequiredLib;
function requireLib() {
  if (hasRequiredLib) return lib;
  hasRequiredLib = 1;
  lib = {
    // Export promiseified graceful-fs:
    .../* @__PURE__ */ requireFs(),
    // Export extra methods:
    .../* @__PURE__ */ requireCopy(),
    .../* @__PURE__ */ requireEmpty(),
    .../* @__PURE__ */ requireEnsure(),
    .../* @__PURE__ */ requireJson(),
    .../* @__PURE__ */ requireMkdirs(),
    .../* @__PURE__ */ requireMove(),
    .../* @__PURE__ */ requireOutputFile(),
    .../* @__PURE__ */ requirePathExists(),
    .../* @__PURE__ */ requireRemove()
  };
  return lib;
}
var libExports = /* @__PURE__ */ requireLib();
const fs = /* @__PURE__ */ getDefaultExportFromCjs(libExports);
var src = { exports: {} };
var electronLogPreload = { exports: {} };
var hasRequiredElectronLogPreload;
function requireElectronLogPreload() {
  if (hasRequiredElectronLogPreload) return electronLogPreload.exports;
  hasRequiredElectronLogPreload = 1;
  (function(module) {
    let electron = {};
    try {
      electron = require("electron");
    } catch (e) {
    }
    if (electron.ipcRenderer) {
      initialize2(electron);
    }
    {
      module.exports = initialize2;
    }
    function initialize2({ contextBridge, ipcRenderer }) {
      if (!ipcRenderer) {
        return;
      }
      ipcRenderer.on("__ELECTRON_LOG_IPC__", (_, message) => {
        window.postMessage({ cmd: "message", ...message });
      });
      ipcRenderer.invoke("__ELECTRON_LOG__", { cmd: "getOptions" }).catch((e) => console.error(new Error(
        `electron-log isn't initialized in the main process. Please call log.initialize() before. ${e.message}`
      )));
      const electronLog = {
        sendToMain(message) {
          try {
            ipcRenderer.send("__ELECTRON_LOG__", message);
          } catch (e) {
            console.error("electronLog.sendToMain ", e, "data:", message);
            ipcRenderer.send("__ELECTRON_LOG__", {
              cmd: "errorHandler",
              error: { message: e?.message, stack: e?.stack },
              errorName: "sendToMain"
            });
          }
        },
        log(...data) {
          electronLog.sendToMain({ data, level: "info" });
        }
      };
      for (const level of ["error", "warn", "info", "verbose", "debug", "silly"]) {
        electronLog[level] = (...data) => electronLog.sendToMain({
          data,
          level
        });
      }
      if (contextBridge && process.contextIsolated) {
        try {
          contextBridge.exposeInMainWorld("__electronLog", electronLog);
        } catch {
        }
      }
      if (typeof window === "object") {
        window.__electronLog = electronLog;
      } else {
        __electronLog = electronLog;
      }
    }
  })(electronLogPreload);
  return electronLogPreload.exports;
}
var renderer = { exports: {} };
var scope;
var hasRequiredScope;
function requireScope() {
  if (hasRequiredScope) return scope;
  hasRequiredScope = 1;
  scope = scopeFactory;
  function scopeFactory(logger) {
    return Object.defineProperties(scope2, {
      defaultLabel: { value: "", writable: true },
      labelPadding: { value: true, writable: true },
      maxLabelLength: { value: 0, writable: true },
      labelLength: {
        get() {
          switch (typeof scope2.labelPadding) {
            case "boolean":
              return scope2.labelPadding ? scope2.maxLabelLength : 0;
            case "number":
              return scope2.labelPadding;
            default:
              return 0;
          }
        }
      }
    });
    function scope2(label) {
      scope2.maxLabelLength = Math.max(scope2.maxLabelLength, label.length);
      const newScope = {};
      for (const level of logger.levels) {
        newScope[level] = (...d) => logger.logData(d, { level, scope: label });
      }
      newScope.log = newScope.info;
      return newScope;
    }
  }
  return scope;
}
var Buffering_1;
var hasRequiredBuffering;
function requireBuffering() {
  if (hasRequiredBuffering) return Buffering_1;
  hasRequiredBuffering = 1;
  class Buffering {
    constructor({ processMessage }) {
      this.processMessage = processMessage;
      this.buffer = [];
      this.enabled = false;
      this.begin = this.begin.bind(this);
      this.commit = this.commit.bind(this);
      this.reject = this.reject.bind(this);
    }
    addMessage(message) {
      this.buffer.push(message);
    }
    begin() {
      this.enabled = [];
    }
    commit() {
      this.enabled = false;
      this.buffer.forEach((item) => this.processMessage(item));
      this.buffer = [];
    }
    reject() {
      this.enabled = false;
      this.buffer = [];
    }
  }
  Buffering_1 = Buffering;
  return Buffering_1;
}
var Logger_1;
var hasRequiredLogger;
function requireLogger() {
  if (hasRequiredLogger) return Logger_1;
  hasRequiredLogger = 1;
  const scopeFactory = requireScope();
  const Buffering = requireBuffering();
  class Logger {
    static instances = {};
    dependencies = {};
    errorHandler = null;
    eventLogger = null;
    functions = {};
    hooks = [];
    isDev = false;
    levels = null;
    logId = null;
    scope = null;
    transports = {};
    variables = {};
    constructor({
      allowUnknownLevel = false,
      dependencies = {},
      errorHandler,
      eventLogger,
      initializeFn,
      isDev = false,
      levels = ["error", "warn", "info", "verbose", "debug", "silly"],
      logId,
      transportFactories = {},
      variables
    } = {}) {
      this.addLevel = this.addLevel.bind(this);
      this.create = this.create.bind(this);
      this.initialize = this.initialize.bind(this);
      this.logData = this.logData.bind(this);
      this.processMessage = this.processMessage.bind(this);
      this.allowUnknownLevel = allowUnknownLevel;
      this.buffering = new Buffering(this);
      this.dependencies = dependencies;
      this.initializeFn = initializeFn;
      this.isDev = isDev;
      this.levels = levels;
      this.logId = logId;
      this.scope = scopeFactory(this);
      this.transportFactories = transportFactories;
      this.variables = variables || {};
      for (const name of this.levels) {
        this.addLevel(name, false);
      }
      this.log = this.info;
      this.functions.log = this.log;
      this.errorHandler = errorHandler;
      errorHandler?.setOptions({ ...dependencies, logFn: this.error });
      this.eventLogger = eventLogger;
      eventLogger?.setOptions({ ...dependencies, logger: this });
      for (const [name, factory] of Object.entries(transportFactories)) {
        this.transports[name] = factory(this, dependencies);
      }
      Logger.instances[logId] = this;
    }
    static getInstance({ logId }) {
      return this.instances[logId] || this.instances.default;
    }
    addLevel(level, index = this.levels.length) {
      if (index !== false) {
        this.levels.splice(index, 0, level);
      }
      this[level] = (...args) => this.logData(args, { level });
      this.functions[level] = this[level];
    }
    catchErrors(options) {
      this.processMessage(
        {
          data: ["log.catchErrors is deprecated. Use log.errorHandler instead"],
          level: "warn"
        },
        { transports: ["console"] }
      );
      return this.errorHandler.startCatching(options);
    }
    create(options) {
      if (typeof options === "string") {
        options = { logId: options };
      }
      return new Logger({
        dependencies: this.dependencies,
        errorHandler: this.errorHandler,
        initializeFn: this.initializeFn,
        isDev: this.isDev,
        transportFactories: this.transportFactories,
        variables: { ...this.variables },
        ...options
      });
    }
    compareLevels(passLevel, checkLevel, levels = this.levels) {
      const pass = levels.indexOf(passLevel);
      const check = levels.indexOf(checkLevel);
      if (check === -1 || pass === -1) {
        return true;
      }
      return check <= pass;
    }
    initialize(options = {}) {
      this.initializeFn({ logger: this, ...this.dependencies, ...options });
    }
    logData(data, options = {}) {
      if (this.buffering.enabled) {
        this.buffering.addMessage({ data, date: /* @__PURE__ */ new Date(), ...options });
      } else {
        this.processMessage({ data, ...options });
      }
    }
    processMessage(message, { transports = this.transports } = {}) {
      if (message.cmd === "errorHandler") {
        this.errorHandler.handle(message.error, {
          errorName: message.errorName,
          processType: "renderer",
          showDialog: Boolean(message.showDialog)
        });
        return;
      }
      let level = message.level;
      if (!this.allowUnknownLevel) {
        level = this.levels.includes(message.level) ? message.level : "info";
      }
      const normalizedMessage = {
        date: /* @__PURE__ */ new Date(),
        logId: this.logId,
        ...message,
        level,
        variables: {
          ...this.variables,
          ...message.variables
        }
      };
      for (const [transName, transFn] of this.transportEntries(transports)) {
        if (typeof transFn !== "function" || transFn.level === false) {
          continue;
        }
        if (!this.compareLevels(transFn.level, message.level)) {
          continue;
        }
        try {
          const transformedMsg = this.hooks.reduce((msg, hook) => {
            return msg ? hook(msg, transFn, transName) : msg;
          }, normalizedMessage);
          if (transformedMsg) {
            transFn({ ...transformedMsg, data: [...transformedMsg.data] });
          }
        } catch (e) {
          this.processInternalErrorFn(e);
        }
      }
    }
    processInternalErrorFn(_e) {
    }
    transportEntries(transports = this.transports) {
      const transportArray = Array.isArray(transports) ? transports : Object.entries(transports);
      return transportArray.map((item) => {
        switch (typeof item) {
          case "string":
            return this.transports[item] ? [item, this.transports[item]] : null;
          case "function":
            return [item.name, item];
          default:
            return Array.isArray(item) ? item : null;
        }
      }).filter(Boolean);
    }
  }
  Logger_1 = Logger;
  return Logger_1;
}
var RendererErrorHandler_1;
var hasRequiredRendererErrorHandler;
function requireRendererErrorHandler() {
  if (hasRequiredRendererErrorHandler) return RendererErrorHandler_1;
  hasRequiredRendererErrorHandler = 1;
  const consoleError = console.error;
  class RendererErrorHandler {
    logFn = null;
    onError = null;
    showDialog = false;
    preventDefault = true;
    constructor({ logFn = null } = {}) {
      this.handleError = this.handleError.bind(this);
      this.handleRejection = this.handleRejection.bind(this);
      this.startCatching = this.startCatching.bind(this);
      this.logFn = logFn;
    }
    handle(error, {
      logFn = this.logFn,
      errorName = "",
      onError = this.onError,
      showDialog = this.showDialog
    } = {}) {
      try {
        if (onError?.({ error, errorName, processType: "renderer" }) !== false) {
          logFn({ error, errorName, showDialog });
        }
      } catch {
        consoleError(error);
      }
    }
    setOptions({ logFn, onError, preventDefault, showDialog }) {
      if (typeof logFn === "function") {
        this.logFn = logFn;
      }
      if (typeof onError === "function") {
        this.onError = onError;
      }
      if (typeof preventDefault === "boolean") {
        this.preventDefault = preventDefault;
      }
      if (typeof showDialog === "boolean") {
        this.showDialog = showDialog;
      }
    }
    startCatching({ onError, showDialog } = {}) {
      if (this.isActive) {
        return;
      }
      this.isActive = true;
      this.setOptions({ onError, showDialog });
      window.addEventListener("error", (event) => {
        this.preventDefault && event.preventDefault?.();
        this.handleError(event.error || event);
      });
      window.addEventListener("unhandledrejection", (event) => {
        this.preventDefault && event.preventDefault?.();
        this.handleRejection(event.reason || event);
      });
    }
    handleError(error) {
      this.handle(error, { errorName: "Unhandled" });
    }
    handleRejection(reason) {
      const error = reason instanceof Error ? reason : new Error(JSON.stringify(reason));
      this.handle(error, { errorName: "Unhandled rejection" });
    }
  }
  RendererErrorHandler_1 = RendererErrorHandler;
  return RendererErrorHandler_1;
}
var transform_1;
var hasRequiredTransform;
function requireTransform() {
  if (hasRequiredTransform) return transform_1;
  hasRequiredTransform = 1;
  transform_1 = { transform };
  function transform({
    logger,
    message,
    transport,
    initialData = message?.data || [],
    transforms = transport?.transforms
  }) {
    return transforms.reduce((data, trans) => {
      if (typeof trans === "function") {
        return trans({ data, logger, message, transport });
      }
      return data;
    }, initialData);
  }
  return transform_1;
}
var console_1$1;
var hasRequiredConsole$1;
function requireConsole$1() {
  if (hasRequiredConsole$1) return console_1$1;
  hasRequiredConsole$1 = 1;
  const { transform } = requireTransform();
  console_1$1 = consoleTransportRendererFactory;
  const consoleMethods = {
    error: console.error,
    warn: console.warn,
    info: console.info,
    verbose: console.info,
    debug: console.debug,
    silly: console.debug,
    log: console.log
  };
  function consoleTransportRendererFactory(logger) {
    return Object.assign(transport, {
      format: "{h}:{i}:{s}.{ms}{scope} › {text}",
      transforms: [formatDataFn],
      writeFn({ message: { level, data } }) {
        const consoleLogFn = consoleMethods[level] || consoleMethods.info;
        setTimeout(() => consoleLogFn(...data));
      }
    });
    function transport(message) {
      transport.writeFn({
        message: { ...message, data: transform({ logger, message, transport }) }
      });
    }
  }
  function formatDataFn({
    data = [],
    logger = {},
    message = {},
    transport = {}
  }) {
    if (typeof transport.format === "function") {
      return transport.format({
        data,
        level: message?.level || "info",
        logger,
        message,
        transport
      });
    }
    if (typeof transport.format !== "string") {
      return data;
    }
    data.unshift(transport.format);
    if (typeof data[1] === "string" && data[1].match(/%[1cdfiOos]/)) {
      data = [`${data[0]}${data[1]}`, ...data.slice(2)];
    }
    const date = message.date || /* @__PURE__ */ new Date();
    data[0] = data[0].replace(/\{(\w+)}/g, (substring, name) => {
      switch (name) {
        case "level":
          return message.level;
        case "logId":
          return message.logId;
        case "scope": {
          const scope2 = message.scope || logger.scope?.defaultLabel;
          return scope2 ? ` (${scope2})` : "";
        }
        case "text":
          return "";
        case "y":
          return date.getFullYear().toString(10);
        case "m":
          return (date.getMonth() + 1).toString(10).padStart(2, "0");
        case "d":
          return date.getDate().toString(10).padStart(2, "0");
        case "h":
          return date.getHours().toString(10).padStart(2, "0");
        case "i":
          return date.getMinutes().toString(10).padStart(2, "0");
        case "s":
          return date.getSeconds().toString(10).padStart(2, "0");
        case "ms":
          return date.getMilliseconds().toString(10).padStart(3, "0");
        case "iso":
          return date.toISOString();
        default:
          return message.variables?.[name] || substring;
      }
    }).trim();
    return data;
  }
  return console_1$1;
}
var ipc$1;
var hasRequiredIpc$1;
function requireIpc$1() {
  if (hasRequiredIpc$1) return ipc$1;
  hasRequiredIpc$1 = 1;
  const { transform } = requireTransform();
  ipc$1 = ipcTransportRendererFactory;
  const RESTRICTED_TYPES = /* @__PURE__ */ new Set([Promise, WeakMap, WeakSet]);
  function ipcTransportRendererFactory(logger) {
    return Object.assign(transport, {
      depth: 5,
      transforms: [serializeFn]
    });
    function transport(message) {
      if (!window.__electronLog) {
        logger.processMessage(
          {
            data: ["electron-log: logger isn't initialized in the main process"],
            level: "error"
          },
          { transports: ["console"] }
        );
        return;
      }
      try {
        const serialized = transform({
          initialData: message,
          logger,
          message,
          transport
        });
        __electronLog.sendToMain(serialized);
      } catch (e) {
        logger.transports.console({
          data: ["electronLog.transports.ipc", e, "data:", message.data],
          level: "error"
        });
      }
    }
  }
  function isPrimitive(value) {
    return Object(value) !== value;
  }
  function serializeFn({
    data,
    depth,
    seen = /* @__PURE__ */ new WeakSet(),
    transport = {}
  } = {}) {
    const actualDepth = depth || transport.depth || 5;
    if (seen.has(data)) {
      return "[Circular]";
    }
    if (actualDepth < 1) {
      if (isPrimitive(data)) {
        return data;
      }
      if (Array.isArray(data)) {
        return "[Array]";
      }
      return `[${typeof data}]`;
    }
    if (["function", "symbol"].includes(typeof data)) {
      return data.toString();
    }
    if (isPrimitive(data)) {
      return data;
    }
    if (RESTRICTED_TYPES.has(data.constructor)) {
      return `[${data.constructor.name}]`;
    }
    if (Array.isArray(data)) {
      return data.map((item) => serializeFn({
        data: item,
        depth: actualDepth - 1,
        seen
      }));
    }
    if (data instanceof Date) {
      return data.toISOString();
    }
    if (data instanceof Error) {
      return data.stack;
    }
    if (data instanceof Map) {
      return new Map(
        Array.from(data).map(([key, value]) => [
          serializeFn({ data: key, depth: actualDepth - 1, seen }),
          serializeFn({ data: value, depth: actualDepth - 1, seen })
        ])
      );
    }
    if (data instanceof Set) {
      return new Set(
        Array.from(data).map(
          (val) => serializeFn({ data: val, depth: actualDepth - 1, seen })
        )
      );
    }
    seen.add(data);
    return Object.fromEntries(
      Object.entries(data).map(
        ([key, value]) => [
          key,
          serializeFn({ data: value, depth: actualDepth - 1, seen })
        ]
      )
    );
  }
  return ipc$1;
}
var hasRequiredRenderer;
function requireRenderer() {
  if (hasRequiredRenderer) return renderer.exports;
  hasRequiredRenderer = 1;
  (function(module) {
    const Logger = requireLogger();
    const RendererErrorHandler = requireRendererErrorHandler();
    const transportConsole = requireConsole$1();
    const transportIpc = requireIpc$1();
    if (typeof process === "object" && process.type === "browser") {
      console.warn(
        "electron-log/renderer is loaded in the main process. It could cause unexpected behaviour."
      );
    }
    module.exports = createLogger();
    module.exports.Logger = Logger;
    module.exports.default = module.exports;
    function createLogger() {
      const logger = new Logger({
        allowUnknownLevel: true,
        errorHandler: new RendererErrorHandler(),
        initializeFn: () => {
        },
        logId: "default",
        transportFactories: {
          console: transportConsole,
          ipc: transportIpc
        },
        variables: {
          processType: "renderer"
        }
      });
      logger.errorHandler.setOptions({
        logFn({ error, errorName, showDialog }) {
          logger.transports.console({
            data: [errorName, error].filter(Boolean),
            level: "error"
          });
          logger.transports.ipc({
            cmd: "errorHandler",
            error: {
              cause: error?.cause,
              code: error?.code,
              name: error?.name,
              message: error?.message,
              stack: error?.stack
            },
            errorName,
            logId: logger.logId,
            showDialog
          });
        }
      });
      if (typeof window === "object") {
        window.addEventListener("message", (event) => {
          const { cmd, logId, ...message } = event.data || {};
          const instance = Logger.getInstance({ logId });
          if (cmd === "message") {
            instance.processMessage(message, { transports: ["console"] });
          }
        });
      }
      return new Proxy(logger, {
        get(target, prop) {
          if (typeof target[prop] !== "undefined") {
            return target[prop];
          }
          return (...data) => logger.logData(data, { level: prop });
        }
      });
    }
  })(renderer);
  return renderer.exports;
}
var packageJson;
var hasRequiredPackageJson;
function requirePackageJson() {
  if (hasRequiredPackageJson) return packageJson;
  hasRequiredPackageJson = 1;
  const fs2 = require$$0__default;
  const path2 = require$$1;
  packageJson = {
    findAndReadPackageJson,
    tryReadJsonAt
  };
  function findAndReadPackageJson() {
    return tryReadJsonAt(getMainModulePath()) || tryReadJsonAt(extractPathFromArgs()) || tryReadJsonAt(process.resourcesPath, "app.asar") || tryReadJsonAt(process.resourcesPath, "app") || tryReadJsonAt(process.cwd()) || { name: void 0, version: void 0 };
  }
  function tryReadJsonAt(...searchPaths) {
    if (!searchPaths[0]) {
      return void 0;
    }
    try {
      const searchPath = path2.join(...searchPaths);
      const fileName = findUp("package.json", searchPath);
      if (!fileName) {
        return void 0;
      }
      const json2 = JSON.parse(fs2.readFileSync(fileName, "utf8"));
      const name = json2?.productName || json2?.name;
      if (!name || name.toLowerCase() === "electron") {
        return void 0;
      }
      if (name) {
        return { name, version: json2?.version };
      }
      return void 0;
    } catch (e) {
      return void 0;
    }
  }
  function findUp(fileName, cwd) {
    let currentPath = cwd;
    while (true) {
      const parsedPath = path2.parse(currentPath);
      const root = parsedPath.root;
      const dir = parsedPath.dir;
      if (fs2.existsSync(path2.join(currentPath, fileName))) {
        return path2.resolve(path2.join(currentPath, fileName));
      }
      if (currentPath === root) {
        return null;
      }
      currentPath = dir;
    }
  }
  function extractPathFromArgs() {
    const matchedArgs = process.argv.filter((arg) => {
      return arg.indexOf("--user-data-dir=") === 0;
    });
    if (matchedArgs.length === 0 || typeof matchedArgs[0] !== "string") {
      return null;
    }
    const userDataDir = matchedArgs[0];
    return userDataDir.replace("--user-data-dir=", "");
  }
  function getMainModulePath() {
    try {
      return require.main?.filename;
    } catch {
      return void 0;
    }
  }
  return packageJson;
}
var NodeExternalApi_1;
var hasRequiredNodeExternalApi;
function requireNodeExternalApi() {
  if (hasRequiredNodeExternalApi) return NodeExternalApi_1;
  hasRequiredNodeExternalApi = 1;
  const childProcess = require$$0$3;
  const os2 = require$$1$1;
  const path2 = require$$1;
  const packageJson2 = requirePackageJson();
  class NodeExternalApi {
    appName = void 0;
    appPackageJson = void 0;
    platform = process.platform;
    getAppLogPath(appName = this.getAppName()) {
      if (this.platform === "darwin") {
        return path2.join(this.getSystemPathHome(), "Library/Logs", appName);
      }
      return path2.join(this.getAppUserDataPath(appName), "logs");
    }
    getAppName() {
      const appName = this.appName || this.getAppPackageJson()?.name;
      if (!appName) {
        throw new Error(
          "electron-log can't determine the app name. It tried these methods:\n1. Use `electron.app.name`\n2. Use productName or name from the nearest package.json`\nYou can also set it through log.transports.file.setAppName()"
        );
      }
      return appName;
    }
    /**
     * @private
     * @returns {undefined}
     */
    getAppPackageJson() {
      if (typeof this.appPackageJson !== "object") {
        this.appPackageJson = packageJson2.findAndReadPackageJson();
      }
      return this.appPackageJson;
    }
    getAppUserDataPath(appName = this.getAppName()) {
      return appName ? path2.join(this.getSystemPathAppData(), appName) : void 0;
    }
    getAppVersion() {
      return this.getAppPackageJson()?.version;
    }
    getElectronLogPath() {
      return this.getAppLogPath();
    }
    getMacOsVersion() {
      const release = Number(os2.release().split(".")[0]);
      if (release <= 19) {
        return `10.${release - 4}`;
      }
      return release - 9;
    }
    /**
     * @protected
     * @returns {string}
     */
    getOsVersion() {
      let osName = os2.type().replace("_", " ");
      let osVersion = os2.release();
      if (osName === "Darwin") {
        osName = "macOS";
        osVersion = this.getMacOsVersion();
      }
      return `${osName} ${osVersion}`;
    }
    /**
     * @return {PathVariables}
     */
    getPathVariables() {
      const appName = this.getAppName();
      const appVersion = this.getAppVersion();
      const self2 = this;
      return {
        appData: this.getSystemPathAppData(),
        appName,
        appVersion,
        get electronDefaultDir() {
          return self2.getElectronLogPath();
        },
        home: this.getSystemPathHome(),
        libraryDefaultDir: this.getAppLogPath(appName),
        libraryTemplate: this.getAppLogPath("{appName}"),
        temp: this.getSystemPathTemp(),
        userData: this.getAppUserDataPath(appName)
      };
    }
    getSystemPathAppData() {
      const home = this.getSystemPathHome();
      switch (this.platform) {
        case "darwin": {
          return path2.join(home, "Library/Application Support");
        }
        case "win32": {
          return process.env.APPDATA || path2.join(home, "AppData/Roaming");
        }
        default: {
          return process.env.XDG_CONFIG_HOME || path2.join(home, ".config");
        }
      }
    }
    getSystemPathHome() {
      return os2.homedir?.() || process.env.HOME;
    }
    getSystemPathTemp() {
      return os2.tmpdir();
    }
    getVersions() {
      return {
        app: `${this.getAppName()} ${this.getAppVersion()}`,
        electron: void 0,
        os: this.getOsVersion()
      };
    }
    isDev() {
      return process.env.NODE_ENV === "development" || process.env.ELECTRON_IS_DEV === "1";
    }
    isElectron() {
      return Boolean(process.versions.electron);
    }
    onAppEvent(_eventName, _handler) {
    }
    onAppReady(handler) {
      handler();
    }
    onEveryWebContentsEvent(eventName, handler) {
    }
    /**
     * Listen to async messages sent from opposite process
     * @param {string} channel
     * @param {function} listener
     */
    onIpc(channel, listener) {
    }
    onIpcInvoke(channel, listener) {
    }
    /**
     * @param {string} url
     * @param {Function} [logFunction]
     */
    openUrl(url, logFunction = console.error) {
      const startMap = { darwin: "open", win32: "start", linux: "xdg-open" };
      const start = startMap[process.platform] || "xdg-open";
      childProcess.exec(`${start} ${url}`, {}, (err) => {
        if (err) {
          logFunction(err);
        }
      });
    }
    setAppName(appName) {
      this.appName = appName;
    }
    setPlatform(platform) {
      this.platform = platform;
    }
    setPreloadFileForSessions({
      filePath,
      // eslint-disable-line no-unused-vars
      includeFutureSession = true,
      // eslint-disable-line no-unused-vars
      getSessions = () => []
      // eslint-disable-line no-unused-vars
    }) {
    }
    /**
     * Sent a message to opposite process
     * @param {string} channel
     * @param {any} message
     */
    sendIpc(channel, message) {
    }
    showErrorBox(title, message) {
    }
  }
  NodeExternalApi_1 = NodeExternalApi;
  return NodeExternalApi_1;
}
var ElectronExternalApi_1;
var hasRequiredElectronExternalApi;
function requireElectronExternalApi() {
  if (hasRequiredElectronExternalApi) return ElectronExternalApi_1;
  hasRequiredElectronExternalApi = 1;
  const path2 = require$$1;
  const NodeExternalApi = requireNodeExternalApi();
  class ElectronExternalApi extends NodeExternalApi {
    /**
     * @type {typeof Electron}
     */
    electron = void 0;
    /**
     * @param {object} options
     * @param {typeof Electron} [options.electron]
     */
    constructor({ electron } = {}) {
      super();
      this.electron = electron;
    }
    getAppName() {
      let appName;
      try {
        appName = this.appName || this.electron.app?.name || this.electron.app?.getName();
      } catch {
      }
      return appName || super.getAppName();
    }
    getAppUserDataPath(appName) {
      return this.getPath("userData") || super.getAppUserDataPath(appName);
    }
    getAppVersion() {
      let appVersion;
      try {
        appVersion = this.electron.app?.getVersion();
      } catch {
      }
      return appVersion || super.getAppVersion();
    }
    getElectronLogPath() {
      return this.getPath("logs") || super.getElectronLogPath();
    }
    /**
     * @private
     * @param {any} name
     * @returns {string|undefined}
     */
    getPath(name) {
      try {
        return this.electron.app?.getPath(name);
      } catch {
        return void 0;
      }
    }
    getVersions() {
      return {
        app: `${this.getAppName()} ${this.getAppVersion()}`,
        electron: `Electron ${process.versions.electron}`,
        os: this.getOsVersion()
      };
    }
    getSystemPathAppData() {
      return this.getPath("appData") || super.getSystemPathAppData();
    }
    isDev() {
      if (this.electron.app?.isPackaged !== void 0) {
        return !this.electron.app.isPackaged;
      }
      if (typeof process.execPath === "string") {
        const execFileName = path2.basename(process.execPath).toLowerCase();
        return execFileName.startsWith("electron");
      }
      return super.isDev();
    }
    onAppEvent(eventName, handler) {
      this.electron.app?.on(eventName, handler);
      return () => {
        this.electron.app?.off(eventName, handler);
      };
    }
    onAppReady(handler) {
      if (this.electron.app?.isReady()) {
        handler();
      } else if (this.electron.app?.once) {
        this.electron.app?.once("ready", handler);
      } else {
        handler();
      }
    }
    onEveryWebContentsEvent(eventName, handler) {
      this.electron.webContents?.getAllWebContents()?.forEach((webContents) => {
        webContents.on(eventName, handler);
      });
      this.electron.app?.on("web-contents-created", onWebContentsCreated);
      return () => {
        this.electron.webContents?.getAllWebContents().forEach((webContents) => {
          webContents.off(eventName, handler);
        });
        this.electron.app?.off("web-contents-created", onWebContentsCreated);
      };
      function onWebContentsCreated(_, webContents) {
        webContents.on(eventName, handler);
      }
    }
    /**
     * Listen to async messages sent from opposite process
     * @param {string} channel
     * @param {function} listener
     */
    onIpc(channel, listener) {
      this.electron.ipcMain?.on(channel, listener);
    }
    onIpcInvoke(channel, listener) {
      this.electron.ipcMain?.handle?.(channel, listener);
    }
    /**
     * @param {string} url
     * @param {Function} [logFunction]
     */
    openUrl(url, logFunction = console.error) {
      this.electron.shell?.openExternal(url).catch(logFunction);
    }
    setPreloadFileForSessions({
      filePath,
      includeFutureSession = true,
      getSessions = () => [this.electron.session?.defaultSession]
    }) {
      for (const session of getSessions().filter(Boolean)) {
        setPreload(session);
      }
      if (includeFutureSession) {
        this.onAppEvent("session-created", (session) => {
          setPreload(session);
        });
      }
      function setPreload(session) {
        if (typeof session.registerPreloadScript === "function") {
          session.registerPreloadScript({
            filePath,
            id: "electron-log-preload",
            type: "frame"
          });
        } else {
          session.setPreloads([...session.getPreloads(), filePath]);
        }
      }
    }
    /**
     * Sent a message to opposite process
     * @param {string} channel
     * @param {any} message
     */
    sendIpc(channel, message) {
      this.electron.BrowserWindow?.getAllWindows()?.forEach((wnd) => {
        if (wnd.webContents?.isDestroyed() === false && wnd.webContents?.isCrashed() === false) {
          wnd.webContents.send(channel, message);
        }
      });
    }
    showErrorBox(title, message) {
      this.electron.dialog?.showErrorBox(title, message);
    }
  }
  ElectronExternalApi_1 = ElectronExternalApi;
  return ElectronExternalApi_1;
}
var initialize;
var hasRequiredInitialize;
function requireInitialize() {
  if (hasRequiredInitialize) return initialize;
  hasRequiredInitialize = 1;
  const fs2 = require$$0__default;
  const os2 = require$$1$1;
  const path2 = require$$1;
  const preloadInitializeFn = requireElectronLogPreload();
  let preloadInitialized = false;
  let spyConsoleInitialized = false;
  initialize = {
    initialize({
      externalApi,
      getSessions,
      includeFutureSession,
      logger,
      preload = true,
      spyRendererConsole = false
    }) {
      externalApi.onAppReady(() => {
        try {
          if (preload) {
            initializePreload({
              externalApi,
              getSessions,
              includeFutureSession,
              logger,
              preloadOption: preload
            });
          }
          if (spyRendererConsole) {
            initializeSpyRendererConsole({ externalApi, logger });
          }
        } catch (err) {
          logger.warn(err);
        }
      });
    }
  };
  function initializePreload({
    externalApi,
    getSessions,
    includeFutureSession,
    logger,
    preloadOption
  }) {
    let preloadPath = typeof preloadOption === "string" ? preloadOption : void 0;
    if (preloadInitialized) {
      logger.warn(new Error("log.initialize({ preload }) already called").stack);
      return;
    }
    preloadInitialized = true;
    try {
      preloadPath = path2.resolve(
        __dirname,
        "../renderer/electron-log-preload.js"
      );
    } catch {
    }
    if (!preloadPath || !fs2.existsSync(preloadPath)) {
      preloadPath = path2.join(
        externalApi.getAppUserDataPath() || os2.tmpdir(),
        "electron-log-preload.js"
      );
      const preloadCode = `
      try {
        (${preloadInitializeFn.toString()})(require('electron'));
      } catch(e) {
        console.error(e);
      }
    `;
      fs2.writeFileSync(preloadPath, preloadCode, "utf8");
    }
    externalApi.setPreloadFileForSessions({
      filePath: preloadPath,
      includeFutureSession,
      getSessions
    });
  }
  function initializeSpyRendererConsole({ externalApi, logger }) {
    if (spyConsoleInitialized) {
      logger.warn(
        new Error("log.initialize({ spyRendererConsole }) already called").stack
      );
      return;
    }
    spyConsoleInitialized = true;
    const levels = ["debug", "info", "warn", "error"];
    externalApi.onEveryWebContentsEvent(
      "console-message",
      (event, level, message) => {
        logger.processMessage({
          data: [message],
          level: levels[level],
          variables: { processType: "renderer" }
        });
      }
    );
  }
  return initialize;
}
var ErrorHandler_1;
var hasRequiredErrorHandler;
function requireErrorHandler() {
  if (hasRequiredErrorHandler) return ErrorHandler_1;
  hasRequiredErrorHandler = 1;
  class ErrorHandler {
    externalApi = void 0;
    isActive = false;
    logFn = void 0;
    onError = void 0;
    showDialog = true;
    constructor({
      externalApi,
      logFn = void 0,
      onError = void 0,
      showDialog = void 0
    } = {}) {
      this.createIssue = this.createIssue.bind(this);
      this.handleError = this.handleError.bind(this);
      this.handleRejection = this.handleRejection.bind(this);
      this.setOptions({ externalApi, logFn, onError, showDialog });
      this.startCatching = this.startCatching.bind(this);
      this.stopCatching = this.stopCatching.bind(this);
    }
    handle(error, {
      logFn = this.logFn,
      onError = this.onError,
      processType = "browser",
      showDialog = this.showDialog,
      errorName = ""
    } = {}) {
      error = normalizeError(error);
      try {
        if (typeof onError === "function") {
          const versions = this.externalApi?.getVersions() || {};
          const createIssue = this.createIssue;
          const result = onError({
            createIssue,
            error,
            errorName,
            processType,
            versions
          });
          if (result === false) {
            return;
          }
        }
        errorName ? logFn(errorName, error) : logFn(error);
        if (showDialog && !errorName.includes("rejection") && this.externalApi) {
          this.externalApi.showErrorBox(
            `A JavaScript error occurred in the ${processType} process`,
            error.stack
          );
        }
      } catch {
        console.error(error);
      }
    }
    setOptions({ externalApi, logFn, onError, showDialog }) {
      if (typeof externalApi === "object") {
        this.externalApi = externalApi;
      }
      if (typeof logFn === "function") {
        this.logFn = logFn;
      }
      if (typeof onError === "function") {
        this.onError = onError;
      }
      if (typeof showDialog === "boolean") {
        this.showDialog = showDialog;
      }
    }
    startCatching({ onError, showDialog } = {}) {
      if (this.isActive) {
        return;
      }
      this.isActive = true;
      this.setOptions({ onError, showDialog });
      process.on("uncaughtException", this.handleError);
      process.on("unhandledRejection", this.handleRejection);
    }
    stopCatching() {
      this.isActive = false;
      process.removeListener("uncaughtException", this.handleError);
      process.removeListener("unhandledRejection", this.handleRejection);
    }
    createIssue(pageUrl, queryParams) {
      this.externalApi?.openUrl(
        `${pageUrl}?${new URLSearchParams(queryParams).toString()}`
      );
    }
    handleError(error) {
      this.handle(error, { errorName: "Unhandled" });
    }
    handleRejection(reason) {
      const error = reason instanceof Error ? reason : new Error(JSON.stringify(reason));
      this.handle(error, { errorName: "Unhandled rejection" });
    }
  }
  function normalizeError(e) {
    if (e instanceof Error) {
      return e;
    }
    if (e && typeof e === "object") {
      if (e.message) {
        return Object.assign(new Error(e.message), e);
      }
      try {
        return new Error(JSON.stringify(e));
      } catch (serErr) {
        return new Error(`Couldn't normalize error ${String(e)}: ${serErr}`);
      }
    }
    return new Error(`Can't normalize error ${String(e)}`);
  }
  ErrorHandler_1 = ErrorHandler;
  return ErrorHandler_1;
}
var EventLogger_1;
var hasRequiredEventLogger;
function requireEventLogger() {
  if (hasRequiredEventLogger) return EventLogger_1;
  hasRequiredEventLogger = 1;
  class EventLogger {
    disposers = [];
    format = "{eventSource}#{eventName}:";
    formatters = {
      app: {
        "certificate-error": ({ args }) => {
          return this.arrayToObject(args.slice(1, 4), [
            "url",
            "error",
            "certificate"
          ]);
        },
        "child-process-gone": ({ args }) => {
          return args.length === 1 ? args[0] : args;
        },
        "render-process-gone": ({ args: [webContents, details] }) => {
          return details && typeof details === "object" ? { ...details, ...this.getWebContentsDetails(webContents) } : [];
        }
      },
      webContents: {
        "console-message": ({ args: [level, message, line, sourceId] }) => {
          if (level < 3) {
            return void 0;
          }
          return { message, source: `${sourceId}:${line}` };
        },
        "did-fail-load": ({ args }) => {
          return this.arrayToObject(args, [
            "errorCode",
            "errorDescription",
            "validatedURL",
            "isMainFrame",
            "frameProcessId",
            "frameRoutingId"
          ]);
        },
        "did-fail-provisional-load": ({ args }) => {
          return this.arrayToObject(args, [
            "errorCode",
            "errorDescription",
            "validatedURL",
            "isMainFrame",
            "frameProcessId",
            "frameRoutingId"
          ]);
        },
        "plugin-crashed": ({ args }) => {
          return this.arrayToObject(args, ["name", "version"]);
        },
        "preload-error": ({ args }) => {
          return this.arrayToObject(args, ["preloadPath", "error"]);
        }
      }
    };
    events = {
      app: {
        "certificate-error": true,
        "child-process-gone": true,
        "render-process-gone": true
      },
      webContents: {
        // 'console-message': true,
        "did-fail-load": true,
        "did-fail-provisional-load": true,
        "plugin-crashed": true,
        "preload-error": true,
        "unresponsive": true
      }
    };
    externalApi = void 0;
    level = "error";
    scope = "";
    constructor(options = {}) {
      this.setOptions(options);
    }
    setOptions({
      events,
      externalApi,
      level,
      logger,
      format: format2,
      formatters,
      scope: scope2
    }) {
      if (typeof events === "object") {
        this.events = events;
      }
      if (typeof externalApi === "object") {
        this.externalApi = externalApi;
      }
      if (typeof level === "string") {
        this.level = level;
      }
      if (typeof logger === "object") {
        this.logger = logger;
      }
      if (typeof format2 === "string" || typeof format2 === "function") {
        this.format = format2;
      }
      if (typeof formatters === "object") {
        this.formatters = formatters;
      }
      if (typeof scope2 === "string") {
        this.scope = scope2;
      }
    }
    startLogging(options = {}) {
      this.setOptions(options);
      this.disposeListeners();
      for (const eventName of this.getEventNames(this.events.app)) {
        this.disposers.push(
          this.externalApi.onAppEvent(eventName, (...handlerArgs) => {
            this.handleEvent({ eventSource: "app", eventName, handlerArgs });
          })
        );
      }
      for (const eventName of this.getEventNames(this.events.webContents)) {
        this.disposers.push(
          this.externalApi.onEveryWebContentsEvent(
            eventName,
            (...handlerArgs) => {
              this.handleEvent(
                { eventSource: "webContents", eventName, handlerArgs }
              );
            }
          )
        );
      }
    }
    stopLogging() {
      this.disposeListeners();
    }
    arrayToObject(array, fieldNames) {
      const obj = {};
      fieldNames.forEach((fieldName, index) => {
        obj[fieldName] = array[index];
      });
      if (array.length > fieldNames.length) {
        obj.unknownArgs = array.slice(fieldNames.length);
      }
      return obj;
    }
    disposeListeners() {
      this.disposers.forEach((disposer) => disposer());
      this.disposers = [];
    }
    formatEventLog({ eventName, eventSource, handlerArgs }) {
      const [event, ...args] = handlerArgs;
      if (typeof this.format === "function") {
        return this.format({ args, event, eventName, eventSource });
      }
      const formatter = this.formatters[eventSource]?.[eventName];
      let formattedArgs = args;
      if (typeof formatter === "function") {
        formattedArgs = formatter({ args, event, eventName, eventSource });
      }
      if (!formattedArgs) {
        return void 0;
      }
      const eventData = {};
      if (Array.isArray(formattedArgs)) {
        eventData.args = formattedArgs;
      } else if (typeof formattedArgs === "object") {
        Object.assign(eventData, formattedArgs);
      }
      if (eventSource === "webContents") {
        Object.assign(eventData, this.getWebContentsDetails(event?.sender));
      }
      const title = this.format.replace("{eventSource}", eventSource === "app" ? "App" : "WebContents").replace("{eventName}", eventName);
      return [title, eventData];
    }
    getEventNames(eventMap) {
      if (!eventMap || typeof eventMap !== "object") {
        return [];
      }
      return Object.entries(eventMap).filter(([_, listen]) => listen).map(([eventName]) => eventName);
    }
    getWebContentsDetails(webContents) {
      if (!webContents?.loadURL) {
        return {};
      }
      try {
        return {
          webContents: {
            id: webContents.id,
            url: webContents.getURL()
          }
        };
      } catch {
        return {};
      }
    }
    handleEvent({ eventName, eventSource, handlerArgs }) {
      const log2 = this.formatEventLog({ eventName, eventSource, handlerArgs });
      if (log2) {
        const logFns = this.scope ? this.logger.scope(this.scope) : this.logger;
        logFns?.[this.level]?.(...log2);
      }
    }
  }
  EventLogger_1 = EventLogger;
  return EventLogger_1;
}
var format;
var hasRequiredFormat;
function requireFormat() {
  if (hasRequiredFormat) return format;
  hasRequiredFormat = 1;
  const { transform } = requireTransform();
  format = {
    concatFirstStringElements,
    formatScope,
    formatText,
    formatVariables,
    timeZoneFromOffset,
    format({ message, logger, transport, data = message?.data }) {
      switch (typeof transport.format) {
        case "string": {
          return transform({
            message,
            logger,
            transforms: [formatVariables, formatScope, formatText],
            transport,
            initialData: [transport.format, ...data]
          });
        }
        case "function": {
          return transport.format({
            data,
            level: message?.level || "info",
            logger,
            message,
            transport
          });
        }
        default: {
          return data;
        }
      }
    }
  };
  function concatFirstStringElements({ data }) {
    if (typeof data[0] !== "string" || typeof data[1] !== "string") {
      return data;
    }
    if (data[0].match(/%[1cdfiOos]/)) {
      return data;
    }
    return [`${data[0]} ${data[1]}`, ...data.slice(2)];
  }
  function timeZoneFromOffset(minutesOffset) {
    const minutesPositive = Math.abs(minutesOffset);
    const sign = minutesOffset > 0 ? "-" : "+";
    const hours = Math.floor(minutesPositive / 60).toString().padStart(2, "0");
    const minutes = (minutesPositive % 60).toString().padStart(2, "0");
    return `${sign}${hours}:${minutes}`;
  }
  function formatScope({ data, logger, message }) {
    const { defaultLabel, labelLength } = logger?.scope || {};
    const template = data[0];
    let label = message.scope;
    if (!label) {
      label = defaultLabel;
    }
    let scopeText;
    if (label === "") {
      scopeText = labelLength > 0 ? "".padEnd(labelLength + 3) : "";
    } else if (typeof label === "string") {
      scopeText = ` (${label})`.padEnd(labelLength + 3);
    } else {
      scopeText = "";
    }
    data[0] = template.replace("{scope}", scopeText);
    return data;
  }
  function formatVariables({ data, message }) {
    let template = data[0];
    if (typeof template !== "string") {
      return data;
    }
    template = template.replace("{level}]", `${message.level}]`.padEnd(6, " "));
    const date = message.date || /* @__PURE__ */ new Date();
    data[0] = template.replace(/\{(\w+)}/g, (substring, name) => {
      switch (name) {
        case "level":
          return message.level || "info";
        case "logId":
          return message.logId;
        case "y":
          return date.getFullYear().toString(10);
        case "m":
          return (date.getMonth() + 1).toString(10).padStart(2, "0");
        case "d":
          return date.getDate().toString(10).padStart(2, "0");
        case "h":
          return date.getHours().toString(10).padStart(2, "0");
        case "i":
          return date.getMinutes().toString(10).padStart(2, "0");
        case "s":
          return date.getSeconds().toString(10).padStart(2, "0");
        case "ms":
          return date.getMilliseconds().toString(10).padStart(3, "0");
        case "z":
          return timeZoneFromOffset(date.getTimezoneOffset());
        case "iso":
          return date.toISOString();
        default: {
          return message.variables?.[name] || substring;
        }
      }
    }).trim();
    return data;
  }
  function formatText({ data }) {
    const template = data[0];
    if (typeof template !== "string") {
      return data;
    }
    const textTplPosition = template.lastIndexOf("{text}");
    if (textTplPosition === template.length - 6) {
      data[0] = template.replace(/\s?{text}/, "");
      if (data[0] === "") {
        data.shift();
      }
      return data;
    }
    const templatePieces = template.split("{text}");
    let result = [];
    if (templatePieces[0] !== "") {
      result.push(templatePieces[0]);
    }
    result = result.concat(data.slice(1));
    if (templatePieces[1] !== "") {
      result.push(templatePieces[1]);
    }
    return result;
  }
  return format;
}
var object = { exports: {} };
var hasRequiredObject;
function requireObject() {
  if (hasRequiredObject) return object.exports;
  hasRequiredObject = 1;
  (function(module) {
    const util = require$$4;
    module.exports = {
      serialize,
      maxDepth({ data, transport, depth = transport?.depth ?? 6 }) {
        if (!data) {
          return data;
        }
        if (depth < 1) {
          if (Array.isArray(data)) return "[array]";
          if (typeof data === "object" && data) return "[object]";
          return data;
        }
        if (Array.isArray(data)) {
          return data.map((child) => module.exports.maxDepth({
            data: child,
            depth: depth - 1
          }));
        }
        if (typeof data !== "object") {
          return data;
        }
        if (data && typeof data.toISOString === "function") {
          return data;
        }
        if (data === null) {
          return null;
        }
        if (data instanceof Error) {
          return data;
        }
        const newJson = {};
        for (const i in data) {
          if (!Object.prototype.hasOwnProperty.call(data, i)) continue;
          newJson[i] = module.exports.maxDepth({
            data: data[i],
            depth: depth - 1
          });
        }
        return newJson;
      },
      toJSON({ data }) {
        return JSON.parse(JSON.stringify(data, createSerializer()));
      },
      toString({ data, transport }) {
        const inspectOptions = transport?.inspectOptions || {};
        const simplifiedData = data.map((item) => {
          if (item === void 0) {
            return void 0;
          }
          try {
            const str = JSON.stringify(item, createSerializer(), "  ");
            return str === void 0 ? void 0 : JSON.parse(str);
          } catch (e) {
            return item;
          }
        });
        return util.formatWithOptions(inspectOptions, ...simplifiedData);
      }
    };
    function createSerializer(options = {}) {
      const seen = /* @__PURE__ */ new WeakSet();
      return function(key, value) {
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) {
            return void 0;
          }
          seen.add(value);
        }
        return serialize(key, value, options);
      };
    }
    function serialize(key, value, options = {}) {
      const serializeMapAndSet = options?.serializeMapAndSet !== false;
      if (value instanceof Error) {
        return value.stack;
      }
      if (!value) {
        return value;
      }
      if (typeof value === "function") {
        return `[function] ${value.toString()}`;
      }
      if (value instanceof Date) {
        return value.toISOString();
      }
      if (serializeMapAndSet && value instanceof Map && Object.fromEntries) {
        return Object.fromEntries(value);
      }
      if (serializeMapAndSet && value instanceof Set && Array.from) {
        return Array.from(value);
      }
      return value;
    }
  })(object);
  return object.exports;
}
var style;
var hasRequiredStyle;
function requireStyle() {
  if (hasRequiredStyle) return style;
  hasRequiredStyle = 1;
  style = {
    transformStyles,
    applyAnsiStyles({ data }) {
      return transformStyles(data, styleToAnsi, resetAnsiStyle);
    },
    removeStyles({ data }) {
      return transformStyles(data, () => "");
    }
  };
  const ANSI_COLORS = {
    unset: "\x1B[0m",
    black: "\x1B[30m",
    red: "\x1B[31m",
    green: "\x1B[32m",
    yellow: "\x1B[33m",
    blue: "\x1B[34m",
    magenta: "\x1B[35m",
    cyan: "\x1B[36m",
    white: "\x1B[37m",
    gray: "\x1B[90m"
  };
  function styleToAnsi(style2) {
    const color = style2.replace(/color:\s*(\w+).*/, "$1").toLowerCase();
    return ANSI_COLORS[color] || "";
  }
  function resetAnsiStyle(string) {
    return string + ANSI_COLORS.unset;
  }
  function transformStyles(data, onStyleFound, onStyleApplied) {
    const foundStyles = {};
    return data.reduce((result, item, index, array) => {
      if (foundStyles[index]) {
        return result;
      }
      if (typeof item === "string") {
        let valueIndex = index;
        let styleApplied = false;
        item = item.replace(/%[1cdfiOos]/g, (match) => {
          valueIndex += 1;
          if (match !== "%c") {
            return match;
          }
          const style2 = array[valueIndex];
          if (typeof style2 === "string") {
            foundStyles[valueIndex] = true;
            styleApplied = true;
            return onStyleFound(style2, item);
          }
          return match;
        });
        if (styleApplied && onStyleApplied) {
          item = onStyleApplied(item);
        }
      }
      result.push(item);
      return result;
    }, []);
  }
  return style;
}
var console_1;
var hasRequiredConsole;
function requireConsole() {
  if (hasRequiredConsole) return console_1;
  hasRequiredConsole = 1;
  const {
    concatFirstStringElements,
    format: format2
  } = requireFormat();
  const { maxDepth, toJSON } = requireObject();
  const {
    applyAnsiStyles,
    removeStyles
  } = requireStyle();
  const { transform } = requireTransform();
  const consoleMethods = {
    error: console.error,
    warn: console.warn,
    info: console.info,
    verbose: console.info,
    debug: console.debug,
    silly: console.debug,
    log: console.log
  };
  console_1 = consoleTransportFactory;
  const separator = process.platform === "win32" ? ">" : "›";
  const DEFAULT_FORMAT = `%c{h}:{i}:{s}.{ms}{scope}%c ${separator} {text}`;
  Object.assign(consoleTransportFactory, {
    DEFAULT_FORMAT
  });
  function consoleTransportFactory(logger) {
    return Object.assign(transport, {
      colorMap: {
        error: "red",
        warn: "yellow",
        info: "cyan",
        verbose: "unset",
        debug: "gray",
        silly: "gray",
        default: "unset"
      },
      format: DEFAULT_FORMAT,
      level: "silly",
      transforms: [
        addTemplateColors,
        format2,
        formatStyles,
        concatFirstStringElements,
        maxDepth,
        toJSON
      ],
      useStyles: process.env.FORCE_STYLES,
      writeFn({ message }) {
        const consoleLogFn = consoleMethods[message.level] || consoleMethods.info;
        consoleLogFn(...message.data);
      }
    });
    function transport(message) {
      const data = transform({ logger, message, transport });
      transport.writeFn({
        message: { ...message, data }
      });
    }
  }
  function addTemplateColors({ data, message, transport }) {
    if (typeof transport.format !== "string" || !transport.format.includes("%c")) {
      return data;
    }
    return [
      `color:${levelToStyle(message.level, transport)}`,
      "color:unset",
      ...data
    ];
  }
  function canUseStyles(useStyleValue, level) {
    if (typeof useStyleValue === "boolean") {
      return useStyleValue;
    }
    const useStderr = level === "error" || level === "warn";
    const stream = useStderr ? process.stderr : process.stdout;
    return stream && stream.isTTY;
  }
  function formatStyles(args) {
    const { message, transport } = args;
    const useStyles = canUseStyles(transport.useStyles, message.level);
    const nextTransform = useStyles ? applyAnsiStyles : removeStyles;
    return nextTransform(args);
  }
  function levelToStyle(level, transport) {
    return transport.colorMap[level] || transport.colorMap.default;
  }
  return console_1;
}
var File_1;
var hasRequiredFile$1;
function requireFile$1() {
  if (hasRequiredFile$1) return File_1;
  hasRequiredFile$1 = 1;
  const EventEmitter = require$$0$4;
  const fs2 = require$$0__default;
  const os2 = require$$1$1;
  class File extends EventEmitter {
    asyncWriteQueue = [];
    bytesWritten = 0;
    hasActiveAsyncWriting = false;
    path = null;
    initialSize = void 0;
    writeOptions = null;
    writeAsync = false;
    constructor({
      path: path2,
      writeOptions = { encoding: "utf8", flag: "a", mode: 438 },
      writeAsync = false
    }) {
      super();
      this.path = path2;
      this.writeOptions = writeOptions;
      this.writeAsync = writeAsync;
    }
    get size() {
      return this.getSize();
    }
    clear() {
      try {
        fs2.writeFileSync(this.path, "", {
          mode: this.writeOptions.mode,
          flag: "w"
        });
        this.reset();
        return true;
      } catch (e) {
        if (e.code === "ENOENT") {
          return true;
        }
        this.emit("error", e, this);
        return false;
      }
    }
    crop(bytesAfter) {
      try {
        const content = readFileSyncFromEnd(this.path, bytesAfter || 4096);
        this.clear();
        this.writeLine(`[log cropped]${os2.EOL}${content}`);
      } catch (e) {
        this.emit(
          "error",
          new Error(`Couldn't crop file ${this.path}. ${e.message}`),
          this
        );
      }
    }
    getSize() {
      if (this.initialSize === void 0) {
        try {
          const stats = fs2.statSync(this.path);
          this.initialSize = stats.size;
        } catch (e) {
          this.initialSize = 0;
        }
      }
      return this.initialSize + this.bytesWritten;
    }
    increaseBytesWrittenCounter(text) {
      this.bytesWritten += Buffer.byteLength(text, this.writeOptions.encoding);
    }
    isNull() {
      return false;
    }
    nextAsyncWrite() {
      const file2 = this;
      if (this.hasActiveAsyncWriting || this.asyncWriteQueue.length === 0) {
        return;
      }
      const text = this.asyncWriteQueue.join("");
      this.asyncWriteQueue = [];
      this.hasActiveAsyncWriting = true;
      fs2.writeFile(this.path, text, this.writeOptions, (e) => {
        file2.hasActiveAsyncWriting = false;
        if (e) {
          file2.emit(
            "error",
            new Error(`Couldn't write to ${file2.path}. ${e.message}`),
            this
          );
        } else {
          file2.increaseBytesWrittenCounter(text);
        }
        file2.nextAsyncWrite();
      });
    }
    reset() {
      this.initialSize = void 0;
      this.bytesWritten = 0;
    }
    toString() {
      return this.path;
    }
    writeLine(text) {
      text += os2.EOL;
      if (this.writeAsync) {
        this.asyncWriteQueue.push(text);
        this.nextAsyncWrite();
        return;
      }
      try {
        fs2.writeFileSync(this.path, text, this.writeOptions);
        this.increaseBytesWrittenCounter(text);
      } catch (e) {
        this.emit(
          "error",
          new Error(`Couldn't write to ${this.path}. ${e.message}`),
          this
        );
      }
    }
  }
  File_1 = File;
  function readFileSyncFromEnd(filePath, bytesCount) {
    const buffer = Buffer.alloc(bytesCount);
    const stats = fs2.statSync(filePath);
    const readLength = Math.min(stats.size, bytesCount);
    const offset = Math.max(0, stats.size - bytesCount);
    const fd = fs2.openSync(filePath, "r");
    const totalBytes = fs2.readSync(fd, buffer, 0, readLength, offset);
    fs2.closeSync(fd);
    return buffer.toString("utf8", 0, totalBytes);
  }
  return File_1;
}
var NullFile_1;
var hasRequiredNullFile;
function requireNullFile() {
  if (hasRequiredNullFile) return NullFile_1;
  hasRequiredNullFile = 1;
  const File = requireFile$1();
  class NullFile extends File {
    clear() {
    }
    crop() {
    }
    getSize() {
      return 0;
    }
    isNull() {
      return true;
    }
    writeLine() {
    }
  }
  NullFile_1 = NullFile;
  return NullFile_1;
}
var FileRegistry_1;
var hasRequiredFileRegistry;
function requireFileRegistry() {
  if (hasRequiredFileRegistry) return FileRegistry_1;
  hasRequiredFileRegistry = 1;
  const EventEmitter = require$$0$4;
  const fs2 = require$$0__default;
  const path2 = require$$1;
  const File = requireFile$1();
  const NullFile = requireNullFile();
  class FileRegistry extends EventEmitter {
    store = {};
    constructor() {
      super();
      this.emitError = this.emitError.bind(this);
    }
    /**
     * Provide a File object corresponding to the filePath
     * @param {string} filePath
     * @param {WriteOptions} [writeOptions]
     * @param {boolean} [writeAsync]
     * @return {File}
     */
    provide({ filePath, writeOptions = {}, writeAsync = false }) {
      let file2;
      try {
        filePath = path2.resolve(filePath);
        if (this.store[filePath]) {
          return this.store[filePath];
        }
        file2 = this.createFile({ filePath, writeOptions, writeAsync });
      } catch (e) {
        file2 = new NullFile({ path: filePath });
        this.emitError(e, file2);
      }
      file2.on("error", this.emitError);
      this.store[filePath] = file2;
      return file2;
    }
    /**
     * @param {string} filePath
     * @param {WriteOptions} writeOptions
     * @param {boolean} async
     * @return {File}
     * @private
     */
    createFile({ filePath, writeOptions, writeAsync }) {
      this.testFileWriting({ filePath, writeOptions });
      return new File({ path: filePath, writeOptions, writeAsync });
    }
    /**
     * @param {Error} error
     * @param {File} file
     * @private
     */
    emitError(error, file2) {
      this.emit("error", error, file2);
    }
    /**
     * @param {string} filePath
     * @param {WriteOptions} writeOptions
     * @private
     */
    testFileWriting({ filePath, writeOptions }) {
      fs2.mkdirSync(path2.dirname(filePath), { recursive: true });
      fs2.writeFileSync(filePath, "", { flag: "a", mode: writeOptions.mode });
    }
  }
  FileRegistry_1 = FileRegistry;
  return FileRegistry_1;
}
var file;
var hasRequiredFile;
function requireFile() {
  if (hasRequiredFile) return file;
  hasRequiredFile = 1;
  const fs2 = require$$0__default;
  const os2 = require$$1$1;
  const path2 = require$$1;
  const FileRegistry = requireFileRegistry();
  const { transform } = requireTransform();
  const { removeStyles } = requireStyle();
  const {
    format: format2,
    concatFirstStringElements
  } = requireFormat();
  const { toString } = requireObject();
  file = fileTransportFactory;
  const globalRegistry = new FileRegistry();
  function fileTransportFactory(logger, { registry = globalRegistry, externalApi } = {}) {
    let pathVariables;
    if (registry.listenerCount("error") < 1) {
      registry.on("error", (e, file2) => {
        logConsole(`Can't write to ${file2}`, e);
      });
    }
    return Object.assign(transport, {
      fileName: getDefaultFileName(logger.variables.processType),
      format: "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}",
      getFile,
      inspectOptions: { depth: 5 },
      level: "silly",
      maxSize: 1024 ** 2,
      readAllLogs,
      sync: true,
      transforms: [removeStyles, format2, concatFirstStringElements, toString],
      writeOptions: { flag: "a", mode: 438, encoding: "utf8" },
      archiveLogFn(file2) {
        const oldPath = file2.toString();
        const inf = path2.parse(oldPath);
        try {
          fs2.renameSync(oldPath, path2.join(inf.dir, `${inf.name}.old${inf.ext}`));
        } catch (e) {
          logConsole("Could not rotate log", e);
          const quarterOfMaxSize = Math.round(transport.maxSize / 4);
          file2.crop(Math.min(quarterOfMaxSize, 256 * 1024));
        }
      },
      resolvePathFn(vars) {
        return path2.join(vars.libraryDefaultDir, vars.fileName);
      },
      setAppName(name) {
        logger.dependencies.externalApi.setAppName(name);
      }
    });
    function transport(message) {
      const file2 = getFile(message);
      const needLogRotation = transport.maxSize > 0 && file2.size > transport.maxSize;
      if (needLogRotation) {
        transport.archiveLogFn(file2);
        file2.reset();
      }
      const content = transform({ logger, message, transport });
      file2.writeLine(content);
    }
    function initializeOnFirstAccess() {
      if (pathVariables) {
        return;
      }
      pathVariables = Object.create(
        Object.prototype,
        {
          ...Object.getOwnPropertyDescriptors(
            externalApi.getPathVariables()
          ),
          fileName: {
            get() {
              return transport.fileName;
            },
            enumerable: true
          }
        }
      );
      if (typeof transport.archiveLog === "function") {
        transport.archiveLogFn = transport.archiveLog;
        logConsole("archiveLog is deprecated. Use archiveLogFn instead");
      }
      if (typeof transport.resolvePath === "function") {
        transport.resolvePathFn = transport.resolvePath;
        logConsole("resolvePath is deprecated. Use resolvePathFn instead");
      }
    }
    function logConsole(message, error = null, level = "error") {
      const data = [`electron-log.transports.file: ${message}`];
      if (error) {
        data.push(error);
      }
      logger.transports.console({ data, date: /* @__PURE__ */ new Date(), level });
    }
    function getFile(msg) {
      initializeOnFirstAccess();
      const filePath = transport.resolvePathFn(pathVariables, msg);
      return registry.provide({
        filePath,
        writeAsync: !transport.sync,
        writeOptions: transport.writeOptions
      });
    }
    function readAllLogs({ fileFilter = (f) => f.endsWith(".log") } = {}) {
      initializeOnFirstAccess();
      const logsPath = path2.dirname(transport.resolvePathFn(pathVariables));
      if (!fs2.existsSync(logsPath)) {
        return [];
      }
      return fs2.readdirSync(logsPath).map((fileName) => path2.join(logsPath, fileName)).filter(fileFilter).map((logPath) => {
        try {
          return {
            path: logPath,
            lines: fs2.readFileSync(logPath, "utf8").split(os2.EOL)
          };
        } catch {
          return null;
        }
      }).filter(Boolean);
    }
  }
  function getDefaultFileName(processType = process.type) {
    switch (processType) {
      case "renderer":
        return "renderer.log";
      case "worker":
        return "worker.log";
      default:
        return "main.log";
    }
  }
  return file;
}
var ipc;
var hasRequiredIpc;
function requireIpc() {
  if (hasRequiredIpc) return ipc;
  hasRequiredIpc = 1;
  const { maxDepth, toJSON } = requireObject();
  const { transform } = requireTransform();
  ipc = ipcTransportFactory;
  function ipcTransportFactory(logger, { externalApi }) {
    Object.assign(transport, {
      depth: 3,
      eventId: "__ELECTRON_LOG_IPC__",
      level: logger.isDev ? "silly" : false,
      transforms: [toJSON, maxDepth]
    });
    return externalApi?.isElectron() ? transport : void 0;
    function transport(message) {
      if (message?.variables?.processType === "renderer") {
        return;
      }
      externalApi?.sendIpc(transport.eventId, {
        ...message,
        data: transform({ logger, message, transport })
      });
    }
  }
  return ipc;
}
var remote;
var hasRequiredRemote;
function requireRemote() {
  if (hasRequiredRemote) return remote;
  hasRequiredRemote = 1;
  const http2 = require$$0$5;
  const https2 = require$$1$2;
  const { transform } = requireTransform();
  const { removeStyles } = requireStyle();
  const { toJSON, maxDepth } = requireObject();
  remote = remoteTransportFactory;
  function remoteTransportFactory(logger) {
    return Object.assign(transport, {
      client: { name: "electron-application" },
      depth: 6,
      level: false,
      requestOptions: {},
      transforms: [removeStyles, toJSON, maxDepth],
      makeBodyFn({ message }) {
        return JSON.stringify({
          client: transport.client,
          data: message.data,
          date: message.date.getTime(),
          level: message.level,
          scope: message.scope,
          variables: message.variables
        });
      },
      processErrorFn({ error }) {
        logger.processMessage(
          {
            data: [`electron-log: can't POST ${transport.url}`, error],
            level: "warn"
          },
          { transports: ["console", "file"] }
        );
      },
      sendRequestFn({ serverUrl, requestOptions, body }) {
        const httpTransport = serverUrl.startsWith("https:") ? https2 : http2;
        const request = httpTransport.request(serverUrl, {
          method: "POST",
          ...requestOptions,
          headers: {
            "Content-Type": "application/json",
            "Content-Length": body.length,
            ...requestOptions.headers
          }
        });
        request.write(body);
        request.end();
        return request;
      }
    });
    function transport(message) {
      if (!transport.url) {
        return;
      }
      const body = transport.makeBodyFn({
        logger,
        message: { ...message, data: transform({ logger, message, transport }) },
        transport
      });
      const request = transport.sendRequestFn({
        serverUrl: transport.url,
        requestOptions: transport.requestOptions,
        body: Buffer.from(body, "utf8")
      });
      request.on("error", (error) => transport.processErrorFn({
        error,
        logger,
        message,
        request,
        transport
      }));
    }
  }
  return remote;
}
var createDefaultLogger_1;
var hasRequiredCreateDefaultLogger;
function requireCreateDefaultLogger() {
  if (hasRequiredCreateDefaultLogger) return createDefaultLogger_1;
  hasRequiredCreateDefaultLogger = 1;
  const Logger = requireLogger();
  const ErrorHandler = requireErrorHandler();
  const EventLogger = requireEventLogger();
  const transportConsole = requireConsole();
  const transportFile = requireFile();
  const transportIpc = requireIpc();
  const transportRemote = requireRemote();
  createDefaultLogger_1 = createDefaultLogger;
  function createDefaultLogger({ dependencies, initializeFn }) {
    const defaultLogger = new Logger({
      dependencies,
      errorHandler: new ErrorHandler(),
      eventLogger: new EventLogger(),
      initializeFn,
      isDev: dependencies.externalApi?.isDev(),
      logId: "default",
      transportFactories: {
        console: transportConsole,
        file: transportFile,
        ipc: transportIpc,
        remote: transportRemote
      },
      variables: {
        processType: "main"
      }
    });
    defaultLogger.default = defaultLogger;
    defaultLogger.Logger = Logger;
    defaultLogger.processInternalErrorFn = (e) => {
      defaultLogger.transports.console.writeFn({
        message: {
          data: ["Unhandled electron-log error", e],
          level: "error"
        }
      });
    };
    return defaultLogger;
  }
  return createDefaultLogger_1;
}
var main;
var hasRequiredMain;
function requireMain() {
  if (hasRequiredMain) return main;
  hasRequiredMain = 1;
  const electron = require$$0$6;
  const ElectronExternalApi = requireElectronExternalApi();
  const { initialize: initialize2 } = requireInitialize();
  const createDefaultLogger = requireCreateDefaultLogger();
  const externalApi = new ElectronExternalApi({ electron });
  const defaultLogger = createDefaultLogger({
    dependencies: { externalApi },
    initializeFn: initialize2
  });
  main = defaultLogger;
  externalApi.onIpc("__ELECTRON_LOG__", (_, message) => {
    if (message.scope) {
      defaultLogger.Logger.getInstance(message).scope(message.scope);
    }
    const date = new Date(message.date);
    processMessage({
      ...message,
      date: date.getTime() ? date : /* @__PURE__ */ new Date()
    });
  });
  externalApi.onIpcInvoke("__ELECTRON_LOG__", (_, { cmd = "", logId }) => {
    switch (cmd) {
      case "getOptions": {
        const logger = defaultLogger.Logger.getInstance({ logId });
        return {
          levels: logger.levels,
          logId
        };
      }
      default: {
        processMessage({ data: [`Unknown cmd '${cmd}'`], level: "error" });
        return {};
      }
    }
  });
  function processMessage(message) {
    defaultLogger.Logger.getInstance(message)?.processMessage(message);
  }
  return main;
}
var node;
var hasRequiredNode;
function requireNode() {
  if (hasRequiredNode) return node;
  hasRequiredNode = 1;
  const NodeExternalApi = requireNodeExternalApi();
  const createDefaultLogger = requireCreateDefaultLogger();
  const externalApi = new NodeExternalApi();
  const defaultLogger = createDefaultLogger({
    dependencies: { externalApi }
  });
  node = defaultLogger;
  return node;
}
var hasRequiredSrc;
function requireSrc() {
  if (hasRequiredSrc) return src.exports;
  hasRequiredSrc = 1;
  const isRenderer = typeof process === "undefined" || (process.type === "renderer" || process.type === "worker");
  const isMain = typeof process === "object" && process.type === "browser";
  if (isRenderer) {
    requireElectronLogPreload();
    src.exports = requireRenderer();
  } else if (isMain) {
    src.exports = requireMain();
  } else {
    src.exports = requireNode();
  }
  return src.exports;
}
var srcExports = requireSrc();
const log = /* @__PURE__ */ getDefaultExportFromCjs(srcExports);
const require$2 = createRequire(import.meta.url);
const pdf$1 = require$2("pdf-parse");
class RAGEngine {
  constructor() {
    this.index = /* @__PURE__ */ new Map();
    this.isIndexing = false;
    this.docsPath = path.join(process.env.APP_ROOT || "", "docs");
  }
  static getInstance() {
    if (!RAGEngine.instance) {
      RAGEngine.instance = new RAGEngine();
    }
    return RAGEngine.instance;
  }
  /**
   * Scan the docs folder and update the index
   */
  async updateIndex() {
    if (this.isIndexing) return;
    this.isIndexing = true;
    console.log("[RAG Engine] Starting background indexing...");
    try {
      if (!await fs.pathExists(this.docsPath)) {
        await fs.ensureDir(this.docsPath);
        this.isIndexing = false;
        return;
      }
      const files = await this.getAllFiles(this.docsPath);
      let updatedCount = 0;
      for (const filePath of files) {
        const stats = await fs.stat(filePath);
        const mtime = stats.mtimeMs;
        const relativePath = path.relative(this.docsPath, filePath);
        const existing = this.index.get(relativePath);
        if (!existing || existing.mtime !== mtime) {
          const content = await this.readFileContent(filePath);
          if (content) {
            this.index.set(relativePath, {
              mtime,
              content,
              path: relativePath
            });
            updatedCount++;
          }
        }
      }
      if (updatedCount > 0) {
        console.log(`[RAG Engine] Index updated: ${updatedCount} files reloaded. Total: ${this.index.size}`);
      }
    } catch (error) {
      console.error("[RAG Engine] Indexing error:", error);
    } finally {
      this.isIndexing = false;
    }
  }
  /**
   * Search relevant content for a given system and campaign
   */
  async getRelevantContext(systemId, campaignName) {
    if (this.index.size === 0) await this.updateIndex();
    const sys = systemId.toLowerCase();
    const camp = campaignName.toLowerCase();
    const results = [];
    for (const [relPath, file2] of this.index.entries()) {
      const lowerPath = relPath.toLowerCase();
      const isSystemFile = lowerPath.includes(`systems/${sys}`) || lowerPath.includes(`systems\\${sys}`);
      const isCampaignFile = lowerPath.includes(`campaigns/${camp}`) || lowerPath.includes(`campaigns\\${camp}`);
      const isMatchedByName = lowerPath.includes(sys) || lowerPath.includes(camp);
      if (isSystemFile || isCampaignFile || isMatchedByName) {
        const header = `[Source: ${relPath}]
`;
        results.push(header + file2.content);
      }
    }
    return results.join("\n\n---\n\n");
  }
  async getAllFiles(dir) {
    const results = [];
    const list = await fs.readdir(dir);
    for (const file2 of list) {
      const filePath = path.join(dir, file2);
      const stat2 = await fs.stat(filePath);
      if (stat2 && stat2.isDirectory()) {
        results.push(...await this.getAllFiles(filePath));
      } else {
        const ext = path.extname(file2).toLowerCase();
        if ([".md", ".txt", ".pdf"].includes(ext)) {
          results.push(filePath);
        }
      }
    }
    return results;
  }
  async readFileContent(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const MAX_SIZE = 5e4;
    try {
      if (ext === ".md" || ext === ".txt") {
        const text = await fs.readFile(filePath, "utf-8");
        return text.length > MAX_SIZE ? text.substring(0, MAX_SIZE) + "... [Tronqué]" : text;
      } else if (ext === ".pdf") {
        const dataBuffer = await fs.readFile(filePath);
        if (typeof pdf$1 === "function") {
          const data = await pdf$1(dataBuffer);
          return data.text || "";
        }
      }
    } catch (err) {
      console.error(`[RAG Engine] Error reading ${filePath}:`, err);
    }
    return null;
  }
}
function registerRagHandlers() {
  const engine = RAGEngine.getInstance();
  ipcMain.handle("ai:search-context", async (_event, systemId, campaignName) => {
    return await engine.getRelevantContext(systemId, campaignName);
  });
  ipcMain.handle("ai:reindex", async () => {
    await engine.updateIndex();
    return true;
  });
  setInterval(() => engine.updateIndex(), 1e3 * 60 * 5);
  setTimeout(() => engine.updateIndex(), 5e3);
}
const DEBUG_LOG_PATH = "C:\\Users\\david\\mcp_bridge_debug.log";
function logToDebugFile(msg) {
  try {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    require$$0.appendFileSync(DEBUG_LOG_PATH, `[${timestamp}] ${msg}
`);
  } catch (err) {
    console.error("Failed to write to debug log:", err);
  }
}
try {
  if (process.type === "browser") {
    require$$0.writeFileSync(DEBUG_LOG_PATH, "--- MCP Bridge Started ---\n");
  }
} catch (err) {
  console.error("Failed to initialize debug log:", err);
}
let mcpProcess = null;
let requestId = 1;
const pendingRequests = /* @__PURE__ */ new Map();
let stdoutBuffer = "";
let serverSpawnPromise = null;
let initializationPromise = null;
let isInitialized = false;
async function ensureHandshake() {
  if (isInitialized) return;
  if (initializationPromise) {
    logToDebugFile("Waiting for existing initialization to complete...");
    return initializationPromise;
  }
  initializationPromise = (async () => {
    try {
      logToDebugFile("Performing initialize handshake...");
      await callMcp("initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {
          sampling: {},
          roots: { listChanged: false }
        },
        clientInfo: { name: "gm-os", version: "1.0.0" }
      });
      logToDebugFile("Sending notifications/initialized...");
      const serverProcess = await ensureMcpServer();
      const notify = JSON.stringify({
        jsonrpc: "2.0",
        method: "notifications/initialized"
      }) + "\n";
      serverProcess.stdin?.write(notify);
      logToDebugFile("Handshake: Waiting 200ms for server state to stabilize...");
      await new Promise((resolve) => setTimeout(resolve, 200));
      isInitialized = true;
      logToDebugFile("Handshake SUCCESS");
    } catch (error) {
      logToDebugFile(`Handshake FAILED: ${error}`);
      console.error("[MCP Bridge] Handshake failed:", error);
      initializationPromise = null;
      throw error;
    }
  })();
  return initializationPromise;
}
async function ensureMcpServer() {
  if (mcpProcess && mcpProcess.connected) return mcpProcess;
  if (serverSpawnPromise) return serverSpawnPromise;
  serverSpawnPromise = (async () => {
    isInitialized = false;
    initializationPromise = null;
    logToDebugFile("Spawning NotebookLM MCP Server with --debug flag...");
    const proc = spawn("python", ["-m", "notebooklm_mcp.server", "--debug"], {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, PYTHONUNBUFFERED: "1" }
    });
    proc.stdout?.on("data", (data) => {
      stdoutBuffer += data.toString();
      let boundary = stdoutBuffer.indexOf("\n");
      while (boundary !== -1) {
        const line = stdoutBuffer.substring(0, boundary).trim();
        stdoutBuffer = stdoutBuffer.substring(boundary + 1);
        if (line) {
          logToDebugFile(`<<< RECV: ${line}`);
          try {
            const response = JSON.parse(line);
            if (response.id !== void 0) {
              const pending = pendingRequests.get(response.id);
              if (pending) {
                clearTimeout(pending.timeout);
                if (response.error) {
                  const errorDetails = JSON.stringify(response.error);
                  logToDebugFile(`!!! ERROR for ID ${response.id}: ${errorDetails}`);
                  pending.reject(new Error(`${response.error.message || "Unknown error"} (Data: ${errorDetails})`));
                } else {
                  pending.resolve(response.result);
                }
                pendingRequests.delete(response.id);
              }
            } else if (response.method === "notifications/message") {
              logToDebugFile(`[Server Notification] ${response.params?.message}`);
            }
          } catch {
            logToDebugFile(`[Raw Output] ${line}`);
          }
        }
        boundary = stdoutBuffer.indexOf("\n");
      }
    });
    proc.stderr?.on("data", (data) => {
      const msg = data.toString().trim();
      if (msg) {
        logToDebugFile(`stderr: ${msg}`);
        if (msg.toLowerCase().includes("error")) {
          console.error(`[MCP Server] ${msg}`);
        }
      }
    });
    proc.on("exit", (code, signal) => {
      logToDebugFile(`Server exited (code: ${code}, signal: ${signal})`);
      isInitialized = false;
      mcpProcess = null;
      serverSpawnPromise = null;
      pendingRequests.forEach((p) => p.reject(new Error(`MCP Server exited with code ${code}`)));
      pendingRequests.clear();
    });
    mcpProcess = proc;
    return proc;
  })();
  return serverSpawnPromise;
}
async function callMcp(method, params) {
  const process2 = await ensureMcpServer();
  if (method !== "initialize" && !isInitialized) {
    await ensureHandshake();
  }
  const id = requestId++;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      const timeoutMsg = `MCP Request ${id} (${method}) timed out after 60s`;
      console.error(`[MCP Bridge] ${timeoutMsg}`);
      pendingRequests.delete(id);
      reject(new Error(timeoutMsg));
    }, 6e4);
    pendingRequests.set(id, { resolve, reject, method, timeout });
    const request = JSON.stringify({
      jsonrpc: "2.0",
      id,
      method,
      params
    }) + "\n";
    logToDebugFile(`>>> SEND: ${request.trim()}`);
    process2.stdin?.write(request);
  });
}
function registerMcpHandlers() {
  console.log("[MCP Bridge] Registering IPC Handlers");
  ipcMain.handle("mcp:list-tools", async () => {
    try {
      console.log("[MCP Bridge] Requesting tool list...");
      const result = await callMcp("tools/list", {});
      return result.tools || [];
    } catch (error) {
      console.error("[MCP Bridge] tools/list failed:", error);
      throw error;
    }
  });
  ipcMain.handle("mcp:call-tool", async (_event, _serverName, toolName, args) => {
    try {
      console.log(`[MCP Bridge] Calling tool: ${toolName}`);
      const cleanArgs = JSON.parse(JSON.stringify(args));
      const result = await callMcp("tools/call", {
        name: toolName,
        arguments: cleanArgs
      });
      if (result && result.content && Array.isArray(result.content)) {
        const textContent = result.content.filter((c) => c.type === "text").map((c) => c.text).join("\n");
        if (textContent.trim().startsWith("{")) {
          let parsed = null;
          try {
            parsed = JSON.parse(textContent);
            if (parsed.status === "success" && typeof parsed.answer === "string") {
              return { content: parsed.answer || "L'Oracle n'a pas trouvé de réponse précise pour ce notebook." };
            }
            if (parsed.status === "error") {
              throw new Error(parsed.error || "Erreur inconnue provenant de l'Oracle.");
            }
          } catch (e) {
            const err = e;
            if (err.message && err.message.includes("provenant de l'Oracle") || parsed?.status === "error") {
              console.error("[MCP Bridge] Oracle Error intercepted:", err);
              throw err;
            }
          }
        }
        return { content: textContent };
      }
      return result;
    } catch (error) {
      console.error(`[MCP Bridge] tools/call ${toolName} failed:`, error);
      throw error;
    }
  });
  ipcMain.handle("mcp:reauthenticate", async () => {
    logToDebugFile(`[Auth] Triggering re-authentication CLI...`);
    try {
      const pythonPath = process.env.PYTHON_PATH || "python";
      const authProcess = spawn(pythonPath, ["-m", "notebooklm_mcp.auth_cli"], {
        shell: true,
        detached: true,
        stdio: "ignore"
      });
      authProcess.unref();
      logToDebugFile(`[Auth] Auth CLI process spawned.`);
      return { success: true, message: "Authentification lancée." };
    } catch (error) {
      logToDebugFile(`[Auth] Error: ${error}`);
      throw error;
    }
  });
  ipcMain.handle("mcp:restart", async () => {
    logToDebugFile(`[System] Restarting MCP Server...`);
    if (mcpProcess) {
      mcpProcess.kill();
      mcpProcess = null;
    }
    serverSpawnPromise = null;
    isInitialized = false;
    initializationPromise = null;
    return { success: true, message: "Serveur MCP redémarré avec succès." };
  });
}
const DEFAULT_VAULT_PATH = "C:\\Users\\david\\OneDrive\\Obsidian Vault";
function registerObsidianHandlers() {
  console.log("[Obsidian Bridge] Registering IPC Handlers");
  ipcMain.handle("obsidian:list-notes", async (_event, vaultPath) => {
    const rootPath = vaultPath || DEFAULT_VAULT_PATH;
    if (!await fs.pathExists(rootPath)) {
      console.error(`[Obsidian Bridge] Vault path not found: ${rootPath}`);
      return [];
    }
    async function getNotes(dir) {
      const items = await fs.readdir(dir, { withFileTypes: true });
      const result = await Promise.all(items.map(async (item) => {
        const fullPath = path.join(dir, item.name);
        const relativePath = path.relative(rootPath, fullPath);
        if (item.name.startsWith(".")) return null;
        if (item.isDirectory()) {
          const children = await getNotes(fullPath);
          if (children.length === 0) return null;
          return {
            name: item.name,
            path: relativePath,
            type: "directory",
            children
          };
        }
        if (item.name.toLowerCase().endsWith(".md")) {
          return {
            name: item.name,
            path: relativePath,
            type: "file"
          };
        }
        return null;
      }));
      return result.filter((r) => r !== null);
    }
    try {
      return await getNotes(rootPath);
    } catch (error) {
      console.error("[Obsidian Bridge] Error listing notes:", error);
      return [];
    }
  });
  ipcMain.handle("obsidian:read-note", async (_event, relativePath, vaultPath) => {
    const rootPath = vaultPath || DEFAULT_VAULT_PATH;
    const fullPath = path.join(rootPath, relativePath);
    if (!fullPath.startsWith(rootPath)) {
      console.error(`[Obsidian Bridge] Security Violation: Attempted to read outside vault: ${fullPath}`);
      return null;
    }
    if (!await fs.pathExists(fullPath)) {
      console.error(`[Obsidian Bridge] Note not found: ${fullPath}`);
      return null;
    }
    try {
      return await fs.readFile(fullPath, "utf-8");
    } catch (error) {
      console.error("[Obsidian Bridge] Error reading note:", error);
      return null;
    }
  });
  ipcMain.handle("obsidian:write-note", async (_event, relativePath, content, vaultPath) => {
    const rootPath = vaultPath || DEFAULT_VAULT_PATH;
    const fullPath = path.join(rootPath, relativePath);
    if (!fullPath.startsWith(rootPath)) {
      console.error(`[Obsidian Bridge] Security Violation: Attempted to write outside vault: ${fullPath}`);
      return false;
    }
    try {
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, content, "utf-8");
      return true;
    } catch (error) {
      console.error("[Obsidian Bridge] Error writing note:", error);
      return false;
    }
  });
  ipcMain.handle("obsidian:ensure-directory", async (_event, relativePath, vaultPath) => {
    const rootPath = vaultPath || DEFAULT_VAULT_PATH;
    const fullPath = path.join(rootPath, relativePath);
    if (!fullPath.startsWith(rootPath)) {
      console.error(`[Obsidian Bridge] Security Violation: Attempted to create directory outside vault: ${fullPath}`);
      return false;
    }
    try {
      await fs.ensureDir(fullPath);
      return true;
    } catch (error) {
      console.error("[Obsidian Bridge] Error creating directory:", error);
      return false;
    }
  });
}
class SessionManager {
  constructor() {
    this.sessions = /* @__PURE__ */ new Map();
    this.ghostTimeouts = /* @__PURE__ */ new Map();
    this.GHOST_DURATION = 2 * 60 * 1e3;
  }
  // 2 minutes
  registerClient(deviceId, pseudo, role) {
    if (this.ghostTimeouts.has(deviceId)) {
      clearTimeout(this.ghostTimeouts.get(deviceId));
      this.ghostTimeouts.delete(deviceId);
    }
    const existingSession = this.sessions.get(deviceId);
    const context = {
      deviceId,
      pseudo: pseudo || existingSession?.pseudo || "Anonyme",
      role,
      status: "active",
      lastSeen: Date.now()
    };
    this.sessions.set(deviceId, context);
    return context;
  }
  ghostClient(deviceId) {
    const session = this.sessions.get(deviceId);
    if (session && session.status === "active") {
      session.status = "ghost";
      session.lastSeen = Date.now();
      const timeout = setTimeout(() => {
        this.disconnectClient(deviceId);
      }, this.GHOST_DURATION);
      this.ghostTimeouts.set(deviceId, timeout);
    }
  }
  disconnectClient(deviceId) {
    this.sessions.delete(deviceId);
    if (this.ghostTimeouts.has(deviceId)) {
      clearTimeout(this.ghostTimeouts.get(deviceId));
      this.ghostTimeouts.delete(deviceId);
    }
  }
  getAllClients() {
    return Array.from(this.sessions.values());
  }
  getClient(deviceId) {
    return this.sessions.get(deviceId);
  }
  updateClientStatus(deviceId, status) {
    const session = this.sessions.get(deviceId);
    if (session) {
      session.status = status;
      session.lastSeen = Date.now();
    }
  }
}
const sessionManager = new SessionManager();
class OllamaService {
  constructor() {
    this.baseUrl = "http://localhost:11434";
  }
  /**
   * Vérifie si le serveur Ollama est accessible
   */
  async checkStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch (error) {
      console.error("[Ollama] Erreur de vérification du statut:", error);
      return false;
    }
  }
  /**
   * Envoie une requête de chat au modèle local
   */
  async chat(model, messages) {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        body: JSON.stringify({
          model,
          messages,
          stream: false
          // On désactive le stream pour simplifier l'intégration initiale
        }),
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) {
        throw new Error(`Ollama error: ${response.statusText}`);
      }
      const data = await response.json();
      return data.message.content;
    } catch (error) {
      console.error("[Ollama] Erreur de chat:", error);
      throw error;
    }
  }
  /**
   * Liste les modèles installés localement
   */
  async listModels() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.models?.map((m) => m.name) || [];
    } catch (error) {
      console.error("[Ollama] Erreur de listing des modèles:", error);
      return [];
    }
  }
  /**
   * Télécharge un modèle depuis la bibliothèque Ollama
   */
  async pullModel(name) {
    try {
      console.log(`[Ollama] Pulling model: ${name}`);
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: "POST",
        body: JSON.stringify({ name, stream: false }),
        headers: { "Content-Type": "application/json" }
      });
      return response.ok;
    } catch (error) {
      console.error(`[Ollama] Erreur lors du pull de ${name}:`, error);
      return false;
    }
  }
  /**
   * Génère une image via l'API Ollama (modèles expérimentaux type Flux)
   * Retourne généralement du texte en Base64 ou formaté en Markdown
   */
  async generateImage(model, prompt) {
    try {
      console.log(`[Ollama] Generating image with: ${model}`);
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        body: JSON.stringify({
          model,
          prompt,
          stream: false
        }),
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) {
        throw new Error(`Ollama image generator error: ${response.statusText}`);
      }
      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error("[Ollama] Erreur de génération d'image:", error);
      throw error;
    }
  }
}
const require$1 = createRequire(import.meta.url);
const pdf = require$1("pdf-parse");
const { WebSocketServer } = require$1("ws");
log.transports.file.level = "info";
log.transports.console.level = "debug";
log.initialize();
console.log("[Main] Logger initialized at:", log.transports.file.getFile().path);
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.join(__dirname$1, "..");
process.env.APP_ROOT = APP_ROOT;
const crashLogPath = path.join(APP_ROOT, "crash.log");
const logError = (error, type) => {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const stack = error instanceof Error ? error.stack : JSON.stringify(error, null, 2);
  const errorMessage = error instanceof Error ? error.message : String(error);
  const logEntry = `[${timestamp}] [${type}] ${errorMessage}
Stack: ${stack}
${"=".repeat(50)}
`;
  try {
    fs.appendFileSync(crashLogPath, logEntry);
    console.error(`[Main] ${type} logged to crash.log`);
  } catch (e) {
    console.error("[Main] Failed to write to crash.log:", e);
  }
};
process.on("uncaughtException", (err) => logError(err, "Uncaught Exception"));
process.on("unhandledRejection", (reason) => logError(reason, "Unhandled Rejection"));
registerRagHandlers();
registerMcpHandlers();
registerObsidianHandlers();
protocol.registerSchemesAsPrivileged([
  { scheme: "gmos", privileges: { standard: true, secure: true, supportFetchAPI: true, bypassCSP: true, stream: true } }
]);
app.commandLine.appendSwitch("ignore-certificate-errors");
const ollamaService = new OllamaService();
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = __dirname$1;
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
let wss = null;
const REMOTE_PORT = 3001;
const TEMP_MEDIA_DIR = path.join(app.getPath("userData"), "temp-media");
function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: "#000000",
    icon: path.join(process.env.VITE_PUBLIC || "", "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs"),
      sandbox: false,
      // SECURITY NOTE: webSecurity is currently false to allow legacy file:// access.
      // Switch to TRUE once you've verified that all media loads via gmos:// protocol.
      webSecurity: true
    }
  });
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  win.webContents.openDevTools({ mode: "detach" });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
const SESSIONS_DIR = path.join(process.env.APP_ROOT || "", "sessions");
ipcMain.handle("save-session", async (_event, data) => {
  await fs.ensureDir(SESSIONS_DIR);
  const { filePath } = await dialog.showSaveDialog({
    title: "Sauvegarder la Session GM-OS",
    defaultPath: path.join(SESSIONS_DIR, "gmos-session.json"),
    filters: [{ name: "GM-OS Session", extensions: ["json"] }]
  });
  if (filePath) {
    await fs.writeJson(filePath, data, { spaces: 2 });
    return true;
  }
  return false;
});
ipcMain.handle("load-session", async () => {
  await fs.ensureDir(SESSIONS_DIR);
  const { filePaths } = await dialog.showOpenDialog({
    title: "Charger une Session GM-OS",
    defaultPath: SESSIONS_DIR,
    filters: [{ name: "GM-OS Session", extensions: ["json"] }],
    properties: ["openFile"]
  });
  if (filePaths && filePaths.length > 0) {
    return await fs.readJson(filePaths[0]);
  }
  return null;
});
ipcMain.handle("npc:list-databases", async (_event, category) => {
  const appRoot = process.env.APP_ROOT || "";
  const dbPath = path.join(appRoot, "databases", category);
  if (await fs.pathExists(dbPath)) {
    const files = await fs.readdir(dbPath);
    return files.filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", ""));
  }
  return [];
});
ipcMain.handle("npc:load-database", async (_event, category, name) => {
  const appRoot = process.env.APP_ROOT || "";
  const filePath = path.join(appRoot, "databases", category, `${name}.json`);
  if (await fs.pathExists(filePath)) {
    return await fs.readJson(filePath);
  }
  return null;
});
ipcMain.handle("tables:list-universes", async () => {
  const appRoot = process.env.APP_ROOT || "";
  const tablesPath = path.join(appRoot, "databases", "tables");
  if (await fs.pathExists(tablesPath)) {
    const dirs = await fs.readdir(tablesPath, { withFileTypes: true });
    return dirs.filter((d) => d.isDirectory()).map((d) => d.name);
  }
  return [];
});
ipcMain.handle("tables:list-tables", async (_event, universe) => {
  const appRoot = process.env.APP_ROOT || "";
  const dbPath = path.join(appRoot, "databases", "tables", universe);
  if (await fs.pathExists(dbPath)) {
    const files = await fs.readdir(dbPath);
    return files.filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", ""));
  }
  return [];
});
ipcMain.handle("tables:load-table", async (_event, universe, tableName) => {
  const appRoot = process.env.APP_ROOT || "";
  const filePath = path.join(appRoot, "databases", "tables", universe, `${tableName}.json`);
  if (await fs.pathExists(filePath)) {
    return await fs.readJson(filePath);
  }
  return null;
});
ipcMain.handle("clock:list-calendars", async () => {
  const appRoot = process.env.APP_ROOT || "";
  const calendarPath = path.join(appRoot, "databases", "calendars");
  if (await fs.pathExists(calendarPath)) {
    const files = await fs.readdir(calendarPath);
    return files.filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", ""));
  }
  return [];
});
ipcMain.handle("clock:load-calendar", async (_event, id) => {
  const appRoot = process.env.APP_ROOT || "";
  const filePath = path.join(appRoot, "databases", "calendars", `${id}.json`);
  if (await fs.pathExists(filePath)) {
    return await fs.readJson(filePath);
  }
  return null;
});
ipcMain.on("web:open-external", (_event, url) => {
  shell.openExternal(url);
});
ipcMain.handle("web:save-list", async (_event, data) => {
  const { filePath } = await dialog.showSaveDialog({
    title: "Exporter les marque-pages",
    defaultPath: path.join(app.getPath("documents") || "", "web-os-bookmarks.json"),
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  if (filePath) {
    await fs.writeJson(filePath, data, { spaces: 2 });
    return true;
  }
  return false;
});
ipcMain.handle("web:load-list", async () => {
  const { filePaths } = await dialog.showOpenDialog({
    title: "Importer des marque-pages",
    filters: [{ name: "JSON", extensions: ["json"] }],
    properties: ["openFile"]
  });
  if (filePaths && filePaths.length > 0) {
    return await fs.readJson(filePaths[0]);
  }
  return null;
});
ipcMain.handle("sound:load-audios", async () => {
  const { filePaths } = await dialog.showOpenDialog({
    title: "Sélectionner des effets sonores",
    filters: [{ name: "Audio", extensions: ["mp3", "wav", "ogg"] }],
    properties: ["openFile", "multiSelections"]
  });
  return filePaths;
});
ipcMain.handle("tactical:list-sounds", async () => {
  try {
    const tacticalPath = path.join(process.env.VITE_PUBLIC || "", "assets/sounds/tactical");
    if (await fs.pathExists(tacticalPath)) {
      const files = await fs.readdir(tacticalPath);
      return files.filter((f) => f.match(/\.(mp3|wav|ogg|m4a)$/i));
    }
  } catch (error) {
    console.error("[Main] Error listing tactical sounds:", error);
  }
  return [];
});
ipcMain.on("log:message", (_event, level, message, ...args) => {
  switch (level) {
    case "info":
      log.info("[Renderer]", message, ...args);
      break;
    case "warn":
      log.warn("[Renderer]", message, ...args);
      break;
    case "error":
      log.error("[Renderer]", message, ...args);
      break;
    case "debug":
      log.debug("[Renderer]", message, ...args);
      break;
    default:
      log.info("[Renderer]", message, ...args);
  }
});
ipcMain.handle("light:request", async (_event, url, method, body) => {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(url);
      const lib2 = parsedUrl.protocol === "https:" ? https : http;
      const options = {
        method,
        rejectUnauthorized: false,
        timeout: 5e3
        // 5 seconds timeout
      };
      const req = lib2.request(parsedUrl, options, (res) => {
        let data = "";
        res.on("data", (chunk) => data += chunk);
        res.on("end", () => {
          try {
            const parsed = data ? JSON.parse(data) : null;
            resolve(parsed);
          } catch {
            resolve(data);
          }
        });
      });
      req.on("error", (err) => {
        console.error(`[Light OS] Node request error for ${url}:`, err.message);
        reject(err);
      });
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Request timed out"));
      });
      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    } catch (error) {
      console.error(`[Light OS] Request setup failed for ${url}:`, error);
      reject(error);
    }
  });
});
const projectorWindows = /* @__PURE__ */ new Map();
let hubWindow = null;
ipcMain.handle("image:get-displays", () => {
  const displays = screen.getAllDisplays();
  return displays.map((d, index) => ({
    id: d.id.toString(),
    bounds: d.bounds,
    label: `Moniteur ${index + 1}`
  }));
});
ipcMain.on("image:sync-hub-data", (_event, type, imagePath) => {
  if (hubWindow && !hubWindow.isDestroyed()) {
    hubWindow.webContents.send("image:sync-hub-data", type, imagePath);
  }
  for (const [, projWin] of projectorWindows) {
    if (!projWin.isDestroyed()) {
      projWin.webContents.send("image:sync-hub-data", type, imagePath);
    }
  }
  if (wss) {
    const message = JSON.stringify({
      type: "hub-projection",
      payload: { type, data: imagePath }
    });
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(message);
      }
    });
  }
});
ipcMain.on("session:launch-hub-window", (_event, mode = "hub") => {
  console.log(`[Main] session:launch-hub-window received (mode: ${mode})`);
  if (hubWindow && !hubWindow.isDestroyed()) {
    console.log("[Main] Hub window already exists, restoring and focusing...");
    if (hubWindow.isMinimized()) hubWindow.restore();
    hubWindow.show();
    hubWindow.focus();
    return;
  }
  console.log(`[Main] Creating new ${mode} window...`);
  const displays = screen.getAllDisplays();
  const targetDisplay = displays.length > 1 ? displays[1] : displays[0];
  hubWindow = new BrowserWindow({
    x: targetDisplay.bounds.x + 50,
    y: targetDisplay.bounds.y + 50,
    width: mode === "tablet" ? 1024 : 1280,
    height: mode === "tablet" ? 768 : 720,
    frame: true,
    // Allow GM to move it around or fullscreen it manually
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs"),
      sandbox: false,
      webSecurity: true
    },
    backgroundColor: "#000000"
  });
  if (VITE_DEV_SERVER_URL) {
    hubWindow.loadURL(`${VITE_DEV_SERVER_URL}?window=${mode}`);
  } else {
    hubWindow.loadFile(path.join(RENDERER_DIST, "index.html"), { query: { window: mode } });
  }
  hubWindow.on("closed", () => {
    console.log(`[Main] ${mode} window closed`);
    hubWindow = null;
  });
});
ipcMain.on("image:launch-display", (_event, paths, target) => {
  console.log(`[Image OS] Launch Display -> Target: ${target}, Paths:`, paths);
  if (target === "hub") {
    if (hubWindow && !hubWindow.isDestroyed()) {
      hubWindow.webContents.send("image:update-display", paths);
    }
    return;
  }
  const displays = screen.getAllDisplays();
  const targetDisplay = displays.find((d) => d.id.toString() === target);
  if (!targetDisplay) {
    console.error(`[Image OS] Target display ${target} not found.`);
    return;
  }
  if (paths && paths.length === 0) {
    const projWin2 = projectorWindows.get(target);
    if (projWin2 && !projWin2.isDestroyed()) {
      projWin2.close();
    }
    projectorWindows.delete(target);
    return;
  }
  let projWin = projectorWindows.get(target);
  if (!projWin || projWin.isDestroyed()) {
    projWin = new BrowserWindow({
      x: targetDisplay.bounds.x,
      y: targetDisplay.bounds.y,
      fullscreen: true,
      // We want the projector to be fullscreen on that display
      frame: false,
      webPreferences: {
        preload: path.join(__dirname$1, "preload.mjs"),
        sandbox: false,
        webSecurity: true
      },
      backgroundColor: "#000000"
    });
    projectorWindows.set(target, projWin);
    projWin.on("closed", () => {
      projectorWindows.delete(target);
    });
    if (VITE_DEV_SERVER_URL) {
      projWin.loadURL(`${VITE_DEV_SERVER_URL}?window=projector`);
    } else {
      projWin.loadFile(path.join(RENDERER_DIST, "index.html"), { query: { window: "projector" } });
    }
    projWin.webContents.on("did-finish-load", () => {
      projWin?.webContents.send("image:update-display", paths);
    });
  } else {
    projWin.webContents.send("image:update-display", paths);
  }
});
ipcMain.on("image:close-all-displays", () => {
  console.log("[Image OS] Close All Displays");
  for (const [, projWin] of projectorWindows) {
    if (!projWin.isDestroyed()) {
      projWin.close();
    }
  }
  projectorWindows.clear();
});
function startRemoteServer() {
  try {
    const server = http.createServer((req, res) => {
      console.log(`[Remote Proxy] Request: ${req.url}`);
      if (req.url && req.url.startsWith("/media/")) {
        const encodedPath = req.url.substring(7);
        const filePath = decodeURIComponent(encodedPath);
        console.log(`[Remote Proxy] Attempting to serve: ${filePath}`);
        if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
          const ext = path.extname(filePath).toLowerCase();
          const mimeTypes = {
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".gif": "image/gif",
            ".webp": "image/webp",
            ".svg": "image/svg+xml",
            ".mp3": "audio/mpeg",
            ".wav": "audio/wav"
          };
          res.writeHead(200, {
            "Content-Type": mimeTypes[ext] || "application/octet-stream",
            "Access-Control-Allow-Origin": "*"
          });
          fs.createReadStream(filePath).pipe(res);
        } else {
          console.warn(`[Remote Proxy] File NOT FOUND: ${filePath}`);
          res.writeHead(404);
          res.end("Media not found");
        }
        return;
      }
      if (req.url && req.url.startsWith("/temp/")) {
        const fileName = req.url.substring(6);
        const filePath = path.join(TEMP_MEDIA_DIR, fileName);
        if (fs.existsSync(filePath)) {
          res.writeHead(200, {
            "Content-Type": "image/webp",
            // Default to webp or guess by extension if needed
            "Access-Control-Allow-Origin": "*"
          });
          fs.createReadStream(filePath).pipe(res);
        } else {
          res.writeHead(404);
          res.end("Temp Media not found");
        }
        return;
      }
      res.writeHead(404);
      res.end();
    });
    wss = new WebSocketServer({ server });
    console.log(`[Remote] Server + Media started on port ${REMOTE_PORT}`);
    if (wss) {
      wss.on("connection", (ws) => {
        let currentDeviceId = null;
        console.log("[Remote] New device connected");
        if (win && !win.isDestroyed()) {
          win.webContents.send("remote:request-sync");
        }
        ws.on("message", (message) => {
          try {
            const data = JSON.parse(message);
            if (data.type === "remote:register") {
              const { deviceId, pseudo, role } = data.payload;
              currentDeviceId = deviceId;
              console.log(`[Remote] Registering client: ${pseudo} (${role})`);
              sessionManager.registerClient(deviceId, pseudo, role);
              if (win && !win.isDestroyed()) {
                win.webContents.send("remote:sync-clients", sessionManager.getAllClients());
              }
            } else if (data.type === "remote:hello") {
              console.log("[Remote] Handshake received");
            } else {
              if (win && !win.isDestroyed()) {
                win.webContents.send("remote:action", data);
              }
            }
          } catch (err) {
            console.error("[Remote] Failed to parse message:", err);
          }
        });
        ws.on("close", () => {
          if (currentDeviceId) {
            console.log(`[Remote] Client went ghost: ${currentDeviceId}`);
            sessionManager.ghostClient(currentDeviceId);
            if (win && !win.isDestroyed()) {
              win.webContents.send("remote:sync-clients", sessionManager.getAllClients());
            }
          } else {
            console.log("[Remote] Anonymous device disconnected");
          }
        });
      });
    }
    server.listen(REMOTE_PORT, "0.0.0.0", () => {
      console.log(`[Remote] Server + Media proxy listening on 0.0.0.0:${REMOTE_PORT}`);
    });
  } catch (err) {
    console.error("[Remote] Failed to start server:", err);
  }
}
ipcMain.handle("remote:cache-media", async (_event, buffer, id) => {
  try {
    await fs.ensureDir(TEMP_MEDIA_DIR);
    const filePath = path.join(TEMP_MEDIA_DIR, id);
    await fs.writeFile(filePath, buffer);
    return true;
  } catch (error) {
    console.error("[Main] Error caching media:", error);
    return false;
  }
});
ipcMain.on("remote:broadcast-sync", (_event, data) => {
  if (wss) {
    const message = JSON.stringify({ type: "sync", payload: data });
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(message);
      }
    });
  }
});
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const networkInterface = interfaces[name];
    if (!networkInterface) continue;
    for (const iface of networkInterface) {
      if ((iface.family === "IPv4" || iface.family === 4) && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}
ipcMain.handle("remote:get-connection-info", () => {
  return {
    ip: getLocalIP(),
    port: REMOTE_PORT
  };
});
ipcMain.on("remote:request-client-sync", (event) => {
  event.reply("remote:sync-clients", sessionManager.getAllClients());
});
ipcMain.handle("ai:list-docs", async () => {
  const docsPath = path.join(APP_ROOT, "docs");
  if (!fs.existsSync(docsPath)) return [];
  async function getFiles(dir) {
    const items = await fs.readdir(dir, { withFileTypes: true });
    const result = await Promise.all(items.map(async (item) => {
      const fullPath = path.join(dir, item.name);
      const relativePath = path.relative(docsPath, fullPath);
      if (item.isDirectory()) {
        return {
          name: item.name,
          path: relativePath,
          type: "directory",
          children: await getFiles(fullPath)
        };
      }
      return {
        name: item.name,
        path: relativePath,
        type: "file",
        extension: path.extname(item.name).toLowerCase()
      };
    }));
    return result;
  }
  return getFiles(docsPath);
});
ipcMain.handle("ai:read-doc", async (_event, relativePath) => {
  const fullPath = path.join(APP_ROOT, "docs", relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, "utf-8");
});
ipcMain.handle("ai:ollama-status", async () => {
  return await ollamaService.checkStatus();
});
ipcMain.handle("ai:ollama-chat", async (_event, model, messages) => {
  return await ollamaService.chat(model, messages);
});
ipcMain.handle("ai:ollama-generate-image", async (_event, model, prompt) => {
  return await ollamaService.generateImage(model, prompt);
});
ipcMain.handle("ai:ollama-list-models", async () => {
  return await ollamaService.listModels();
});
ipcMain.handle("ai:ollama-pull", async (_event, model) => {
  return await ollamaService.pullModel(model);
});
ipcMain.handle("ai:extract-pdf", async (_event, relativePath) => {
  const fullPath = path.join(APP_ROOT, "docs", relativePath);
  console.log(`[AI Main] Extracting PDF: ${fullPath}`);
  if (!fs.existsSync(fullPath)) {
    console.error(`[AI Main] PDF file not found: ${fullPath}`);
    return "Fichier introuvable.";
  }
  try {
    const dataBuffer = fs.readFileSync(fullPath);
    console.log(`[AI Main] Buffer read, size: ${dataBuffer.length} bytes. Parsing...`);
    const data = await pdf(dataBuffer);
    console.log(`[AI Main] PDF parsed successfully. Text length: ${data.text?.length || 0}`);
    return data.text || "PDF vide ou illisible.";
  } catch (error) {
    console.error("[AI Main] PDF Extraction Error:", error);
    return `Erreur lors de l'extraction du PDF : ${error instanceof Error ? error.message : String(error)}`;
  }
});
ipcMain.handle("ai:proxy-request", async (_event, url, method, headers, body) => {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(url);
      const lib2 = parsedUrl.protocol === "https:" ? https : http;
      const options = {
        method,
        headers,
        rejectUnauthorized: false,
        timeout: 3e5
        // 300 seconds (5 minutes) for heavy AI analysis (PDFs, etc.)
      };
      const req = lib2.request(parsedUrl, options, (res) => {
        let data = "";
        res.on("data", (chunk) => data += chunk);
        res.on("end", () => {
          try {
            const parsed = data ? JSON.parse(data) : null;
            resolve({
              ok: res.statusCode ? res.statusCode >= 200 && res.statusCode < 300 : false,
              status: res.statusCode,
              statusText: res.statusMessage,
              data: parsed
            });
          } catch {
            resolve({
              ok: res.statusCode ? res.statusCode >= 200 && res.statusCode < 300 : false,
              status: res.statusCode,
              statusText: res.statusMessage,
              data
            });
          }
        });
      });
      req.on("error", (err) => {
        console.error(`[AI Main] Proxy request failed for ${url}:`, err.message);
        reject(err);
      });
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("AI Request timed out"));
      });
      if (body) {
        req.write(typeof body === "string" ? body : JSON.stringify(body));
      }
      req.end();
    } catch (error) {
      console.error(`[AI Main] Proxy setup failed for ${url}:`, error);
      reject(error);
    }
  });
});
ipcMain.handle("npc:select-avatar", async () => {
  const { filePaths } = await dialog.showOpenDialog({
    title: "Sélectionner un Avatar",
    filters: [{ name: "Images", extensions: ["jpg", "png", "gif", "webp", "jpeg"] }],
    properties: ["openFile"]
  });
  if (filePaths && filePaths.length > 0 && typeof filePaths[0] === "string") {
    const rawPath = filePaths[0];
    const normalized = rawPath.replace(/\\/g, "/");
    return normalized;
  }
  return null;
});
ipcMain.handle("npc:save-avatar", async (_event, buffer, fileName) => {
  try {
    const avatarsDir = path.join(process.env.APP_ROOT || "", "public", "assets", "avatars", "npc");
    await fs.ensureDir(avatarsDir);
    const filePath = path.join(avatarsDir, fileName);
    if (!filePath || typeof filePath !== "string") throw new Error("Chemin d'avatar invalide.");
    await fs.writeFile(filePath, buffer);
    const normalized = filePath.replace(/\\/g, "/");
    return `gmos://media/${normalized}`;
  } catch (error) {
    console.error("[Main] Error saving avatar:", error);
    return null;
  }
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(async () => {
  try {
    if (await fs.pathExists(TEMP_MEDIA_DIR)) {
      await fs.emptyDir(TEMP_MEDIA_DIR);
      console.log("[Main] Temp media directory cleared");
    }
  } catch (e) {
    console.warn("[Main] Could not clear temp media directory:", e);
  }
  protocol.handle("gmos", (request) => {
    console.log(`[Protocol:GMOS] Request received: ${request.url}`);
    if (!request || !request.url) {
      console.error("[Protocol:GMOS] Missing request URL");
      return new Response("URL manquante", { status: 400 });
    }
    try {
      const rawUrl = String(request.url);
      console.log(`[Protocol:GMOS] Raw URL string: "${rawUrl}"`);
      const url = rawUrl.replace(/^gmos:\/\/media\//, "");
      console.log(`[Protocol:GMOS] Decoded path part: "${url}"`);
      const decodedPath = decodeURIComponent(url);
      const appRoot = process.env.APP_ROOT || "";
      const absolutePath = path.isAbsolute(decodedPath) ? decodedPath : path.join(appRoot, decodedPath);
      console.log(`[Protocol:GMOS] Final absolute path: "${absolutePath}"`);
      return net.fetch(`file:///${absolutePath}`);
    } catch (error) {
      console.error("[Main] protocol:gmos error:", error);
      const errMsg = error instanceof Error ? error.message : String(error);
      return new Response(`Erreur interne du protocole gmos: ${errMsg}`, { status: 500 });
    }
  });
  createWindow();
  startRemoteServer();
  screen.on("display-added", () => {
    console.log("[Main] Display added");
    win?.webContents.send("app:display-changed", screen.getAllDisplays().length);
  });
  screen.on("display-removed", () => {
    console.log("[Main] Display removed");
    win?.webContents.send("app:display-changed", screen.getAllDisplays().length);
  });
  screen.on("display-metrics-changed", () => {
    console.log("[Main] Display metrics changed");
    win?.webContents.send("app:display-changed", screen.getAllDisplays().length);
  });
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
