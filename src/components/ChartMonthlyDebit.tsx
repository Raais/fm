import dayjs from "dayjs";
import Chart from "react-apexcharts";
import { kFmt } from "../lib/utils";

export const ChartMonthlyDebit = ({ series, selection, yformat, debitSumData, debitSumCmLR }: any) => {
    return <Chart
    key={"debit-sum"}
    type="line"
    height="300px"
    series={series}
    options={{
      colors: ['#1677ff'],
      forecastDataPoints: {count: 1},
      theme: {mode: 'dark'},
      chart: {
        height: 350,
        background: '#0f0f0f',
        type: 'line',
        foreColor: 'grey',
        toolbar: {tools: {download: true, zoom: false, pan: false, zoomin: false, zoomout: false, reset: false}},
        events: {
          dataPointSelection: selection,
        }
      },
      tooltip: {
        y: {
          formatter: yformat,
        },
        shared: false,
        intersect: true,
      },
      markers: {
        size: 4,
        strokeColors: '#1677ff',
        strokeWidth: 2,
      },
      annotations: {
        points: [{
          x: dayjs().format('MMMM'),
          y: debitSumCmLR.nextY,
          marker: {
            size: 8,
            fillColor: 'transparent',
            strokeColor: '#FF4560',
            radius: 2,
          },
          label: {
            borderColor: '#FF4560',
            style: {
              color: '#fff',
              background: '#FF4560',
            },
            text: `Forecast ${kFmt(debitSumCmLR.nextY)}`,
          },
          
        },{
          x: dayjs().format('MMMM'),
          y: debitSumData.data[debitSumData.data.length - 1],
          marker: {
            size: 0,
            fillColor: debitSumData.p > 0 ? '#FF456090' : '#00E39690',
            strokeColor: 'transparent',
            radius: 2,
          },
          label: {
            borderColor: debitSumData.p > 0 ? '#FF4560' : '#00E396',
            offsetX: 35,
            offsetY: 17,
            style: {
              color: '#fff',
              background: debitSumData.p > 0 ? '#FF456090' : '#00E39690',
            },
            text: `${debitSumData.p > 0 ? '▲' : '▼'} ${debitSumData.p > 0 ? '+' : ''}${debitSumData.p.toFixed(0)}%`,
          },
          
        }]
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'straight'
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
      title: {
        text: 'Monthly Debit Sum',
        align: 'left',
        style: {
          fontSize: '16px',
        }
      },
      xaxis: {
        categories: debitSumData.months,
        max: debitSumData.months.length,
      },
      yaxis: {
        min: Math.min(...debitSumData.data, debitSumCmLR.nextY) * 0.1,
        max: Math.max(...debitSumData.data, debitSumCmLR.nextY) * 1.1,
        decimalsInFloat: 0,
        tickAmount: 3,
        labels: {formatter: function (val: number) {
          return Number(val.toFixed(0)).toLocaleString();
        }},
      }
    }}
  />;
}