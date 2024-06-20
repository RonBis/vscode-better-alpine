/**
 * All alpine symbols in a HTML document.
 */
export type AlpineSymbolTable = AlpineSymbols[];
/**
 * Alpine attributes for a single HTML tag.
 */
export type AlpineSymbols = {
  attributes: AlpineAttribute[];
};
/**
 * Properties for a single alpine attribute.
 */
export type AlpineAttribute = {
  xattr: string;
  xvalue: string;
  sourceRange: {
    start: number;
    end: number;
  };
  generatedRange: {
    start: number;
    end: number;
  };
};
