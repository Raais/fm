import {
  Button,
  Dropdown,
  Flex,
  message,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { CloseOutlined, CheckOutlined } from "@ant-design/icons";
import ReactTimeAgo from "react-time-ago";
import dayjs from "dayjs";
import { castToArray } from "../lib/utils";
import {
  cmd_applyCategory,
  cmd_changeCategory,
  cmd_changeNote,
} from "../lib/db/models/transactions";

export const TableDataset = ({
  dataSource,
  curr,
  categories,
  to_category_ranked,
  store,
}: any) => {
  return (
    <Table
      dataSource={dataSource}
      columns={[
        {
          title: "TXN",
          dataIndex: "date",
          render: (value: any, record: any) => {
            void value;
            return (
              <Flex vertical>
                <Typography.Text strong>{record?.type}</Typography.Text>
                <div>
                  <Tag bordered={false} color="blue">
                    <Flex gap="small">
                      <span>
                        {(record?.ref as string)?.replace(/^="|"$|"/g, "")}
                      </span>
                      <Button
                        shape="circle"
                        size="small"
                        type="text"
                        danger
                        icon={<CloseOutlined size={1} />}
                        onClick={() => {
                          //const id = record?.ref;
                          //if (id) cmd_removeTransaction(store, id);
                        }}
                      />
                    </Flex>
                  </Tag>
                </div>

                <Flex vertical>
                  <Typography.Text type="secondary">
                    {dayjs(record?.date, "DD-MM-YYYY").format("ddd D-MMM-YY")}
                  </Typography.Text>
                  <Typography.Text disabled>
                    <ReactTimeAgo
                      date={
                        new Date(
                          dayjs(record?.date, "DD-MM-YYYY").format(
                            "ddd D-MMM-YY"
                          )
                        )
                      }
                      locale="en-US"
                    />
                  </Typography.Text>
                </Flex>
              </Flex>
            );
          },
          sorter: (a: any, b: any) => {
            return (
              dayjs(a?.date, "DD-MM-YYYY").unix() -
              dayjs(b?.date, "DD-MM-YYYY").unix()
            );
          },
        },
        {
          title: "",
          dataIndex: "ref",
          render: (value: any, record: any) => {
            void value;
            return (
              <Flex vertical>
                <div>
                  <Dropdown
                    menu={{
                      items: castToArray(categories).map((cat: any) => {
                        return {
                          key: cat.name,
                          label: `${cat.emoji} ${cat.name}`,
                        };
                      }),
                      onClick: (item) => {
                        const id = record?.ref;
                        const cat = item.key;
                        if (id && cat) cmd_changeCategory(store, id, cat);
                      },
                    }}
                    trigger={["click"]}
                    placement="bottomLeft"
                    arrow={false}
                  >
                    <Tooltip
                      title={
                        record?.category === "_undefined_" &&
                        to_category_ranked[record?.to] ? (
                          <Button
                            size="large"
                            icon={<CheckOutlined />}
                            onClick={() => {
                              const id = record?.ref;
                              const cat = to_category_ranked[record?.to];
                              if (id && cat) cmd_changeCategory(store, id, cat);
                            }}
                          >
                            {to_category_ranked[record?.to]}
                          </Button>
                        ) : record?.category !== "_undefined_" ? (
                          <Button
                            size="small"
                            icon={<CheckOutlined />}
                            onClick={() => {
                              const to = record?.to;
                              const cat = record?.category;
                              if (to && cat) {
                                cmd_applyCategory(store, to, cat);
                                message.success(`Applied to all ${to}`);
                              }
                            }}
                          >
                            {`Apply to all ${record?.to}`}
                          </Button>
                        ) : (
                          ""
                        )
                      }
                      placement={
                        record?.category !== "_undefined_" ? "right" : "top"
                      }
                    >
                      <Tag
                        bordered={false}
                        color={
                          record?.color
                            ? record?.color
                            : to_category_ranked[record?.to]
                            ? "gold-inverse"
                            : "gold"
                        }
                        className="hover-glow"
                      >
                        <Typography.Text style={{}}>
                          {`${
                            record?.emoji
                              ? record?.emoji
                              : to_category_ranked[record?.to]
                              ? "🤔"
                              : "👉"
                          } ${
                            record?.category === "_undefined_"
                              ? to_category_ranked[record?.to]
                                ? `${to_category_ranked[record?.to]} ?`
                                : "Add Category"
                              : record?.category
                          }`}
                        </Typography.Text>
                      </Tag>
                    </Tooltip>
                  </Dropdown>
                </div>

                <Typography.Text
                  type="secondary"
                  className="hover-glow-text"
                  onClick={() => {
                    const id = record?.ref;
                    const note = window.prompt("Enter note");
                    if (id && note) cmd_changeNote(store, id, note);
                  }}
                >
                  {record?.note === "_undefined_" ? "+ Note" : record?.note}
                </Typography.Text>
              </Flex>
            );
          },
        },
        {
          title: "TO/FROM",
          dataIndex: "ref",
          render: (value: any, record: any) => {
            void value;
            const from = record?.from;
            const to = record?.to;
            return (
              <Flex vertical>
                <Typography.Text strong>{from}</Typography.Text>
                <Typography.Text strong>{to}</Typography.Text>
              </Flex>
            );
          },
        },
        {
          title: "LOCATION",
          dataIndex: "loc",
        },
        {
          title: (
            <>
              <Tag bordered={false} color="red">
                <strong>DEBIT</strong>
              </Tag>
              <strong>{`/`}</strong>
              <Tag bordered={false} color="green">
                <strong>CREDIT</strong>
              </Tag>
            </>
          ),
          dataIndex: "ref",
          render: (value: any, record: any) => {
            void value;
            const debited = parseFloat(record?.debited);
            const credited = parseFloat(record?.credited);
            return debited > 0 ? (
              <Tag bordered={false} color="red">
                <strong>{`- ${curr(record?.debited, "")}`}</strong>
              </Tag>
            ) : credited > 0 ? (
              <Tag bordered={false} color="green">
                <strong>{`+ ${curr(record?.credited, "")}`}</strong>
              </Tag>
            ) : (
              ""
            );
          },
        },
        {
          title: "BALANCE",
          dataIndex: "balance",
          render: (value: any) => {
            return value ? (
              <Tag bordered={false} color="geekblue">
                <strong>{`${curr(value, "")}`}</strong>
              </Tag>
            ) : (
              ""
            );
          },
        },
      ]}
    />
  );
};
