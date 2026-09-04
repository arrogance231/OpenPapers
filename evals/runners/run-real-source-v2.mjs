process.env.REAL_SOURCE_DATASET_FILE='evals/datasets/research-real-v2.json';
process.env.REAL_SOURCE_ACQUISITION_OUTPUT=`real-source-v2-acquisition-${process.argv.includes('--split=holdout')?'holdout':'development'}.json`;
process.env.REAL_SOURCE_RESULT_PREFIX=process.argv.includes('--split=holdout')?'real-source-v2-holdout':'real-source-v2-development-baseline';
await import('./run-real-source.mjs');
