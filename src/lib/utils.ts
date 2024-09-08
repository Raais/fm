import dayjs from "dayjs";

export const log = (...args: any[]) => console.log(...args);
export const error = (...args: any[]) => console.error(...args);

export const isObjEmpty = (objectName: any) => {
  return Object.keys(objectName).length === 0;
};

export const castToArray = (obj: any) => {
  return Object.keys(obj).map((key) => obj[key]);
};

export function debounce(func: any, timeout = 300) {
  let timer: any;
  return (...args : any) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      // @ts-ignore
      func.apply(this, args);
    }, timeout);
  };
}

export function kFmt(num: number) {
  return Math.abs(num) > 999 ? Math.sign(num)*(Math.round(Math.abs(num)/100)/10) + 'k' : Math.sign(num)*Math.abs(num)
}

/** Linear Regression */
export const lr = (seq: number[]) => {
  const n = seq.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  let sumYY = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += seq[i];
    sumXY += i * seq[i];
    sumXX += i * i;
    sumYY += seq[i] * seq[i];
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  const nextX = n;
  const nextY = slope * nextX + intercept;
  let ssTotal = 0;
  let ssResidual = 0;
  const meanY = sumY / n;
  for (let i = 0; i < n; i++) {
    const predictedY = slope * i + intercept;
    ssTotal += (seq[i] - meanY) ** 2;
    ssResidual += (seq[i] - predictedY) ** 2;
  }
  const rSquared = 1 - (ssResidual / ssTotal);
  return { nextY, slope, intercept, rSquared };
}

/** Ranges */
export const rangeToStr : any = {
  "1y": "1 Year",
  "90d": "90 Days",
  "7d": "7 Days",
  "10d": "10 Days",
  "15d": "15 Days",
  "20d": "20 Days",
  "30d": "30 Days",
  "60d": "60 Days",
  "all": "All",
  "_lm": "Last Month",
  "_cm": "Current Month",
  "_sm": "Salary Month",
  "__january": "January",
  "__february": "February",
  "__march": "March",
  "__april": "April",
  "__may": "May",
  "__june": "June",
  "__july": "July",
  "__august": "August",
  "__september": "September",
  "__october": "October",
  "__november": "November",
  "__december": "December",
};

function getMostRecentMonthStart(month: number) {
  if (month < 1 || month > 12) {
      throw new Error('Month must be between 1 and 12.');
  }
  const currentDate = dayjs();
  const zeroIndexedMonth = month - 1;
  if (currentDate.month() > zeroIndexedMonth || (currentDate.month() === zeroIndexedMonth && currentDate.date() > 1)) {
      return dayjs().month(zeroIndexedMonth).date(1);
  } else {
      return dayjs().subtract(1, 'year').month(zeroIndexedMonth).date(1);
  }
}

export const rangeData = (range: string) => {
  switch (range) {
    case "7d": return { from: dayjs().subtract(7, "day"), to: dayjs() };
    case "10d": return { from: dayjs().subtract(10, "day"), to: dayjs() };
    case "15d": return { from: dayjs().subtract(15, "day"), to: dayjs() };
    case "20d": return { from: dayjs().subtract(20, "day"), to: dayjs() };
    case "30d": return { from: dayjs().subtract(30, "day"), to: dayjs() };
    case "60d": return { from: dayjs().subtract(60, "day"), to: dayjs() };
    case "90d": return { from: dayjs().subtract(90, "day"), to: dayjs() };
    case "1y": return { from: dayjs().subtract(365, "day"), to: dayjs() };
    case "all": return { from: dayjs().subtract(365, "day"), to: dayjs() };
    case "_lm": return { from: dayjs().subtract(1, "month").startOf("month"), to: dayjs().subtract(1, "month").endOf("month") };
    case "_cm": return { from: dayjs().startOf("month"), to: dayjs() };
    case "_sm": return { from: dayjs(localStorage.getItem("salary_month"), "DD-MM-YYYY"), to: dayjs() };
    case "__january": return { from: getMostRecentMonthStart(1), to: getMostRecentMonthStart(1).endOf("month") };
    case "__february": return { from: getMostRecentMonthStart(2), to: getMostRecentMonthStart(2).endOf("month") };
    case "__march": return { from: getMostRecentMonthStart(3), to: getMostRecentMonthStart(3).endOf("month") };
    case "__april": return { from: getMostRecentMonthStart(4), to: getMostRecentMonthStart(4).endOf("month") };
    case "__may": return { from: getMostRecentMonthStart(5), to: getMostRecentMonthStart(5).endOf("month") };
    case "__june": return { from: getMostRecentMonthStart(6), to: getMostRecentMonthStart(6).endOf("month") };
    case "__july": return { from: getMostRecentMonthStart(7), to: getMostRecentMonthStart(7).endOf("month") };
    case "__august": return { from: getMostRecentMonthStart(8), to: getMostRecentMonthStart(8).endOf("month") };
    case "__september": return { from: getMostRecentMonthStart(9), to: getMostRecentMonthStart(9).endOf("month") };
    case "__october": return { from: getMostRecentMonthStart(10), to: getMostRecentMonthStart(10).endOf("month") };
    case "__november": return { from: getMostRecentMonthStart(11), to: getMostRecentMonthStart(11).endOf("month") };
    case "__december": return { from: getMostRecentMonthStart(12), to: getMostRecentMonthStart(12).endOf("month") };
    default: return { from: dayjs().subtract(365, "day"), to: dayjs() };
  }
};