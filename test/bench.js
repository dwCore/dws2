const dws2 = require('../')
    , bl       = require('bl')
    , crypto   = require('crypto')
    , assert   = require('assert')

function run (callback) {
  var bufs   = Array.apply(null, Array(10)).map(function () { return crypto.randomBytes(32) })
    , DWS = dws2(function (chunk, env, callback) {
        callback(null, chunk.toString('hex'))
      })

  DWS.pipe(bl(function (err, data) {
    assert(!err)
    assert.equal(data.toString(), Buffer.concat(bufs).toString('hex'))
    callback()
  }))

  bufs.forEach(function (b) {
    DWS.write(b)
  })
  DWS.end()
}

var count = 0
  , start = Date.now()

;(function exec () {
  count++
  run(function () {
    if (Date.now() - start < 1000 * 10) {
      return setImmediate(exec)
    }
    console.log('Ran', count, 'iterations in', Date.now() - start, 'ms')
  })
}())

console.log('Running for ~10s')