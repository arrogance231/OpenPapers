export type ShutdownStep = () => Promise<void>;

export function createShutdownController(steps: ShutdownStep[]): () => Promise<void> {
  let completion: Promise<void> | undefined;
  return () => {
    if(!completion) completion=runSteps(steps);
    return completion;
  };
}

async function runSteps(steps: ShutdownStep[]): Promise<void> {
  let firstError: unknown;
  for(const step of steps){
    try { await step(); }
    catch(error){ if(firstError===undefined) firstError=error; }
  }
  if(firstError!==undefined) throw firstError;
}
