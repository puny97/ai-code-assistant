import { validateGeneratedCode } from "../sandbox/sandbox.service.js";

async function main() {
  const files = [
    {
      path: "src/index.ts",
      content: "const message: string = 123;",
    },
  ];

  const result = await validateGeneratedCode(files);

  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
