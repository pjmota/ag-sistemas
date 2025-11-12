const BASE = "/branding/";
const ENV_LOGO = process.env.NEXT_PUBLIC_LOGO_FILE?.trim();

// Lista de candidatos: se ENV definir o arquivo, tenta ele primeiro, depois cai para formatos comuns.
export const logoSrcList: string[] = [
  ...(ENV_LOGO ? [BASE + ENV_LOGO] : []),
  ...["logo.png", "logo.svg", "logo.webp", "logo.jpg", "logo.jpeg"].map((f) => BASE + f),
];