import Chart from "react-apexcharts";

export const ChartCategoryAggregates = ({
  Key,
  series,
  setCatDisplay,
  catSetter,
  renderCatDisplay,
  title,
  labelFormat,
  valueFormat,
  labels,
  tooltipFormat,
}: any) => {
  return (
    <Chart
      key={Key}
      type="donut"
      width="100%"
      series={series}
      options={{
        chart: {
          width: "100%",
          foreColor: "grey",
          type: "donut",
          dropShadow: { enabled: false },
          events: {
            dataPointMouseLeave: function (_e: any, chart: any, _opts: any) {
              const isSelected =
                chart.w.globals.selectedDataPoints[0]?.length > 0;
              if (isSelected) {
                return;
              }
              setCatDisplay(<></>);
              catSetter(null);
            },
            dataPointMouseEnter: function (_e: any, chart: any, opts: any) {
              const isSelected =
                chart.w.globals.selectedDataPoints[0]?.length > 0;
              if (isSelected) {
                return;
              }
              let selected = opts.dataPointIndex;
              renderCatDisplay(selected);
            },
            dataPointSelection: function (_e: any, _chart: any, opts: any) {
              let selected = opts.dataPointIndex;
              renderCatDisplay(selected);
              catSetter(selected);
            },
          },
        },
        title: {
          text: title,
          align: "left",
          style: {
            fontSize: "16px",
          },
        },
        plotOptions: {
          pie: {
            donut: {
              size: "60%",
              labels: {
                show: true,
                name: {
                  show: true,
                  formatter: labelFormat,
                },
                value: {
                  show: true,
                  formatter: valueFormat,
                  color: "grey",
                  fontSize: "14px",
                },
              },
            },
          },
        },
        labels: labels,
        //colors: categoryAgrsData().map((i)=>categories[i.key].color),
        tooltip: {
          y: {
            formatter: tooltipFormat,
          },
        },
        stroke: { show: false },
        legend: { position: "left" },
      }}
    />
  );
};
