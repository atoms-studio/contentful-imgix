import { Component } from 'react';
import { DialogExtensionSDK } from 'contentful-ui-extensions-sdk';
import { Tabs, TabPanel, Tab, Modal } from '@contentful/forma-36-react-components';
import ImgixAPI from 'imgix-management-js';
import { debounce } from 'lodash';

import { SourceProps, getSourceIDAndPaths } from '../../helpers/sources';
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
  disableSourceSelection: boolean;
  page: PageProps;
  verified: boolean; // if API key is verified
  errors: IxError[]; // array of IxErrors if any
  selectedTab: string;
  uploadsInProgress: number;
}

export type PageProps = {
  currentIndex: number;
  totalPageCount: number;
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
      selectedSource: installationParameters.defaultSource || {},
      disableSourceSelection: installationParameters.disableSourceSelection || false,
      page: {
        currentIndex: 0,
        totalPageCount: 1,
      },
      verified,
      errors: [],
      selectedTab: 'gallery',
      uploadsInProgress: 0,
    };
  }

  getSources = async () => {
    return await this.state.imgix.request('sources');
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
      const sources = await getSourceIDAndPaths(this.state.imgix);
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

  setUploadsInProgress = (uploadsInProgress: number) => {
    this.setState({ uploadsInProgress });
  }

  render() {
    const { selectedSource, allSources, page, imgix, selectedTab, uploadsInProgress, disableSourceSelection } = this.state;
    const sdk = this.props.sdk;
    const selectedImage = (
      this.props.sdk.parameters.invocation as AppInvocationParameters
    )?.selectedImage;

    return (
      <div className="ix-container">
        <Modal.Header title="Select imgIX image" onClose={() => sdk.close(selectedImage)} />
        <Modal.Content>
          { !disableSourceSelection && <SourceSelect
            selectedSource={selectedSource}
            allSources={allSources}
            setSource={this.setSelectedSource}
            resetErrors={() => this.resetNErrors(this.state.errors.length)}
          /> }

          <div className="ix-tabs">
            <Tabs role="tablist" withDivider>
              <Tab id="gallery" selected={selectedTab === 'gallery'} onSelect={this.setTab}>
                Browse images
              </Tab>
              <Tab id="upload" disabled={!selectedSource.id} selected={selectedTab === 'upload'} onSelect={this.setTab}>
                Uploads ({uploadsInProgress})
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

          <TabPanel id="upload" className={selectedTab === 'upload' ? '' : 'ix-hidden'}>
            <UploadPanel
              selectedSource={selectedSource}
              imgix={imgix}
              sdk={sdk}
              onProgressUpdate={this.setUploadsInProgress}
            />
          </TabPanel>
          
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
