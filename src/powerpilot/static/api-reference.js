const status = document.querySelector("#api-status");
const container = document.querySelector("#api-endpoints");
const search = document.querySelector("#api-search");
const operations = [];
const element = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
};
function section(title, payload) {
  const node = element("section", undefined, "contract-section");
  node.append(element("h3", title), element("pre", JSON.stringify(payload, null, 2)));
  return node;
}
try {
  const response = await fetch("/openapi.json");
  if (!response.ok) throw new Error("接口定义暂时无法读取，请检查本地服务。");
  const schema = await response.json();
  for (const [path, methods] of Object.entries(schema.paths)) {
    for (const [method, contract] of Object.entries(methods)) {
      if (!["get", "post", "put", "patch", "delete", "options", "head"].includes(method)) continue;
      const card = element("details", undefined, "endpoint-card");
      const summary = element("summary");
      summary.append(element("span", method.toUpperCase(), "method method-" + method), element("code", path), element("span", contract.summary || "", "endpoint-summary"));
      card.append(summary);
      if (contract.description) card.append(element("p", contract.description, "endpoint-description"));
      if (contract.parameters) card.append(section("请求参数", contract.parameters));
      if (contract.requestBody) card.append(section("请求内容", contract.requestBody));
      card.append(section("响应", contract.responses));
      operations.push({ node: card, text: [method, path, contract.summary, contract.description].join(" ").toLowerCase() });
      container.append(card);
    }
  }
  for (const [name, definition] of Object.entries(schema.components?.schemas || {})) {
    const card = element("details", undefined, "schema-definition");
    card.append(element("summary", name), element("pre", JSON.stringify(definition, null, 2)));
    document.querySelector("#api-schemas").append(card);
  }
  status.textContent = `${operations.length} 个接口 · ${schema.info.title} ${schema.info.version}`;
  search.addEventListener("input", () => {
    const query = search.value.trim().toLowerCase();
    let count = 0;
    operations.forEach(({ node, text }) => { node.hidden = !text.includes(query); if (!node.hidden) count++; });
    status.textContent = count ? `显示 ${count} 个接口` : "没有匹配的接口，试试其他关键词。";
  });
} catch (error) { status.textContent = error.message; }
