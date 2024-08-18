import Chart from "react-apexcharts";

export const ChartDebitRepeats = ({
  Key,
  series,
  title,
  labels,
  tooltipFormat,
  selection,
}: any) => {
  return (
    <Chart
      key={Key}
      type="pie"
      width="100%"
      series={series}
      options={{
        chart: {
          type: "pie",
          foreColor: "grey",
          dropShadow: { enabled: false },
          events: {
            dataPointSelection: selection,
          }
        },
        legend: { position: "left" },
        title: {
          text: title,
          align: "left",
          style: {
            fontSize: "16px",
          },
        },
        plotOptions: {
          pie: {
            expandOnClick: false,
          },
        },
        labels: labels,
        tooltip: {
          y: {
            formatter: tooltipFormat,
          },
        },
        stroke: { show: false },
      }}
    />
  );
};
