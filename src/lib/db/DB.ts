//import sqlite3, {Database} from 'sqlite3';
import { Database, Sqlite3Static } from "@sqlite.org/sqlite-wasm";
import sqlite3InitModule from "@sqlite.org/sqlite-wasm"; // https://github.com/sqlite/sqlite-wasm
//import sqlite3InitModule from "../sqlean/sqlean"; // https://github.com/nalgeon/sqlean.js

import {
  createSqliteWasmPersister,
  SqliteWasmPersister,
} from "tinybase/debug/persisters/persister-sqlite-wasm";

import { createStore, Store } from "tinybase";
import { error, log } from "../utils";
import {
  createIndexedDbPersister,
  IndexedDbPersister,
} from "tinybase/persisters/persister-indexed-db";
import { initTables, initValues } from "./seed";
import { databasePersisterConfig, tablesSchema, valuesSchema } from "./types";

export const createNewStore = (): Store => {
  log("New store created.");
  return createStore()
    .setValuesSchema(valuesSchema)
    .setTablesSchema(tablesSchema)
  ;
  // data init done in persister auto load
};

export const bootstrapSqlite3Instance = async (): Promise<Sqlite3Static> => {
  const sqlite3 = await sqlite3InitModule({
    print: log,
    printErr: error,
  });
  if (sqlite3) {
    log("Loaded SQLite3 version", sqlite3.version.libVersion);
  }
  return sqlite3;
};

export const bootstrapPersisterSqlite3 = async (
  sqlite3: Sqlite3Static,
  store: Store,
  arrayBuffer?: ArrayBuffer,
  mainPersister?: IndexedDbPersister
): Promise<SqliteWasmPersister> => {
  let db;
  if (arrayBuffer) {
    db = await deserializeSqlite(arrayBuffer, sqlite3);
    log("Deserialized SQLite3 database from file");
  } else {
    db = new sqlite3.oo1.DB(":memory:", "c");
    log("Created new SQLite3 database");
  }

  const sqlite3Persister = createSqliteWasmPersister(
    store,
    sqlite3,
    db,
    databasePersisterConfig,
  );
  log("Sqlite3 persister created");

  if (arrayBuffer && mainPersister) {
    // stop using main until we load from sqlite db
    await mainPersister.stopAutoLoad();
    await mainPersister.stopAutoSave();

    // load from sqlite db once -> Store
    await sqlite3Persister.load(initTables, initValues);
    // auto save all further updates to sqlite db
    await sqlite3Persister.startAutoSave();

    // save to main and resume auto load from main
    await mainPersister.save();
    await mainPersister.startAutoLoad(initTables, initValues);
    await mainPersister.startAutoSave();
    /* some of these steps might not be needed... */
  } else {
    await sqlite3Persister.startAutoSave();
  }
  return sqlite3Persister;
};

export const bootstrapPersisterIndexedDB = async (
  store: Store
): Promise<IndexedDbPersister> => {
  const persister = createIndexedDbPersister(store, "tinybase", 1);
  log("IndexedDB persister created");

  await persister.startAutoLoad(initTables, initValues);
  await persister.startAutoSave();
  return persister;
};

export const deserializeSqlite = async (
  buffer: ArrayBuffer,
  sqlite3Instance: Sqlite3Static
): Promise<Database> => {
  const db = new sqlite3Instance.oo1.DB();
  const p = sqlite3Instance.wasm.allocFromTypedArray(buffer);
  /* https://sqlite.org/wasm/doc/trunk/api-c-style.md#sqlite3_deserialize */
  db.onclose = {
    after: function () {
      sqlite3Instance.wasm.dealloc(p);
    },
  };
  let deserialize_flags = sqlite3Instance.capi.SQLITE_DESERIALIZE_FREEONCLOSE;
  deserialize_flags |= sqlite3Instance.capi.SQLITE_DESERIALIZE_RESIZEABLE;
  const rc = sqlite3Instance.capi.sqlite3_deserialize(
    db,
    "main",
    p,
    buffer.byteLength,
    buffer.byteLength,
    deserialize_flags
  );
  return db.checkRc(rc);
};

export const exportDb = async (
  persister: SqliteWasmPersister,
  sqlite3: Sqlite3Static
) => {
  await persister.save();
  const byteArray = sqlite3.capi.sqlite3_js_db_export(persister.getDb());

  const blob = new Blob([byteArray.buffer], {
    type: "application/x-sqlite3",
  });

  const a = document.createElement("a");
  document.body.appendChild(a);
  a.href = URL.createObjectURL(blob);
  a.download = `${Date.now()}.db`;
  a.addEventListener("click", function () {
    setTimeout(function () {
      window.URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
  });
  a.click();
};

export const useIndexedDB = async (
  indexedDBPersister: IndexedDbPersister | null,
  setIndexedDBPersister: React.Dispatch<
    React.SetStateAction<IndexedDbPersister | null>
  >,
  store: Store
) => {
  if (indexedDBPersister !== null) await indexedDBPersister.destroy();
  const persister = await bootstrapPersisterIndexedDB(store);
  if (persister) {
    setIndexedDBPersister(persister);
  }
  return persister;
};

export const useSqlite3 = async (
  sqlite3Persister: SqliteWasmPersister | null,
  setSqlite3Persister: React.Dispatch<
    React.SetStateAction<SqliteWasmPersister | null>
  >,
  sqlite3Instance: Sqlite3Static | null,
  setSqlite3Instance: React.Dispatch<
    React.SetStateAction<Sqlite3Static | null>
  >,
  store: Store,
  arrayBuffer?: ArrayBuffer,
  mainPersister?: IndexedDbPersister
): Promise<{ persister: SqliteWasmPersister; sqlite3: Sqlite3Static }> => {
  if (sqlite3Persister !== null) await sqlite3Persister.destroy();

  let persister: SqliteWasmPersister | null = null;
  let sqlite3: Sqlite3Static | null = sqlite3Instance;
  if (!sqlite3) {
    sqlite3 = await bootstrapSqlite3Instance();
    setSqlite3Instance(sqlite3);
  }
  persister = await bootstrapPersisterSqlite3(
    sqlite3,
    store,
    arrayBuffer,
    mainPersister
  );
  if (persister) {
    setSqlite3Persister(persister);
  }
  return { persister, sqlite3 };
};

export const resetPersistentStorage = async (
  store: Store,
  indexedDBPersister: IndexedDbPersister | null,
  setIndexedDBPersister: React.Dispatch<
    React.SetStateAction<IndexedDbPersister | null>
  >
) => {
  if (indexedDBPersister !== null) {
    store.delTables();
    store.delValues();
    indexedDBPersister.destroy();
    indexedDB.deleteDatabase("tinybase");
    useIndexedDB(indexedDBPersister, setIndexedDBPersister, store);
  }
};

export const _clearData = async (store: Store) => {
  store.delTables();
  store.delValues();
};
