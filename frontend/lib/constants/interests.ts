export type InterestOption = {
  id: string;
  label: string;
};

export const INTERESTS: readonly InterestOption[] = [
  { id: "math", label: "Matemática" },
  { id: "statistics", label: "Estatística" },
  { id: "physics", label: "Física" },
  { id: "chemistry", label: "Química" },
  { id: "programming", label: "Programação" },
  { id: "engineering", label: "Engenharia" },
  { id: "biology", label: "Biologia" },
  { id: "health", label: "Saúde" },
  { id: "anatomy", label: "Anatomia" },
  { id: "physical-education", label: "Ed. Física" },
  { id: "history", label: "História" },
  { id: "geography", label: "Geografia" },
  { id: "philosophy", label: "Filosofia" },
  { id: "sociology", label: "Sociologia" },
  { id: "psychology", label: "Psicologia" },
  { id: "literature", label: "Literatura" },
  { id: "languages", label: "Idiomas" },
  { id: "writing", label: "Redação" },
  { id: "arts", label: "Artes" },
  { id: "law", label: "Direito" },
  { id: "economics", label: "Economia" },
  { id: "research", label: "Pesquisa" },
  { id: "study", label: "Estudos" },
] as const;

export const INTEREST_GROUPS = [
  {
    title: "Exatas e Tecnologia",
    itemIds: ["math", "statistics", "physics", "chemistry", "programming", "engineering"],
  },
  {
    title: "Biológicas e Saúde",
    itemIds: ["biology", "health", "anatomy", "physical-education"],
  },
  {
    title: "Humanas",
    itemIds: ["history", "geography", "philosophy", "sociology", "psychology"],
  },
  {
    title: "Linguagens",
    itemIds: ["literature", "languages", "writing", "arts"],
  },
  {
    title: "Aplicadas e Profissionais",
    itemIds: ["law", "economics"],
  },
  {
    title: "Acadêmico e Produtividade",
    itemIds: ["research", "study"],
  },
] as const;

export const INTEREST_OPTIONS_BY_ID: Readonly<Record<string, InterestOption>> = Object.freeze(
  Object.fromEntries(INTERESTS.map((interest) => [interest.id, interest]))
);

export const AVAILABLE_INTERESTS = INTERESTS.map((interest) => interest.id);

const LEGACY_LABEL_TO_ID = Object.freeze(
  Object.fromEntries(INTERESTS.map((interest) => [interest.label.toLowerCase(), interest.id]))
);

export function normalizeInterestIds(interests: unknown): string[] {
  if (!Array.isArray(interests)) return [];

  const normalized = interests
    .map((value) => {
      if (typeof value !== "string") return null;
      const trimmed = value.trim();
      if (!trimmed) return null;
      const byId = INTEREST_OPTIONS_BY_ID[trimmed];
      if (byId) return byId.id;
      return LEGACY_LABEL_TO_ID[trimmed.toLowerCase()] ?? null;
    })
    .filter((value): value is string => Boolean(value));

  return Array.from(new Set(normalized));
}

export function getInterestLabel(id: string): string {
  return INTEREST_OPTIONS_BY_ID[id]?.label ?? id;
}
