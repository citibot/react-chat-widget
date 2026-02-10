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
    "select:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
  ].join(", ");

  const elements = Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelectors)
  );

  // Filter out elements that are not visible or aria-hidden
  return elements.filter((el) => {
    // Check if element is visible
    const style = window.getComputedStyle(el);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      el.getAttribute("aria-hidden") === "true"
    ) {
      return false;
    }
    return true;
  });
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
  isOpen = true;
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

    // Move focus to the close button when dialog opens
    setTimeout(() => {
      const closeButton = container.querySelector(
        ".rcw-close-button"
      ) as HTMLElement;
      if (closeButton) {
        closeButton.focus();
      }
    }, 100);

    // Handle Tab key to trap focus (cyclic navigation)
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const currentFocusableElements = getFocusableElements(container);

      if (currentFocusableElements.length === 0) return;

      const activeElement = document.activeElement as HTMLElement;

      // Check if active element is inside our container
      if (!container.contains(activeElement)) {
        // Focus escaped somehow, bring it back
        e.preventDefault();
        currentFocusableElements[0].focus();
        return;
      }

      const currentIndex = currentFocusableElements.indexOf(activeElement);

      // Shift + Tab (backward navigation)
      if (e.shiftKey) {
        if (currentIndex <= 0) {
          e.preventDefault();
          currentFocusableElements[currentFocusableElements.length - 1].focus();
        }
      }
      // Tab (forward navigation)
      else {
        if (currentIndex >= currentFocusableElements.length - 1) {
          e.preventDefault();
          currentFocusableElements[0].focus();
        }
      }
    };

    // Backup: catch focus leaving the document
    const handleDocumentFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;

      // If focus moved outside our container
      if (target && !container.contains(target)) {
        e.preventDefault();
        const focusableElements = getFocusableElements(container);
        if (focusableElements.length > 0) {
          focusableElements[focusableElements.length - 1].focus();
        }
      }
    };

    // Handle Escape key to close dialog
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        toggleChat();
        if (window.parent !== window) {
          window.parent.postMessage({ type: "CHATBOT_CLOSED_BY_ESCAPE" }, "*");
        }
      }
    };

    // Add event listeners
    document.addEventListener("keydown", handleTabKey, true);
    document.addEventListener("keydown", handleEscapeKey);
    document.addEventListener("focus", handleDocumentFocus, true);

    // Cleanup function
    return () => {
      document.removeEventListener("keydown", handleTabKey, true);
      document.removeEventListener("keydown", handleEscapeKey);
      document.removeEventListener("focus", handleDocumentFocus, true);
    };
  }, [isOpen, toggleChat]);

  // Return focus when dialog closes
  useEffect(() => {
    if (!isOpen && previousActiveElementRef.current) {
      setTimeout(() => {
        previousActiveElementRef.current?.focus();
      }, 0);
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
