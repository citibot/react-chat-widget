import { useRef, useState, useEffect } from "react";
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
  messageButtonColor: string;
  toggleChat: AnyFunction;
  profileAvatar?: string;
  profileClientAvatar?: string;
  titleAvatar?: string;
  onQuickButtonClicked?: AnyFunction;
  onTextInputChange?: (event: any) => void;
  showTimeStamp: boolean;
  resizable?: boolean;
  emojis?: boolean;
  acceptedImageTypes?: string[];
  isOpen: boolean; // Add this prop to track dialog open state
};

// Utility function to get all focusable elements
const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const focusableSelectors = [
    "a[href]",
    "button:not([disabled])",
    "textarea:not([disabled])",
    "input:not([disabled])",
    "select:not([select])",
    '[tabindex]:not([tabindex="-1"])',
  ].join(", ");

  return Array.from(container.querySelectorAll(focusableSelectors));
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
  messageButtonColor,
  toggleChat,
  profileAvatar,
  profileClientAvatar,
  titleAvatar,
  onQuickButtonClicked,
  onTextInputChange,
  showTimeStamp,
  resizable,
  emojis,
  acceptedImageTypes,
  isOpen,
}: Props) {
  const [containerDiv, setContainerDiv] = useState<HTMLElement | null>();
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  let startX, startWidth;

  useEffect(() => {
    const containerDiv = document.getElementById("rcw-conversation-container");
    setContainerDiv(containerDiv);
  }, []);

  // Focus Trap Implementation
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;

    // Store the element that opened the dialog
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    // Get all focusable elements
    const focusableElements = getFocusableElements(container);

    if (focusableElements.length === 0) return;

    // Move focus to the close button (first element) when dialog opens
    setTimeout(() => {
      const closeButton = container.querySelector(
        ".rcw-close-button"
      ) as HTMLElement;
      if (closeButton) {
        closeButton.focus();
      } else if (focusableElements[0]) {
        focusableElements[0].focus();
      }
    }, 100);

    // Handle Tab key to trap focus (cyclic navigation)
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const currentFocusableElements = getFocusableElements(container);

      if (currentFocusableElements.length === 0) return;

      const firstElement = currentFocusableElements[0];
      const lastElement =
        currentFocusableElements[currentFocusableElements.length - 1];

      // Shift + Tab (backward navigation)
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      }
      // Tab (forward navigation)
      else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Handle Escape key to close dialog
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        toggleChat();
      }
    };

    // Add event listeners
    container.addEventListener("keydown", handleTabKey);
    container.addEventListener("keydown", handleEscapeKey);

    // Cleanup function
    return () => {
      container.removeEventListener("keydown", handleTabKey);
      container.removeEventListener("keydown", handleEscapeKey);

      // Return focus to the element that opened the dialog
      if (previousActiveElementRef.current && !isOpen) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, toggleChat]);

  // Return focus when dialog closes
  useEffect(() => {
    if (!isOpen && previousActiveElementRef.current) {
      previousActiveElementRef.current.focus();
    }
  }, [isOpen]);

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
      ref={containerRef}
      aria-label="Chat conversation"
      role="dialog"
      aria-modal="true"
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
        messageButtonColor={messageButtonColor}
        placeholder={senderPlaceHolder}
        disabledInput={disabledInput}
        autofocus={autofocus}
        onTextInputChange={onTextInputChange}
        onPressEmoji={togglePicker}
        onChangeSize={setOffset}
        acceptedImageTypes={acceptedImageTypes}
      />
    </div>
  );
}

export default Conversation;
