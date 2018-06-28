const dws2Test = require('tape')
    , dws2     = require('../')
    , crypto   = require('crypto')
    , bl       = require('bl')
    , spigot   = require('stream-spigot')

dws2Test('plain through', function (t) {
  var Dws2 = dws2(function (chunk, enc, callback) {
    if (!this._i)
      this._i = 97 // 'a'
    else
      this._i++
    var b = new Buffer(chunk.length)
    for (var i = 0; i < chunk.length; i++)
      b[i] = this._i
    this.push(b)
    callback()
  })

  Dws2.pipe(bl(function (err, b) {
    var s = b.toString('ascii')
    t.equal('aaaaaaaaaabbbbbcccccccccc', s, 'got transformed string')
    t.end()
  }))

  Dws2.write(crypto.randomBytes(10))
  Dws2.write(crypto.randomBytes(5))
  Dws2.write(crypto.randomBytes(10))
  Dws2.end()
})

dws2Test('pipeable through', function (t) {
  var Dws2 = dws2(function (chunk, enc, callback) {
    if (!this._i)
      this._i = 97 // 'a'
    else
      this._i++
    var b = new Buffer(chunk.length)
    for (var i = 0; i < chunk.length; i++)
      b[i] = this._i
    this.push(b)
    callback()
  })

  Dws2.pipe(bl(function (err, b) {
    var s = b.toString('ascii')
    // bl() acts like a proper streams2 stream and passes as much as it's
    // asked for, so we really only get one write with such a small amount
    // of data
    t.equal(s, 'aaaaaaaaaaaaaaaaaaaaaaaaa', 'got transformed string')
    t.end()
  }))

  var bufs = bl()
  bufs.append(crypto.randomBytes(10))
  bufs.append(crypto.randomBytes(5))
  bufs.append(crypto.randomBytes(10))
  bufs.pipe(Dws2)
})

dws2Test('object through', function (t) {
  t.plan(3)

  var Dws2 = dws2({ objectMode: true}, function (chunk, enc, callback) {
    this.push({ out: chunk.in + 1 })
    callback()
  })

  var e = 0
  Dws2.on('data', function (o) {
    t.deepEqual(o, { out: e === 0 ? 102 : e == 1 ? 203 : -99 }, 'got transformed object')
    e++
  })

  Dws2.write({ in: 101 })
  Dws2.write({ in: 202 })
  Dws2.write({ in: -100 })
  Dws2.end()
})

dws2Test('object through with dws2.obj', function (t) {
  t.plan(3)

  var Dws2 = dws2.obj(function (chunk, enc, callback) {
    this.push({ out: chunk.in + 1 })
    callback()
  })

  var e = 0
  Dws2.on('data', function (o) {
    t.deepEqual(o, { out: e === 0 ? 102 : e == 1 ? 203 : -99 }, 'got transformed object')
    e++
  })

  Dws2.write({ in: 101 })
  Dws2.write({ in: 202 })
  Dws2.write({ in: -100 })
  Dws2.end()
})

dws2Test('flushing through', function (t) {
  var Dws2 = dws2(function (chunk, enc, callback) {
    if (!this._i)
      this._i = 97 // 'a'
    else
      this._i++
    var b = new Buffer(chunk.length)
    for (var i = 0; i < chunk.length; i++)
      b[i] = this._i
    this.push(b)
    callback()
  }, function (callback) {
    this.push(new Buffer([ 101, 110, 100 ]))
    callback()
  })

  Dws2.pipe(bl(function (err, b) {
    var s = b.toString('ascii')
    t.equal(s, 'aaaaaaaaaabbbbbccccccccccend', 'got transformed string')
    t.end()
  }))

  Dws2.write(crypto.randomBytes(10))
  Dws2.write(crypto.randomBytes(5))
  Dws2.write(crypto.randomBytes(10))
  Dws2.end()
})

dws2Test('plain through ctor', function (t) {
  var DWS2 = dws2.ctor(function (chunk, enc, callback) {
    if (!this._i)
      this._i = 97 // 'a'
    else
      this._i++
    var b = new Buffer(chunk.length)
    for (var i = 0; i < chunk.length; i++)
      b[i] = this._i
    this.push(b)
    callback()
  })

  var Dws2 = new DWS2()

  Dws2.pipe(bl(function (err, b) {
    var s = b.toString('ascii')
    t.equal('aaaaaaaaaabbbbbcccccccccc', s, 'got transformed string')
    t.end()
  }))

  Dws2.write(crypto.randomBytes(10))
  Dws2.write(crypto.randomBytes(5))
  Dws2.write(crypto.randomBytes(10))
  Dws2.end()
})

