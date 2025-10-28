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
const emoji = require("../../../../../../../assets/icon-smiley.svg") as string;
const uploadIcon = require("../../../../../../../assets/icon-upload.svg") as string;
const brRegex = /<br>/g;

import "./style.scss";

type Props = {
  placeholder: string;
  disabledInput: boolean;
  autofocus: boolean;
  sendMessage: (event: any) => void;
  photoUploadIcon: boolean;
  messageButtonColor: string;
  onPressEmoji: () => void;
  onChangeSize: (event: any) => void;
  onTextInputChange?: (event: any) => void;
  acceptedImageTypes?: string[];
};

function Sender(
  {
    sendMessage,
    photoUploadIcon,
    messageButtonColor,
    placeholder,
    disabledInput,
    autofocus,
    onTextInputChange,
    onPressEmoji,
    onChangeSize,
    acceptedImageTypes = ['image/*'],
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
  const acceptedTypesString = acceptedImageTypes.join(',');

  useEffect(() => {
    if (showChat && autofocus) inputRef.current?.focus();
  }, [showChat]);

  useEffect(() => {
    if (showChat && inputRef?.current) {
      const editable = inputRef.current.querySelector(
        '[contenteditable="true"]'
      );
      (editable as HTMLElement | null)?.focus();
    }
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
    let file;
    if (event?.target?.files?.length) {
      file = event.target.files[0];
    }
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
      <label htmlFor="message-input" className="sr-only">
        {placeholder}
      </label>
      <div
        className={cn("rcw-new-message", {
          "rcw-message-disable": disabledInput,
        })}
      >
        <div
          id="message-input"
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
          aria-multiline="true"
          aria-label={placeholder}
          tabIndex={disabledInput ? -1 : 0}
        />
      </div>
      {photoUploadIcon && (
        <>
          <button
            type="button"
            className="rcw-upload-button"
            onClick={handleUploadIconClick}
            aria-label="Upload image"
          >
            <img src={uploadIcon} className="rcw-upload-icon" alt="" />
          </button>

          <input
            type="file"
            id="photo-upload-input"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept={acceptedTypesString}
            onChange={handleFileChange}
          />
        </>
      )}
      <button
        type="submit"
        className="rcw-send"
        onClick={handlerSendMessage}
        aria-label="Send message"
      >
        <svg
          viewBox="0 0 24 24"
          className="rcw-send-icon"
          xmlns="http://www.w3.org/2000/svg"
          style={{ fill: messageButtonColor }}
        >
          <polygon points="2,21 23,12 2,3 2,10 17,12 2,14" />
        </svg>
      </button>
    </div>
  );
}

export default forwardRef(Sender);
