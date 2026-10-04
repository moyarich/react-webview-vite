import type { DependencyKind, DependencyResult } from "../shared/types";
import {
  extractDependenciesFromJson,
  extractDependenciesFromYaml,
  parsePackageSpecifier,
} from "./parse";

type PackageMetadata = {
  homepage?: string;
  repository?: string | { url?: string };
};

const metadataCache = new Map<string, Promise<DependencyResult>>();

export function npmPackageUrl(name: string) {
  return `https://www.npmjs.com/package/${encodeURIComponent(name)}`;
}

export function normalizeRepositoryUrl(value?: string) {
  if (!value) {
    return undefined;
  }

  return value
    .replace(/^git\+/, "")
    .replace(/^git:\/\/github\.com\//, "https://github.com/")
    .replace(/^git@github\.com:/, "https://github.com/")
    .replace(/\.git$/, "");
}

export async function resolvePackage(
  name: string,
  spec?: string,
  kind: DependencyKind = "input",
): Promise<DependencyResult> {
  const cacheKey = `${name}\0${spec ?? ""}\0${kind}`;
  const cached = metadataCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const request = (async () => {
    const npmUrl = npmPackageUrl(name);

    try {
      const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        return { name, spec, kind, npmUrl };
      }

      const metadata = (await response.json()) as PackageMetadata;
      const repositoryValue =
        typeof metadata.repository === "string" ? metadata.repository : metadata.repository?.url;

      return {
        name,
        spec,
        kind,
        npmUrl,
        repositoryUrl: normalizeRepositoryUrl(repositoryValue),
        homepageUrl: metadata.homepage,
      };
    } catch {
      return { name, spec, kind, npmUrl };
    }
  })();

  metadataCache.set(cacheKey, request);
  return request;
}

export async function resolveInput(input: string): Promise<DependencyResult[]> {
  const value = input.trim();
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    const dependencies = extractDependenciesFromJson(parsed);
    if (dependencies.length > 0) {
      return Promise.all(
        dependencies.map((entry) => resolvePackage(entry.name, entry.spec, entry.kind)),
      );
    }
  } catch {
    // Not JSON; continue with URL, YAML, or package-name handling.
  }

  const yamlDependencies = extractDependenciesFromYaml(value);
  if (yamlDependencies.length > 0) {
    return Promise.all(
      yamlDependencies.map((entry) => resolvePackage(entry.name, entry.spec, entry.kind)),
    );
  }

  if (/^https?:\/\//i.test(value)) {
    const url = new URL(value);
    const githubMatch =
      url.hostname === "github.com"
        ? url.pathname.match(/^\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/)
        : undefined;

    if (githubMatch) {
      return [
        {
          name: `${githubMatch[1]}/${githubMatch[2]}`,
          kind: "input",
          npmUrl: value,
          repositoryUrl: value.replace(/\.git\/?$/, ""),
        },
      ];
    }

    const response = await fetch(value);
    if (!response.ok) {
      throw new Error(`Unable to fetch manifest: HTTP ${response.status}`);
    }

    const body = await response.text();
    return resolveInput(body);
  }

  if (/^[\w.-]+\/[\w.-]+$/.test(value)) {
    return [
      {
        name: value,
        kind: "input",
        npmUrl: `https://github.com/${value}`,
        repositoryUrl: `https://github.com/${value}`,
      },
    ];
  }

  const packageSpec = parsePackageSpecifier(value);
  return [await resolvePackage(packageSpec.name, packageSpec.spec)];
}
