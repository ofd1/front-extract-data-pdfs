const ERROR_MAP: [RegExp, string][] = [
  [/Failed to fetch/i, "Não foi possível conectar ao servidor. Verifique sua conexão."],
  [/502/i, "O servidor está temporariamente indisponível. Tente novamente em instantes."],
  [/504/i, "O processamento demorou mais que o esperado. Tente com menos arquivos."],
  [/AbortError/i, "A requisição foi cancelada. Tente novamente."],
  [/NetworkError/i, "Erro de rede. Verifique sua conexão com a internet."],
];

export function humanizeError(raw: string): string {
  for (const [pattern, friendly] of ERROR_MAP) {
    if (pattern.test(raw)) return friendly;
  }
  return raw;
}
