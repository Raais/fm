
# FisaMatrix 🇲🇻

### [🔥 FisaMatrix App (raa.is/fm)](https://raais.github.io/fm)

A ~~local-first~~ **local-only**, solution to gain insights to your personal finances.

- Upload your statements
- Categorize your transactions
- That's it.

![charts](https://github.com/Raais/fm/blob/main/README/charts.jpg?raw=true)

![dataset](https://github.com/Raais/fm/blob/main/README/dataset.jpg?raw=true)

### Features

- Built In / Custom Categories
- Daily expenses graphs
- Monthly expenses Trends
- Select any range
- Category Aggregates / Breakdowns
- End-of-month Forecasts
- Debit Sum / Count Overviews
- [Powerful search](https://github.com/lucaong/minisearch) for Dataset table
- [Locally Stored](https://tinybase.org/) (Browser Storage / IndexedDB)
- Import Transactions as CSV
- Import/Export all data as SQLite DB

### Why?

- Because I didn't want to open my budget tracker app and manually add transactions everytime
- Zero work (after categorizing)
- One, authoritative source of truth (it's literally your bank)

### Your Data

This is a **fully client-side React app**... the only network request is for fetching currency rates.

All your data is stored in your Browser's [IndexedDB](https://tinybase.org/api/persister-indexed-db/interfaces/persister/indexeddbpersister/) Storage. You can inspect everything the app sees by clicking the tiny black-and-pink icon on the bottom.

You can conveniently **export** or **restore** the entire database from the settings tab.

### Built with

- [TinyBase](https://tinybase.org/)
- [sqlite-wasm](https://github.com/sqlite/sqlite-wasm)
- [Apex Charts](https://apexcharts.com/)
- [MiniSearch](https://github.com/lucaong/minisearch)

## Run

    npm install
    npm run dev

## License

MIT
