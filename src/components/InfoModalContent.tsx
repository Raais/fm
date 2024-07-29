import { WarningFilled } from "@ant-design/icons";
import { Button, Flex, message } from "antd";
import { cmd_createRecords } from "../lib/db/models/transactions";
import { extractDataSource } from "../lib/fmt";
import { mockDataGet } from "../lib/db/mock";

export const InfoModalContent = ({ trx, store, modalInfo }: any) => {
  return (
    <span style={{ fontSize: "16px", color: "lightgrey", lineHeight: "1" }}>
      <strong style={{ color: "#167fff" }}>
        ALL DATA IS STORED LOCALLY ON YOUR BROWSER.
      </strong>
      <br />
      <span>
        Read more about what this app is on the{" "}
        <a href="https://github.com/Raais/fm" target="_blank">
          GitHub Repo
        </a>
        .
      </span>
      <p>
        Get started by importing your statement CSV file under the{" "}
        <strong>Settings</strong> tab.
      </p>
      <p>Supported imports:</p>
      <ul>
        <li style={{ marginBottom: "7px" }}>
          <strong style={{ color: "#E01B22" }}>
            🇲🇻 BML (Bank of Maldives)
          </strong>
        </li>
        <a
          style={{ marginLeft: "20px" }}
          href="https://github.com/Raais/fm/issues/1"
          target="_blank"
        >
          How to export statement from Internet Banking?
        </a>
        <p style={{ marginLeft: "20px", color: "#FFB01A", lineHeight: "0" }}>
          <Flex align="center" gap="small">
            <WarningFilled />
            Limitations
          </Flex>
        </p>
        <ul style={{ color: "#DC4446", lineHeight: "1.4", fontSize: "14px" }}>
          <li>
            Records reflect the date of PROCESSING, not the date of the
            transaction.
          </li>
          <li>
            Weekend transactions might appear as next business day, eg. Sunday,
            etc.
          </li>
        </ul>
      </ul>
      <p>Notes</p>
      <ul style={{ lineHeight: "1.4" }}>
        <li>
          <strong style={{ color: "#167fff" }}>Debit</strong> = outgoing
          transactions, i.e. <span style={{ color: "#DC4446" }}>expenses</span>
        </li>
        <li>
          <strong style={{ color: "#00E396" }}>Credit</strong> = incoming
          transactions, i.e. <span style={{ color: "#00E396" }}>recieved</span>
        </li>
        <br />
        <li>
          <Flex gap="small">
            <span>You can also test out the app without your own data:</span>
            <Button
              size="small"
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
                modalInfo.close();
                localStorage.setItem("infoShown", "true");
              }}
            >
              Generate Mock Data
            </Button>
          </Flex>
        </li>
      </ul>
    </span>
  );
};
