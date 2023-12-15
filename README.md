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

`npm run bench` tests write a 1 MB file a thousand times for each `fs.writeFile` supported content type

* Task names with `- INVALID` postfixed did not write the content successfully.
* Tasks missing in the final table do not support the content type.
* Tasks showing `NaN` or `undefined` errored when attempting to write (content type likely not supported)

Example output on my M1 MacBook Pro

### String

| Task Name                                         | ops/sec | Average Time (ns)  | Margin | Samples |
|---------------------------------------------------|---------|--------------------|--------|---------|
| string - write-file-atomic                        | 104     | 9569456.648971885  | ±0.93% | 1000    |
| string - fast-write-atomic                        | 100     | 9974691.528048366  | ±1.05% | 1000    |
| string - atomically                               | 90      | 10993664.809025824 | ±1.21% | 1000    |
| string - steno                                    | 1,720   | 581064.2120279372  | ±5.04% | 1000    |
| string - steno (cached writers)                   | 1,856   | 538735.5449534953  | ±6.25% | 1000    |
| string - @sgtpooki/steno-patched                  | 1,855   | 538935.3109970689  | ±5.96% | 1000    |
| string - @sgtpooki/steno-patched (cached writers) | 1,839   | 543614.1699589789  | ±5.93% | 1000    |

### Buffer

| Task Name                                         | ops/sec | Average Time (ns)  | Margin | Samples |
|---------------------------------------------------|---------|--------------------|--------|---------|
| Buffer - write-file-atomic                        | 106     | 9413316.115945578  | ±1.24% | 1000    |
| Buffer - fast-write-atomic                        | 87      | 11396506.075043231 | ±1.39% | 1000    |
| Buffer - atomically                               | 98      | 10167072.37899676  | ±1.60% | 1000    |
| Buffer - steno                                    | 2,914   | 343070.8889402449  | ±6.03% | 1000    |
| Buffer - steno (cached writers)                   | 2,735   | 365561.4319778979  | ±8.32% | 1000    |
| Buffer - @sgtpooki/steno-patched                  | 2,927   | 341579.9469836056  | ±2.29% | 1000    |
| Buffer - @sgtpooki/steno-patched (cached writers) | 2,974   | 336181.8239837885  | ±7.88% | 1000    |

### Uint8Array

| Task Name                                             | ops/sec | Average Time (ns)  | Margin | Samples |
|-------------------------------------------------------|---------|--------------------|--------|---------|
| Uint8Array - write-file-atomic                        | 101     | 9853620.467916131  | ±1.15% | 1000    |
| Uint8Array - fast-write-atomic                        | 106     | 9421993.666924536  | ±1.30% | 1000    |
| Uint8Array - atomically                               | 101     | 9857824.475903064  | ±1.16% | 1000    |
| Uint8Array - steno                                    | 2,937   | 340472.6759530604  | ±4.23% | 1000    |
| Uint8Array - steno (cached writers)                   | 3,037   | 329200.16099512577 | ±6.35% | 1000    |
| Uint8Array - @sgtpooki/steno-patched                  | 2,940   | 340053.3969886601  | ±9.02% | 1000    |
| Uint8Array - @sgtpooki/steno-patched (cached writers) | 2,566   | 389624.0490563214  | ±8.57% | 1000    |

### Uint16Array

| Task Name                                              | ops/sec | Average Time (ns)  | Margin  | Samples |
|--------------------------------------------------------|---------|--------------------|---------|---------|
| Uint16Array - write-file-atomic - INVALID              | 106     | 9366256.469059736  | ±1.84%  | 1000    |
| Uint16Array - fast-write-atomic                        | 105     | 9485154.04104814   | ±1.29%  | 1000    |
| Uint16Array - atomically - INVALID                     | 105     | 9512628.273036331  | ±2.13%  | 1000    |
| Uint16Array - steno                                    | 3,070   | 325627.6100054383  | ±4.11%  | 1000    |
| Uint16Array - steno (cached writers)                   | 2,928   | 341501.7860159278  | ±10.23% | 1000    |
| Uint16Array - @sgtpooki/steno-patched                  | 3,061   | 326585.48698946834 | ±8.27%  | 1000    |
| Uint16Array - @sgtpooki/steno-patched (cached writers) | 2,984   | 335088.25398236513 | ±10.90% | 1000    |

