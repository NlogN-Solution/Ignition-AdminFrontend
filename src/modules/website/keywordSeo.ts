export function keywordInputs(seo: Record<string, unknown> | null | undefined) {
  return {
    primary_keyword: typeof seo?.primaryKeyword === "string" ? seo.primaryKeyword : "",
    secondary_keywords: Array.isArray(seo?.secondaryKeywords)
      ? seo.secondaryKeywords.filter((value): value is string => typeof value === "string").join(", ")
      : "",
  };
}

export function keywordSeo(existing: Record<string, unknown> | null | undefined, primary: string, secondary: string) {
  const primaryKeyword = primary.trim();
  const secondaryKeywords = [...new Map(
    secondary.split(/[,\n]/).map((value) => value.trim()).filter(
      (value) => value && value.toLowerCase() !== primaryKeyword.toLowerCase(),
    ).map((value) => [value.toLowerCase(), value]),
  ).values()];
  return { ...existing, primaryKeyword, secondaryKeywords };
}
