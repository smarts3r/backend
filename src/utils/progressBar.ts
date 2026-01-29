function progressBar(totalSteps: number, message: string) {
  let current = 0;
  const interval = setInterval(() => {
    current++;
    const percent = Math.floor((current / totalSteps) * 100);
    const bar = "█".repeat(current) + "-".repeat(totalSteps - current);
    process.stdout.write(`\r${message} [${bar}] ${percent}%`);
    if (current === totalSteps) {
      clearInterval(interval);
      console.log("\nDone!");
    }
  }, 100);
}

module.exports = progressBar;