### Uint32Array

| Task Name                                              | ops/sec | Average Time (ns)  | Margin | Samples |
|--------------------------------------------------------|---------|--------------------|--------|---------|
| Uint32Array - write-file-atomic - INVALID              | 137     | 7248817.8689703345 | ±1.13% | 1000    |
| Uint32Array - fast-write-atomic                        | 99      | 10027958.324976265 | ±1.48% | 1000    |
| Uint32Array - atomically - INVALID                     | 136     | 7339935.803066939  | ±1.78% | 1000    |
| Uint32Array - steno                                    | 2,829   | 353382.5658969581  | ±5.97% | 1000    |
| Uint32Array - steno (cached writers)                   | 3,047   | 328090.66795930266 | ±7.05% | 1000    |
| Uint32Array - @sgtpooki/steno-patched                  | 3,229   | 309673.2000261545  | ±7.81% | 1000    |
| Uint32Array - @sgtpooki/steno-patched (cached writers) | 3,038   | 329160.20902246237 | ±7.65% | 1000    |

### DataView

| Task Name                                           | ops/sec | Average Time (ns)  | Margin | Samples |
|-----------------------------------------------------|---------|--------------------|--------|---------|
| DataView - write-file-atomic                        | 99      | 10023608.434963971 | ±1.52% | 1000    |
| DataView - fast-write-atomic                        | 104     | 9605465.122014284  | ±1.39% | 1000    |
| DataView - atomically                               | 87      | 11452541.950047016 | ±1.18% | 1000    |
| DataView - steno                                    | 3,113   | 321212.2639194131  | ±2.16% | 1000    |
| DataView - steno (cached writers)                   | 3,282   | 304673.0729416013  | ±7.46% | 1000    |
| DataView - @sgtpooki/steno-patched                  | 3,260   | 306680.9140481055  | ±7.47% | 1000    |
| DataView - @sgtpooki/steno-patched (cached writers) | 2,952   | 338718.1470580399  | ±9.85% | 1000    |

### Iterable

| Task Name                                           | ops/sec | Average Time (ns)  | Margin      | Samples |
|-----------------------------------------------------|---------|--------------------|-------------|---------|
| Iterable - atomically - INVALID                     | NaN     | NaN                | ±undefined% |         |
| Iterable - steno                                    | 6,335   | 157834.0379744768  | ±0.97%      | 1000    |
| Iterable - steno (cached writers)                   | 6,539   | 152909.95298326015 | ±1.03%      | 1000    |
| Iterable - @sgtpooki/steno-patched                  | 6,510   | 153586.5519978106  | ±0.89%      | 1000    |
| Iterable - @sgtpooki/steno-patched (cached writers) | 6,791   | 147243.3290593326  | ±0.74%      | 1000    |

### AsyncIterable

| Task Name                                                | ops/sec | Average Time (ns)  | Margin      | Samples |
|----------------------------------------------------------|---------|--------------------|-------------|---------|
| AsyncIterable - atomically - INVALID                     | NaN     | NaN                | ±undefined% |         |
| AsyncIterable - steno                                    | 6,248   | 160029.91100028157 | ±1.17%      | 1000    |
| AsyncIterable - steno (cached writers)                   | 6,611   | 151245.8410039544  | ±0.85%      | 1000    |
| AsyncIterable - @sgtpooki/steno-patched                  | 6,179   | 161817.61096417904 | ±1.15%      | 1000    |
| AsyncIterable - @sgtpooki/steno-patched (cached writers) | 6,194   | 161436.42192333937 | ±1.26%      | 1000    |

### Stream

| Task Name                                         | ops/sec | Average Time (ns)  | Margin      | Samples |
|---------------------------------------------------|---------|--------------------|-------------|---------|
| Stream - atomically - INVALID                     | NaN     | NaN                | ±undefined% |         |
| Stream - steno                                    | 2,795   | 357745.4889751971  | ±7.52%      | 1000    |
| Stream - steno (cached writers)                   | 2,856   | 350058.62103030086 | ±6.54%      | 1000    |
| Stream - @sgtpooki/steno-patched                  | 3,059   | 326857.8610792756  | ±6.98%      | 1000    |
| Stream - @sgtpooki/steno-patched (cached writers) | 2,976   | 336011.23297587037 | ±6.76%      | 1000    |


## License

MIT
