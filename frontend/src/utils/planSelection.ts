export function selectedPlanId(search: string) {
  const value = new URLSearchParams(search).get("plan") ?? "";
  return /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value))
    ? value
    : "";
}
