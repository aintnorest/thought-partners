export interface Flags {
  fixture: boolean;
  noimages: boolean;
  novoice: boolean;
  nowatch: boolean;
}

const TRUTHY_VALUES: Record<string, true> = { "1": true, true: true };

export function readFlags(search: string): Flags {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);

  return {
    fixture: TRUTHY_VALUES[params.get("fixture") ?? ""] === true,
    noimages: TRUTHY_VALUES[params.get("noimages") ?? ""] === true,
    novoice: TRUTHY_VALUES[params.get("novoice") ?? ""] === true,
    nowatch: TRUTHY_VALUES[params.get("nowatch") ?? ""] === true,
  };
}
