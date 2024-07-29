import {
  Group,
  Having,
  Join,
  Select,
  Store,
  Where,
  createQueries,
} from "tinybase";
import {
  in_1y,
  in_30d,
  in_7d,
  in_90d,
  in_xdays,
  in_cm,
  in_lm,
  in_month,
  in_date_plus_31d,
} from "./ranges";

import dayjs from "dayjs";
import { repeatsGt, xM } from "../../../config";

type all = {
  select: Select;
  join: Join;
  where: Where;
  group: Group;
  having: Having;
};

const IS_DEBIT = (getCell: any) => getCell("debited") > 0;
const IS_CREDIT = (getCell: any) => getCell("credited") > 0;

const GET_CATEGORIES = ({ select, join, where, group, having }: all) => {
  void select, join, where, group, having;
  select("name").as("key");
  select("name");
  select("emoji");
  select("color");
};

const GET_TRANSACTIONS = ({ select, join, where, group, having }: all) => {
  void select, join, where, group, having;
  select("ref").as("key");
  select((getCell) =>
    dayjs(getCell("date")?.toString(), "YYYY-MM-DD").format("DD-MM-YYYY")
  ).as("date");
  select("type");
  select("ref");
  select("trx");
  select("from");
  select("to");
  select("loc");
  select("debited");
  select("credited");
  select("balance");
  select("category");
  select("note");

  select("_category", "emoji").as("emoji");
  select("_category", "color").as("color");
  join("categories", "category").as("_category");
};

const GET_BALANCES = ({ select, join, where, group, having }: all) => {
  void select, join, where, group, having;
  select("ref").as("key");
  select((getCell) =>
    dayjs(getCell("date")?.toString(), "YYYY-MM-DD").format("DD-MM-YYYY")
  ).as("date");
  select("balance");
};

const GET_CATEGORY_AGRS = ({ select, join, where, group, having }: all) => {
  void select, join, where, group, having;
  select("category");
  select("ref");
  select("debited");
  group("ref", "count").as("count");
  group("debited", "avg").as("avg");
  group("debited", "sum").as("sum");
  group("debited", "max").as("max");
  group("debited", "min").as("min");
};

const GET_DEBIT_REPEATS = ({ select, join, where, group, having }: all) => {
  void select, join, where, group, having;
  select("to");
  select("ref");
  select("debited");
  group("ref", "count").as("count");
  group("debited", "avg").as("avg");
  group("debited", "sum").as("sum");
  group("debited", "max").as("max");
  group("debited", "min").as("min");

  //@ts-ignore
  having((getCell) => getCell("count") > repeatsGt);
  where(IS_DEBIT);
};

const GET_TO_CATEGORY_RANKED = ({
  select,
  join,
  where,
  group,
  having,
}: all) => {
  void select, join, where, group, having;
  select("to");
  select("ref");
  select("category");
  group("ref", "count").as("count");

  //@ts-ignore
  having((getCell) => getCell("count") > 1);
  where((getCell) => getCell("category") !== "_undefined_");
  where(IS_DEBIT);
};

const GET_FORECASTED_EOM = ({
  key,
  group,
}: any) => {
  group("debited",
    (txs: any) => {
      const startOfMonth = key === "_sm" ? dayjs(localStorage.getItem("salary_month"), "DD-MM-YYYY") : dayjs().startOf('month');
      const daysSoFar = dayjs().diff(startOfMonth, 'day');

      const total = txs.reduce((acc: any, cur: any) => acc + cur, 0);
      const dailyAvg = total / daysSoFar;

      return dailyAvg * 31;
    }
  ).as("forecastEom");
};

const GET_DEBIT_AGRS = ({
  select,
  where,
  group,
}: any) => {
  select("debited");
  group("ref", "count").as("count");
  group("debited", "avg").as("avg");
  group("debited", "sum").as("sum");
  group("debited", "max").as("max");
  group("debited", "min").as("min");
  where(IS_DEBIT);
}

const GET_CREDIT_AGRS = ({
  select,
  where,
  group,
}: any) => {
  select("credited");
  group("ref", "count").as("count");
  group("credited", "avg").as("avg");
  group("credited", "sum").as("sum");
  group("credited", "max").as("max");
  group("credited", "min").as("min");
  where(IS_CREDIT);
}

/*****************************************************************************
WITH RANGES
*****************************************************************************/

const initialRanges: Record<string, any> = {
  all: null,
  '_cm': in_cm,
  '_lm': in_lm,
  '7d': in_7d,
  '30d': in_30d,
  '90d': in_90d,
  '1y': in_1y,
};

function getMonthKey(date: dayjs.Dayjs): string {
  return date.format('MMMM').toLowerCase(); // 'june'
}

function getFormattedMonth(date: dayjs.Dayjs): string {
  return date.format('MM/YYYY'); // '06/2024'
}

function addLastXMonths(x: number, ranges: Record<string, any>): Record<string, any> {
  const currentDate = dayjs();

  for (let i = 1; i <= x; i++) {
    const previousMonth = currentDate.subtract(i, 'month');
    const monthKey = getMonthKey(previousMonth);
    const formattedMonth = getFormattedMonth(previousMonth);

    ranges[`__${monthKey}`] = (getCell: any) => in_month(formattedMonth, getCell);
  }

  return ranges;
}

