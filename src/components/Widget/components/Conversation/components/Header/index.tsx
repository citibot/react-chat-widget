const close = require("../../../../../../../assets/clear-button.svg") as string;

import "./style.scss";

type Props = {
  title: string;
  subtitle: string;
  toggleChat: () => void;
  showCloseButton: boolean;
  titleAvatar?: string;
};

function Header({
  title,
  subtitle,
  toggleChat,
  showCloseButton,
  titleAvatar,
}: Props) {
  return (
    <div className="rcw-header">
      {showCloseButton && (
        <button className="rcw-close-button" onClick={toggleChat}>
          <img src={close} className="rcw-close" alt="close" />
        </button>
      )}
      {titleAvatar && (
        <img src={titleAvatar} className="avatar" alt="profile" />
      )}
      <div>
      <h4 title={title} className="rcw-title">{title}</h4>
      <span>{subtitle}</span>
      </div>
   
    </div>
  );
}

export default Header;
