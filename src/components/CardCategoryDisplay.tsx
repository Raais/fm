import { Avatar, Card, Flex, Tooltip } from "antd";

export const CardCategoryDisplay = ({
  category,
  categoryAgr,
  curr,
  forecastEom,
  p,
  categoryAgrLm,
}: any) => {
  return (
    <Card
      style={{ fontSize: "16px", height: "100%" }}
      bordered={false}
      title={
        <span
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Avatar
            size={30}
            shape="square"
            style={{ backgroundColor: category.color.toString() }}
          >
            {category.emoji}
          </Avatar>
          <strong
            style={{ fontSize: "30px", color: category.color.toString() }}
          >
            {categoryAgr.category}
          </strong>
        </span>
      }
    >
      <span style={{ fontSize: "36px", fontWeight: "bold" }}>
        {curr(categoryAgr.sum, "")}
      </span>
      <br />
      <Flex vertical gap={0} style={{ lineHeight: "1.2" }}>
        {forecastEom && p && (
          <span style={{ color: p > 0 ? "#FF4560" : "#00E396" }}>
            <Tooltip color="#000" title="forecast = (daily avg...today) * 31">
              <strong style={{ color: "lightgrey" }}>EOMF:</strong>
            </Tooltip>{" "}
            {curr(forecastEom)}{" "}
            {`(${p > 0 ? "▲" : "▼"} ${p > 0 ? "+" : ""}${p.toFixed(2)}%)`}
          </span>
        )}
        {categoryAgrLm && (
          <span style={{ fontSize: "15px", color: "grey" }}>
            <span>Last Month:</span> {curr(categoryAgrLm.sum)}
          </span>
        )}
        <span style={{ fontSize: "15px", color: "grey" }}>
          <span>TRX:</span> {categoryAgr.count} (avg{" "}
          {categoryAgr.avg.toFixed(2)})
        </span>
      </Flex>
    </Card>
  );
};
