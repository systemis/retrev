# App Design Skills

A portable library of reusable **app design skills** for building React Native /
Expo apps with Claude Code. Each skill captures one design pattern — the "how"
and the drop-in code — so you never have to re-describe it.

## How these work

Claude Code auto-discovers any skill in `.claude/skills/<name>/SKILL.md` while
you work in this repo. Claude reads each skill's `description` and applies the
matching one automatically when your request fits — or you can invoke it
explicitly with `/<skill-name>`.

## Reusing these in a NEW app

Copy the whole folder into the new project's root:

```bash
cp -R path/to/this-repo/.claude/skills  path/to/new-app/.claude/
```

That's it — the skills activate automatically in the new repo. No re-explaining
the design; just say what you want ("frosted header that blends into the list")
and Claude applies the pattern.

> Want a skill available in **every** project on this machine without copying?
> Also drop it in `~/.claude/skills/` (user scope). Keep only one copy of a given
> skill name active at a time to avoid duplicates.

## Skills in this library

| Skill | Use it when |
|---|---|
| `seamless-blur-header` | You want a frosted/translucent blur header (sticky nav / large title) that blends seamlessly into a scrolling list — no visible seam or divider line. |

## Adding a new design skill

1. Create `.claude/skills/<kebab-name>/SKILL.md`.
2. Add YAML frontmatter — `name` and a keyword-rich `description` that states
   **when** to use it (this is what triggers auto-selection):

   ```markdown
   ---
   name: my-pattern
   description: >-
     Build <thing>. Use when the user asks for <triggers>. Stack: <libraries>.
   ---

   # My pattern
   ...why it works, required packages, drop-in code, wiring, gotchas...
   ```

3. Keep the body self-contained: the principle, the exact packages to
   `npx expo install`, a copy-paste component, how to wire it, and tuning notes.
4. Add a row to the table above.

## Conventions for skills here

- **Generic, not app-specific** — no hard-coded colors/names from one project.
- **State the stack** and that native modules need a dev build / `expo prebuild`.
- **Explain the "why"** (the failure it prevents), not just the code.
- One pattern per skill; compose them rather than making one giant skill.
