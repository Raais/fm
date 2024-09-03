import * as chrono from "chrono-node";

import {
  AreaChartOutlined,
  BarChartOutlined,
  CloseOutlined,
  CodepenOutlined,
  ExportOutlined,
  GithubFilled,
  ImportOutlined,
  InfoCircleOutlined,
  LineChartOutlined,
  PlusOutlined,
  WarningFilled,
} from "@ant-design/icons";
import {
  AutoComplete,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Collapse,
  ColorPicker,
  ConfigProvider,
  Divider,
  Flex,
  Input,
  Layout,
  List,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Tooltip,
  Typography,
  Upload,
  message,
} from "antd";
import {
  _clearData,
  exportDb,
  resetPersistentStorage,
  useSqlite3,
} from "./lib/db/DB";
import {
  balanceGet,
  categoryAgrsDataGet,
  debitRepeatsDataGet,
  debitSumCmLRGet,
  debitSumDataGet,
  extractDailyDebitCredit,
  extractDataSource,
  rankMapTopCat,
} from "./lib/fmt";
import { castToArray, debounce, rangeData, rangeToStr } from "./lib/utils";
import {
  cmd_addCategory,
  cmd_removeCategory,
} from "./lib/db/models/categories";
import { cmd_createRecords, parseCSVData } from "./lib/db/models/transactions";
import { renderCat, salaryMonthPrompt } from "./lib/extra";
import { useEffect, useRef, useState } from "react";
import { useQueries, useResultTable, useStore } from "tinybase/debug/ui-react";

import { ChartCategoryAggregates } from "./components/ChartCategoryAggregates";
import { ChartCategoryBreakdown } from "./components/ChartCategoryBreakdown";
import { ChartDailyCredit } from "./components/ChartDailyCredit";
import { ChartDailyDebit } from "./components/ChartDailyDebit";
import { ChartDebitRepeats } from "./components/ChartDebitRepeats";
import { ChartMonthlyDebit } from "./components/ChartMonthlyDebit";
import EmojiPicker from "./components/EmojiPicker";
import { InfoModalContent } from "./components/InfoModalContent";
import MiniSearch from "minisearch";
import { TableDataset } from "./components/TableDataset";
import { TableUncategorized } from "./components/TableUncategorized";
import axios from "axios";
import dayjs from "dayjs";
import { mockDataGet } from "./lib/db/mock";
import { ranges } from "./lib/db/queries/queries";
import { usePersister } from "./context/PersisterContext";
import { xM } from "./config";

