/**
 * All alpine symbols in a HTML document.
 */
export type AlpineSymbolTable = AlpineSymbols[];
/**
 * Alpine attributes for a single HTML tag.
 */
export type AlpineSymbols = {
  attributes: AlpineAttribute[];
  scope: {
    start: number;
    end: number;
  };
};
/**
 * Properties for a single alpine attribute.
 */
export type AlpineAttribute = {
  x_attr: string;
  x_value: string;
  textrange: {
    start: number;
    end: number;
  };
};
