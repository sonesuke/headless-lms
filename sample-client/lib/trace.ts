const DEBUG_MODE: boolean = true;

export const trace = (...args: any[]) => {
  if (
    DEBUG_MODE &&
    window.console &&
    typeof window.console.log != "undefined"
  ) {
    args.map((arg) => console.log(arg));
  }
};
