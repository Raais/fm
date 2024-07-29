import { QuestionCircleOutlined } from "@ant-design/icons";
import { Flex } from "antd";
import dayjs from "dayjs";
import { castToArray } from "./utils";
import { CardCategoryDisplay } from "../components/CardCategoryDisplay";

function getTopSalaryCandidate(salary_candidates: any) {
  const sortedByDate = [...salary_candidates].sort(
    (a: any, b: any) =>
      dayjs(b?.date, "DD-MM-YYYY").unix() - dayjs(a?.date, "DD-MM-YYYY").unix()
  );
  const firstOfType = sortedByDate.find((item: any) => item?.type === "salary");
  return (
    firstOfType ||
    sortedByDate.sort(
      (a: any, b: any) => parseFloat(b?.credited) - parseFloat(a?.credited)
    )[0]
  );
}

export const salaryMonthPrompt = ({ modal, salary_candidates, curr }: any) => {
  const salary_month = localStorage.getItem("salary_month");

  if (salary_month) {
    if (!salary_month.startsWith("null:")) {
      if (!dayjs(salary_month, "DD-MM-YYYY").isValid()) {
        localStorage.removeItem("salary_month");
        return;
      }
      if (dayjs().diff(dayjs(salary_month, "DD-MM-YYYY"), "day") <= 31) {
        // Less than or equal to 31 days
        return;
      }
    } else {
      const lastAlert = salary_month.replace("null:", "");
      if (!dayjs(lastAlert, "DD-MM-YYYY").isValid()) {
        localStorage.removeItem("salary_month");
        return;
      }
      if (dayjs().diff(dayjs(lastAlert, "DD-MM-YYYY"), "day") < 1) {
        // Less than 1 day
        return;
      }
    }
  }

  let sc = getTopSalaryCandidate(salary_candidates);

  if (!sc) return;

  modal.confirm({
    title: "Confirm salary month",
    icon: <QuestionCircleOutlined />,
    content: (
      <Flex vertical wrap="wrap">
        <span>Is this your latest salary payment?</span>
        <span
          style={{
            textAlign: "center",
            borderRadius: "6px",
            color: "green",
            backgroundColor: "#e6f4ff",
            fontWeight: "bold",
          }}
        >{`${dayjs(sc?.date, "DD-MM-YYYY").format("DD-MMM-YYYY")} - ${
          sc?.from
        } - ${curr(sc?.credited)}`}</span>
      </Flex>
    ),
    okText: "Yes",
    cancelText: "No",
    onOk() {
      localStorage.setItem("salary_month", sc?.date);
      window.location.reload();
    },
    onCancel() {
      localStorage.setItem(
        "salary_month",
        `null:${dayjs().format("DD-MM-YYYY")}`
      );
    },
  });
};

export const renderCat = ({
  selected,
  categoryAgrs,
  categoryAgrsData,
  categoryAgrsCm,
  categories,
  queries,
  curr,
  setCatDisplay,
}: any) => {
  const categoryAgr = categoryAgrs.find(
    (i: any) => i.category === categoryAgrsData[selected]?.key
  );
  if (categoryAgr) {
    const category = categories[categoryAgr.category];
    const categoryAgrCm = categoryAgrsCm.find(
      (i: any) => i.category === category.name
    );
    const forecastEom = categoryAgrCm?.forecastEom;
    const categoryAgrLm = castToArray(
      queries.getResultTable("getCategoryAgrs__lm")
    ).find((i: any) => i.category === category.name);
    const p =
      forecastEom &&
      categoryAgrLm &&
      ((forecastEom - categoryAgrLm.sum) / categoryAgrLm.sum) * 100;
    setCatDisplay(
      <>
        <CardCategoryDisplay
          category={category}
          categoryAgr={categoryAgr}
          curr={curr}
          forecastEom={forecastEom}
          p={p}
          categoryAgrLm={categoryAgrLm}
        />
      </>
    );
  }
};
