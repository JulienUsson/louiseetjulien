import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      // Client Prisma généré et composants shadcn : code tiers, non maintenu ici.
      "src/generated/**",
      "src/components/ui/**",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypeScript,
];

export default config;
