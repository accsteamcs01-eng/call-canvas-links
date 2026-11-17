/** Compare every editable value, including optional media and toggles. */
export function hasUnsavedChanges(current: string, saved: string): boolean {
  return current !== saved;
}

/** Only the existing required fields count toward completion; optional fields stay optional. */
export function formCompletion(
  name: string,
  validVideo: boolean,
  ringType: string,
  ringValue: string,
): number {
  const complete = [
    Boolean(name.trim()),
    validVideo,
    ringType !== "custom" || ringValue.startsWith("http"),
  ];
  return Math.round((complete.filter(Boolean).length / complete.length) * 100);
}
