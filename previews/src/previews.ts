export type PreviewDefinition = {
  id: string;
  route: string;
  title: string;
  description: string;
  iframePath: string;
};

export const previews: PreviewDefinition[] = [
  {
    id: "inspector",
    route: "inspector",
    title: "Inspector",
    description: "Resolve npm packages, repositories, manifests, JSON, YAML, and URLs.",
    iframePath: "/previews/inspector.html",
  },
  {
    id: "dependency-explorer",
    route: "dependency-explorer",
    title: "Dependency Explorer",
    description: "Explore package relationships, references, impact, filters, and version context.",
    iframePath: "/previews/dependency-graph.html",
  },
];

export const defaultPreviewRoute = previews[1].route;
