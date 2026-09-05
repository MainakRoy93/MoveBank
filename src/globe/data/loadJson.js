const jsonCache = new Map();

export async function loadJson(source) {
  if (!source) {
    throw new Error('A JSON source URL is required.');
  }

  if (!jsonCache.has(source)) {
    jsonCache.set(
      source,
      fetch(source)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to load ${source}: ${response.status} ${response.statusText}`);
          }

          return response.json();
        })
        .catch((error) => {
          jsonCache.delete(source);
          throw error;
        }),
    );
  }

  return jsonCache.get(source);
}
