import {
  defaultWebviewMessages,
  type WebviewMessages,
} from "../../shared/localization";

declare global {
  interface Window {
    __DEPENDENCY_LINKS_L10N__?: Partial<WebviewMessages>;
  }
}

export const messages: WebviewMessages = {
  ...defaultWebviewMessages,
  ...(window.__DEPENDENCY_LINKS_L10N__ ?? {}),
};
