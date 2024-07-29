import Chart from "react-apexcharts";

export const ChartCategoryBreakdown = ({
  Key,
  series,
  catBkdn,
  yformat,
}: any) => {
  return (
    <div id="catbkdn">
      <Chart
        key={Key}
        type="pie"
        width="100%"
        height={400}
        series={series}
        options={{
          chart: {
            background: "#0f0f0f",
            type: "pie",
            foreColor: "grey",
            dropShadow: { enabled: false },
          },
          legend: {
            position: "left",
            fontSize: "10px",
          },
          dataLabels: {
            enabled: true,
            dropShadow: { enabled: false },
            style: {
              colors: ["#14141490"],
            },
          },
          theme: {
            monochrome: {
              enabled: true,
              color: catBkdn.category.color,
              shadeIntensity: 1,
            },
          },
          plotOptions: {
            pie: {
              expandOnClick: false,
              customScale: 0.9,
            },
          },
          labels: catBkdn.data.map((i: any) => i.key),
          tooltip: {
            y: {
              formatter: yformat,
            },
            fillSeriesColor: false,
            theme: "dark",
            enabled: true,
          },

          stroke: { width: 0, colors: ["#14141401"] },
        }}
      />
    </div>
  );
};
