// A simple loading spinner for the Command Line
export default class CLISpinner {
  spinner: string[];
  spinnerIndex: number;
  interval: NodeJS.Timeout | null;
  constructor() {
    // spinner frames
    this.spinner = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];
    this.spinnerIndex = 0;
    this.interval = null;
  }
  start() {
    // hide cursor
    process.stdout.write("\x1B[?25l");
    // start spinner interval, showing one frame every 100ms
    this.interval = setInterval(() => {
      // write current frame of spinner to stdout
      process.stdout.write(`\r${this.spinner[this.spinnerIndex]}`);
      // increment spinner index, looping back to 0 if we reach the end
      this.spinnerIndex = (this.spinnerIndex + 1) % this.spinner.length;
    }, 100);
  }
  stop() {
    // stop spinner interval
    if (this.interval) {
      clearInterval(this.interval);
    }
    // clear spinner from stdout
    process.stdout.write("\r");
    // show cursor
    process.stdout.write("\x1B[?25h");
  }
}
