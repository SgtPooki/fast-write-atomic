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

```
Running suite for string content
┌─────────┬────────────────────────────────────────────────────┬─────────┬────────────────────┬──────────┬─────────┐
│ (index) │                     Task Name                      │ ops/sec │ Average Time (ns)  │  Margin  │ Samples │
├─────────┼────────────────────────────────────────────────────┼─────────┼────────────────────┼──────────┼─────────┤
│    0    │            'string: write-file-atomic'             │  '98'   │ 10141127.130072564 │ '±0.98%' │  1000   │
│    1    │            'string: fast-write-atomic'             │  '105'  │  9482647.12691307  │ '±1.05%' │  1000   │
│    2    │                'string: atomically'                │  '97'   │ 10247388.864010572 │ '±1.03%' │  1000   │
│    3    │                  'string: steno'                   │ '1,793' │ 557665.9199930727  │ '±2.05%' │  1000   │
│    4    │          'string: steno (cached writers)'          │ '1,832' │ 545577.4789899588  │ '±4.83%' │  1000   │
│    5    │         'string: @sgtpooki/steno-patched'          │ '1,844' │ 542128.9540454745  │ '±4.33%' │  1000   │
│    6    │ 'string: @sgtpooki/steno-patched (cached writers)' │ '1,828' │ 546750.7128603756  │ '±4.10%' │  1000   │
└─────────┴────────────────────────────────────────────────────┴─────────┴────────────────────┴──────────┴─────────┘

Running suite for Buffer content
┌─────────┬────────────────────────────────────────────────────┬─────────┬────────────────────┬──────────┬─────────┐
│ (index) │                     Task Name                      │ ops/sec │ Average Time (ns)  │  Margin  │ Samples │
├─────────┼────────────────────────────────────────────────────┼─────────┼────────────────────┼──────────┼─────────┤
│    0    │            'Buffer: write-file-atomic'             │  '93'   │ 10647329.308964312 │ '±1.07%' │  1000   │
│    1    │            'Buffer: fast-write-atomic'             │  '93'   │ 10724833.747904748 │ '±1.18%' │  1000   │
│    2    │                'Buffer: atomically'                │  '103'  │ 9681722.464945167  │ '±1.19%' │  1000   │
│    3    │                  'Buffer: steno'                   │ '2,957' │ 338130.2399970591  │ '±2.35%' │  1000   │
│    4    │          'Buffer: steno (cached writers)'          │ '3,108' │  321667.986959219  │ '±8.57%' │  1000   │
│    5    │         'Buffer: @sgtpooki/steno-patched'          │ '3,055' │ 327327.04797387123 │ '±8.35%' │  1000   │
│    6    │ 'Buffer: @sgtpooki/steno-patched (cached writers)' │ '2,902' │ 344481.1870083213  │ '±8.96%' │  1000   │
└─────────┴────────────────────────────────────────────────────┴─────────┴────────────────────┴──────────┴─────────┘

Running suite for Uint8Array content
┌─────────┬────────────────────────────────────────────────────────┬─────────┬────────────────────┬──────────┬─────────┐
│ (index) │                       Task Name                        │ ops/sec │ Average Time (ns)  │  Margin  │ Samples │
├─────────┼────────────────────────────────────────────────────────┼─────────┼────────────────────┼──────────┼─────────┤
│    0    │            'Uint8Array: write-file-atomic'             │  '93'   │ 10649403.379000723 │ '±1.23%' │  1000   │
│    1    │            'Uint8Array: fast-write-atomic'             │  '93'   │ 10716505.24397567  │ '±1.36%' │  1000   │
│    2    │                'Uint8Array: atomically'                │  '91'   │ 10982564.680039883 │ '±1.13%' │  1000   │
│    3    │                  'Uint8Array: steno'                   │ '3,017' │ 331438.19296360016 │ '±2.56%' │  1000   │
│    4    │          'Uint8Array: steno (cached writers)'          │ '3,029' │ 330061.0620751977  │ '±8.72%' │  1000   │
│    5    │         'Uint8Array: @sgtpooki/steno-patched'          │ '3,039' │ 328965.3820358217  │ '±7.30%' │  1000   │
│    6    │ 'Uint8Array: @sgtpooki/steno-patched (cached writers)' │ '3,048' │ 328013.7880370021  │ '±7.70%' │  1000   │
└─────────┴────────────────────────────────────────────────────────┴─────────┴────────────────────┴──────────┴─────────┘

Running suite for Uint16Array content
┌─────────┬─────────────────────────────────────────────────────────┬─────────┬────────────────────┬──────────┬─────────┐
│ (index) │                        Task Name                        │ ops/sec │ Average Time (ns)  │  Margin  │ Samples │
├─────────┼─────────────────────────────────────────────────────────┼─────────┼────────────────────┼──────────┼─────────┤
│    0    │       'Uint16Array: write-file-atomic - INVALID'        │  '105'  │ 9483421.069014817  │ '±1.45%' │  1000   │
│    1    │            'Uint16Array: fast-write-atomic'             │  '94'   │ 10553417.209014297 │ '±1.24%' │  1000   │
│    2    │           'Uint16Array: atomically - INVALID'           │  '107'  │ 9343969.604857266  │ '±1.51%' │  1000   │
│    3    │                  'Uint16Array: steno'                   │ '3,020' │ 331036.04197502136 │ '±1.43%' │  1000   │
│    4    │          'Uint16Array: steno (cached writers)'          │ '3,067' │ 325985.72900146246 │ '±7.19%' │  1000   │
│    5    │         'Uint16Array: @sgtpooki/steno-patched'          │ '3,053' │ 327543.77199709415 │ '±7.81%' │  1000   │
│    6    │ 'Uint16Array: @sgtpooki/steno-patched (cached writers)' │ '3,133' │  319123.477011919  │ '±6.56%' │  1000   │
└─────────┴─────────────────────────────────────────────────────────┴─────────┴────────────────────┴──────────┴─────────┘

Running suite for Uint32Array content
┌─────────┬─────────────────────────────────────────────────────────┬─────────┬────────────────────┬──────────┬─────────┐
│ (index) │                        Task Name                        │ ops/sec │ Average Time (ns)  │  Margin  │ Samples │
├─────────┼─────────────────────────────────────────────────────────┼─────────┼────────────────────┼──────────┼─────────┤
│    0    │       'Uint32Array: write-file-atomic - INVALID'        │  '136'  │ 7311366.059925407  │ '±1.27%' │  1000   │
│    1    │            'Uint32Array: fast-write-atomic'             │  '107'  │ 9304161.356981844  │ '±1.08%' │  1000   │
│    2    │           'Uint32Array: atomically - INVALID'           │  '140'  │  7110223.74593094  │ '±1.16%' │  1000   │
│    3    │                  'Uint32Array: steno'                   │ '3,144' │ 317998.45795333385 │ '±2.80%' │  1000   │
│    4    │          'Uint32Array: steno (cached writers)'          │ '3,033' │ 329627.07901746035 │ '±7.60%' │  1000   │
│    5    │         'Uint32Array: @sgtpooki/steno-patched'          │ '3,076' │ 325001.25800445676 │ '±8.09%' │  1000   │
│    6    │ 'Uint32Array: @sgtpooki/steno-patched (cached writers)' │ '3,121' │ 320333.6189612746  │ '±7.38%' │  1000   │
└─────────┴─────────────────────────────────────────────────────────┴─────────┴────────────────────┴──────────┴─────────┘

Running suite for DataView content
┌─────────┬──────────────────────────────────────────────────────┬─────────┬────────────────────┬──────────┬─────────┐
│ (index) │                      Task Name                       │ ops/sec │ Average Time (ns)  │  Margin  │ Samples │
├─────────┼──────────────────────────────────────────────────────┼─────────┼────────────────────┼──────────┼─────────┤
│    0    │            'DataView: write-file-atomic'             │  '92'   │ 10755427.586954087 │ '±1.19%' │  1000   │
│    1    │            'DataView: fast-write-atomic'             │  '103'  │ 9682615.898888558  │ '±1.30%' │  1000   │
│    2    │                'DataView: atomically'                │  '99'   │ 10038814.300976694 │ '±1.30%' │  1000   │
│    3    │                  'DataView: steno'                   │ '3,006' │ 332660.66405922174 │ '±1.71%' │  1000   │
│    4    │          'DataView: steno (cached writers)'          │ '3,114' │ 321063.73800709844 │ '±7.30%' │  1000   │
│    5    │         'DataView: @sgtpooki/steno-patched'          │ '2,935' │ 340601.26296430826 │ '±5.38%' │  1000   │
│    6    │ 'DataView: @sgtpooki/steno-patched (cached writers)' │ '2,658' │ 376117.6629848778  │ '±8.61%' │  1000   │
└─────────┴──────────────────────────────────────────────────────┴─────────┴────────────────────┴──────────┴─────────┘

Running suite for Iterable content
┌─────────┬──────────────────────────────────────────────────────┬─────────┬────────────────────┬───────────────┬───────────┐
│ (index) │                      Task Name                       │ ops/sec │ Average Time (ns)  │    Margin     │  Samples  │
├─────────┼──────────────────────────────────────────────────────┼─────────┼────────────────────┼───────────────┼───────────┤
│    0    │           'Iterable: atomically - INVALID'           │  'NaN'  │        NaN         │ '±undefined%' │ undefined │
│    1    │                  'Iterable: steno'                   │ '5,886' │ 169870.42497843504 │   '±1.38%'    │   1000    │
│    2    │          'Iterable: steno (cached writers)'          │ '6,321' │ 158191.94603711367 │   '±1.18%'    │   1000    │
│    3    │         'Iterable: @sgtpooki/steno-patched'          │ '6,250' │ 159984.88796502352 │   '±1.00%'    │   1000    │
│    4    │ 'Iterable: @sgtpooki/steno-patched (cached writers)' │ '6,419' │ 155779.72603216767 │   '±0.96%'    │   1000    │
└─────────┴──────────────────────────────────────────────────────┴─────────┴────────────────────┴───────────────┴───────────┘

Running suite for AsyncIterable content
┌─────────┬───────────────────────────────────────────────────────────┬─────────┬────────────────────┬───────────────┬───────────┐
│ (index) │                         Task Name                         │ ops/sec │ Average Time (ns)  │    Margin     │  Samples  │
├─────────┼───────────────────────────────────────────────────────────┼─────────┼────────────────────┼───────────────┼───────────┤
│    0    │           'AsyncIterable: atomically - INVALID'           │  'NaN'  │        NaN         │ '±undefined%' │ undefined │
│    1    │                  'AsyncIterable: steno'                   │ '6,391' │ 156456.6680341959  │   '±0.99%'    │   1000    │
│    2    │          'AsyncIterable: steno (cached writers)'          │ '6,478' │ 154359.0930737555  │   '±1.18%'    │   1000    │
│    3    │         'AsyncIterable: @sgtpooki/steno-patched'          │ '6,487' │ 154149.9589793384  │   '±0.94%'    │   1000    │
│    4    │ 'AsyncIterable: @sgtpooki/steno-patched (cached writers)' │ '6,408' │ 156052.87803336978 │   '±1.29%'    │   1000    │
└─────────┴───────────────────────────────────────────────────────────┴─────────┴────────────────────┴───────────────┴───────────┘

Running suite for Stream content
┌─────────┬────────────────────────────────────────────────────┬─────────┬────────────────────┬───────────────┬───────────┐
│ (index) │                     Task Name                      │ ops/sec │ Average Time (ns)  │    Margin     │  Samples  │
├─────────┼────────────────────────────────────────────────────┼─────────┼────────────────────┼───────────────┼───────────┤
│    0    │           'Stream: atomically - INVALID'           │  'NaN'  │        NaN         │ '±undefined%' │ undefined │
│    1    │                  'Stream: steno'                   │ '2,658' │ 376147.6060375571  │   '±7.08%'    │   1000    │
│    2    │          'Stream: steno (cached writers)'          │ '2,942' │  339895.16813308   │   '±6.85%'    │   1000    │
│    3    │         'Stream: @sgtpooki/steno-patched'          │ '3,011' │ 332088.10099959373 │   '±8.45%'    │   1000    │
│    4    │ 'Stream: @sgtpooki/steno-patched (cached writers)' │ '3,052' │ 327651.11902728677 │   '±6.76%'    │   1000    │
└─────────┴────────────────────────────────────────────────────┴─────────┴────────────────────┴───────────────┴───────────┘

```

## License

MIT
