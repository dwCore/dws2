var Transform = require('readable-stream/transform')
  , inherits  = require('util').inherits
  , xtend     = require('xtend')

function ThrowawayTf(opts) {
  Transform.call(this, opts)
  this._destroyed = false
}

inherits(ThrowawayTf, Transform)

ThrowawayTf.prototype.destroy = function(err) {
  if (this._destroyed) return
  this._destroyed = true
  
  var self = this
  process.nextTick(function() {
    if (err)
      self.emit('error', err)
    self.emit('close')
  })
}

// a noop _transform function
function noop (chunk, enc, callback) {
  callback(null, chunk)
}
function dws2 (construct) {
  return function (options, transform, flush) {
    if (typeof options == 'function') {
      flush     = transform
      transform = options
      options   = {}
    }

    if (typeof transform != 'function')
      transform = noop

    if (typeof flush != 'function')
      flush = null

    return construct(options, transform, flush)
  }
}


// main export, just make me a transform stream!
module.exports = dws2(function (options, transform, flush) {
  var Dws2 = new ThrowawayTf(options)

  Dws2._transform = transform

  if (flush)
    Dws2._flush = flush

  return Dws2
})


// make me a reusable prototype that I can `new`, or implicitly `new`
// with a constructor call
module.exports.ctor = dws2(function (options, transform, flush) {
  function DWS2 (override) {
    if (!(this instanceof DWS2))
      return new DWS2(override)

    this.options = xtend(options, override)

    ThrowawayTf.call(this, this.options)
  }

  inherits(DWS2, ThrowawayTf)

  DWS2.prototype._transform = transform

  if (flush)
    DWS2.prototype._flush = flush

  return DWS2
})


module.exports.obj = dws2(function (options, transform, flush) {
  var Dws2 = new ThrowawayTf(xtend({ objectMode: true, highWaterMark: 16 }, options))

  Dws2._transform = transform

  if (flush)
    Dws2._flush = flush

  return Dws2
})