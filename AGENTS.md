# Workflow for Codex agents

- After every completed feature or finished user-requested task, run the relevant
  verification, commit only the intended files, and push directly to
  `origin/main` before replying that the work is done.
- Do not leave completed work uncommitted unless the user explicitly asks not to
  commit or push yet.
- Do not create feature branches or open pull requests unless the user explicitly
  asks for them.
- If committing or pushing is blocked, report the blocker and the exact user
  action needed.

## Project board (Dave Board)

This project's progress is tracked at https://davefrassoni.com/board/
(project: "CyberMorph"). If `DF_BOARD_API_KEY` is set in `.env`, use it:

- Base URL: `https://davefrassoni.com/board/api/v1/`
- Auth header: `Authorization: Bearer <DF_BOARD_API_KEY>`
- `GET state/` — current tasks/categories for this project.
- `POST tasks/` — file a new task (`title`, `description`, `status`, `priority`, `category`).
- `PATCH tasks/<id>/` — move/update a task (e.g. `status: "done"`).
- `DELETE tasks/<id>/` — remove a task that's no longer relevant.

After finishing a feature: check `GET state/`, mark the matching task `done`
(or create one describing what shipped) with a short detail note. File newly
discovered pending work as `todo`/`backlog`. Periodically reconcile: move
stale `in progress`/`todo` items that are actually done, and delete tasks
that no longer reflect the project.