function addSalaryMonth(ranges: Record<string, any>): Record<string, any> {
  const salaryMonth = localStorage.getItem("salary_month");
  if (!salaryMonth || salaryMonth.startsWith("null:") || !dayjs(salaryMonth, "DD-MM-YYYY").isValid()) {
    return ranges;
  }

  ranges["_sm"] = (getCell: any) => in_date_plus_31d(salaryMonth, getCell);
  return ranges;
}

let _ranges = { ...initialRanges };
_ranges = addSalaryMonth(_ranges);
_ranges = addLastXMonths(xM, _ranges);

export const ranges = _ranges;

export const appQueries = (store: Store) => {
  const queries = createQueries(store);

  queries.setQueryDefinition(
    "getCategories",
    "categories",
    ({ select, join, where, group, having }) => {
      GET_CATEGORIES({ select, join, where, group, having });
    }
  );

  queries.setQueryDefinition(
    "getTransactions",
    "transactions",
    ({ select, join, where, group, having }) => {
      GET_TRANSACTIONS({ select, join, where, group, having });
    }
  );

  queries.setQueryDefinition(
    "getSalaryCandidates31d",
    "transactions",
    ({ select, join, where, group, having }) => {
      GET_TRANSACTIONS({ select, join, where, group, having });
      where((getCell) => in_xdays(31, getCell));
      where(IS_CREDIT);
    }
  );

  queries.setQueryDefinition(
    "getBalances",
    "transactions",
    ({ select, join, where, group, having }) => {
      GET_BALANCES({ select, join, where, group, having });
    }
  );

  Object.entries(ranges).forEach(([key, r]) => {
    queries.setQueryDefinition(
      `getTransactions_${key}`,
      "transactions",
      ({ select, join, where, group, having }) => {
        GET_TRANSACTIONS({ select, join, where, group, having });
        if (r) {
          where(r);
        }
      }
    );
  });

  Object.entries(ranges).forEach(([key, r]) => {
    queries.setQueryDefinition(
      `getDebitAgrs_${key}`,
      "transactions",
      ({ select, where, group }) => {
        GET_DEBIT_AGRS({ select, where, group });
        if (r) {
          where(r);
        }
      }
    );
  });

  Object.entries(ranges).forEach(([key, r]) => {
    queries.setQueryDefinition(
      `getCreditAgrs_${key}`,
      "transactions",
      ({ select, where, group }) => {
        GET_CREDIT_AGRS({ select, where, group });
        if (r) {
          where(r);
        }
      }
    );
  });

  Object.entries(ranges).forEach(([key, r]) => {
    queries.setQueryDefinition(
      `getDebitRepeats_${key}`,
      "transactions",
      ({ select, join, where, group, having }) => {
        GET_DEBIT_REPEATS({ select, join, where, group, having });
        if (key === "_sm" || key === "_cm") {
          GET_FORECASTED_EOM({ key, group });
        }
        if (r) {
          where(r);
        }
      }
    );
  });

  queries.setQueryDefinition(
    "getUncategorized",
    "transactions",
    ({ select, join, where, group, having }) => {
      GET_TRANSACTIONS({ select, join, where, group, having });
      where((getCell) => getCell("category") === "_undefined_");
    }
  );

  Object.entries(ranges).forEach(([key, r]) => {
    queries.setQueryDefinition(
      `getCategoryAgrs_${key}`,
      "transactions",
      ({ select, join, where, group, having }) => {
        GET_CATEGORY_AGRS({ select, join, where, group, having });
        if (key === "_sm" || key === "_cm") {
          GET_FORECASTED_EOM({ key, group });
        }
        if (r) {
          where(r);
        }
      }
    );
  });

  queries.setQueryDefinition(
    "getToCategoryRanked",
    "transactions",
    ({ select, join, where, group, having }) => {
      GET_TO_CATEGORY_RANKED({ select, join, where, group, having });
    }
  );

  queries.setQueryDefinition(
    "getCategorizedCount",
    "transactions",
    ({ select, join, where, group, having }) => {
      void join, where, group, having;
      select((getCell) =>
        getCell("category") === "_undefined_" ? "uncategorized" : "categorized"
      ).as("key");
      select("ref");
      group("ref", "count").as("count");
    }
  );

  queries.setQueryDefinition(
    "debug_debit_credit",
    "transactions",
    ({ select, join, where, group, having }) => {
      void join, where, group, having;
      select((getCell: any) =>
        getCell("debited") > 0 ? "debit" : "credit"
      ).as("key");
      select((getCell: any) =>
        getCell("debited") > 0 ? getCell("debited") : getCell("credited")
      ).as("amount");
      select("ref");
      group("ref", "count").as("count");
      group("amount", "avg").as("avg");
      group("amount", "sum").as("sum");
      group("amount", "max").as("max");
      group("amount", "min").as("min");
    }
  );

  return queries;
};
