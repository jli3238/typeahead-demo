import chalk from 'chalk';

export function info(str) {
  console.log(chalk.blue(str));
}

export function success(str) {
  console.log(chalk.green(str));
}

export function warn(str) {
  console.warn(chalk.yellow(str));
}

export function error(str) {
  console.error(chalk.red(str));
}
