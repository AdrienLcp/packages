import { describeSettingsError } from './describe-settings-error.ts'
import { loadRun } from './load-run.ts'
import { summarize } from './summary.ts'
import { type ShotsRunFailure, takeShots } from './take-shots.ts'
import { USAGE } from './usage.ts'

/** Where the CLI writes: the summary to one stream, failures to the other. */
export type CliOutput = {
  error: (text: string) => void
  info: (text: string) => void
}

const RUN_FAILURE_WORDING = {
  browser_unavailable:
    'Chromium could not start. Install it with: pnpm exec playwright install chromium',
  out_unwritable: 'The output folder could not be created.'
} as const satisfies Record<ShotsRunFailure, string>

const EXIT_SUCCESS = 0
const EXIT_RUN_FAILED = 1
const EXIT_USAGE = 2

/** Runs the command line to its exit code. */
export const runCli = async ({
  argv,
  output,
  workingFolder
}: {
  argv: readonly string[]
  output: CliOutput
  workingFolder: string
}): Promise<number> => {
  const request = await loadRun({ argv, workingFolder })

  if (request.status === 'failure') {
    output.error(describeSettingsError(request.error))
    return EXIT_USAGE
  }

  if (request.data.kind === 'help') {
    output.info(USAGE)
    return EXIT_SUCCESS
  }

  const { mocks, settings } = request.data
  const reports = await takeShots({ mocks, settings })

  if (reports.status === 'failure') {
    output.error(RUN_FAILURE_WORDING[reports.error])
    return EXIT_RUN_FAILED
  }

  const summary = summarize({ out: settings.out, reports: reports.data })
  output.info(summary.text)
  return summary.exitCode
}