dws2Test('reuse through ctor', function (t) {
  t.plan(4)

  var DWS2 = dws2.ctor(function (chunk, enc, callback) {
    if (!this._i) {
      t.ok(1, 'did not contain previous instance data (this._i)')
      this._i = 97 // 'a'
    } else
      this._i++
    var b = new Buffer(chunk.length)
    for (var i = 0; i < chunk.length; i++)
      b[i] = this._i
    this.push(b)
    callback()
  })

  var Dws2 = DWS2()

  Dws2.pipe(bl(function (err, b) {
    var s = b.toString('ascii')
    t.equal('aaaaaaaaaabbbbbcccccccccc', s, 'got transformed string')

    var newInstance = DWS2()
    newInstance.pipe(bl(function (err, b) {
      var s = b.toString('ascii')
      t.equal('aaaaaaabbbbccccccc', s, 'got transformed string')
    }))

    newInstance.write(crypto.randomBytes(7))
    newInstance.write(crypto.randomBytes(4))
    newInstance.write(crypto.randomBytes(7))
    newInstance.end()
  }))

  Dws2.write(crypto.randomBytes(10))
  Dws2.write(crypto.randomBytes(5))
  Dws2.write(crypto.randomBytes(10))
  Dws2.end()
})

dws2Test('object through ctor', function (t) {
  t.plan(3)

  var DWS2 = dws2.ctor({ objectMode: true}, function (chunk, enc, callback) {
    this.push({ out: chunk.in + 1 })
    callback()
  })

  var Dws2 = new DWS2()

  var e = 0
  Dws2.on('data', function (o) {
    t.deepEqual(o, { out: e === 0 ? 102 : e == 1 ? 203 : -99 }, 'got transformed object')
    e++
  })

  Dws2.write({ in: 101 })
  Dws2.write({ in: 202 })
  Dws2.write({ in: -100 })
  Dws2.end()
})

dws2Test('pipeable object through ctor', function (t) {
  t.plan(4)

  var DWS2 = dws2.ctor({ objectMode: true}, function (record, enc, callback) {
    if (record.temp != null && record.unit == 'F') {
      record.temp = ( ( record.temp - 32 ) * 5 ) / 9
      record.unit = 'C'
    }
    this.push(record)
    callback()
  })

  var Dws2 = DWS2()

  var expect = [-19, -40, 100, 22]
  Dws2.on('data', function (o) {
    t.deepEqual(o, { temp: expect.shift(), unit: 'C' }, 'got transformed object')
  })

  spigot({objectMode: true}, [
    {temp: -2.2, unit: 'F'},
    {temp: -40, unit: 'F'},
    {temp: 212, unit: 'F'},
    {temp: 22, unit: 'C'}
  ]).pipe(Dws2)
})

dws2Test('object through ctor override', function (t) {
  t.plan(3)

  var DWS2 = dws2.ctor(function (chunk, enc, callback) {
    this.push({ out: chunk.in + 1 })
    callback()
  })

  var Dws2 = DWS2({objectMode: true})

  var e = 0
  Dws2.on('data', function (o) {
    t.deepEqual(o, { out: e === 0 ? 102 : e == 1 ? 203 : -99 }, 'got transformed object')
    e++
  })

  Dws2.write({ in: 101 })
  Dws2.write({ in: 202 })
  Dws2.write({ in: -100 })
  Dws2.end()
})

dws2Test('object settings available in transform', function (t) {
  t.plan(6)

  var DWS2 = dws2.ctor({objectMode: true, peek: true}, function (chunk, enc, callback) {
    t.ok(this.options.peek, "reading options from inside _transform")
    this.push({ out: chunk.in + 1 })
    callback()
  })

  var Dws2 = DWS2()

  var e = 0
  Dws2.on('data', function (o) {
    t.deepEqual(o, { out: e === 0 ? 102 : e == 1 ? 203 : -99 }, 'got transformed object')
    e++
  })

  Dws2.write({ in: 101 })
  Dws2.write({ in: 202 })
  Dws2.write({ in: -100 })
  Dws2.end()
})

dws2Test('object settings available in transform override', function (t) {
  t.plan(6)

  var DWS2 = dws2.ctor(function (chunk, enc, callback) {
    t.ok(this.options.peek, "reading options from inside _transform")
    this.push({ out: chunk.in + 1 })
    callback()
  })

  var Dws2 = DWS2({objectMode: true, peek: true})

  var e = 0
  Dws2.on('data', function (o) {
    t.deepEqual(o, { out: e === 0 ? 102 : e == 1 ? 203 : -99 }, 'got transformed object')
    e++
  })

  Dws2.write({ in: 101 })
  Dws2.write({ in: 202 })
  Dws2.write({ in: -100 })
  Dws2.end()
})

dws2Test('object override extends options', function (t) {
  t.plan(6)

  var DWS2 = dws2.ctor({objectMode: true}, function (chunk, enc, callback) {
    t.ok(this.options.peek, "reading options from inside _transform")
    this.push({ out: chunk.in + 1 })
    callback()
  })

  var Dws2 = DWS2({peek: true})

  var e = 0
  Dws2.on('data', function (o) {
    t.deepEqual(o, { out: e === 0 ? 102 : e == 1 ? 203 : -99 }, 'got transformed object')
    e++
  })

  Dws2.write({ in: 101 })
  Dws2.write({ in: 202 })
  Dws2.write({ in: -100 })
  Dws2.end()
})

dws2Test('can be destroyed', function(t) {
  t.plan(1)

  var th = dws2()

  th.on('close', function() {
    t.ok(true, 'shoud emit close')
    t.end()
  })

  th.destroy()
})

dws2Test('can be destroyed twice', function(t) {
  t.plan(1)

  var th = dws2()

  th.on('close', function() {
    t.ok(true, 'shoud emit close')
    t.end()
  })

  th.destroy()
  th.destroy()
})