# Dependency Links

Dependency Links helps you jump from package dependencies to their source repositories without leaving VS Code.

It adds clickable links to dependency names in supported manifest files, an **Inspector** for resolving packages and manifests, and a **Dependency Graph** for viewing dependencies grouped by type.

## Features

### Open dependency repositories from package files

Open a supported manifest and hover a dependency name.

Dependency Links resolves the package through the npm registry and opens:

- the package repository when repository metadata is available
- the npm package page as a fallback

Supported dependency sections include:

- `dependencies`
- `devDependencies`
- `peerDependencies`
- `optionalDependencies`
- `bundledDependencies`
- `bundleDependencies`

For `package.json`, dependency names are detected from JSON/JSONC structure.

For YAML files, dependency names are detected inside supported dependency sections.

### Explore workspace dependencies

Run:

```text
Dependency Links: Open Dependency Graph
```

from the Command Palette to open the **Dependency Explorer**.

The explorer discovers workspace `package.json` files automatically and provides:

- an interactive dependency graph with direct and one-hop transitive relationships
- workspace/package scope and dependency-type filters
- package search and a package list view
- source references for imports, type imports, dynamic imports, `require()`, and re-exports
- dependents and dependencies impact analysis
- declared, resolved, and latest package version context
- repository, npm, and homepage links for the selected package

Select a package once to synchronize the graph, package details, impact tabs, and source references. Double-click a graph node to open its repository or npm page when available.

The explorer still supports pasted JSON or YAML through **Manual manifest** in the sidebar.

### Inspect packages and manifests

Run:

```text
Dependency Links: Open Inspector
```

from the Command Palette.

The Inspector accepts several input formats.

#### npm package

```text
react
```

You can also include a version or range:

```text
react@^19
@scope/package@1.2.3
```

#### GitHub repository

```text
facebook/react
```

or:

```text
https://github.com/facebook/react
```

#### package.json content

```json
{
  "dependencies": {
    "react": "^19.0.0"
  },
  "devDependencies": {
    "vite": "^8.0.0"
  }
}
```

#### Dependency object

You can paste only the dependency map:

```json
{
  "react": "^19.0.0",
  "vite": "^8.0.0"
}
```

#### YAML

```yaml
dependencies:
  react: ^19.0.0

devDependencies:
  vite: ^8.0.0
```

#### Manifest URL

Paste an HTTP or HTTPS URL whose response contains supported JSON or YAML dependency data.

The Inspector fetches the manifest and resolves its dependencies.

## Inspector results

Resolved packages are grouped by dependency type when that information is available.

Each result can provide:

- **Repository** — opens the source repository when npm metadata provides one
- **npm** — opens the package on npm
- **Homepage** — opens the package homepage when available

The Inspector remembers the text you entered while the webview remains available in VS Code.

## Using clickable dependency links

Open a `package.json` or supported YAML file and move the pointer over a dependency name.

For example:

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

The dependency names become VS Code document links.

When you open one, Dependency Links queries the npm registry for package metadata. If the package declares a repository, that repository is opened. Otherwise, the package's npm page is opened.

## Supported files

### package.json

Dependency links are registered for:

```text
**/package.json
```

with JSON and JSONC language modes.

### YAML

Dependency links are registered for:

```text
**/*.yaml
**/*.yml
```

with YAML language mode.

Only entries nested under supported dependency sections are treated as package dependencies.

## Command Palette

Dependency Links contributes these commands:

| Command                                   | Description                                             |
| ----------------------------------------- | ------------------------------------------------------- |
| `Dependency Links: Open Inspector`        | Opens the dependency resolver and repository inspector. |
| `Dependency Links: Open Dependency Graph` | Opens the dependency graph view.                        |

Open the Command Palette with:

- macOS: `Cmd+Shift+P`
- Windows/Linux: `Ctrl+Shift+P`

then search for **Dependency Links**.

## How resolution works

For npm packages, Dependency Links reads package metadata from the npm registry.

Repository URLs are normalized when common Git URL forms are used, including:

```text
git+https://github.com/owner/repo.git
git://github.com/owner/repo.git
git@github.com:owner/repo.git
```

When repository metadata is unavailable or cannot be resolved, the npm package page remains available.

## Network access

Dependency resolution may contact:

```text
https://registry.npmjs.org/
```

The Inspector can also fetch a URL when you explicitly paste an HTTP or HTTPS manifest URL.

Repository, npm, Homepage, and graph links use standard HTTPS links and open outside the webview.

## Troubleshooting

### A dependency is not clickable

Confirm that:

1. the file is a `package.json`, `.yaml`, or `.yml` file
2. VS Code recognizes the document as JSON, JSONC, or YAML
3. the dependency is inside a supported dependency section

For YAML, indentation determines whether an entry belongs to a dependency section.

### A link opens npm instead of the repository

The npm registry metadata for that package did not provide a usable repository URL, or the metadata lookup could not be completed.

The npm page is used as the fallback.

### The Inspector returns no dependencies

For pasted JSON or YAML, make sure the content contains one of the supported dependency sections.

A plain JSON object is also supported when every value is a string dependency specification.

Example:

```json
{
  "react": "^19",
  "vite": "^8"
}
```

### A manifest URL cannot be loaded

The URL must use HTTP or HTTPS and return content that Dependency Links can interpret as supported JSON, YAML, a package name, or repository input.

Remote servers may also reject or restrict the request.

## Current scope

Dependency Links currently focuses on npm-style package metadata and package manifest dependency sections.

It does not attempt to install, upgrade, remove, or modify dependencies.

Its purpose is navigation and inspection: helping you move quickly from a dependency reference to the package's repository, npm page, or homepage.


## Development

Run the browser preview workspace:

```sh
npm run dev
```

This opens `/previews/`, where you can switch between every available webview, reload the active preview, copy its URL, or open it in a separate tab.

Direct preview commands are also available:

```sh
npm run dev:inspector
npm run dev:explorer
```
