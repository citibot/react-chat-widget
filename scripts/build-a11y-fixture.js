const fs = require("fs");
const path = require("path");

const fixturePath = path.resolve(__dirname, "..", "a11y-widget-fixture.html");

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>React Chat Widget Accessibility Fixture</title>
    <link rel="stylesheet" href="lib/styles.css" />
    <style>
      html,
      body {
        height: 100%;
        margin: 0;
      }

      body {
        background: #f7f8fb;
        font-family: Arial, Helvetica, sans-serif;
      }

      .fixture-heading {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    </style>
  </head>
  <body>
    <main aria-label="Accessibility fixture page">
      <h1 class="fixture-heading">React chat widget accessibility fixture</h1>
      <div id="root"></div>
    </main>

    <script src="node_modules/react/umd/react.development.js"></script>
    <script src="node_modules/react-dom/umd/react-dom.development.js"></script>
    <script src="lib/index.js"></script>
    <script>
      (function () {
        const React = window.React;
        const ReactDOM = window.ReactDOM;
        const ChatWidget = window["react-chat-widget"];

        function App() {
          React.useEffect(function () {
            ChatWidget.addResponseMessage(
              "Welcome. This fixture exercises the local widget bundle for accessibility checks."
            );
            ChatWidget.addResponseMessage(
              "Here is a response with [a link](https://www.citibot.io/) and **formatted text**."
            );
            ChatWidget.setQuickButtons([
              { label: "Report an issue", value: "issue" },
              { label: "Ask a question", value: "question" },
            ]);
          }, []);

          return React.createElement(ChatWidget.Widget, {
            title: "Accessibility Fixture",
            subtitle: "Local bundle test",
            senderPlaceHolder: "Type a message...",
            profileAvatar:
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%230469e3'/%3E%3Ctext x='20' y='25' text-anchor='middle' fill='white' font-size='16' font-family='Arial'%3EC%3C/text%3E%3C/svg%3E",
            profileClientAvatar:
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%2335cce6'/%3E%3Ctext x='20' y='25' text-anchor='middle' fill='black' font-size='16' font-family='Arial'%3EU%3C/text%3E%3C/svg%3E",
            showCloseButton: true,
            fullScreenMode: false,
            autofocus: false,
            photoUploadIcon: true,
            messageButtonColor: "#0469e3",
            imagePreview: true,
            emojis: false,
            acceptedImageTypes: ["image/jpeg", "image/png"],
            handleNewUserMessage: function (message) {
              if (typeof message === "string") {
                ChatWidget.addResponseMessage("Echo: " + message);
              } else {
                ChatWidget.addResponseMessage("File upload received.");
              }
            },
            handleQuickButtonClicked: function (value) {
              ChatWidget.addResponseMessage("Selected: " + value);
              ChatWidget.setQuickButtons([]);
            },
          });
        }

        ReactDOM.createRoot(document.getElementById("root")).render(
          React.createElement(App)
        );
      })();
    </script>
  </body>
</html>
`;

fs.writeFileSync(fixturePath, html);
console.log("Generated a11y-widget-fixture.html");
