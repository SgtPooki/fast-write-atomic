import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { rm, readFile } from 'node:fs/promises'
import writeFileAtomic from 'write-file-atomic'
import fastWriteAtomic from './index.js'
import { Writer as StenoWriter } from 'steno'
import { Writer as PatchedStenoWriter } from '@sgtpooki/steno-patched'
import { writeFile } from 'atomically'
import { Bench } from 'tinybench'
import { promisify } from 'node:util'
import toBuffer from 'it-to-buffer'
import { Readable } from 'stream'

const wfaPromisified = promisify(writeFileAtomic)
const fwaPromisified = promisify(fastWriteAtomic)

const content = Buffer.allocUnsafe(1024 * 1024).fill(5) // 1MB
/**
 * create an array of [content type names, content] pairs for each type that fs.writeFile supports
 * @see https://nodejs.org/api/fs.html#fspromiseswritefilefile-data-options
 * <string> | <Buffer> | <TypedArray> | <DataView> | <AsyncIterable> | <Iterable> | <Stream>
 */
const contentTypes = [
  ['string', content.toString()],
  ['Buffer', content],
  ['Uint8Array', new Uint8Array(content.buffer)],
  ['Uint16Array', new Uint16Array(content.buffer)],
  ['Uint32Array', new Uint32Array(content.buffer)],
  ['DataView', new DataView(content.buffer)],
  ['Iterable', {
    [Symbol.iterator] () {
      return {
        current: 0,
        last: 10,
        chunkSize: content.length / this.last,
        next () { // called every iteration, to get the next value
          if (this.current <= this.last) {
            const value = Uint8Array.prototype.slice.call(content, this.current, this.current + this.chunkSize)
            this.current += 1
            return { done: false, value }
          } else {
            return { done: true }
          }
        }
      }
    }
  }],
  ['AsyncIterable', {
    [Symbol.asyncIterator] () {
      return {
        current: 0,
        last: 10,
        chunkSize: content.length / this.last,
        next () { // called every iteration, to get the next value
          if (this.current <= this.last) {
            const value = Uint8Array.prototype.slice.call(content, this.current, this.current + this.chunkSize)
            this.current += 1
            return { done: false, value }
          } else {
            return { done: true }
          }
        }
      }
    }
  }],

  /**
   * in order to avoid the stream being consumed by the first write, we need to create a new stream for each write,
   * so there is logic below to call the content function for each write when using streams
   */
  ['Stream', () => Readable.from(content)]
]

async function validateWrittenFile (dest, content) {
  const fileContent = await readFile(dest)
  // fileContent will always be a buffer, we need to normalize the fileContent to the same type as content
  if (typeof content === 'string') {
    content = Buffer.from(content)
  } else if (content instanceof Uint8Array) {
    content = Buffer.from(content.buffer)
  } else if (content instanceof Uint16Array) {
    content = Buffer.from(content.buffer, content.byteOffset, content.length * 2)
  } else if (content instanceof Uint32Array) {
    content = Buffer.from(content.buffer, content.byteOffset, content.length * 4)
  } else if (content instanceof DataView) {
    content = Buffer.from(content.buffer)
  } else if (typeof content === 'function' && content() instanceof Readable) {
    const bufs = []
    const actualContent = content()
    actualContent.on('data', function (d) { bufs.push(d) })
    content = await new Promise((resolve, reject) => actualContent.on('end', function () {
      resolve(Buffer.concat(bufs))
    }))
  } else if (typeof content[Symbol.iterator] === 'function') {
    content = await toBuffer(content)
  } else if (typeof content[Symbol.asyncIterator] === 'function') {
    content = await toBuffer(content)
  } else {
    throw new Error(`Unsupported content type: ${typeof content}`)
  }
  if (fileContent.length !== content.length) {
    throw new Error(`File content length mismatch: expected ${content.length}, got ${fileContent.length}`)
  }
  if (!fileContent.equals(content)) {
    throw new Error('File content mismatch')
  }
}

async function runSuiteForContent (contentType, content) {
  const writers = new Map()
  let folder = tmpdir()
  let dest = join(folder, 'dest')
  const invalidWritesMap = new Map()
  const bench = new Bench({
    warmupIterations: 10,
    time: 1,
    iterations: 1000,
    setup: async () => {
      folder = tmpdir()
      dest = join(folder, 'dest')
    },
    teardown: async (task, mode) => {
      try {
        await validateWrittenFile(dest, content)
      } catch (err) {
        // console.error(err)
        invalidWritesMap.set(task.name, err)
      }
      await rm(dest, { force: true })
      // remove cached writers
      writers.clear()
    }
  })
  if (!['Stream', 'AsyncIterable', 'AsyncGenerator', 'Iterable'].includes(contentType)) {
    // cannot run these tests for these types due to fatal and uncatchable errors
    bench.add(`${contentType}: write-file-atomic`, async function () {
      await wfaPromisified(dest, content)
    })
      .add(`${contentType}: fast-write-atomic`, async function () {
        await fwaPromisified(dest, content)
      })
  }

  if (contentType === 'Stream') {
    // We add specific tests in this block to avoid the branching logic on stream content type within each task
    bench
      .add(`${contentType}: atomically`, async function () {
        await writeFile(dest, content())
      })
      .add(`${contentType}: steno`, async function () {
        const writer = new StenoWriter(dest)
        await writer.write(content())
      })
      .add(`${contentType}: steno (cached writers)`, async function () {
        let writer = writers.get(dest)
        if (writer == null) {
          writer = new StenoWriter(dest)
          writers.set(dest, writer)
        }
        await writer.write(content())
      })
      .add(`${contentType}: @sgtpooki/steno-patched`, async function () {
        const writer = new PatchedStenoWriter(dest)
        await writer.write(content())
      })
      .add(`${contentType}: @sgtpooki/steno-patched (cached writers)`, async function () {
        let writer = writers.get(dest)
        if (writer == null) {
          writer = new PatchedStenoWriter(dest)
          writers.set(dest, writer)
        }
        await writer.write(content())
      })
  } else {
    bench
      .add(`${contentType}: atomically`, async function () {
        await writeFile(dest, content)
      })
      .add(`${contentType}: steno`, async function () {
        const writer = new StenoWriter(dest)
        await writer.write(content)
      })
      .add(`${contentType}: steno (cached writers)`, async function () {
        let writer = writers.get(dest)
        if (writer == null) {
          writer = new StenoWriter(dest)
          writers.set(dest, writer)
        }
        await writer.write(content)
      })
      .add(`${contentType}: @sgtpooki/steno-patched`, async function () {
        const writer = new PatchedStenoWriter(dest)
        await writer.write(content)
      })
      .add(`${contentType}: @sgtpooki/steno-patched (cached writers)`, async function () {
        let writer = writers.get(dest)
        if (writer == null) {
          writer = new PatchedStenoWriter(dest)
          writers.set(dest, writer)
        }
        await writer.write(content)
      })
  }

  try {
    await bench.run()
    console.table(bench.table().map(({ 'Task Name': taskName, ...rest }) => {
      const invalidWrite = invalidWritesMap.get(taskName)
      if (invalidWrite) {
        taskName = `${taskName} - INVALID`
      }
      return { 'Task Name': taskName, ...rest }
    }))
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

try {
  for (const [contentType, content] of contentTypes) {
    console.log(`\nRunning suite for ${contentType} content`)
    await runSuiteForContent(contentType, content)
  }
  process.exit(0)
} catch (err) {
  console.error(err)
  process.exit(1)
}
