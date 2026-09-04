process.env.REAL_SOURCE_DATASET_FILE='evals/datasets/research-real-v2.json';
process.env.REAL_SOURCE_ACQUISITION_OUTPUT=`real-source-v2-acquisition-${process.argv.includes('--split=holdout')?'holdout':'development'}.json`;
await import('./acquire-real-source.mjs');
