function capitalizeWord(word) {
  if (!word) return "";
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function titleCaseRealm(raw) {
  if (!raw) return "";

  return raw
    .split(/\s+/)           // split on spaces only
    .filter(Boolean)
    .map(token =>
      token
        .split("-")         // preserve dashes, but capitalize each piece
        .map(capitalizeWord)
        .join("-")
    )
    .join(" ");
}


export function formatCharacterId(input) {
  const clean = String(input ?? "").trim();
  if (!clean) {
    return { name: "", realm: "", full: "" };
  }

  // split only once logically: first chunk is name, the rest is realm
  const [rawName, ...realmParts] = clean.split("-");
  const name = capitalizeWord(rawName);

  const rawRealm = realmParts.join("-").trim();
  const realm = titleCaseRealm(rawRealm);

  const full = realm ? `${name}-${realm}` : name;

  return { name, realm, full };
}
