// EDINET codes look like "E02144". Shared by server and client code.
export function isEdinetCode(value: string): boolean {
  return /^E\d{5}$/.test(value);
}

// Link to the original securities report on the FSA's EDINET viewer.
export function edinetDocumentUrl(docId: string): string {
  return `https://disclosure2.edinet-fsa.go.jp/WZEK0040.aspx?${docId}`;
}
