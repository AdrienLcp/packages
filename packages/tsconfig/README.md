# @adrienlcp/tsconfig

The strictest TypeScript settings, for a project where `tsc` only checks and a
bundler (Vite, tsdown) emits.

```bash
pnpm add -D @adrienlcp/tsconfig
```

```json
{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  },
  "extends": "@adrienlcp/tsconfig/web-app.json",
  "include": ["scripts", "src", "vite.config.ts"]
}
```

| File | For |
| --- | --- |
| `base.json` | Any TypeScript: Node, a library, a script. `lib: ["esnext"]` |
| `web-app.json` | A React app in the browser: `base.json` plus `jsx: "react-jsx"` and the DOM libs |

Every flag is on because a bug once paid for it: `strict`,
`noUncheckedIndexedAccess`, `noUnusedLocals` / `Parameters`,
`noFallthroughCasesInSwitch`, `noImplicitOverride`, `erasableSyntaxOnly` (no
`enum`, no `namespace` with values, no parameter properties),
`verbatimModuleSyntax`, `noUncheckedSideEffectImports`,
`allowUnreachableCode: false`. `noEmit` is on: a library build sets
`noEmit: false` in its own `tsconfig.build.json`.

`paths`, `include` and `types` stay in the project: TypeScript resolves
`paths` against the file that declares them, so an alias set here would point
inside `node_modules`.
