import { Store } from "tinybase";
import Papa from "papaparse";
import { TableSchema } from "../types";
import { isObjEmpty } from "../../utils";

/* https://www.bankofmaldives.com.mv/internetbanking/api/account/{ID}/download/csv */
/* These fields or order may change at any time from BML systems */
export interface BML_CSV_DataFields {
  date: string; // YYYY-MM-DD
  date_: string; // same?
  type: string; // "Purchase" | "Transfer Debit" | "Transfer Credit" | "Salary" | "ATM Withdrawal" | ...
  ref: string; // TRFDBT = BLAZxxx... , TRFCRT = B24xxx... , CARD = RB0xxx... , ATM = 0000xxx...
  trx: string; // FTxxx...
  from: string;
  to: string;
  loc: string;
  debited: number;
  credited: number;
  balance: number;
}
/* CSV export available from Internet Banking frontend */

export const transactionsSchema : TableSchema = {
  date: { type: "string" },
  date_: { type: "string" },
  type: { type: "string" },
  ref: { type: "string" },
  trx: { type: "string" },
  from: { type: "string" },
  to: { type: "string" },
  loc: { type: "string" },
  debited: { type: "number" },
  credited: { type: "number" },
  balance: { type: "number" },
  /* CUSTOM FIELDS BELOW */
  category: { type: "string", default: "_undefined_"},
  note: { type: "string", default: "_undefined_"},
};

export const cmd_createRecords = (store: Store, rows: BML_CSV_DataFields[]) => {
  // dont confuse db transaction and bank transactions table ;)
  store.transaction(() => {
    rows.forEach((row) => {
      if (!isObjEmpty(store.getRow("transactions", row.ref))) return;
      store.setRow("transactions", row.ref, {
        date: row.date,
        date_: row.date_,
        type: row.type,
        ref: row.ref,
        trx: row.trx,
        from: row.from,
        to: row.to,
        loc: row.loc,
        debited: row.debited,
        credited: row.credited,
        balance: row.balance,
        /* CUSTOM FIELDS BELOW */
        category: "_undefined_",
        note: "_undefined_",
      });
    });
  });
};

export const cmd_removeCategory = (store: Store, category: string) => {
  store.transaction(() => {
    store.delRow("categories", category);
  });
};

export const cmd_removeTransaction = (store: Store, transactionId: string) => {
  store.transaction(() => {
    store.delRow("transactions", transactionId);
  });
};

export const cmd_changeCategory = (store: Store, transactionId: string, category: string) => {
  if (isObjEmpty(store.getRow("transactions", transactionId))) return;
  store.transaction(() => {
    store.setCell("transactions", transactionId, "category", category);
  });
};

export const cmd_applyCategory = (store: Store, to: string, category: string) => {
 store.transaction(() => {
   store.forEachRow("transactions", (transactionId) => {
     const row = store.getRow("transactions", transactionId);
     if (row.to === to && row.category === "_undefined_") {
       store.setCell("transactions", transactionId, "category", category);
     }
   });
 });
};

export const cmd_changeNote = (store: Store, transactionId: string, note: string) => {
  if (isObjEmpty(store.getRow("transactions", transactionId))) return;
  store.transaction(() => {
    store.setCell("transactions", transactionId, "note", note);
  });
};

export const parseCSVData = (data: any) : BML_CSV_DataFields[] => {
    const transformFields = (row: string[]): BML_CSV_DataFields | null => {
        if (row.length !== 11) return null;
        const [date, date_, type, ref, trx, from, to, loc, debited, credited, balance] = row;
        return {
          date,
          date_,
          type,
          ref: ref.replace(/^="|"$|"/g, ""),
          trx: trx.replace(/^="|"$|"/g, ""),
          from: from.match(/^\d{2}-\d{2}-\d{4}/) || from.match(/^\d{4}-\d{2}-\d{2}/) ? "" : from,
          to: to.replace(/^="|"$|"/g, ""),
          loc,
          debited: parseFloat(debited),
          credited: parseFloat(credited),
          balance: parseFloat(balance),
        };
    };

    const parsed: BML_CSV_DataFields[] = [];
    Papa.parse(data, {
        complete: (result: any) => {
            result?.data.forEach((row: string[]) => {
                const transformedRow = transformFields(row);
                if (transformedRow) parsed.push(transformedRow);
            });
        },
    });
    return parsed;
};