const fetcher = async (...args: Parameters<typeof fetch>) => {
  const response = await fetch(...args);
  // fetch() resolves on 4xx/5xx, so an error page would be returned as a body.
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.text();
};

export default fetcher;

