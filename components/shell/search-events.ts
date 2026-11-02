/** Dispatch on window (e.g. from the mobile tab bar) to open the command search. */
export const OPEN_SEARCH_EVENT = "shoowflix:open-search";

export function openCommandSearch() {
  window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
}
