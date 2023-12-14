import bench from 'fastbench'
import { tmpdir } from 'os'
import { join } from 'path'
import writeFileAtomic from 'write-file-atomic'
import fastWriteAtomic from './index.js'
import { Writer as stenoWriter } from 'steno'
import { writeFile } from 'atomically'

const dest = join(tmpdir(), 'dest')
const file = Buffer.allocUnsafe(1024 * 1024) // 1MB

const run = bench([
  function benchWriteFileAtomic (cb) {
    writeFileAtomic(dest, file, cb)
  },
  function benchFastWriteAtomic (cb) {
    fastWriteAtomic(dest, file, cb)
  },
  function benchStenoWrite (cb) {
    const writer = new stenoWriter(dest)
    writer.write(file).then(cb, cb)
  },
  function benchAtomically (cb) {
    writeFile(dest, file).then(cb, cb)
  }
], 1000)

run(run)
