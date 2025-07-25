import { useRef, useState, useEffect } from "react";
// import { Picker } from 'emoji-mart';
import cn from "classnames";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

import Header from "./components/Header";
import Messages from "./components/Messages";
import Sender from "./components/Sender";
import QuickButtons from "./components/QuickButtons";

import { AnyFunction } from "../../../../utils/types";

import "./style.scss";

interface ISenderRef {
  onSelectEmoji: (event: any) => void;
}

type Props = {
  id: string;
  title: string;
  subtitle: string;
  senderPlaceHolder: string;
  showCloseButton: boolean;
  disabledInput: boolean;
  autofocus: boolean;
  className: string;
  sendMessage: AnyFunction;
  photoUploadIcon: boolean;
  toggleChat: AnyFunction;
  profileAvatar?: string;
  profileClientAvatar?: string;
  titleAvatar?: string;
  onQuickButtonClicked?: AnyFunction;
  onTextInputChange?: (event: any) => void;
  showTimeStamp: boolean;
  resizable?: boolean;
  emojis?: boolean;
};

function Conversation({
  id,
  title,
  subtitle,
  senderPlaceHolder,
  showCloseButton,
  disabledInput,
  autofocus,
  className,
  sendMessage,
  photoUploadIcon,
  toggleChat,
  profileAvatar,
  profileClientAvatar,
  titleAvatar,
  onQuickButtonClicked,
  onTextInputChange,
  showTimeStamp,
  resizable,
  emojis,
}: Props) {
  const [containerDiv, setContainerDiv] = useState<HTMLElement | null>();
  let startX, startWidth;

  useEffect(() => {
    const containerDiv = document.getElementById("rcw-conversation-container");
    setContainerDiv(containerDiv);
  }, []);

  const initResize = (e) => {
    if (resizable) {
      startX = e.clientX;
      if (document.defaultView && containerDiv) {
        startWidth = parseInt(
          document.defaultView.getComputedStyle(containerDiv).width
        );
        window.addEventListener("mousemove", resize, false);
        window.addEventListener("mouseup", stopResize, false);
      }
    }
  };

  const resize = (e) => {
    if (containerDiv) {
      containerDiv.style.width = startWidth - e.clientX + startX + "px";
    }
  };

  const stopResize = (e) => {
    window.removeEventListener("mousemove", resize, false);
    window.removeEventListener("mouseup", stopResize, false);
  };

  const [pickerOffset, setOffset] = useState(0);
  const senderRef = useRef<ISenderRef>(null!);
  const [pickerStatus, setPicket] = useState(false);

  const onSelectEmoji = (emoji) => {
    senderRef.current?.onSelectEmoji(emoji);
  };

  const togglePicker = () => {
    setPicket((prevPickerStatus) => !prevPickerStatus);
  };

  const handlerSendMsn = (event) => {
    sendMessage(event);
    if (pickerStatus) setPicket(false);
  };

  return (
    <div
      aria-label="Chat conversation"
      role="region"
      id="rcw-conversation-container"
      onMouseDown={initResize}
      className={cn("rcw-conversation-container", className)}
      aria-live="polite"
    >
      {resizable && (
        <div
          className="rcw-conversation-resizer"
          aria-hidden="true"
          tabIndex={-1}
        />
      )}
      <Header
        title={title}
        subtitle={subtitle}
        toggleChat={toggleChat}
        showCloseButton={showCloseButton}
        titleAvatar={titleAvatar}
      />
      <Messages
        profileAvatar={profileAvatar}
        profileClientAvatar={profileClientAvatar}
        showTimeStamp={showTimeStamp}
      />
      <QuickButtons onQuickButtonClicked={onQuickButtonClicked} />
      {emojis && pickerStatus && (
        <>
          <Picker
            data={data}
            onEmojiSelect={onSelectEmoji}
            onClickOutside={togglePicker}
            style={{
              position: "absolute",
              bottom: pickerOffset,
              left: "0",
              width: "100%",
            }}
          />
        </>
      )}
      <Sender
        ref={senderRef}
        sendMessage={handlerSendMsn}
        photoUploadIcon={photoUploadIcon}
        placeholder={senderPlaceHolder}
        disabledInput={disabledInput}
        autofocus={autofocus}
        onTextInputChange={onTextInputChange}
        onPressEmoji={togglePicker}
        onChangeSize={setOffset}
      />
    </div>
  );
}

export default Conversation;