export const FisaMatrix = () => {
  const [modal, modalCtxHolder] = Modal.useModal();

  const [useUSD, setUseUSD] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<any>(null);

  const [filterRange, setFilterRange] = useState<string>("7d");

  const [graphType, setGraphType] = useState<"bar" | "area" | "line">("bar");
  const [aggregateType, setAggregateType] = useState<"sum" | "count">("sum");
  const [repeatsType, setRepeatsType] = useState<"repeats" | "all">("all");
  const [colorizeDaily, setColorizeDaily] = useState<"true" | "false">("true");

  const [datasetOpen, setDatasetOpen] = useState<any>([]);
  const datasetRef = useRef<any>(null);

  const [openStates, setOpenStates] = useState({
    modalCat: false,
    modalInfo: false,
  });
  const getOpenHandler = (key: string) => {
    return {
      //@ts-ignore
      isOpen: openStates[key],
      open: () => setOpenStates((state) => ({ ...state, [key]: true })),
      close: () => setOpenStates((state) => ({ ...state, [key]: false })),
      toggle: () =>
        //@ts-ignore
        setOpenStates((state) => ({ ...state, [key]: !state[key] })),
    };
  };
  const modalInfo = getOpenHandler("modalInfo");
  const modalCat = getOpenHandler("modalCat");
  const [catName, setCatName] = useState<string>("Food");
  const [catEmoji, setCatEmoji] = useState("🥑");
  const [catColor, setCatColor] = useState("#00FF77");

  const [catDisplay, setCatDisplay] = useState<any>(<></>);
  const [catBkdn, setCatBkdn] = useState<any>(null);

  useEffect(() => {
    setCatDisplay(<></>);
    setCatBkdn(null);
  }, [filterRange, aggregateType]);

  useEffect(() => {
    if (localStorage.getItem("graphType")) {
      setGraphType(
        localStorage.getItem("graphType") as "bar" | "area" | "line"
      );
    }
    if (localStorage.getItem("aggregateType")) {
      setAggregateType(
        localStorage.getItem("aggregateType") as "sum" | "count"
      );
    }
    if (localStorage.getItem("repeatsType")) {
      setRepeatsType(localStorage.getItem("repeatsType") as "repeats" | "all");
    }
    if (localStorage.getItem("colorizeDaily")) {
      setColorizeDaily(
        localStorage.getItem("colorizeDaily") as "true" | "false"
      );
    }
    if (!localStorage.getItem("infoShown")) {
      modalInfo.open();
    }
  }, []);

  const [tally, setTally] = useState<number | null>(null);

  const addToTally = (value: number) => {
    setTally((prevTally) => (prevTally !== null ? prevTally + value : value));
  };

  const store = useStore();
  const queries = useQueries();

  const {
    sqlite3Persister,
    indexedDBPersister,
    sqlite3Instance,
    setIndexedDBPersister,
    setSqlite3Persister,
    setSqlite3Instance,
  } = usePersister();

  if (
    store === undefined ||
    queries === undefined ||
    sqlite3Persister === undefined ||
    indexedDBPersister === undefined ||
    sqlite3Instance === undefined ||
    setIndexedDBPersister === undefined ||
    setSqlite3Persister === undefined ||
    setSqlite3Instance === undefined
  )
    return;

  const trx = useResultTable("getTransactions_" + filterRange);

  const [trxFiltered, setTrxFiltered] = useState<any>(null);
  const [lastSearch, setLastSearch] = useState<any>(null);
  const [searchAutocomplete, setSearchAutocomplete] = useState<any>([]);
  const miniSearch = new MiniSearch({
    fields: [
      "to",
      "from",
      "category",
      "type",
      "note",
      "ref",
      "loc",
      "uncategorized",
    ],
    idField: "key",
    searchOptions: {
      fuzzy: 0.2,
      boost: { to: 2, from: 2, category: 2 },
    },
    extractField: (doc: any, field: string) => {
      if (field === "uncategorized") {
        const uncategorized = doc["category"] === "_undefined_";
        return uncategorized && "uncategorized";
      }
      return doc[field];
    },
  });
  miniSearch.removeAll();
  miniSearch.addAll(extractDataSource(trx));

  const categories = useResultTable("getCategories");

  const balances = useResultTable("getBalances");
  const balance = balanceGet(balances);

  const categorized = useResultTable("getCategorizedCount");
  const categoryAgrs = castToArray(
    useResultTable("getCategoryAgrs_" + filterRange)
  );
  const categoryAgrsCm = castToArray(useResultTable("getCategoryAgrs__cm"));
  const categoryAgrsData = categoryAgrsDataGet(categoryAgrs);

  const debitAgrs = useResultTable("getDebitAgrs_" + filterRange);
  const debitSumCmLR = debitSumCmLRGet(xM, queries);
  const debitSumData = debitSumDataGet({ queries });
  const debitRepeats = castToArray(
    useResultTable("getDebitRepeats_" + filterRange)
  );
  const debitRepeatsData = debitRepeatsDataGet({ debitRepeats, aggregateType });

  const creditAgrs = useResultTable("getCreditAgrs_" + filterRange);

  const uncategorized = useResultTable("getUncategorized");

  /* Credits in the last 31 days */
  const salary_candidates = castToArray(
    useResultTable("getSalaryCandidates31d")
  );

  /* Field [to] ranked to find its most frequent category */
  const to_category_ranked = rankMapTopCat(
    castToArray(useResultTable("getToCategoryRanked"))
  );

  /* Utility function to globally format currency */
  const curr = (value: string, prefix: string = "", approx: string = "≈ ") => {
    let convert = useUSD;
    let rate = exchangeRates?.MVR;
    if (!rate) convert = false;
    let num = parseFloat(value);
    num = convert ? num / exchangeRates?.MVR : num;
    return `${convert ? approx + "USD" : "MVR"} ${prefix}${
      convert ? "$" : ""
    }${num.toLocaleString("en", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleSearch = (value: string) => {
    if (value === "") {
      setSearchAutocomplete([]);
      setTrxFiltered(null);
      setLastSearch(null);
      return;
    }
    setLastSearch(value);
    const autocomplete = miniSearch.autoSuggest(value, {
      fuzzy: 0.2,
      boost: { to: 2, from: 2, category: 2, type: 2 },
    });
    setSearchAutocomplete(
      autocomplete.map((i: any) => {
        return {
          label: i.suggestion,
          value: i.suggestion,
        };
      })
    );
    const searchResult = miniSearch.search(value);
    let filtered = [];
    if (searchResult.length > 0) {
      filtered = extractDataSource(trx).filter((i: any) => {
        return searchResult.some((j: any) => i.key === j.id);
      });
    } else {
      const parsed = chrono.parseDate(value);
      if (parsed) {
        const date = dayjs(parsed);
        filtered = extractDataSource(trx).filter((i: any) =>
          dayjs(i.date, "DD-MM-YYYY").isSame(date, "day")
        );
      } else {
        if (value.startsWith(">") || value.startsWith("<")) {
          const op = value[0];
          const number = parseFloat(value.slice(1).replace(/[^0-9.]/g, ""));
          if (!isNaN(number)) {
            filtered = extractDataSource(trx).filter((i: any) => {
              const debited = parseFloat(i?.debited);
              const credited = parseFloat(i?.credited);
              if (op === ">") {
                return debited > number || credited > number;
              } else {
                return debited < number || credited < number;
              }
            });
          }
        }
      }
    }
    setTrxFiltered(filtered);
  };

  const handleGotoDate = (_e: any, _chart: any, options: any) => {
    const date = options.w.globals.labels[options?.dataPointIndex];
    if (date) {
      if (datasetOpen.length === 0) setDatasetOpen(["1"]);
      if (datasetRef.current) {
        const filtered = extractDataSource(trx).filter((i: any) =>
          dayjs(i.date, "DD-MM-YYYY").isSame(dayjs(date, "DD-MM-YYYY"), "day")
        );
        if (filtered.length > 0) {
          setTrxFiltered(filtered);
          datasetRef.current.scrollIntoView();
        }
      }
    }
  };

  const closeModalInfo = () => {
    modalInfo.close();
    localStorage.setItem("infoShown", "true");
  };

  useEffect(() => {
    lastSearch && handleSearch(lastSearch);
  }, [trx]);

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await axios.get(
          "https://open.er-api.com/v6/latest/USD"
        );
        const rates = response?.data?.rates;
        setExchangeRates(rates);
      } catch (error) {
        message.error("Failed to fetch exchange rates");
        console.error("Failed to fetch exchange rates:", error);
      }
    };
    fetchExchangeRate();
  }, []);

  if (!trx || !categories) return;

  return (
    <Layout style={{ minHeight: "100vh", margin: "10px 30px" }}>
      <Layout.Header
        style={{
          backgroundColor: "#000",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "30px",
          paddingBottom: "20px",
        }}
      >
        <Flex align="center" gap="small">
          <Typography.Title
            style={{ fontSize: "36px" }}
            className="title-gradient"
          >
            FisaMatrix
          </Typography.Title>
          <span>
            <WarningFilled
              className="fade-in"
              style={{ fontSize: "16px", color: "#FFB01A", cursor: "pointer" }}
              onClick={() => modalInfo.open()}
            />
          </span>
        </Flex>
        <Flex gap="middle" align="center">
          <span
            style={{ fontSize: "20px", fontWeight: "bold", color: "#1677ff" }}
          >
            {curr(balance ?? 0, "", "")}
          </span>
          <span>
            <Select
              style={{ width: 120, textAlign: "left" }}
              options={Object.keys(ranges).map((key: string) => {
                return {
                  label: rangeToStr[key],
                  value: key,
                };
              })}
              value={filterRange}
              onClick={() =>
                salaryMonthPrompt({ modal, salary_candidates, curr })
              }
              onChange={(value) => {
                setFilterRange(value);
              }}
            />
          </span>
          <Flex>
            <ConfigProvider
              theme={{
                token: {
                  colorLink: "#fff",
                },
              }}
            >
              <Button
                href="https://github.com/Raais/fm"
                target="_blank"
                htmlType="button"
                size="large"
                style={{}}
                icon={<GithubFilled style={{ fontSize: "24px" }} />}
                type="link"
              />
            </ConfigProvider>
          </Flex>
        </Flex>
      </Layout.Header>
      <Modal
        title={
          <h2 style={{ marginTop: "1px" }}>
            <span className="title-gradient">FisaMatrix BETA</span> 🔥
          </h2>
        }
        width={800}
        footer={
          <Button type="primary" onClick={closeModalInfo}>
            Close
          </Button>
        }
        open={modalInfo.isOpen}
        onCancel={closeModalInfo}
        onOk={closeModalInfo}
      >
        <InfoModalContent trx={trx} store={store} modalInfo={modalInfo} />
      </Modal>
      <div className="floating-div">
        <ConfigProvider
          theme={{
            token: {
              borderRadius: 32,
            },
          }}
        >
          <Select
            style={{ width: 120, textAlign: "left" }}
            options={Object.keys(ranges).map((key: string) => {
              return {
                label: rangeToStr[key],
                value: key,
              };
            })}
            value={filterRange}
            onChange={(value) => setFilterRange(value)}
          />
        </ConfigProvider>
      </div>
      {modalCtxHolder}
      {tally && (
        <div className="tally">
          <Flex>
            <Flex className="tally-clear">
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                style={{ color: "#777777" }}
                onClick={() => setTally(null)}
              />
            </Flex>
            <Typography.Text type="secondary">{curr(tally.toString())}</Typography.Text>
          </Flex>
        </div>
      )}
      <Layout.Content style={{ margin: "16px 16px" }}>
        <Flex vertical gap="middle">
          <Row gutter={16}>
            <Col span={12}>
              <Card bordered={false}>
                <div>
                  <ChartDailyDebit
                    graphType={graphType}
                    series={[
                      {
                        name: "debit",
                        data:
                          colorizeDaily === "true"
                            ? extractDailyDebitCredit(
                                trx,
                                "debited",
                                rangeData(filterRange),
                                categories
                              )
                            : extractDailyDebitCredit(
                                trx,
                                "debited",
                                rangeData(filterRange),
                                categories
                              ).map((el: any) => ({
                                x: el.x,
                                y: el.y,
                                topCategory: el.topCategory,
                              })),
                      },
                    ]}
                    title={curr(debitAgrs[0]?.sum.toString() ?? "0", "", "")}
                    yformat={function (val: any, opts: any) {
                      const cat =
                        opts.w.config.series[0].data[opts.dataPointIndex]
                          ?.topCategory;
                      return cat !== "_undefined_"
                        ? `${curr(val)} [top: ${categories[cat]?.emoji} ${cat}]`
                        : curr(val);
                    }}
                    selection={handleGotoDate}
                  />
                </div>
              </Card>
            </Col>

            <Col span={12}>
              <Card bordered={false}>
                <div>
                  <ChartDailyCredit
                    graphType={graphType}
                    series={[
                      {
                        name: "credit",
                        data: extractDailyDebitCredit(
                          trx,
                          "credited",
                          rangeData(filterRange),
                          categories
                        ).map((el: any) => ({ x: el.x, y: el.y })),
                      },
                    ]}
                    title={curr(creditAgrs[0]?.sum.toString() ?? "0", "", "")}
                    yformat={function (val: any) {
                      return curr(val);
                    }}
                    selection={handleGotoDate}
                  />
                </div>
              </Card>
            </Col>
          </Row>

          {debitSumData.data.length > 0 && (
            <Card>
              <ChartMonthlyDebit
                series={[{ name: "Debit Sum", data: debitSumData.data }]}
                selection={function (_e: any, _chart: any, opts: any) {
                  const isLast =
                    opts.dataPointIndex === debitSumData.data.length - 1;
                  setFilterRange(
                    isLast
                      ? "_cm"
                      : `__${debitSumData.months[
                          opts.dataPointIndex
                        ].toLowerCase()}`
                  );
                }}
                yformat={function (val: any, opts: any) {
                  const isLast =
                    opts.dataPointIndex === debitSumData.data.length - 1;
                  return isLast ? `${curr(val)}` : `${curr(val)}`;
                }}
                debitSumData={debitSumData}
                debitSumCmLR={debitSumCmLR}
              />
            </Card>
          )}

          <Card
            style={{ backgroundColor: "#0a0a0a" }}
            bordered={false}
            extra={
              <Flex>
                <Select
                  style={{ textAlign: "left", width: "70px" }}
                  options={[
                    { label: "Sum", value: "sum" },
                    { label: "TRXs", value: "count" },
                  ]}
                  value={aggregateType}
                  onChange={(value) => {
                    setAggregateType(value);
                    localStorage.setItem("aggregateType", value);
                  }}
                />
              </Flex>
            }
          >
            <Flex vertical gap="middle">
              <Card>
                <Row>
                  <Col span={12}>
                    {categoryAgrsData.length > 0 && (
                      <ChartCategoryAggregates
                        Key={aggregateType + filterRange + useUSD + "pie"}
                        series={
                          aggregateType === "sum"
                            ? categoryAgrsData.map((i: any) => i.sum)
                            : categoryAgrsData.map((i: any) => i.count)
                        }
                        setCatDisplay={setCatDisplay}
                        catSetter={(catIndex: any) => {
                          if (!catIndex) {
                            setCatBkdn(null);
                          }
                          const categoryAgr = categoryAgrs.find(
                            (i: any) =>
                              i.category === categoryAgrsData[catIndex]?.key
                          );
                          if (categoryAgr) {
                            const category = categories[categoryAgr.category];
                            const data = castToArray(trx).filter(
                              (i: any) => i.category === categoryAgr?.category
                            );
                            const dataGrouped = data.reduce(
                              (acc: any, cur: any) => {
                                const key = cur.to;
                                if (!acc[key]) {
                                  acc[key] = {
                                    key,
                                    sum: 0,
                                    count: 0,
                                    avg: 0,
                                  };
                                }
                                const amount = cur?.debited
                                  ? parseFloat(cur?.debited)
                                  : parseFloat(cur?.credited);
                                acc[key].sum += amount;
                                acc[key].count++;
                                acc[key].avg = acc[key].sum / acc[key].count;
                                return acc;
                              },
                              {}
                            );
                            const resultArray = Object.values(dataGrouped).sort(
                              (a: any, b: any) =>
                                aggregateType === "sum"
                                  ? b.sum - a.sum
                                  : b.count - a.count
                            );

                            // sort by sum
                            setCatBkdn({
                              category: category,
                              data: resultArray,
                            });
                          }
                        }}
                        renderCatDisplay={(selected: number) =>
                          renderCat({
                            selected,
                            categoryAgrs,
                            categoryAgrsData,
                            categoryAgrsCm,
                            categories,
                            queries,
                            curr,
                            setCatDisplay,
                          })
                        }
                        title={
                          "Category Aggregates" +
                          " (" +
                          rangeToStr[filterRange] +
                          ")"
                        }
                        labelFormat={function (val: any) {
                          return val === "_undefined_"
                            ? "Uncategorized"
                            : `${categories[val]?.emoji} ${val}`;
                        }}
                        valueFormat={function (val: any) {
                          return aggregateType === "sum"
                            ? curr(val)
                            : `${val} trx`;
                        }}
                        labels={categoryAgrsData.map((i: any) => i.key)}
                        tooltipFormat={function (val: any) {
                          return aggregateType === "sum"
                            ? curr(val)
                            : `${val} trx`;
                        }}
                      />
                    )}
                  </Col>
                  <Col span={12}>{catDisplay}</Col>
                </Row>
                {catBkdn?.data && catBkdn.data.length > 0 && (
                  <Row>
                    <Col span={24}>
                      <Space />
                      <Divider style={{ color: "grey" }} orientation="right">
                        Category Breakdown
                      </Divider>
                      <ChartCategoryBreakdown
                        Key={aggregateType + filterRange + useUSD + "pie3"}
                        series={
                          aggregateType === "sum"
                            ? catBkdn.data.map((i: any) => i.sum)
                            : catBkdn.data.map((i: any) => i.count)
                        }
                        catBkdn={catBkdn}
                        yformat={function (val: any, opts: any) {
                          return aggregateType === "sum"
                            ? `${curr(val)} (${
                                catBkdn.data[opts.seriesIndex]?.count
                              } trx, avg ${catBkdn.data[
                                opts.seriesIndex
                              ]?.avg.toFixed(2)})`
                            : `${val} (${curr(
                                catBkdn.data[opts.seriesIndex]?.sum.toString()
                              )})`;
                        }}
                        selection={function (_e: any, _chart: any, opts: any) {
                          const value = opts.w.globals.series[opts.dataPointIndex];
                          addToTally(value);
                        }}
                      />
                    </Col>
                  </Row>
                )}
              </Card>
              <Card>
                {debitRepeatsData.length > 0 && (
                  <ChartDebitRepeats
                    Key={aggregateType + filterRange + useUSD + "pie2"}
                    series={
                      aggregateType === "sum"
                        ? debitRepeatsData.map((i: any) => i.sum)
                        : debitRepeatsData.map((i: any) => i.count)
                    }
                    title={
                      "Debit Overview" + " (" + rangeToStr[filterRange] + ")"
                    }
                    labels={debitRepeatsData.map((i: any) => i.key)}
                    tooltipFormat={function (val: any, opts: any) {
                      return aggregateType === "sum"
                        ? `${curr(val)} (${
                            debitRepeatsData[opts.seriesIndex]?.count
                          } trx, avg ${debitRepeatsData[
                            opts.seriesIndex
                          ]?.avg.toFixed(2)})`
                        : `${val} (${curr(
                            debitRepeatsData[opts.seriesIndex]?.sum.toString()
                          )})`;
                    }}
                    selection={function (_e: any, _chart: any, opts: any) {
                      const value = opts.w.globals.series[opts.dataPointIndex];
                      addToTally(value);
                    }}
                  />
                )}
                <Select
                  style={{ textAlign: "left", width: "50px" }}
                  options={[
                    { label: ">1", value: "repeats" },
                    { label: "All", value: "all" },
                  ]}
                  value={repeatsType}
                  onChange={(value) => {
                    setRepeatsType(value);
                    localStorage.setItem("repeatsType", value);
                    window.location.reload();
                  }}
                />
              </Card>
            </Flex>
          </Card>

          <Collapse
            ref={datasetRef}
            activeKey={datasetOpen}
            onChange={(keys: any) => {
              setDatasetOpen(keys);
            }}
            items={[
              {
                key: "1",
                label: (
                  <Flex justify="space-between">
                    <strong>Dataset</strong>
                    <Flex>
                      <Badge
                        overflowCount={9999}
                        style={{ backgroundColor: "#1677ff", color: "white" }}
                        count={
                          trxFiltered
                            ? trxFiltered.length
                            : castToArray(trx).length ?? 0
                        }
                      />
                      <Divider type="vertical" />
                      <Badge
                        overflowCount={9999}
                        style={{ backgroundColor: "#1677ff", color: "white" }}
                        count={categorized[0]?.count ?? 0}
                      />
                    </Flex>
                  </Flex>
                ),
                children: (
                  <Flex vertical gap="middle">
                    <Flex style={{ flex: 1, justifyContent: "flex-end" }}>
                      <Flex>
                        <Button
                          size="small"
                          icon={
                            <CloseOutlined style={{ color: "#77777740" }} />
                          }
                          type="text"
                          onClick={() => {
                            setTrxFiltered(null);
                            setLastSearch(null);
                          }}
                        />
                        <AutoComplete
                          popupMatchSelectWidth={true}
                          style={{ width: 250 }}
                          options={searchAutocomplete}
                          onSelect={(value: any) =>
                            debounce(handleSearch)(value)
                          }
                          onSearch={(value: any) =>
                            debounce(handleSearch)(value)
                          }
                          size="large"
                        >
                          <Input.Search
                            size="middle"
                            allowClear
                            placeholder="search anything"
                          />
                        </AutoComplete>
                      </Flex>
                      <Flex
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginTop: "8px",
                        }}
                      >
                        <ConfigProvider
                          theme={{
                            token: {
                              borderRadius: 2,
                            },
                          }}
                        >
                          <Tooltip
                            overlayInnerStyle={{ color: "lightgrey" }}
                            overlayStyle={{
                              fontSize: "11px",
                              fontStyle: "italic",
                              borderRadius: "2px",
                            }}
                            color="#141414"
                            title={`Search "salary" "bakery" "ahmed" "transfer" "uncategorized" ">5000" ...or a date in any format "last friday" "three days ago" "22 jul"`}
                          >
                            <InfoCircleOutlined
                              style={{ color: "#77777730" }}
                            />
                          </Tooltip>
                        </ConfigProvider>
                      </Flex>
                    </Flex>
                    <TableDataset
                      dataSource={
                        trxFiltered ? trxFiltered : extractDataSource(trx)
                      }
                      curr={curr}
                      categories={categories}
                      to_category_ranked={to_category_ranked}
                      store={store}
                      addToTally={addToTally}
                    />
                  </Flex>
                ),
              },
            ]}
          />
          <Collapse
            collapsible={
              (
                Object.values(categorized).find(
                  (item: any) => item?.key === "uncategorized"
                ) || ({} as any)
              )?.count
                ? "header"
                : "disabled"
            }
            items={[
              {
                key: "1",
                label: (
                  <Flex justify="space-between">
                    <strong>Uncategorized</strong>
                    <Badge
                      overflowCount={99}
                      style={{ backgroundColor: "#FF4560", color: "white" }}
                      count={
                        (
                          Object.values(categorized).find(
                            (item: any) => item?.key === "uncategorized"
                          ) || ({} as any)
                        )?.count ?? 0
                      }
                    />
                  </Flex>
                ),
                children: (
                  <TableUncategorized
                    dataSource={extractDataSource(uncategorized)}
                    curr={curr}
                    categories={categories}
                    to_category_ranked={to_category_ranked}
                    store={store}
                  />
                ),
              },
            ]}
          />

          <Collapse
            collapsible="icon"
            items={[
              {
                key: "1",
                label: (
                  <Flex justify="space-between">
                    <strong>Categories</strong>
                    <Button
                      size="small"
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={modalCat.open}
                    />
                    <Modal
                      title="New Category"
                      open={modalCat.isOpen}
                      onOk={modalCat.close}
                      onCancel={modalCat.close}
                      closeIcon={null}
                      width={300}
                      footer={[
                        <Button
                          type="primary"
                          onClick={() => {
                            cmd_addCategory(store, catName, catEmoji, catColor);
                            setCatName("");
                            //setCatEmoji("");
                            //setCatColor("");
                            modalCat.close();
                          }}
                        >
                          Add
                        </Button>,
                      ]}
                    >
                      <Flex gap="small">
                        <Input
                          value={catName}
                          style={{ width: "250px" }}
                          onChange={(e) => setCatName(e.target.value)}
                        />
                        <Flex>
                          <EmojiPicker
                            value={catEmoji}
                            onChange={(emoji: string) => setCatEmoji(emoji)}
                          />
                          <ColorPicker
                            value={catColor}
                            size="large"
                            onChange={(color) =>
                              setCatColor(color.toHexString())
                            }
                          />
                        </Flex>
                      </Flex>
                    </Modal>
                  </Flex>
                ),
                children: (
                  <List itemLayout="horizontal">
                    {castToArray(categories)
                      .sort((a: any, b: any) => a.name.localeCompare(b.name))
                      .map((item: any) => (
                        <List.Item key={item.name}>
                          <List.Item.Meta
                            avatar={
                              <Avatar
                                size={26}
                                shape="square"
                                style={{ backgroundColor: item.color }}
                              >
                                {item.emoji}
                              </Avatar>
                            }
                            title={
                              <strong style={{ fontSize: 16 }}>
                                {item.name}
                              </strong>
                            }
                          />
                          <Button
                            shape="circle"
                            size="small"
                            type="text"
                            danger
                            icon={<CloseOutlined size={1} />}
                            onClick={() => {
                              const id = item.name;
                              if (id) cmd_removeCategory(store, id);
                            }}
                          />
                        </List.Item>
                      ))}
                  </List>
                ),
              },
            ]}
          />

          <Collapse
            collapsible="header"
            items={[
              {
                key: "1",
                label: <strong>Settings</strong>,
                children: (
                  <Row gutter={16}>
                    <Col span={8}>
                      <Card bordered={false}>
                        <Flex gap="small" vertical>
                          <Tag color="#141414">
                            {exchangeRates && (
                              <Flex gap="middle">
                                <Switch
                                  unCheckedChildren="MVR"
                                  checkedChildren="USD"
                                  checked={useUSD}
                                  onChange={(checked) => setUseUSD(checked)}
                                />
                                <span>Currency</span>
                              </Flex>
                            )}
                          </Tag>
                          <Tag color="#141414">
                            <Flex gap="middle">
                              <Select
                                style={{ textAlign: "left" }}
                                size="small"
                                options={[
                                  { label: <BarChartOutlined />, value: "bar" },
                                  {
                                    label: <AreaChartOutlined />,
                                    value: "area",
                                  },
                                  {
                                    label: <LineChartOutlined />,
                                    value: "line",
                                  },
                                ]}
                                value={graphType}
                                onChange={(value) => {
                                  setGraphType(value);
                                  localStorage.setItem("graphType", value);
                                }}
                              />
                              <span>Graph Type</span>
                            </Flex>
                          </Tag>
                          <Tag color="#141414">
                            <Flex gap="middle">
                              <Switch
                                checked={colorizeDaily === "true"}
                                onChange={(value) => {
                                  setColorizeDaily(value ? "true" : "false");
                                  localStorage.setItem(
                                    "colorizeDaily",
                                    value ? "true" : "false"
                                  );
                                  //window.location.reload();
                                }}
                              />
                              <span>Colorize Daily</span>
                            </Flex>
                          </Tag>
                        </Flex>
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card title="My Data" bordered={true}>
                        <Flex gap="middle" vertical>
                          <Upload
                            accept=".csv,.CSV"
                            showUploadList={false}
                            beforeUpload={(file) => {
                              const reader = new FileReader();
                              reader.readAsText(file);
                              reader.onload = (e) => {
                                if (e?.target?.result) {
                                  const rows = parseCSVData(e.target.result);
                                  if (rows.length > 0) {
                                    cmd_createRecords(store, rows);
                                  }
                                }
                              };
                              return false;
                            }}
                          >
                            <Button
                              size="large"
                              type="primary"
                              icon={<ImportOutlined />}
                            >
                              Import Statement CSV
                            </Button>
                          </Upload>
                          <span
                            style={{
                              fontSize: "10px",
                              color: "grey",
                              marginBottom: "-4px",
                            }}
                          >{`Duplicates will be skipped.`}</span>
                          <Divider orientation="center">Database</Divider>
                          <Flex gap="middle" wrap="wrap">
                            <Flex>
                              <Button
                                icon={<ExportOutlined />}
                                type="text"
                                onClick={() => {
                                  if (!sqlite3Persister || !sqlite3Instance) {
                                    useSqlite3(
                                      sqlite3Persister,
                                      setSqlite3Persister,
                                      sqlite3Instance,
                                      setSqlite3Instance,
                                      store
                                    ).then(({ persister, sqlite3 }) =>
                                      exportDb(persister, sqlite3)
                                    );
                                  } else {
                                    exportDb(sqlite3Persister, sqlite3Instance);
                                  }
                                }}
                              >
                                Export SQLite
                              </Button>
                            </Flex>

                            <Flex>
                              <Upload
                                accept=".db,.DB,.sqlite,.sqlite3"
                                showUploadList={false}
                                beforeUpload={(file) => {
                                  if (!indexedDBPersister) return false;
                                  const reader = new FileReader();
                                  reader.readAsArrayBuffer(file);
                                  reader.onload = async (e) => {
                                    const buffer = e.target
                                      ?.result as ArrayBuffer;
                                    await useSqlite3(
                                      sqlite3Persister,
                                      setSqlite3Persister,
                                      sqlite3Instance,
                                      setSqlite3Instance,
                                      store,
                                      buffer,
                                      indexedDBPersister
                                    );
                                  };
                                  return false;
                                }}
                              >
                                <Button type="text" icon={<CodepenOutlined />}>
                                  Import SQLite
                                </Button>
                              </Upload>
                            </Flex>
                          </Flex>
                        </Flex>
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Flex gap="middle" vertical>
                        <Card
                          title={
                            <strong style={{ color: "#DC4446" }}>
                              Danger Zone
                            </strong>
                          }
                          bordered={true}
                        >
                          <Flex wrap="wrap" gap="middle">
                            <Flex>
                              <Button
                                danger
                                onClick={() => {
                                  resetPersistentStorage(
                                    store,
                                    indexedDBPersister,
                                    setIndexedDBPersister
                                  );
                                  localStorage.clear();
                                }}
                              >
                                Clear and Reset Defaults
                              </Button>
                            </Flex>
                            <Flex>
                              <Button
                                danger
                                type="text"
                                onClick={() => {
                                  _clearData(store);
                                  localStorage.clear();
                                }}
                              >
                                Wipe Database
                              </Button>
                            </Flex>
                          </Flex>
                        </Card>
                        <Card title="Mock Data" bordered={true}>
                          <Button
                            type="dashed"
                            onClick={() => {
                              if (extractDataSource(trx).length > 0) {
                                message.error(
                                  "Cannot create mock data while data is present"
                                );
                                return;
                              }
                              const mock = mockDataGet(100);
                              cmd_createRecords(store, mock);
                            }}
                          >
                            Generate Mock Data
                          </Button>
                        </Card>
                      </Flex>
                    </Col>
                  </Row>
                ),
              },
            ]}
          />
        </Flex>
      </Layout.Content>
      <Layout.Footer style={{ textAlign: "center" }}>
        Made for You ❤️ Raais N.
      </Layout.Footer>
    </Layout>
  );
};
