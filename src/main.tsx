import './fonts/GT-Walsheim/styles.css';
import "./index.css";

import { ConfigProvider, theme } from "antd";
import {
  Provider as StoreProvider,
  useCreateQueries,
  useCreateStore,
} from "tinybase/debug/ui-react";
import { createNewStore, useIndexedDB } from "./lib/db/DB";

import { FisaMatrix } from "./FisaMatrix";
import { IndexedDbPersister } from "tinybase/persisters/persister-indexed-db";
import { PersisterProvider } from "./context/PersisterContext";
import ReactDOM from "react-dom/client";
import { Sqlite3Static } from "@sqlite.org/sqlite-wasm";
import { SqliteWasmPersister } from "tinybase/persisters/persister-sqlite-wasm";
import { StoreInspector } from "tinybase/debug/ui-react-dom";
import TimeAgo from "javascript-time-ago";
import { appQueries } from "./lib/db/queries/queries";
import en from "javascript-time-ago/locale/en.json";
import { useState } from "react";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);
TimeAgo.addDefaultLocale(en);

const App = () => {
  const [indexedDBPersister, setIndexedDBPersister] =
    useState<IndexedDbPersister | null>(null);
  const [sqlite3Persister, setSqlite3Persister] =
    useState<SqliteWasmPersister | null>(null);
  const [sqlite3Instance, setSqlite3Instance] = useState<Sqlite3Static | null>(
    null
  );

  /*
  DATA LAYERS:
    Memory: [STORE] - TinyBase Store
    TinyBase Persisters: 
      [IndexedDB] - browser storage that persists data locally
      [SQLite3] - in-memory db for export/import data as SQLite db file

    Order:
      page load
      [STORE] empty
      [IndexedDB] load/init data -> [STORE]

      [STORE] changes -> [IndexedDB] // auto save
      [STORE] <- changes [IndexedDB] // auto load - polling 1 second

      manual import
      [file.db] load -> [SQLite3] overwrite data -> [STORE]
      [STORE] changes -> [IndexedDB] // auto save

      manual export
      [STORE] -> [SQLite3] -> [file.db]
  */

  const store = useCreateStore(() => {
    const store = createNewStore();
    useIndexedDB(indexedDBPersister, setIndexedDBPersister, store);
    return store;
  });

  const queries = useCreateQueries(store, appQueries);

  if (!store || !queries) {
    return <div>Loading...</div>;
  }

  return (
    <StoreProvider store={store} queries={queries}>
      <PersisterProvider
        value={{
          sqlite3Persister,
          indexedDBPersister,
          sqlite3Instance,
          setIndexedDBPersister,
          setSqlite3Persister,
          setSqlite3Instance,
        }}
      >
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: "#0072ff",
              colorBgContainer: "#0f0f0f",
              borderRadius: 32,
              fontFamily: 'GT Walsheim',
            },
            algorithm: [theme.darkAlgorithm, theme.compactAlgorithm],
          }}
        >
          <FisaMatrix />
        </ConfigProvider>
        <StoreInspector />
      </PersisterProvider>
    </StoreProvider>
  );
};

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(<App />);
