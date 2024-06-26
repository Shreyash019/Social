import { Worker } from 'worker_threads'; // Node.js built-in worker_threads module

const workerPool = new Map(); // Map to store available worker threads

function createWorker() {
  const worker = new Worker('./worker.js');
  workerPool.set(worker, true); // Mark worker as available
  worker.on('message', (message) => {
    // Handle worker thread response (explained later)
  });
  worker.on('error', (error) => {
    console.error('Worker error:', error);
    // Handle worker thread errors (explained later)
    workerPool.delete(worker); // Remove errored worker from pool
  });
  return worker;
}

function getAvailableWorker() {
  for (const [worker, isAvailable] of workerPool.entries()) {
    if (isAvailable) {
      workerPool.set(worker, false); // Mark worker as busy
      return worker;
    }
  }
  // If no available worker found, create a new one:
  return createWorker();
}

export { createWorker, getAvailableWorker };
