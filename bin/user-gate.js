#! /usr/bin/env node

require('yargs')
  .usage('Usage: $0 <command> [options]')
  .commandDir('cmds')
  .demand(1, 'Must provide a valid command')
  .strict()
  .help('h')
  .alias('h', 'help').argv;
