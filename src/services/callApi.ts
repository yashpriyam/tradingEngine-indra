import { allActions } from "../..";

/**
 * child process execution code
 */
process.on("message", async (message: any) => {
  const { data } = message;

  allActions.sync.forEach((action) => {
    action.execute(data);
  });

  (async () => {
    for (const action of allActions.async) {
      await action.execute(data);
    }
  })()

  process.exit();
});
