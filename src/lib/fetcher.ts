const fetcher = (...args: Parameters<typeof fetch>) =>
  fetch(...args).then((res) => res.text());

export default fetcher;

