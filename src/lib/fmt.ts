import dayjs from "dayjs";
import { castToArray, lr } from "./utils";
import { xM } from "../config";

export const extractDataSource = (obj: any) => {
    let arr = castToArray(obj);
    arr = arr.sort((a: any, b: any) => {
      // sort date: descending - recent first
      const dateA = dayjs(a?.date, "DD-MM-YYYY").unix();
      const dateB = dayjs(b?.date, "DD-MM-YYYY").unix();
      if (dateA > dateB) return -1;
      if (dateA < dateB) return 1;

      // sort balance: ascending - smallest first
      if (parseFloat(a?.balance) > parseFloat(b?.balance)) return 1;
      if (parseFloat(a?.balance) < parseFloat(b?.balance)) return -1;

      // both are equal
      return 0;
    });
    //console.log("arr", arr);
    return arr;
  };

  export const extractDailyDebitCredit = (
    obj: any,
    type: "debited" | "credited",
    r: any,
    categories: any
  ) => {
    const len = dayjs(r.to).diff(dayjs(r.from), "day");
    const dateMap = new Map<string, { amount: number; category: string; categoryTotals: Map<string, number>}>();
  
    for (let i = 0; i < len; i++) {
      const date = dayjs(r.to).subtract(len - i, "day").format("DD-MM-YYYY");
      dateMap.set(date, { amount: 0.0, category: "_undefined_", categoryTotals: new Map<string, number>()});
    }
  
    const arr = castToArray(obj)
      .sort(
        (a: any, b: any) =>
          dayjs(b?.date, "DD-MM-YYYY").unix() -
          dayjs(a?.date, "DD-MM-YYYY").unix()
      )
      .filter(
        (item: any) =>
          dayjs(item?.date, "DD-MM-YYYY").isAfter(r.from) &&
          dayjs(item?.date, "DD-MM-YYYY").isBefore(r.to)
      );
  
    arr.forEach((item: any) => {
      const itemDate = dayjs(item?.date, "DD-MM-YYYY").format("DD-MM-YYYY");
      const itemCategory = item?.category ?? '_undefined_';
      const itemAmount = parseFloat(item?.[type] ?? 0.0);
  
      if (dateMap.has(itemDate)) {
        const dateEntry = dateMap.get(itemDate)!;
        dateEntry.amount += itemAmount;

        if (type === "debited") {
          dateEntry.categoryTotals.set(
            itemCategory,
            (dateEntry.categoryTotals.get(itemCategory) ?? 0) + itemAmount
          );
          
          dateEntry.category = [...dateEntry.categoryTotals.entries()].reduce(
            (maxCategory, [category, total]) => total > maxCategory[1] ? [category, total] : maxCategory,
            ["", 0]
          )[0];
        }

        dateMap.set(itemDate, dateEntry);
      }
    });
  
    const result = Array.from(dateMap.entries()).map(([date, { amount, category }]) => ({
      x: date,
      y: amount,
      topCategory: category,
      fillColor: category === '_undefined_' ? '#1677ff' : categories[category]?.color ?? '#1677ff',
      strokeColor: category === '_undefined_' ? '#1677ff' : categories[category]?.color ?? '#1677ff',
    }));

    return result;
  };

export const debitSumDataGet = ({queries}: any) => {
    let data = [];
    let months = [];
    for (let i = 1; i <= xM; i++) {
      const month = dayjs().subtract(i, "month").format("MMMM");
      months.push(month);
      const debitAgrs = queries.getResultTable(
        "getDebitAgrs___" + month.toLowerCase()
      );
      if (!debitAgrs[0]?.sum) return { data: [], months: [], p: 0 }; // missing data
      data.push(Number(debitAgrs[0]?.sum || 0));
    }
    data = data.reverse();

    data.push(Number(queries.getResultTable("getDebitAgrs__cm")[0]?.sum || 0));
    months.reverse();
    months.push(dayjs().format("MMMM"));
    months.push("...");
    const p =
      ((data[data.length - 1] - data[data.length - 2]) /
        data[data.length - 2]) *
      100;
    return { data, months, p };
}
  
export const debitSumCmLRGet = (x = 4, queries: any) => {
    let sums = [];
    for (let i = 1; i <= x; i++) {
      const month = dayjs().subtract(i, "month").format("MMMM").toLowerCase();
      const debitAgrs = queries.getResultTable("getDebitAgrs___" + month);
      sums.push(Number(debitAgrs[0]?.sum || 0));
    }
    sums = sums.reverse();
    return lr(sums);
  }
  
export function rankMapTopCat(data: any) {
    const counts: any = {};
    data.forEach((item: any) => {
      const { to, category, count } = item;
      if (!counts[to] || count > counts[to].count) {
        counts[to] = { category, count };
      }
    });
    const rankedMap: any = {};
    Object.keys(counts).forEach((to) => {
      rankedMap[to] = counts[to].category;
    });
    return rankedMap;
}
  
export const balanceGet = (balances: any) => {
    let allTrx = castToArray(balances);
    allTrx = allTrx.sort((a: any, b: any) => {
      const dateA = dayjs(a?.date, "DD-MM-YYYY").unix();
      const dateB = dayjs(b?.date, "DD-MM-YYYY").unix();
      if (dateA > dateB) return -1;
      if (dateA < dateB) return 1;
      if (parseFloat(a?.balance) > parseFloat(b?.balance)) return 1;
      if (parseFloat(a?.balance) < parseFloat(b?.balance)) return -1;
      return 0;
    });
    return allTrx[0]?.balance;
};
  
export const categoryAgrsDataGet = (categoryAgrs: any) => {
    return categoryAgrs
      .map((i: any) => {
        return {
          key: i?.category,
          sum: Number(i?.sum || 0),
          count: Number(i?.count || 0),
        };
      })
      .sort((a: any, b: any) => b.sum - a.sum);
};
  
export const debitRepeatsDataGet = ({debitRepeats, aggregateType}: any) => {
    return debitRepeats
      .map((i: any) => {
        return {
          key: i?.to,
          sum: Number(i?.sum || 0),
          count: Number(i?.count || 0),
          avg: Number(i?.avg || 0),
        };
      })
      .sort((a: any, b: any) =>
        aggregateType === "sum" ? b.sum - a.sum : b.count - a.count
      );
  };