export const openPostComposer = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-post-composer'));
  }
};

export const subscribeOpenPostComposer = (handler: () => void) => {
  if (typeof window === 'undefined') return () => {};
  const listener = () => handler();
  window.addEventListener('open-post-composer', listener);
  return () => window.removeEventListener('open-post-composer', listener);
};

export const openSearchMode = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-search-mode'));
  }
};

export const subscribeOpenSearchMode = (handler: () => void) => {
  if (typeof window === 'undefined') return () => {};
  const listener = () => handler();
  window.addEventListener('open-search-mode', listener);
  return () => window.removeEventListener('open-search-mode', listener);
};

export const notifyComposerOpened = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('composer-opened'));
  }
};

export const subscribeComposerOpened = (handler: () => void) => {
  if (typeof window === 'undefined') return () => {};
  const listener = () => handler();
  window.addEventListener('composer-opened', listener);
  return () => window.removeEventListener('composer-opened', listener);
};

export const notifyComposerClosed = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('composer-closed'));
  }
};

export const subscribeComposerClosed = (handler: () => void) => {
  if (typeof window === 'undefined') return () => {};
  const listener = () => handler();
  window.addEventListener('composer-closed', listener);
  return () => window.removeEventListener('composer-closed', listener);
};

export const notifyVisibilityPromptOpened = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('visibility-prompt-opened'));
  }
};

export const subscribeVisibilityPromptOpened = (handler: () => void) => {
  if (typeof window === 'undefined') return () => {};
  const listener = () => handler();
  window.addEventListener('visibility-prompt-opened', listener);
  return () => window.removeEventListener('visibility-prompt-opened', listener);
};

export const notifyVisibilityPromptClosed = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('visibility-prompt-closed'));
  }
};

export const subscribeVisibilityPromptClosed = (handler: () => void) => {
  if (typeof window === 'undefined') return () => {};
  const listener = () => handler();
  window.addEventListener('visibility-prompt-closed', listener);
  return () => window.removeEventListener('visibility-prompt-closed', listener);
};
