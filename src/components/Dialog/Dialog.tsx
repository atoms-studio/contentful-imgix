import { Component } from 'react';
import { DialogExtensionSDK } from 'contentful-ui-extensions-sdk';
import { Tabs, TabPanel, Tab, Modal } from '@contentful/forma-36-react-components';
import ImgixAPI, { APIError } from 'imgix-management-js';
import { debounce } from 'lodash';

import { AppInstallationParameters } from '../ConfigScreen/';
import { ImageGallery } from '../Gallery/';
import { UploadPanel } from '../UploadPanel/';
import { SourceSelect } from '../SourceSelect/';
import { Note } from '../Note/';
import {
  IxError,
  invalidApiKeyError,
  noSourcesError,
  noOriginImagesError,
} from '../../helpers/errors';
import { ImageData } from '../Gallery/ImageGallery';

import './Dialog.css';

interface DialogProps {
  sdk: DialogExtensionSDK;
}

interface DialogState {
  imgix: ImgixAPI;
  isOpen: boolean;
  allSources: Array<SourceProps>;
  selectedSource: Partial<SourceProps>;
  page: PageProps;
  verified: boolean; // if API key is verified
  errors: IxError[]; // array of IxErrors if any
  selectedTab: string;
}

export type PageProps = {
  currentIndex: number;
  totalPageCount: number;
};

export type SourceProps = {
  id: string;
  name: string;
  domain: string;
};

type AppInvocationParameters = {
  selectedImage: ImageData | {};
};

export default class Dialog extends Component<DialogProps, DialogState> {
  constructor(props: DialogProps) {
    super(props);

    const installationParameters = props.sdk.parameters
      .installation as AppInstallationParameters;
    const apiKey = installationParameters.imgixAPIKey || '';
    const verified = !!installationParameters.successfullyVerified;
    const imgix = new ImgixAPI({
      apiKey,
    });

    this.state = {
      imgix,
      isOpen: false,
      allSources: [],
      selectedSource: {},
      page: {
        currentIndex: 0,
        totalPageCount: 1,
      },
      verified,
      errors: [],
      selectedTab: 'gallery',
    };
  }

  getSources = async () => {
    return await this.state.imgix.request('sources');
  };

  getSourceIDAndPaths = async (): Promise<Array<SourceProps>> => {
    let sources,
      enabledSources: Array<SourceProps> = [];

    try {
      sources = await this.getSources();
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

  handleTotalImageCount = (totalImageCount: number, isFiltering = false) => {
    const totalPageCount = Math.ceil(totalImageCount / 18);
    let errors = [...this.state.errors];

    if (!totalPageCount && !isFiltering) {
      errors.push(noOriginImagesError());
    }

    return this.setState({
      page: {
        ...this.state.page,
        totalPageCount,
      },
      errors,
    });
  };

  handlePageChange = (newPageIndex: number) =>
    this.setState({
      page: { ...this.state.page, currentIndex: newPageIndex },
    });

  debounceHandlePageChange = debounce(this.handlePageChange, 1000, {
    leading: true,
  });

  setSelectedSource = (source: SourceProps) => {
    this.setState({ selectedSource: source });
  };

  resetNErrors = (n: number = 1) => {
    this.setState({ errors: this.state.errors.slice(n) });
  };

  async componentDidMount() {
    // If the API key is not valid do not attempt to load sources
    if (!this.state.verified) {
      this.setState({
        errors: [invalidApiKeyError()],
      });
      return;
    }
    try {
      const sources = await this.getSourceIDAndPaths();
      if (sources.length === 0) {
        throw noSourcesError();
      }
      this.setState({ allSources: sources });
    } catch (error) {
      this.setState({ errors: [error] as IxError[] });
    }
  }

  setTab = (id: string) => {
    this.setState({ selectedTab: id });
  }

  render() {
    const { selectedSource, allSources, page, imgix, selectedTab } = this.state;
    const sdk = this.props.sdk;
    const selectedImage = (
      this.props.sdk.parameters.invocation as AppInvocationParameters
    )?.selectedImage;

    return (
      <div className="ix-container">
        <Modal.Header title="Select imgIX image" onClose={() => sdk.close(selectedImage)} />
        <Modal.Content>
          <SourceSelect
            selectedSource={selectedSource}
            allSources={allSources}
            setSource={this.setSelectedSource}
            resetErrors={() => this.resetNErrors(this.state.errors.length)}
          />

          <div className="ix-tabs">
            <Tabs role="tablist" withDivider>
              <Tab id="gallery" selected={selectedTab === 'gallery'} onSelect={this.setTab}>
                Browse images
              </Tab>
              <Tab id="upload" disabled={!selectedSource.id} selected={selectedTab === 'upload'} onSelect={this.setTab}>
                Uploads (0)
              </Tab>
            </Tabs>
          </div>

          {selectedTab === 'gallery' && (
            <TabPanel id="gallery">
              <ImageGallery
                selectedSource={selectedSource}
                imgix={imgix}
                sdk={sdk}
                getTotalImageCount={this.handleTotalImageCount}
                pageInfo={page}
                changePage={this.debounceHandlePageChange}
              />
            </TabPanel>
          )}

          {selectedTab === 'upload' && (
            <TabPanel id="upload">
              <UploadPanel
                selectedSource={selectedSource}
                imgix={imgix}
                sdk={sdk}
              />
            </TabPanel>
          )}
          
          {/* { UI Error fallback } */}
          {this.state.errors.length > 0 && (
            <Note
              error={this.state.errors[0]}
              type={this.state.errors[0].type}
              resetErrorBoundary={this.resetNErrors}
            />
          )}
        </Modal.Content>
      </div>
    );
  }
}
