# Provider integrations

Provider adapters map upstream payloads into the OpenPapers domain model. Each adapter preserves provider-native identifiers, source URLs, and missing values. Provider errors are reported separately so an unavailable service does not erase successful results from other providers.

## arXiv

Purpose: preprint search and metadata from the arXiv API. Authentication is not required. Search uses the export API and preserves normalized arXiv identifiers and canonical URLs. Anonymous service availability and result ordering can vary. Official resources: [arXiv](https://arxiv.org/) and [API help](https://info.arxiv.org/help/api/).

## Crossref

Purpose: DOI and bibliographic metadata through the public works endpoint. Authentication is not required. Crossref records may be incomplete or disagree with other providers; conflicts remain visible. Official resource: [Crossref](https://www.crossref.org/).

## OpenAlex

Purpose: open scholarly metadata, authors, topics, references, and reverse citations. Authentication is not required by the current adapter. Results retain OpenAlex IDs and DOI links where supplied. Official resources: [OpenAlex](https://openalex.org/) and [API documentation](https://docs.openalex.org/).

## Semantic Scholar

Purpose: paper metadata, authors, references, citations, related works, recommendations, and author profiles. `SEMANTIC_SCHOLAR_API_KEY` is optional; anonymous requests are subject to rate limits. HTTP 429 and other provider failures remain explicit in response transparency. Official resources: [Semantic Scholar](https://www.semanticscholar.org/) and [API](https://api.semanticscholar.org/).

## GitHub

Purpose: bounded repository search, revision resolution, directory listing, and line-numbered file inspection. `GITHUB_TOKEN` is optional and improves access to rate-limited endpoints. Repository content is treated as untrusted text and is never executed. Official resource: [GitHub](https://github.com/).

## Hugging Face

Purpose: model and dataset search, metadata, cards, revisions, and paper-link extraction. `HF_TOKEN` is optional. Card links and local scholarly reconciliation are reported separately; a link alone is not proof of an official implementation. Official resource: [Hugging Face](https://huggingface.co/).

## GROBID

GROBID is an optional external parsing service used as the primary PDF parser in the Compose deployment. It returns TEI XML, which OpenPapers maps into structured sections, references, equations, figures, tables, and locators. Official resource: [GROBID](https://github.com/kermitt2/grobid).

## Cross-provider provenance

Provider-native IDs are retained alongside normalized project IDs. DOI and arXiv identifiers are preferred for reconciliation when available; metadata fallback is used for identifier-poor records. Conflicts are reported rather than silently treating one provider as universally authoritative.
