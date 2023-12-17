import cluster from 'node:cluster';
import { availableParallelism } from 'node:os';
import process from 'node:process';
import { Writer as CustomStenoWriter } from './steno-custom.mjs'
import { Writer as StenoWriter } from 'steno'
import fastWriteAtomic from './index.js'
import * as fs from 'node:fs'
import * as fsPromises from 'node:fs/promises'

/**
 * @type {Map<number, import('node:cluster').Worker>}
 */
let readyWorkers = new Map()

/**
 * @type {Map<number, import('node:cluster').Worker>}
 */
let doneWorkers = new Map()

const content = Buffer.allocUnsafe(1024 * 1024) // 1MB

async function manualWrite(path, data) {
  await fsPromises.writeFile(path, data, { flag: 'w' })
}

async function manualWriteFd(path, data) {
    const fd = await new Promise((resolve, reject) => {
    fs.open(path, 'w', (err, fd) => {
      if (err) {
        reject(err)
      } else {
        resolve(fd)
      }
    })
  })
  // write the data
  await new Promise((resolve, reject) => {
    fs.write(fd, data, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
  await new Promise((resolve, reject) => {
    fs.close(fd, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve(fd)
      }
    })
  })
}

async function stenoWrite(path, data) {
  const writer = new StenoWriter(path)
  await writer.write(data)
}
// const stenoWriters = new Map()
async function customStenoWrite(path, data) {
  // let writer = stenoWriters.get(path)
  // if (!writer) {
  //   writer = new CustomStenoWriter(path)
  //   stenoWriters.set(path, writer)
  // }
  const writer = new CustomStenoWriter(path)
  await writer.write(data)
}

async function fwaWrite(path, data) {
  await new Promise((resolve, reject) => {
    fastWriteAtomic(path, data, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

function getALotOfRandomText() {
  let text = ''
  const N = 10000
  for (let i = 0; i < N; i++) {
    text += Math.random().toString(36).substring(2)
  }
  return text
}


async function runPrimary() {
  // Start workers and listen for messages containing notifyRequest
  let numCPUs = availableParallelism();
  // numCpus /= 2 // half...
  // numCPUs = 2 // less for debugging

  console.log('Primary ' + process.pid + ' has started.');

  // Be notified when worker processes die.
  cluster.on('death', (worker) => {
    console.log('Worker ' + worker.pid + ' died.');
  });

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // let finalData = null
  const failedWriteFunctions = new Set()
  cluster.on('message', (worker, msg) => {
    switch (msg.cmd) {
      case 'ready':
        readyWorkers.set(worker.process.pid, worker)
        worker.on('error', (err) => {
          console.error('worker error', err)
        })
        break;
      // case 'done':
      //   finalData = msg.finalData
      //   doneWorkers.set(worker.process.pid, worker)
      //   break;
      default:
        break;
    }
    // console.log(`Primary ${process.pid} received message from worker ${worker.process.pid}.`, msg);
  })

  while (readyWorkers.size < numCPUs) {
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  const randomLargeString = getALotOfRandomText()
  console.log('testing write of large string of length', randomLargeString.length)
  for (const writeFn of ['fwaWrite', 'stenoWrite', 'customStenoWrite', 'manualWrite', 'manualWriteFd']) {
  // for (const writeFn of ['customStenoWrite']) {
    // let lastDataToWrite = null
    console.log('')
    process.stdout.write(`testing ${writeFn}`)
    let path = `test-${writeFn}.txt`
    const N = 50

    for (let i = 0; i < N; i++) {
      let finalData = null
      // call all workers N times for each writeFn
      for (const worker of readyWorkers.values()) {
        worker.once('message', (msg) => {
          if (msg.cmd === 'done') {
            finalData = msg.finalData
            doneWorkers.set(worker.process.pid, worker)
          }
        })
        worker.send({
          cmd: 'execute',
          data: `test-data-${worker.process.pid}-${randomLargeString}\n`,
          path,
          writeFn
        })
      }

      while (doneWorkers.size < numCPUs) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      // verify that the file was written and the contents are correct
      const fileContents = await fsPromises.readFile(path, 'utf8')
      // assert.strictEqual(fileContents, finalData, `file contents mismatch for ${writeFn}`)
      let errored = false
      if (fileContents !== finalData) {
        errored = true
        failedWriteFunctions.add(writeFn)
        console.log('')
        console.error(`file contents mismatch for ${writeFn}`)
        if (finalData != null) {
          console.error(`expected ${finalData.slice(0, 20)}...`)
          console.error(`got ${fileContents.slice(0, 20)}...`)
        } else {
          console.error('finalData is null, writeFn errored when writing.')
        }
      }
      doneWorkers.clear()
      if (errored) {
        // break out of the N loop, to try the next writeFn
        break
      }
    }
  }

  for (const worker of readyWorkers.values()) {
    worker.kill()
  }
  console.log('')
  console.log('Primary ' + process.pid + ' is exiting.');
  if (failedWriteFunctions.size === 0) {
    console.log('All write functions passed concurrent write test.')
  } else {
    console.log('The following write functions failed concurrent write test:\n\t *', [...failedWriteFunctions].join('\n\t * '))
  }
}

async function runWorker() {

  const writers = new Map()
  writers.set('fwaWrite', fwaWrite)
  writers.set('stenoWrite', stenoWrite)
  writers.set('customStenoWrite', customStenoWrite)
  writers.set('manualWrite', manualWrite)
  writers.set('manualWriteFd', manualWriteFd)
  console.log('Worker ' + process.pid + ' has started.');

  // Send message to primary process.
  process.send({ cmd: 'ready' })

  process.on('uncaughtException', (err) => {
    // swallow the error, but tell the primary process that we're done
    process.send({ cmd: 'done', finalData: null })
  })

  // Receive messages from the primary process.
  process.on('message', async (msg) => {
    // console.log('Worker ' + process.pid + ' received message from primary.', msg);
    switch (msg.cmd) {
      case 'execute':
        // convert msg.data object of { type: 'Buffer', data: [ 1, 2, 3, ... ] } to a Buffer
        // const data = Buffer.from(msg.data.data ?? msg.data)
        const data = msg.data
        const writeFn = writers.get(msg.writeFn)
        try {
          await writeFn(msg.path, data)
          process.stdout.write('.')
        } catch (err) {
          console.error(`worker ${process.pid} threw an error when trying to write file with ${msg.writeFn}`)
        } finally {
          process.send({ cmd: 'done', finalData: data })
        }

        break;
      default:
        break;
    }
  });
}

if (cluster.isPrimary) {
  runPrimary()
} else if (cluster.isWorker) {
  runWorker()
}
