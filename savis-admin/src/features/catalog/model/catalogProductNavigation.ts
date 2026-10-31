/** Keep list context in the URL so it survives reloads and analysis mode changes. */
export function catalogReturnTo(search: string, productId?: string) {
  const target = new URLSearchParams(search).get("returnTo");
  if (
    target === "/catalog-products" ||
    target?.startsWith("/catalog-products?")
  )
    return target;
  const params = new URLSearchParams();
  if (productId) params.set("selected", productId);
  return `/catalog-products${params.size ? `?${params}` : ""}`;
}

export function catalogProductWorkspaceLink(
  productId: string,
  workspace: "edit" | "analysis",
  returnTo: string,
) {
  return `/catalog-products/${productId}/${workspace}?${new URLSearchParams({ returnTo })}`;
}

export function catalogListReturnTo(search: string, productId: string) {
  const params = new URLSearchParams(search);
  params.set("selected", productId);
  return `/catalog-products?${params}`;
}
