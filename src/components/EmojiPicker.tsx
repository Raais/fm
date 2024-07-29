import { Button, Popover } from "antd";

import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { FC, useState } from "react";

const EmojiPicker: FC<any> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  return (
    <Popover
      content={
        <Picker
          data={data}
          onEmojiSelect={(data: any) => {
            onChange(data.native);
            setOpen(false);
          }}
          autoFocus={true}
          skinTonePosition="none"
        />
      }
      trigger="click"
      open={open}
      onOpenChange={handleOpenChange}
    >
      <Button type="default" size="large">{value}</Button>
    </Popover>
  );
};

export default EmojiPicker;
