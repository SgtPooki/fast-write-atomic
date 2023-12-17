import { writeFile } from 'node:fs/promises';
import * as fsExt from 'fs-ext'
import { open } from 'node:fs/promises'
import pRetry from 'p-retry';
const { flock } = fsExt

export class Writer {
    #filename;
    /**
     * @type {import('node:fs/promises').FileHandle}
     */
    #fd;
    #locked = false;
    #prev = null;
    #next = null;
    #nextPromise = null;
    #nextData = null;
    // File is locked, add data for later
    #add(data) {
        // Only keep most recent data
        this.#nextData = data;
        // Create a singleton promise to resolve all next promises once next data is written
        this.#nextPromise ||= new Promise((resolve, reject) => {
            this.#next = [resolve, reject];
        });
        // Return a promise that will resolve at the same time as next promise
        return new Promise((resolve, reject) => {
            this.#nextPromise?.then(resolve).catch(reject);
        });
    }

    async #getFd() {
      this.#fd ||= await open(this.#filename, 'w')
    }

    async #closeFd() {
      await this.#fd.close();
      this.#fd = null;
    }

    // create cross-process lock before writing to the file
    async #lockFile() {
      await this.#getFd();
      await new Promise((resolve, reject) => {
        flock(this.#fd.fd, 'ex', (err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })

      this.#locked = true;
      // console.log('locked file')
    }

    async #unlockFile() {
      // console.log('trying to unlock file')
      await new Promise((resolve, reject) => {
        flock(this.#fd.fd, 'un', (err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })
      await this.#closeFd()

      this.#locked = false;
      // console.log('unlocked file')
    }

    // File isn't locked, write data
    async #write(data) {
        // Lock file
        await pRetry(() => this.#lockFile(), { retries: 1000 })
        try {
            // Atomic write
            await writeFile(this.#fd, data);
            // Call resolve
            this.#prev?.[0]();
        }
        catch (err) {
            // Call reject
            if (err instanceof Error) {
                this.#prev?.[1](err);
            }
            throw err;
        }
        finally {
            // Unlock file
            await pRetry(() => this.#unlockFile(), { retries: 1000 })
            // await backOff(() => this.#unlockFile(), { retries: 100 })
            // this.#unlockFile()
            this.#prev = this.#next;
            this.#next = this.#nextPromise = null;
            if (this.#nextData !== null) {
                const nextData = this.#nextData;
                this.#nextData = null;
                await this.write(nextData);
            }
        }
    }
    constructor(filename) {
        this.#filename = filename;
        this.#getFd.bind(this);
        this.#write.bind(this);
        this.#lockFile.bind(this);
        this.#unlockFile.bind(this);
        this.write.bind(this);
    }
    async write(data) {
      return this.#locked ?
        this.#add(data) :
        this.#write(data);
    }
}
