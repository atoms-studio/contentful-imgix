import ImgixAPI, { APIError } from 'imgix-management-js';

export type SourceProps = {
  id: string;
  name: string;
  domain: string;
};


const getSources = async (imgix: ImgixAPI) => {
  return await imgix.request('sources');
};

export const getSourceIDAndPaths = async (imgix: ImgixAPI): Promise<Array<SourceProps>> => {
  let sources,
    enabledSources: Array<SourceProps> = [];

  try {
    sources = await getSources(imgix);
  } catch (error) {
    // APIError will emit more helpful data for debugging
    if (error instanceof APIError) {
      console.error(error.toString());
    } else {
      console.error(error);
    }
    return enabledSources;
  }

  /*
   * Resolved requests can either return an array of objects or a single
   * object via the `data` top-level field. When parsing all enabled sources,
   * both possibilities must be accounted for.
   */
  const sourcesArray = Array.isArray(sources.data)
    ? sources.data
    : [sources.data];
  enabledSources = sourcesArray.reduce(
    (result: SourceProps[], source: any) => {
      // TODO: add more explicit types for source
      if (source.attributes.enabled) {
        const id = source.id;
        const name = source.attributes.name;
        // there may be multiple domains, but we'll extract the first one for now
        let domain = source.attributes.deployment.imgix_subdomains[0];
        result.push({ id, name, domain });
      }
      return result;
    },
    [] as SourceProps[],
  );

  return enabledSources;
};
