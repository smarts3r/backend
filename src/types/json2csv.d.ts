declare module "json2csv" {
  import { ParserOptions } from "json2csv/lib/Parser";

  export class Parser<T = any> {
    constructor(opts?: ParserOptions<T>);
    parse(data: T): string;
  }
}
