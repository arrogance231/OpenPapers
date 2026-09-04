process.env.REAL_SOURCE_DATASET_FILE='evals/datasets/research-real-v3.json';
process.env.REAL_SOURCE_ACQUISITION_OUTPUT=`real-source-v3-acquisition-${process.argv.includes('--split=holdout')?'holdout':'development'}.json`;
process.env.REAL_SOURCE_RESULT_PREFIX=process.argv.includes('--split=holdout')?'real-source-v3-holdout':'real-source-v3-development';
await import('./run-real-source-v3.mjs');
