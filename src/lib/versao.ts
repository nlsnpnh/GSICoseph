// A versão vive no package.json e é injetada no build pelo vite.config.ts.
// Manter uma fonte só evita o clássico "esqueci de atualizar em um dos dois".

/** Versão da aplicação, ex.: "1.1.0". */
export const APP_VERSION: string = __APP_VERSION__;
