import { CellSchema, DatabasePersisterConfig, TablesSchema, ValuesSchema } from "tinybase";
import { transactionsSchema } from "./models/transactions";
import { categoriesSchema } from "./models/categories";

export type TableSchema = { [cellId: string]: CellSchema };

export const tablesSchema: TablesSchema = {
  transactions: transactionsSchema,
  categories: categoriesSchema,
};

export const databasePersisterConfig: DatabasePersisterConfig  = {
  mode: 'tabular',
  tables: {
    save: { transactions: 'transactions', categories: 'categories'},
    load: { transactions: 'transactions', categories: 'categories'},
  }
}

export const valuesSchema: ValuesSchema = {};