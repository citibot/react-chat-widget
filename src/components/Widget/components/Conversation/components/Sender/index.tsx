import {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useSelector } from "react-redux";
import cn from "classnames";

import { GlobalState } from "src/store/types";

import {
  getCaretIndex,
  isFirefox,
  updateCaret,
  insertNodeAtCaret,
  getSelection,
} from "../../../../../../utils/contentEditable";
const send = require("../../../../../../../assets/send_button.svg") as string;
const emoji = require("../../../../../../../assets/icon-smiley.svg") as string;
const uploadIcon = require("../../../../../../../assets/icon-upload.svg") as string;
const brRegex = /<br>/g;

import "./style.scss";

type Props = {
  placeholder: string;
  disabledInput: boolean;
  autofocus: boolean;
  sendMessage: (event: any) => void;
  buttonAlt: string;
  onPressEmoji: () => void;
  onChangeSize: (event: any) => void;
  onTextInputChange?: (event: any) => void;
};

function Sender(
  {
    sendMessage,
    placeholder,
    disabledInput,
    autofocus,
    onTextInputChange,
    buttonAlt,
    onPressEmoji,
    onChangeSize,
  }: Props,
  ref
) {
  const showChat = useSelector((state: GlobalState) => state.behavior.showChat);
  const inputRef = useRef<HTMLDivElement>(null!);
  const refContainer = useRef<HTMLDivElement>(null);
  const [enter, setEnter] = useState(false);
  const [firefox, setFirefox] = useState(false);
  const [height, setHeight] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showChat && autofocus) inputRef.current?.focus();
  }, [showChat]);

  useEffect(() => {
    setFirefox(isFirefox());
  }, []);

  useImperativeHandle(ref, () => ({
    onSelectEmoji: handlerOnSelectEmoji,
  }));

  const handlerOnChange = (event) => {
    onTextInputChange && onTextInputChange(event);
  };

  const handleFileChange = (event) => {
    handlerSendMessage(event);
  };

  const handlerSendMessage = (event?) => {
    const file = event?.target?.files[0];
    if (file) {
      sendMessage(file);
    } else {
      const el = inputRef.current;
      if (el.innerHTML.trim()) {
        sendMessage(el.innerText.trim());
        el.innerHTML = "";
      }
    }
  };

  const handleUploadIconClick = () => {
    fileInputRef.current?.click();
  };

  const handlerOnSelectEmoji = (emoji) => {
    const el = inputRef.current;
    const { start, end } = getSelection(el);
    if (el.innerHTML) {
      const firstPart = el.innerHTML.substring(0, start);
      const secondPart = el.innerHTML.substring(end);
      el.innerHTML = `${firstPart}${emoji.native}${secondPart}`;
    } else {
      el.innerHTML = emoji.native;
    }
    updateCaret(el, start, emoji.native.length);
  };

  const handlerOnKeyPress = (event) => {
    const el = inputRef.current;

    if (event.charCode == 13 && !event.shiftKey) {
      event.preventDefault();
      handlerSendMessage();
    }
    if (event.charCode === 13 && event.shiftKey) {
      event.preventDefault();
      insertNodeAtCaret(el);
      setEnter(true);
    }
  };

  const checkSize = () => {
    const senderEl = refContainer.current;
    if (senderEl && height !== senderEl.clientHeight) {
      const { clientHeight } = senderEl;
      setHeight(clientHeight);
      onChangeSize(clientHeight ? clientHeight - 1 : 0);
    }
  };

  const handlerOnKeyUp = (event) => {
    const el = inputRef.current;
    if (!el) return true;

    if (firefox && event.key === "Backspace") {
      if (el.innerHTML.length === 1 && enter) {
        el.innerHTML = "";
        setEnter(false);
      } else if (brRegex.test(el.innerHTML)) {
        el.innerHTML = el.innerHTML.replace(brRegex, "");
      }
    }
    checkSize();
  };

  const handlerOnKeyDown = (event) => {
    const el = inputRef.current;

    if (event.key === "Backspace" && el) {
      const caretPosition = getCaretIndex(inputRef.current);
      const character = el.innerHTML.charAt(caretPosition - 1);
      if (character === "\n") {
        event.preventDefault();
        event.stopPropagation();
        el.innerHTML =
          el.innerHTML.substring(0, caretPosition - 1) +
          el.innerHTML.substring(caretPosition);
        updateCaret(el, caretPosition, -1);
      }
    }
  };

  const handlerPressEmoji = () => {
    onPressEmoji();
    checkSize();
  };

  return (
    <div ref={refContainer} className="rcw-sender">
      <div
        className={cn("rcw-new-message", {
          "rcw-message-disable": disabledInput,
        })}
      >
        <div
          spellCheck
          className="rcw-input"
          role="textbox"
          contentEditable={!disabledInput}
          ref={inputRef}
          placeholder={placeholder}
          onInput={handlerOnChange}
          onKeyPress={handlerOnKeyPress}
          onKeyUp={handlerOnKeyUp}
          onKeyDown={handlerOnKeyDown}
        />
      </div>
      <button
        type="button"
        className="rcw-upload-button"
        onClick={handleUploadIconClick}
      >
        <img src={uploadIcon} className="rcw-upload-icon" alt="Upload" />
      </button>

      <input
        type="file"
        id="photo-upload-input"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={handleFileChange} // Handle file change
      />
      <button type="submit" className="rcw-send" onClick={handlerSendMessage}>
        <img src={send} className="rcw-send-icon" alt={buttonAlt} />
      </button>
    </div>
  );
}

export default forwardRef(Sender);
