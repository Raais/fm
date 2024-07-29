import dayjs from "dayjs";

export const in_7d = (getCell: any) =>
  dayjs(getCell("date")?.toString(), "YYYY-MM-DD").isAfter(
    dayjs().subtract(7, "day")
  );

export const in_30d = (getCell: any) =>
  dayjs(getCell("date")?.toString(), "YYYY-MM-DD").isAfter(
    dayjs().subtract(30, "day")
  );

export const in_90d = (getCell: any) =>
  dayjs(getCell("date")?.toString(), "YYYY-MM-DD").isAfter(
    dayjs().subtract(90, "day")
  );

export const in_xdays = (x: number, getCell: any) =>
  dayjs(getCell("date")?.toString(), "YYYY-MM-DD").isAfter(
    dayjs().subtract(x, "day")
  );

export const in_1y = (getCell: any) =>
  dayjs(getCell("date")?.toString(), "YYYY-MM-DD").isAfter(
    dayjs().subtract(1, "year")
  );

export const in_cm = (getCell: any) =>
  dayjs(getCell("date")?.toString(), "YYYY-MM-DD").isAfter(
    dayjs().startOf("month")
  );

export const in_lm = (getCell: any) =>
  dayjs(getCell("date")?.toString(), "YYYY-MM-DD").isSame(
    dayjs().subtract(1, "month"),
    "month"
  );

export const in_month = (month: string, getCell: any) =>
  dayjs(getCell("date")?.toString(), "YYYY-MM-DD").isSame(
    dayjs(month, "MM/YYYY"),
    "month"
  );

export const in_date_plus_31d = (date: string, getCell: any) =>
  dayjs(getCell("date")?.toString(), "YYYY-MM-DD").isAfter(
    dayjs(date, "DD-MM-YYYY")) &&
  dayjs(getCell("date")?.toString(), "YYYY-MM-DD").isBefore(
    dayjs(date, "DD-MM-YYYY").add(31, "day")
  );