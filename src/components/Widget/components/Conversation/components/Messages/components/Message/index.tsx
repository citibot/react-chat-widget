import { useEffect } from "react";
import format from "date-fns/format";
import markdownIt from "markdown-it";
import markdownItSup from "markdown-it-sup";
import markdownItSanitizer from "markdown-it-sanitizer";
import markdownItClass from "@toycode/markdown-it-class";
import markdownItLinkAttributes from "markdown-it-link-attributes";

import { MessageTypes } from "src/store/types";

import "./styles.scss";
import { MESSAGES_TYPES } from "../../../../../../../../constants";

type Props = {
  message: MessageTypes;
  showTimeStamp: boolean;
};

function Message({ message, showTimeStamp }: Props) {
  let fileUrl: string | undefined;

  if (message.type === MESSAGES_TYPES.FILE && message.file) {
    fileUrl = URL.createObjectURL(message.file);
  }

  // Cleanup the object URL when the component unmounts
  // It is necessary to prevent memory leaks
  useEffect(() => {
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl]);

  if (typeof message.text === "string") {
    const sanitizedHTML = markdownIt({ break: true })
      .use(markdownItClass, {
        img: ["rcw-message-img"],
      })
      .use(markdownItSup)
      .use(markdownItSanitizer)
      .use(markdownItLinkAttributes, {
        attrs: { target: "_blank", rel: "noopener" },
      })
      .render(message.text);

    return (
      <div className={`rcw-${message.sender}`}>
        <div
          className="rcw-message-text"
          dangerouslySetInnerHTML={{ __html: sanitizedHTML.replace(/\n$/, "") }}
        />
        {showTimeStamp && (
          <span className="rcw-timestamp">
            Delivered {format(message.timestamp, "hh:mm a")}
          </span>
        )}
      </div>
    );
  }
  if (message.type === MESSAGES_TYPES.FILE && message.file) {
    return (
      <div className={`rcw-${message.sender}`}>
        <div className="rcw-message-text">
          <img src={fileUrl} alt="Uploaded" className="rcw-message-img" />
        </div>
        {showTimeStamp && (
          <span className="rcw-timestamp">
            Delivered {format(message.timestamp, "hh:mm a")}
          </span>
        )}
      </div>
    );
  }
  return null;
}

export default Message;
