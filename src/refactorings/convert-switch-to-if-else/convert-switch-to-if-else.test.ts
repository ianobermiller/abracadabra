import { Editor, ErrorReason, Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { convertSwitchToIfElse } from "./convert-switch-to-if-else";

describe("Convert Switch To If Else", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection?: Selection; expected: Code }>(
    "should convert switch to if else",
    [
      {
        description: "simple switch",
        code: `switch (name) {
case "Jane":
  sayHelloToJane();
  break;
case "John":
  sayHelloToJohn();
  break;
default:
  sayHello();
  break;
}`,
        expected: `if (name === "Jane") {
  sayHelloToJane();
} else if (name === "John") {
  sayHelloToJohn();
} else {
  sayHello();
}`
      },
      {
        description: "convert the selected switch only",
        code: `switch (name) {
case "Jane":
  sayHelloToJane();
  break;
default:
  sayHello();
  break;
}

if (name === "John") {
  sayHelloToJohn();
} else {
  sayHello();
}`,
        expected: `if (name === "Jane") {
  sayHelloToJane();
} else {
  sayHello();
}

if (name === "John") {
  sayHelloToJohn();
} else {
  sayHello();
}`
      },
      {
        description: "without default case",
        code: `switch (name) {
case "Jane":
  sayHelloToJane();
  break;
case "John":
  sayHelloToJohn();
  break;
}`,
        expected: `if (name === "Jane") {
  sayHelloToJane();
} else if (name === "John") {
  sayHelloToJohn();
}`
      },
      {
        description: "default case without break",
        code: `switch (name) {
case "Jane":
  sayHelloToJane();
  break;
default:
  sayHello();
}`,
        expected: `if (name === "Jane") {
  sayHelloToJane();
} else {
  sayHello();
}`
      },
      {
        description: "last case without break",
        code: `switch (name) {
case "Jane":
  sayHelloToJane();
  break;
case "John":
  sayHelloToJohn();
}`,
        expected: `if (name === "Jane") {
  sayHelloToJane();
} else if (name === "John") {
  sayHelloToJohn();
}`
      },
      {
        description: "with return statements",
        code: `switch (name) {
case "Jane":
  return sayHelloToJane();
case "John":
  return sayHelloToJohn();
default:
  return sayHello();
}`,
        expected: `if (name === "Jane") {
  return sayHelloToJane();
} else if (name === "John") {
  return sayHelloToJohn();
} else {
  return sayHello();
}`
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 0), expected }) => {
      const result = await doConvertSwitchToIfElse(code, selection);

      expect(result).toBe(expected);
    }
  );

  testEach<{ code: Code; selection?: Selection }>(
    "should not convert",
    [
      {
        description: "case without brea",
        code: `switch (name) {
case "Jane":
  sayHelloToJane();
  break;
case "John":
  sayHelloToJohn();
default:
  sayHello();
}`
      },
      {
        description: "default case not last",
        code: `switch (name) {
case "Jane":
  sayHelloToJane();
  break;
default:
  sayHello();
  break;
case "John":
  sayHelloToJohn();
  break;
}`
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 0) }) => {
      const result = await doConvertSwitchToIfElse(code, selection);

      expect(result).toBe(code);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const selection = Selection.cursorAt(0, 0);

    await doConvertSwitchToIfElse(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFindSwitchToConvert
    );
  });

  async function doConvertSwitchToIfElse(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    await convertSwitchToIfElse(code, selection, editor);
    return editor.code;
  }
});
