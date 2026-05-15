import { getFocusableElements } from "../index";

describe("getFocusableElements", () => {
  it("excludes focusable elements hidden from assistive technology", () => {
    global.window = {
      getComputedStyle: () => ({ display: "block", visibility: "visible" }),
    };

    const createElement = (id, hiddenSelector = null) => ({
      id,
      closest: (selector) => selector === hiddenSelector,
    });

    const container = {
      querySelectorAll: () => [
        createElement("visible"),
        createElement("direct-hidden", '[aria-hidden="true"]'),
        createElement("ancestor-hidden", '[aria-hidden="true"]'),
        createElement("html-hidden", "[hidden]"),
      ],
    };

    const focusableElements = getFocusableElements(container);

    expect(focusableElements.map((element) => element.id)).toEqual(["visible"]);
  });
});
