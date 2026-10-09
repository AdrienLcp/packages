#!/usr/bin/env node
import { measureFontCommand } from './measure-font-command.ts'

process.exitCode = await measureFontCommand(process.argv.slice(2), process)
