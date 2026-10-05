#!/usr/bin/env node
import process from 'node:process'

import { runCli } from './run-cli.ts'

process.exitCode = await runCli({
  argv: process.argv.slice(2),
  output: {
    error: (text) => process.stderr.write(`${text}\n`),
    info: (text) => process.stdout.write(`${text}\n`)
  },
  workingFolder: process.cwd()
})
