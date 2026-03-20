import { ipcMain, app, dialog, shell, screen, BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as fs$2 from "fs";
import fs__default from "fs";
import require$$0 from "constants";
import require$$0$1 from "stream";
import require$$4 from "util";
import require$$5 from "assert";
import require$$1 from "path";
import http from "node:http";
import https from "node:https";
import { createRequire } from "node:module";
import os from "node:os";
import { spawn } from "child_process";
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
  var constants = require$$0;
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
  var Stream = require$$0$1.Stream;
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
  var fs2 = fs__default;
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
    function copyFile(src, dest, flags, cb) {
      if (typeof flags === "function") {
        cb = flags;
        flags = 0;
      }
      return go$copyFile(src, dest, flags, cb);
      function go$copyFile(src2, dest2, flags2, cb2, startTime) {
        return fs$copyFile(src2, dest2, flags2, function(err) {
          if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
            enqueue([go$copyFile, [src2, dest2, flags2, cb2], err, startTime || Date.now(), Date.now()]);
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
  function getStats(src, dest, opts) {
    const statFunc = opts.dereference ? (file2) => fs2.stat(file2, { bigint: true }) : (file2) => fs2.lstat(file2, { bigint: true });
    return Promise.all([
      statFunc(src),
      statFunc(dest).catch((err) => {
        if (err.code === "ENOENT") return null;
        throw err;
      })
    ]).then(([srcStat, destStat]) => ({ srcStat, destStat }));
  }
  function getStatsSync(src, dest, opts) {
    let destStat;
    const statFunc = opts.dereference ? (file2) => fs2.statSync(file2, { bigint: true }) : (file2) => fs2.lstatSync(file2, { bigint: true });
    const srcStat = statFunc(src);
    try {
      destStat = statFunc(dest);
    } catch (err) {
      if (err.code === "ENOENT") return { srcStat, destStat: null };
      throw err;
    }
    return { srcStat, destStat };
  }
  async function checkPaths(src, dest, funcName, opts) {
    const { srcStat, destStat } = await getStats(src, dest, opts);
    if (destStat) {
      if (areIdentical(srcStat, destStat)) {
        const srcBaseName = path2.basename(src);
        const destBaseName = path2.basename(dest);
        if (funcName === "move" && srcBaseName !== destBaseName && srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
          return { srcStat, destStat, isChangingCase: true };
        }
        throw new Error("Source and destination must not be the same.");
      }
      if (srcStat.isDirectory() && !destStat.isDirectory()) {
        throw new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`);
      }
      if (!srcStat.isDirectory() && destStat.isDirectory()) {
        throw new Error(`Cannot overwrite directory '${dest}' with non-directory '${src}'.`);
      }
    }
    if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
      throw new Error(errMsg(src, dest, funcName));
    }
    return { srcStat, destStat };
  }
  function checkPathsSync(src, dest, funcName, opts) {
    const { srcStat, destStat } = getStatsSync(src, dest, opts);
    if (destStat) {
      if (areIdentical(srcStat, destStat)) {
        const srcBaseName = path2.basename(src);
        const destBaseName = path2.basename(dest);
        if (funcName === "move" && srcBaseName !== destBaseName && srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
          return { srcStat, destStat, isChangingCase: true };
        }
        throw new Error("Source and destination must not be the same.");
      }
      if (srcStat.isDirectory() && !destStat.isDirectory()) {
        throw new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`);
      }
      if (!srcStat.isDirectory() && destStat.isDirectory()) {
        throw new Error(`Cannot overwrite directory '${dest}' with non-directory '${src}'.`);
      }
    }
    if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
      throw new Error(errMsg(src, dest, funcName));
    }
    return { srcStat, destStat };
  }
  async function checkParentPaths(src, srcStat, dest, funcName) {
    const srcParent = path2.resolve(path2.dirname(src));
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
      throw new Error(errMsg(src, dest, funcName));
    }
    return checkParentPaths(src, srcStat, destParent, funcName);
  }
  function checkParentPathsSync(src, srcStat, dest, funcName) {
    const srcParent = path2.resolve(path2.dirname(src));
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
      throw new Error(errMsg(src, dest, funcName));
    }
    return checkParentPathsSync(src, srcStat, destParent, funcName);
  }
  function areIdentical(srcStat, destStat) {
    return destStat.ino !== void 0 && destStat.dev !== void 0 && destStat.ino === srcStat.ino && destStat.dev === srcStat.dev;
  }
  function isSrcSubdir(src, dest) {
    const srcArr = path2.resolve(src).split(path2.sep).filter((i) => i);
    const destArr = path2.resolve(dest).split(path2.sep).filter((i) => i);
    return srcArr.every((cur, i) => destArr[i] === cur);
  }
  function errMsg(src, dest, funcName) {
    return `Cannot ${funcName} '${src}' to a subdirectory of itself, '${dest}'.`;
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
  async function copy2(src, dest, opts = {}) {
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
    const { srcStat, destStat } = await stat2.checkPaths(src, dest, "copy", opts);
    await stat2.checkParentPaths(src, srcStat, dest, "copy");
    const include = await runFilter(src, dest, opts);
    if (!include) return;
    const destParent = path2.dirname(dest);
    const dirExists = await pathExists(destParent);
    if (!dirExists) {
      await mkdirs2(destParent);
    }
    await getStatsAndPerformCopy(destStat, src, dest, opts);
  }
  async function runFilter(src, dest, opts) {
    if (!opts.filter) return true;
    return opts.filter(src, dest);
  }
  async function getStatsAndPerformCopy(destStat, src, dest, opts) {
    const statFn = opts.dereference ? fs2.stat : fs2.lstat;
    const srcStat = await statFn(src);
    if (srcStat.isDirectory()) return onDir(srcStat, destStat, src, dest, opts);
    if (srcStat.isFile() || srcStat.isCharacterDevice() || srcStat.isBlockDevice()) return onFile(srcStat, destStat, src, dest, opts);
    if (srcStat.isSymbolicLink()) return onLink(destStat, src, dest, opts);
    if (srcStat.isSocket()) throw new Error(`Cannot copy a socket file: ${src}`);
    if (srcStat.isFIFO()) throw new Error(`Cannot copy a FIFO pipe: ${src}`);
    throw new Error(`Unknown file: ${src}`);
  }
  async function onFile(srcStat, destStat, src, dest, opts) {
    if (!destStat) return copyFile(srcStat, src, dest, opts);
    if (opts.overwrite) {
      await fs2.unlink(dest);
      return copyFile(srcStat, src, dest, opts);
    }
    if (opts.errorOnExist) {
      throw new Error(`'${dest}' already exists`);
    }
  }
  async function copyFile(srcStat, src, dest, opts) {
    await fs2.copyFile(src, dest);
    if (opts.preserveTimestamps) {
      if (fileIsNotWritable(srcStat.mode)) {
        await makeFileWritable(dest, srcStat.mode);
      }
      const updatedSrcStat = await fs2.stat(src);
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
  async function onDir(srcStat, destStat, src, dest, opts) {
    if (!destStat) {
      await fs2.mkdir(dest);
    }
    await asyncIteratorConcurrentProcess(await fs2.opendir(src), async (item) => {
      const srcItem = path2.join(src, item.name);
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
  async function onLink(destStat, src, dest, opts) {
    let resolvedSrc = await fs2.readlink(src);
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
  function copySync(src, dest, opts) {
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
    const { srcStat, destStat } = stat2.checkPathsSync(src, dest, "copy", opts);
    stat2.checkParentPathsSync(src, srcStat, dest, "copy");
    if (opts.filter && !opts.filter(src, dest)) return;
    const destParent = path2.dirname(dest);
    if (!fs2.existsSync(destParent)) mkdirsSync(destParent);
    return getStats(destStat, src, dest, opts);
  }
  function getStats(destStat, src, dest, opts) {
    const statSync = opts.dereference ? fs2.statSync : fs2.lstatSync;
    const srcStat = statSync(src);
    if (srcStat.isDirectory()) return onDir(srcStat, destStat, src, dest, opts);
    else if (srcStat.isFile() || srcStat.isCharacterDevice() || srcStat.isBlockDevice()) return onFile(srcStat, destStat, src, dest, opts);
    else if (srcStat.isSymbolicLink()) return onLink(destStat, src, dest, opts);
    else if (srcStat.isSocket()) throw new Error(`Cannot copy a socket file: ${src}`);
    else if (srcStat.isFIFO()) throw new Error(`Cannot copy a FIFO pipe: ${src}`);
    throw new Error(`Unknown file: ${src}`);
  }
  function onFile(srcStat, destStat, src, dest, opts) {
    if (!destStat) return copyFile(srcStat, src, dest, opts);
    return mayCopyFile(srcStat, src, dest, opts);
  }
  function mayCopyFile(srcStat, src, dest, opts) {
    if (opts.overwrite) {
      fs2.unlinkSync(dest);
      return copyFile(srcStat, src, dest, opts);
    } else if (opts.errorOnExist) {
      throw new Error(`'${dest}' already exists`);
    }
  }
  function copyFile(srcStat, src, dest, opts) {
    fs2.copyFileSync(src, dest);
    if (opts.preserveTimestamps) handleTimestamps(srcStat.mode, src, dest);
    return setDestMode(dest, srcStat.mode);
  }
  function handleTimestamps(srcMode, src, dest) {
    if (fileIsNotWritable(srcMode)) makeFileWritable(dest, srcMode);
    return setDestTimestamps(src, dest);
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
  function setDestTimestamps(src, dest) {
    const updatedSrcStat = fs2.statSync(src);
    return utimesMillisSync(dest, updatedSrcStat.atime, updatedSrcStat.mtime);
  }
  function onDir(srcStat, destStat, src, dest, opts) {
    if (!destStat) return mkDirAndCopy(srcStat.mode, src, dest, opts);
    return copyDir(src, dest, opts);
  }
  function mkDirAndCopy(srcMode, src, dest, opts) {
    fs2.mkdirSync(dest);
    copyDir(src, dest, opts);
    return setDestMode(dest, srcMode);
  }
  function copyDir(src, dest, opts) {
    const dir = fs2.opendirSync(src);
    try {
      let dirent;
      while ((dirent = dir.readSync()) !== null) {
        copyDirItem(dirent.name, src, dest, opts);
      }
    } finally {
      dir.closeSync();
    }
  }
  function copyDirItem(item, src, dest, opts) {
    const srcItem = path2.join(src, item);
    const destItem = path2.join(dest, item);
    if (opts.filter && !opts.filter(srcItem, destItem)) return;
    const { destStat } = stat2.checkPathsSync(srcItem, destItem, "copy", opts);
    return getStats(destStat, srcItem, destItem, opts);
  }
  function onLink(destStat, src, dest, opts) {
    let resolvedSrc = fs2.readlinkSync(src);
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
var file;
var hasRequiredFile;
function requireFile() {
  if (hasRequiredFile) return file;
  hasRequiredFile = 1;
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
  file = {
    createFile: u(createFile),
    createFileSync
  };
  return file;
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
  const { createFile, createFileSync } = /* @__PURE__ */ requireFile();
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
    _fs = fs__default;
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
  async function move2(src, dest, opts = {}) {
    const overwrite = opts.overwrite || opts.clobber || false;
    const { srcStat, isChangingCase = false } = await stat2.checkPaths(src, dest, "move", opts);
    await stat2.checkParentPaths(src, srcStat, dest, "move");
    const destParent = path2.dirname(dest);
    const parsedParentPath = path2.parse(destParent);
    if (parsedParentPath.root !== destParent) {
      await mkdirp(destParent);
    }
    return doRename(src, dest, overwrite, isChangingCase);
  }
  async function doRename(src, dest, overwrite, isChangingCase) {
    if (!isChangingCase) {
      if (overwrite) {
        await remove(dest);
      } else if (await pathExists(dest)) {
        throw new Error("dest already exists.");
      }
    }
    try {
      await fs2.rename(src, dest);
    } catch (err) {
      if (err.code !== "EXDEV") {
        throw err;
      }
      await moveAcrossDevice(src, dest, overwrite);
    }
  }
  async function moveAcrossDevice(src, dest, overwrite) {
    const opts = {
      overwrite,
      errorOnExist: true,
      preserveTimestamps: true
    };
    await copy2(src, dest, opts);
    return remove(src);
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
  function moveSync(src, dest, opts) {
    opts = opts || {};
    const overwrite = opts.overwrite || opts.clobber || false;
    const { srcStat, isChangingCase = false } = stat2.checkPathsSync(src, dest, "move", opts);
    stat2.checkParentPathsSync(src, srcStat, dest, "move");
    if (!isParentRoot(dest)) mkdirpSync(path2.dirname(dest));
    return doRename(src, dest, overwrite, isChangingCase);
  }
  function isParentRoot(dest) {
    const parent = path2.dirname(dest);
    const parsedPath = path2.parse(parent);
    return parsedPath.root === parent;
  }
  function doRename(src, dest, overwrite, isChangingCase) {
    if (isChangingCase) return rename(src, dest, overwrite);
    if (overwrite) {
      removeSync(dest);
      return rename(src, dest, overwrite);
    }
    if (fs2.existsSync(dest)) throw new Error("dest already exists.");
    return rename(src, dest, overwrite);
  }
  function rename(src, dest, overwrite) {
    try {
      fs2.renameSync(src, dest);
    } catch (err) {
      if (err.code !== "EXDEV") throw err;
      return moveAcrossDevice(src, dest, overwrite);
    }
  }
  function moveAcrossDevice(src, dest, overwrite) {
    const opts = {
      overwrite,
      errorOnExist: true,
      preserveTimestamps: true
    };
    copySync(src, dest, opts);
    return removeSync(src);
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
    fs$2.appendFileSync(DEBUG_LOG_PATH, `[${timestamp}] ${msg}
`);
  } catch (err) {
    console.error("Failed to write to debug log:", err);
  }
}
try {
  if (process.type === "browser") {
    fs$2.writeFileSync(DEBUG_LOG_PATH, "--- MCP Bridge Started ---\n");
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
          try {
            const parsed = JSON.parse(textContent);
            if (parsed.status === "success" && typeof parsed.answer === "string") {
              return { content: parsed.answer || "L'Oracle n'a pas trouvé de réponse précise pour ce notebook." };
            }
          } catch {
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
const require$1 = createRequire(import.meta.url);
const pdf = require$1("pdf-parse");
const { WebSocketServer } = require$1("ws");
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
registerRagHandlers();
registerMcpHandlers();
registerObsidianHandlers();
app.commandLine.appendSwitch("ignore-certificate-errors");
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
let wss = null;
const REMOTE_PORT = 3001;
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC || "", "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs"),
      sandbox: false,
      webSecurity: false
      // Nécessaire pour charger les fichiers audio locaux via fetch/file://
    },
    width: 1200,
    height: 800,
    backgroundColor: "#000000"
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
ipcMain.on("debug:open-console", () => {
  if (win && !win.isDestroyed()) {
    win.webContents.openDevTools({ mode: "detach" });
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
      webSecurity: false
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
        webSecurity: false
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
            // Allow cross-origin for tablets
          });
          fs.createReadStream(filePath).pipe(res);
        } else {
          console.warn(`[Remote Proxy] File NOT FOUND or not a file: ${filePath}`);
          res.writeHead(404);
          res.end("Media not found");
        }
        return;
      }
      res.writeHead(404);
      res.end();
    });
    wss = new WebSocketServer({ server });
    console.log(`[Remote] Server + Media started on port ${REMOTE_PORT}`);
    wss.on("connection", (ws) => {
      console.log("[Remote] New device connected");
      if (win && !win.isDestroyed()) {
        win.webContents.send("remote:request-sync");
      }
      ws.on("message", (message) => {
        try {
          const data = JSON.parse(message);
          console.log("[Remote] Action received:", data);
          if (data.type === "remote:hello") {
            console.log("[Remote] Handshake received from device");
          } else {
            if (win && !win.isDestroyed()) {
              win.webContents.send("remote:action", data);
            }
          }
        } catch (err) {
          console.error("[Remote] Failed to parse message:", err);
        }
      });
      ws.on("close", () => console.log("[Remote] Device disconnected"));
    });
    server.listen(REMOTE_PORT, "0.0.0.0", () => {
      console.log(`[Remote] Server + Media proxy listening on 0.0.0.0:${REMOTE_PORT}`);
    });
  } catch (err) {
    console.error("[Remote] Failed to start server:", err);
  }
}
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
const APP_ROOT = process.env.APP_ROOT || "";
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
        timeout: 12e4
        // 120 seconds (2 minutes) for heavy AI analysis (PDFs, etc.)
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
  if (filePaths && filePaths.length > 0) {
    const rawPath = filePaths[0];
    const normalized = rawPath.replace(/\\/g, "/");
    return `file:///${encodeURI(normalized).replace(/#/g, "%23").replace(/\?/g, "%3F")}`;
  }
  return null;
});
ipcMain.handle("npc:save-avatar", async (_event, buffer, fileName) => {
  try {
    const avatarsDir = path.join(process.env.APP_ROOT || "", "public", "assets", "avatars", "npc");
    await fs.ensureDir(avatarsDir);
    const filePath = path.join(avatarsDir, fileName);
    await fs.writeFile(filePath, buffer);
    const normalized = filePath.replace(/\\/g, "/");
    return `file:///${encodeURI(normalized).replace(/#/g, "%23").replace(/\?/g, "%3F")}`;
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
app.whenReady().then(() => {
  createWindow();
  startRemoteServer();
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
