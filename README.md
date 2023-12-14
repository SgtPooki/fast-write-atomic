# fast-write-atomic

[![Build
Status](https://travis-ci.com/mcollina/fast-write-atomic.svg?branch=master)](https://travis-ci.com/mcollina/fast-write-atomic)

Fast way to write a file atomically, for Node.js

Status: *experimental*

## Install

```
npm i fast-write-atomic
```

## Example

```js
const writeFile = require('fast-write-atomic')

const data = Buffer.from('hello world')

writeFile('./hello', data, function (err) {
  if (err) {
    console.log(err)
    return
  }

  console.log('file written')
})
```

## Benchmarks

Those benchmarks writes a 1 MB file a thousand times:

```
benchWriteFileAtomic*1000: 10.960s
benchFastWriteAtomic*1000: 10.100s
benchStenoWrite*1000: 327.397ms
benchAtomically*1000: 10.903s
benchWriteFileAtomic*1000: 11.291s
benchFastWriteAtomic*1000: 9.959s
benchStenoWrite*1000: 386ms
benchAtomically*1000: 11.961s
```

## License

MIT

