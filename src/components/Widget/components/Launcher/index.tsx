import { useSelector, useDispatch } from "react-redux";
import cn from "classnames";

import Badge from "./components/Badge";
import { GlobalState } from "../../../../store/types";
import { setBadgeCount } from "../../../../store/actions";

import "./style.scss";

const openLauncher = require("../../../../../assets/launcher_button.svg") as string;
const close = require("../../../../../assets/clear-button.svg") as string;

type Props = {
  toggle: () => void;
  chatId: string;
  openLabel: string;
  closeLabel: string;
  closeImg: string;
  openImg: string;
  showBadge?: boolean;
};

function Launcher({
  toggle,
  chatId,
  openImg,
  closeImg,
  openLabel = "Open chat",
  closeLabel = "Close chat",
  showBadge,
}: Props) {
  const dispatch = useDispatch();
  const { showChat, badgeCount } = useSelector((state: GlobalState) => ({
    showChat: state.behavior.showChat,
    badgeCount: state.messages.badgeCount,
  }));

  const toggleChat = () => {
    toggle();
    if (!showChat) dispatch(setBadgeCount(0));
  };

  return (
    <button
      type="button"
      className={cn("rcw-launcher", { "rcw-hide-sm": showChat })}
      onClick={toggleChat}
      aria-expanded={showChat}
      aria-controls={chatId}
      aria-label={showChat ? closeLabel : openLabel}
    >
      {!showChat && showBadge && <Badge badge={badgeCount} />}
      {showChat ? (
        <img
          src={closeImg || close}
          className="rcw-close-launcher"
          alt={closeLabel}
        />
      ) : (
        <img
          src={openImg || openLauncher}
          className="rcw-open-launcher"
          alt={openLabel}
        />
      )}
      <span className="sr-only">{showChat ? closeLabel : openLabel}</span>
    </button>
  );
}

export default Launcher;
