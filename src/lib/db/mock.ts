import { BML_CSV_DataFields } from "./models/transactions";
import dayjs from "dayjs";

const genId = (prefix: string, length: number = 12) => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = prefix;
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
};

const rbtwn = (min: number, max: number) => {
  return Math.random() * (max - min) + min;
};

const pr = (arr: any[]) => {
  // pick random
  return arr[Math.floor(Math.random() * arr.length)];
};

const biasedPrDc = (): string => {
  const biasedOptions = [
    ...Array(20).fill("Debit"),
    ...Array(2).fill("Credit"),
  ];
  const randomIndex = Math.floor(Math.random() * biasedOptions.length);
  return biasedOptions[randomIndex];
};

const trxrs = [
  "AHMED AHMED",
  "COFFEE CAFE",
  "FATHIMATH FATHIMATH",
  "BURGER PLACE",
  "RANDOM BAKERY",
  "SHOP SHOP",
  "MOHAMED MOHAMED",
  "COMPANY PVT LTD",
  "CHEAP MART",
  "SOME PHARMACY",
  "ABDULLA ABDULLA",
  "PRICEY CAFE",
  "ILYAS ILYAS",
  "MOOSA MOOSA",
  "PIZZA PLACE",
  "AISHATH AISHATH",
  "BIG HOSPITAL",
  "CLINIC CLINIC",
  "SUSHI PLACE",
];

export const mockDataGet = (rows: number) => {
  let balance = 4800;
  const mockData: BML_CSV_DataFields[] = [];

  for (let i = 0; i < rows; i++) {
    const date = dayjs().subtract(i, "day").format("YYYY/MM/DD");
    const dc = biasedPrDc();
    const type =
      dc === "Debit"
        ? pr(["Purchase", "Transfer Debit", "ATM Withdrawal"])
        : pr(["Salary", "Transfer Credit"]);
    const ref = genId(pr(["BLAZ", "RB0", "B24"]));
    const trx = genId("FT");
    const from = dc === "Debit" ? "" : pr(trxrs);
    const to = dc === "Debit" ? pr(trxrs) : "";
    const loc = pr([
      "MALE MV MV",
      "HULHUMALE MV MV",
      "MALE CITY MV MV",
      "London GB GB",
      "Internet Banking",
    ]);
    const debited = dc === "Debit" ? rbtwn(25, 1000) : NaN;
    const credited = dc === "Credit" ? rbtwn(1000, 12000) : NaN;
    if (!isNaN(debited)) {
      balance -= debited;
    } else if (!isNaN(credited)) {
      balance += credited;
    }
    mockData.push({
      date,
      date_: date,
      type: type,
      ref: ref,
      trx: trx,
      from: from,
      to: to,
      loc: loc,
      debited: debited,
      credited: credited,
      balance: balance,
    });
  }

  return mockData;
};
