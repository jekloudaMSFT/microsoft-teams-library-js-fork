/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { LoadContext } from '../public';
import { pages } from '../public/pages';
import { Communication, sendMessageEventToChild, sendMessageToParent } from './communication';

/** @internal */
class HandlersPrivate {
  public static handlers: {
    [func: string]: Function;
  } = {};
  public static themeChangeHandler: (theme: string) => void;
  public static loadHandler: (context: LoadContext) => void;
  public static beforeUnloadHandler: (readyToUnload: () => void) => boolean;
}

/** @internal */
export function initializeHandlers(): void {
  // ::::::::::::::::::::MicrosoftTeams SDK Internal :::::::::::::::::
  HandlersPrivate.handlers['themeChange'] = handleThemeChange;
  HandlersPrivate.handlers['load'] = handleLoad;
  HandlersPrivate.handlers['beforeUnload'] = handleBeforeUnload;
  pages.backStack._initialize();
}

/** @internal */
export function callHandler(name: string, args?: any[]): [true, any] | [false, undefined] {
  const handler = HandlersPrivate.handlers[name];
  if (handler) {
    const result = handler.apply(this, args);
    return [true, result];
  } else {
    return [false, undefined];
  }
}

/** @internal */
export function registerHandler(name: string, handler: Function, sendMessage = true, args: any[] = []): void {
  if (handler) {
    HandlersPrivate.handlers[name] = handler;
    sendMessage && sendMessageToParent('registerHandler', [name, ...args]);
  } else {
    delete HandlersPrivate.handlers[name];
  }
}

/** @internal */
export function removeHandler(name: string): void {
  delete HandlersPrivate.handlers[name];
}

/** @internal */
export function registerOnThemeChangeHandler(handler: (theme: string) => void): void {
  HandlersPrivate.themeChangeHandler = handler;
  handler && sendMessageToParent('registerHandler', ['themeChange']);
}

/** @internal */
export function handleThemeChange(theme: string): void {
  if (HandlersPrivate.themeChangeHandler) {
    HandlersPrivate.themeChangeHandler(theme);
  }

  if (Communication.childWindow) {
    sendMessageEventToChild('themeChange', [theme]);
  }
}

/** @internal */
export function registerOnLoadHandler(handler: (context: LoadContext) => void): void {
  HandlersPrivate.loadHandler = handler;
  handler && sendMessageToParent('registerHandler', ['load']);
}

/** @internal */
function handleLoad(context: LoadContext): void {
  if (HandlersPrivate.loadHandler) {
    HandlersPrivate.loadHandler(context);
  }

  if (Communication.childWindow) {
    sendMessageEventToChild('load', [context]);
  }
}

/** @internal */
export function registerBeforeUnloadHandler(handler: (readyToUnload: () => void) => boolean): void {
  HandlersPrivate.beforeUnloadHandler = handler;
  handler && sendMessageToParent('registerHandler', ['beforeUnload']);
}

/** @internal */
function handleBeforeUnload(): void {
  const readyToUnload = (): void => {
    sendMessageToParent('readyToUnload', []);
  };

  if (!HandlersPrivate.beforeUnloadHandler || !HandlersPrivate.beforeUnloadHandler(readyToUnload)) {
    readyToUnload();
  }
}
