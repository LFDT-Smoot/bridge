
// Example Usage:
const TimeoutPromise = require('./timeoutPromise.js')

async function fetchDataWithTimeout(dataContent) {
  try {
    const data = await new TimeoutPromise(async (resolve, reject) => {
      // Simulate an async operation
      await new Promise(res => setTimeout(res, 2000));
      resolve(`${dataContent} fetched successfully!`);
    }, 1000, "FetchTimeout"); // 1 second timeout
    console.log(data);
  } catch (error) {
    if (error.message === "FetchTimeout") {
      console.error(`${dataContent} fetch timed out!`);
    } else {
      console.error("An unexpected error occurred:", error.message);
    }
  }
}

async function fetchDataWithTimely(dataContent) {
  try {
    const data = await new TimeoutPromise(async (resolve, reject) => {
      // Simulate an async operation
      await new Promise(res => setTimeout(res, 300));
      resolve(`${dataContent} fetched successfully!`);
    }, 1000, "FetchTimeout"); // 1 second timeout
    console.log(data);
  } catch (error) {
    if (error.message === "FetchTimeout") {
      console.error(`${dataContent} fetch timed out!`);
    } else {
      console.error("An unexpected error occurred:", error.message);
    }
  }
}

async function exceptionTestA() {
  try {
    console.log("Starting task...");
    const result = await new TimeoutPromise(async (resolve, reject) => {
      // Simulate a task that might take time
      await new Promise(res => setTimeout(res, 500)); // Resolves in 500ms
      resolve("Task completed!");
    }, 100); // Set a timeout of 100ms
    console.log("Result:", result);
  } catch (error) {
    console.error("Caught an error:", error.message);
    if (error.message === 'PTIMEOUT') {
      console.error("It was a timeout error!");
    } else {
      console.error("It was another error!");
    }
  }
}


async function main(){
  await fetchDataWithTimeout("Data-1");
  await fetchDataWithTimely("Data-2")

  await exceptionTestA();
}

main().catch((err) => {}).finally(()=>{console.log("Done!")})