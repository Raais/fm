import { Sqlite3Static } from "@sqlite.org/sqlite-wasm";
import React, { createContext, useContext } from "react";
import { IndexedDbPersister } from "tinybase/persisters/persister-indexed-db";
import { SqliteWasmPersister } from "tinybase/persisters/persister-sqlite-wasm";

interface Context {
  indexedDBPersister?: IndexedDbPersister | null;
  sqlite3Persister?: SqliteWasmPersister | null;
  sqlite3Instance?: Sqlite3Static | null;

  setIndexedDBPersister?: React.Dispatch<React.SetStateAction<IndexedDbPersister | null>>;
  setSqlite3Persister?: React.Dispatch<React.SetStateAction<SqliteWasmPersister | null>>;
  setSqlite3Instance?: React.Dispatch<React.SetStateAction<Sqlite3Static | null>>;
}

export const PersisterContext = createContext<Context>({});
export const PersisterProvider = PersisterContext.Provider;
export const usePersister = () => useContext(PersisterContext);
