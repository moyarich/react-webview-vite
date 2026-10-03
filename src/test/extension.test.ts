import * as assert from "assert";
import {
  extractDependenciesFromJson,
  extractDependenciesFromYaml,
  normalizeRepositoryUrl,
  parsePackageSpecifier,
} from "../dependencies";

suite("Dependency resolver", () => {
  test("extracts supported package.json dependency sections", () => {
    const results = extractDependenciesFromJson({
      dependencies: { react: "^19.0.0" },
      devDependencies: { vite: "^8.0.0" },
      peerDependencies: { typescript: ">=5" },
      optionalDependencies: { fsevents: "^2.3.3" },
    });

    assert.deepStrictEqual(
      results.map(({ name, kind }) => ({ name, kind })),
      [
        { name: "react", kind: "dependencies" },
        { name: "vite", kind: "devDependencies" },
        { name: "typescript", kind: "peerDependencies" },
        { name: "fsevents", kind: "optionalDependencies" },
      ],
    );
  });

  test("accepts a pasted dependency object", () => {
    const results = extractDependenciesFromJson({
      react: "^19.0.0",
      vite: "^8.0.0",
    });

    assert.deepStrictEqual(
      results.map(({ name, spec }) => ({ name, spec })),
      [
        { name: "react", spec: "^19.0.0" },
        { name: "vite", spec: "^8.0.0" },
      ],
    );
  });

  test("extracts YAML dependency sections by indentation", () => {
    const results = extractDependenciesFromYaml(
      "dependencies:\n  react: ^19.0.0\ndevDependencies:\n  vite: \"^8.0.0\"\nscripts:\n  test: vitest\n",
    );

    assert.deepStrictEqual(
      results.map(({ name, spec, kind }) => ({ name, spec, kind })),
      [
        { name: "react", spec: "^19.0.0", kind: "dependencies" },
        { name: "vite", spec: "^8.0.0", kind: "devDependencies" },
      ],
    );
  });

  test("parses scoped and unscoped package specifiers", () => {
    assert.deepStrictEqual(parsePackageSpecifier("react@^19"), {
      name: "react",
      spec: "^19",
    });
    assert.deepStrictEqual(parsePackageSpecifier("@scope/pkg@1.2.3"), {
      name: "@scope/pkg",
      spec: "1.2.3",
    });
    assert.deepStrictEqual(parsePackageSpecifier("@scope/pkg"), {
      name: "@scope/pkg",
    });
  });

  test("normalizes common GitHub repository URL forms", () => {
    assert.strictEqual(
      normalizeRepositoryUrl("git+https://github.com/facebook/react.git"),
      "https://github.com/facebook/react",
    );
    assert.strictEqual(
      normalizeRepositoryUrl("git@github.com:facebook/react.git"),
      "https://github.com/facebook/react",
    );
  });
});
