import dayjs from "dayjs";
import Chart from "react-apexcharts";

export const ChartDailyCredit = ({
  graphType,
  series,
  title,
  yformat,
}: any) => {
  return (
    <Chart
      key={graphType}
      type={graphType}
      width="100%"
      series={series}
      options={{
        chart: {
          id: "basic-bar2",
          type: graphType,
          toolbar: {
            show: false,
          },
          foreColor: "#fff",
          sparkline: {
            enabled: true,
          },
        },
        colors: ["#00E396"],
        title: {
          text: title,
          offsetX: 0,
          style: {
            fontSize: "34px",
          },
        },
        subtitle: {
          text: `Credit`,
          offsetX: 0,
          offsetY: 40,
          style: {
            fontSize: "20px",
          },
        },
        tooltip: {
          theme: "dark",
          x: {
            show: true, //graphType === "bar",
            //@ts-ignore
            formatter: function (val: any, { dataPointIndex, w }) {
              const value =
                w.globals.categoryLabels.length > 0
                  ? w.globals.categoryLabels[dataPointIndex]
                  : val;
              return dayjs(value, "DD-MM-YYYY").format("dddd Do MMM YYYY");
            },
          },
          y: {
            formatter: yformat,
          },
        },
        stroke: {
          curve: graphType === "area" ? "straight" : "smooth",
          width: 2,
        },
        xaxis: {
          type: "category",
          labels: {
            show: false,
          },
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
        },
        yaxis: {
          labels: {
            show: false,
          },
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
        },
        dataLabels: {
          enabled: false,
        },
        grid: {
          xaxis: {
            lines: {
              show: false,
            },
          },
          yaxis: {
            lines: {
              show: false,
            },
          },
        },
      }}
    />
  );
};
